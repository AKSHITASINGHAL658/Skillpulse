import os
import re
import html
import logging
from datetime import date, datetime, timedelta
from typing import List, Dict, Any, Optional
import psycopg
from psycopg.rows import dict_row

import httpx
from bs4 import BeautifulSoup

from database import get_db

logger = logging.getLogger("skillpulse.scraper")
logger.setLevel(logging.INFO)

class ScrapedPosting:
    def __init__(
        self,
        title: str,
        company: str,
        location: str,
        description: str = "",
        salary_min: Optional[float] = None,
        salary_max: Optional[float] = None,
        posted_date: Optional[date] = None,
        source_url: str = "",
        source_site: str = "aggregator",
        explicit_skills: Optional[List[str]] = None,
        experience_level: str = "Mid-Level",
        min_exp_yrs: float = 0.0
    ):
        self.title = title.strip()
        self.company = company.strip()
        self.location = location.strip()
        self.description = description.strip()
        self.salary_min = salary_min
        self.salary_max = salary_max
        self.posted_date = posted_date or date.today()
        self.source_url = source_url.strip()
        self.source_site = source_site.strip()
        self.explicit_skills = explicit_skills or []
        self.experience_level = experience_level
        self.min_exp_yrs = min_exp_yrs

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "company": self.company,
            "location": self.location,
            "salary_min": self.salary_min,
            "salary_max": self.salary_max,
            "posted_date": self.posted_date.isoformat(),
            "source_url": self.source_url,
            "source_site": self.source_site,
            "explicit_skills": self.explicit_skills
        }


class CanonicalSkillMatcher:
    """Loads canonical skills and aliases from PostgreSQL and performs regex keyword matching."""
    def __init__(self):
        self.skills_by_id: Dict[int, str] = {}
        self.patterns: List[Dict[str, Any]] = []
        self.load_dictionary()

    def load_dictionary(self):
        with get_db() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT id, name FROM skill;")
                skills = cur.fetchall()
                for s in skills:
                    self.skills_by_id[s["id"]] = s["name"]

                cur.execute("SELECT alias_name, skill_id FROM skill_alias;")
                aliases = cur.fetchall()

        self.patterns = []
        # Build lookup terms
        terms: List[Dict[str, Any]] = []
        for s_id, s_name in self.skills_by_id.items():
            terms.append({"term": s_name, "skill_id": s_id, "is_canonical": True})
        for a in aliases:
            terms.append({"term": a["alias_name"], "skill_id": a["skill_id"], "is_canonical": False})

        # Sort terms by length descending to prioritize longer matches (e.g. "Spring Boot" before "Spring")
        terms.sort(key=lambda x: len(x["term"]), reverse=True)

        for item in terms:
            term = item["term"]
            skill_id = item["skill_id"]

            # Safe regex pattern generation
            escaped = re.escape(term)
            if re.match(r"^[A-Za-z0-9_]+$", term):
                # Standard alphanumeric word boundary
                pattern = re.compile(rf"\b{escaped}\b", re.IGNORECASE)
            else:
                # Term contains special chars (e.g. C++, C#, .NET, Node.js, Next.js, Vue.js, CI/CD)
                pattern = re.compile(rf"(?<![A-Za-z0-9]){escaped}(?![A-Za-z0-9])", re.IGNORECASE)

            self.patterns.append({
                "term": term,
                "skill_id": skill_id,
                "regex": pattern,
                "canonical_name": self.skills_by_id.get(skill_id, term)
            })

    def extract_skills(self, text: str, explicit_tags: Optional[List[str]] = None) -> List[Dict[str, Any]]:
        found_skill_ids = set()
        matched_results: List[Dict[str, Any]] = []

        # 1. Check explicit tags
        if explicit_tags:
            for tag in explicit_tags:
                clean_tag = tag.strip().lower()
                for p in self.patterns:
                    if p["term"].lower() == clean_tag or p["regex"].search(clean_tag):
                        s_id = p["skill_id"]
                        if s_id not in found_skill_ids:
                            found_skill_ids.add(s_id)
                            matched_results.append({
                                "skill_id": s_id,
                                "skill_name": self.skills_by_id[s_id],
                                "matched_by": tag
                            })
                        break

        # 2. Clean HTML and scan text
        if text:
            clean_text = html.unescape(re.sub(r"<[^>]+>", " ", text))
            for p in self.patterns:
                s_id = p["skill_id"]
                if s_id in found_skill_ids:
                    continue
                if p["regex"].search(clean_text):
                    found_skill_ids.add(s_id)
                    matched_results.append({
                        "skill_id": s_id,
                        "skill_name": self.skills_by_id[s_id],
                        "matched_by": p["term"]
                    })

        return matched_results


def parse_salary_text(text: str) -> tuple[Optional[float], Optional[float]]:
    """Parse salary/stipend text into min and max annual INR amount."""
    if not text:
        return None, None
    clean = text.replace(",", "").strip()

    # Look for patterns like "4000000 - 7500000" or "4000000" or "40 - 75 LPA" or "25000 /month"
    is_monthly = bool(re.search(r"/(?:month|mo)", clean, re.IGNORECASE))
    is_lpa = bool(re.search(r"lpa|lakh", clean, re.IGNORECASE))

    # Match numeric amounts
    numbers = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", clean)]
    if not numbers:
        return None, None

    if is_lpa:
        # e.g. 15 - 25 LPA -> 1500000, 2500000
        converted = [n * 100000 for n in numbers]
    elif is_monthly:
        # e.g. 30000 /month -> 360000
        converted = [n * 12 for n in numbers]
    else:
        # Check magnitude: if numbers are like 12 - 20 without explicit LPA
        if all(n < 150 for n in numbers):
            converted = [n * 100000 for n in numbers]
        else:
            converted = numbers

    if len(converted) >= 2:
        return min(converted[0], converted[1]), max(converted[0], converted[1])
    elif len(converted) == 1:
        return converted[0], converted[0]

    return None, None


def scrape_internshala(search_term: str, location: Optional[str] = None, limit: int = 25) -> List[ScrapedPosting]:
    """Scrapes job listings from Internshala using httpx and BeautifulSoup."""
    postings: List[ScrapedPosting] = []
    
    # Formulate URL slug based on query
    # E.g. "python" -> "python-jobs", "full stack" -> "full-stack-development-jobs"
    term_slug = search_term.strip().lower()
    term_slug = re.sub(r"[^a-z0-9]+", "-", term_slug).strip("-")
    
    urls_to_try = [
        f"https://internshala.com/jobs/{term_slug}-jobs/",
        f"https://internshala.com/jobs/keywords-{term_slug}/",
        f"https://internshala.com/jobs/"
    ]

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://internshala.com/"
    }

    resp = None
    with httpx.Client(timeout=15.0, follow_redirects=True, headers=headers) as client:
        for url in urls_to_try:
            try:
                r = client.get(url)
                if r.status_code == 200 and len(r.text) > 1000:
                    resp = r
                    break
            except Exception as e:
                logger.warning(f"Internshala request error for {url}: {e}")

        if not resp:
            return postings

        soup = BeautifulSoup(resp.text, "html.parser")
        cards = soup.select(".individual_internship, .job_container, .container-fluid.visibilityTrackerItem")

        for card in cards[:limit]:
            try:
                # 1. Title
                title_elem = card.select_one(".heading_4_5.profile, .job-internship-name, .job-title-href, h2 a, h3 a")
                title = title_elem.get_text(strip=True) if title_elem else ""
                if not title:
                    continue

                # 2. Company
                comp_elem = card.select_one(".link_display_like_text, .company-name, .company_name a, .company_name p")
                company = comp_elem.get_text(strip=True) if comp_elem else "Tech Enterprise"

                # 3. Location
                loc_elem = card.select_one(".locations, #location_names, .row-1-item.locations")
                loc_text = loc_elem.get_text(strip=True) if loc_elem else "Bengaluru, India"

                # 4. Salary / Stipend
                salary_min, salary_max = None, None
                sal_elem = card.select_one(".salary, .stipend")
                if sal_elem:
                    salary_min, salary_max = parse_salary_text(sal_elem.get_text(strip=True))
                else:
                    # Search within row-1-item containing currency symbol or LPA or /year
                    for item in card.select(".row-1-item"):
                        t = item.get_text(strip=True)
                        if "₹" in t or "LPA" in t or "/year" in t or "/month" in t:
                            salary_min, salary_max = parse_salary_text(t)
                            break

                # 5. Explicit Tags / Skills
                explicit_skills = [
                    t.get_text(strip=True) 
                    for t in card.select(".tags_container span, .round_tabs, .skill_tag, .tag")
                    if t.get_text(strip=True)
                ]

                # 6. Source URL
                link_elem = card.select_one("a.job-title-href, a[data-href], a[href*='/job/detail/']")
                href = ""
                if link_elem:
                    href = link_elem.get("href") or link_elem.get("data-href") or ""
                if not href and card.get("data-href"):
                    href = card.get("data-href")
                if href and not href.startswith("http"):
                    href = f"https://internshala.com{href}"

                # 7. Experience
                min_exp = 0.0
                exp_elem = card.select_one(".row-1-item.experience, .item_body.experience")
                if exp_elem:
                    nums = re.findall(r"\d+", exp_elem.get_text(strip=True))
                    if nums:
                        min_exp = float(nums[0])

                postings.append(ScrapedPosting(
                    title=title,
                    company=company,
                    location=loc_text,
                    description=f"{title} position at {company} in {loc_text}. Looking for strong technical skills.",
                    salary_min=salary_min,
                    salary_max=salary_max,
                    posted_date=date.today(),
                    source_url=href,
                    source_site="internshala",
                    explicit_skills=explicit_skills,
                    min_exp_yrs=min_exp
                ))
            except Exception as e:
                logger.error(f"Error parsing Internshala card: {e}")

    return postings


def scrape_jobspy_engine(
    search_term: str,
    location: str = "India",
    limit: int = 25,
    sites: Optional[List[str]] = None
) -> List[ScrapedPosting]:
    """Scrapes job listings from LinkedIn, Indeed, Glassdoor using python-jobspy."""
    postings: List[ScrapedPosting] = []
    if sites is None:
        sites = ["linkedin", "indeed", "glassdoor"]

    try:
        from jobspy import scrape_jobs

        # Map generic city or country to appropriate format for JobSpy
        country_param = "India"
        df = scrape_jobs(
            site_name=sites,
            search_term=search_term,
            location=location,
            results_wanted=limit,
            country_indeed=country_param
        )

        if df is not None and not df.empty:
            for _, row in df.iterrows():
                try:
                    title = str(row.get("title") or "").strip()
                    company = str(row.get("company") or "").strip()
                    if not title or not company:
                        continue

                    loc = str(row.get("location") or location).strip()
                    desc = str(row.get("description") or "").strip()
                    job_url = str(row.get("job_url_direct") or row.get("job_url") or "").strip()
                    site_name = str(row.get("site") or "jobspy").lower()

                    # Salary parsing
                    sal_min = row.get("min_amount")
                    sal_max = row.get("max_amount")
                    interval = str(row.get("interval") or "yearly").lower()

                    salary_min_val = float(sal_min) if sal_min is not None and not (isinstance(sal_min, float) and sal_min != sal_min) else None
                    salary_max_val = float(sal_max) if sal_max is not None and not (isinstance(sal_max, float) and sal_max != sal_max) else None

                    # If monthly interval, annualize
                    if interval == "monthly":
                        if salary_min_val:
                            salary_min_val *= 12
                        if salary_max_val:
                            salary_max_val *= 12

                    # Posted Date
                    posted_date = date.today()
                    raw_date = row.get("date_posted")
                    if raw_date and hasattr(raw_date, "date"):
                        posted_date = raw_date.date()
                    elif isinstance(raw_date, str) and raw_date:
                        try:
                            posted_date = datetime.strptime(raw_date[:10], "%Y-%m-%d").date()
                        except Exception:
                            posted_date = date.today()

                    # Explicit skills if returned by jobspy
                    explicit_skills = []
                    raw_skills = row.get("skills")
                    if isinstance(raw_skills, list):
                        explicit_skills = [str(s) for s in raw_skills]
                    elif isinstance(raw_skills, str) and raw_skills:
                        explicit_skills = [s.strip() for s in raw_skills.split(",") if s.strip()]

                    # Experience level
                    job_level = str(row.get("job_level") or "Mid-Level")

                    postings.append(ScrapedPosting(
                        title=title,
                        company=company,
                        location=loc,
                        description=desc or f"{title} at {company}",
                        salary_min=salary_min_val,
                        salary_max=salary_max_val,
                        posted_date=posted_date,
                        source_url=job_url,
                        source_site=site_name,
                        explicit_skills=explicit_skills,
                        experience_level=job_level
                    ))
                except Exception as row_err:
                    logger.warning(f"Error parsing jobspy row: {row_err}")

    except Exception as e:
        logger.error(f"Error in jobspy scrape: {e}")

    return postings


class ScraperTaskManager:
    """Singleton task manager tracking asynchronous ingestion jobs."""
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ScraperTaskManager, cls).__new__(cls)
            cls._instance.active_task = None
            cls._instance.history = []
        return cls._instance

    def start_task(self, task_id: str, query: str, location: str, source: str, limit: int):
        self.active_task = {
            "task_id": task_id,
            "query": query,
            "location": location,
            "source": source,
            "limit": limit,
            "status": "running",
            "total_found": 0,
            "total_processed": 0,
            "newly_inserted": 0,
            "skills_extracted_count": 0,
            "recent_skills": [],
            "logs": [f"🚀 Initiated real-time ingestion pipeline for '{query}' in {location} ({source})..."],
            "started_at": datetime.now().isoformat(),
            "completed_at": None,
            "error": None
        }

    def add_log(self, message: str):
        if self.active_task:
            self.active_task["logs"].append(message)
            if len(self.active_task["logs"]) > 50:
                self.active_task["logs"] = self.active_task["logs"][-50:]

    def update_progress(self, found: int, processed: int, inserted: int, skills: List[str]):
        if self.active_task:
            self.active_task["total_found"] = found
            self.active_task["total_processed"] = processed
            self.active_task["newly_inserted"] = inserted
            for s in skills:
                if s not in self.active_task["recent_skills"]:
                    self.active_task["recent_skills"].append(s)
            self.active_task["recent_skills"] = self.active_task["recent_skills"][-15:]
            self.active_task["skills_extracted_count"] += len(skills)

    def complete_task(self, total_inserted: int):
        if self.active_task:
            self.active_task["status"] = "completed"
            self.active_task["completed_at"] = datetime.now().isoformat()
            self.active_task["newly_inserted"] = total_inserted
            self.add_log(f"✅ Ingestion completed! Successfully ingested and mapped {total_inserted} postings to database.")
            self.history.append(self.active_task)

    def fail_task(self, error_msg: str):
        if self.active_task:
            self.active_task["status"] = "failed"
            self.active_task["completed_at"] = datetime.now().isoformat()
            self.active_task["error"] = error_msg
            self.add_log(f"❌ Error during scraping: {error_msg}")
            self.history.append(self.active_task)

    def get_status(self) -> Dict[str, Any]:
        if not self.active_task:
            return {
                "status": "idle",
                "message": "Scraper engine is ready for queries",
                "active_task": None,
                "history_count": len(self.history)
            }
        return {
            "status": self.active_task["status"],
            "active_task": self.active_task,
            "history_count": len(self.history)
        }


scraper_manager = ScraperTaskManager()


def run_pipeline(task_id: str, query: str, location: str = "Bengaluru", source: str = "all", limit: int = 25):
    """Executes the full scraping, skill extraction, database insertion, and view refresh pipeline."""
    try:
        matcher = CanonicalSkillMatcher()
        scraped_records: List[ScrapedPosting] = []

        scraper_manager.add_log(f"🔎 Querying sources for target role: '{query}', hub: '{location}'...")

        # 1. Fetch from requested sources
        if source in ["all", "linkedin", "indeed", "glassdoor"]:
            sites = ["linkedin", "indeed"] if source == "all" else [source]
            scraper_manager.add_log(f"📡 Querying python-jobspy aggregator ({', '.join(sites)})...")
            jobspy_postings = scrape_jobspy_engine(
                search_term=query,
                location=location,
                limit=limit,
                sites=sites
            )
            scraped_records.extend(jobspy_postings)
            scraper_manager.add_log(f"✨ Found {len(jobspy_postings)} postings via JobSpy.")

        if source in ["all", "internshala"]:
            scraper_manager.add_log(f"🌐 Querying Internshala live job portal...")
            internshala_postings = scrape_internshala(search_term=query, location=location, limit=limit)
            scraped_records.extend(internshala_postings)
            scraper_manager.add_log(f"✨ Found {len(internshala_postings)} postings via Internshala.")

        total_found = len(scraped_records)
        scraper_manager.add_log(f"📦 Total raw listings collected: {total_found}. Processing canonical entities...")
        scraper_manager.update_progress(found=total_found, processed=0, inserted=0, skills=[])

        # 2. Database Insertion and Normalization
        newly_inserted = 0

        with get_db() as conn:
            with conn.cursor() as cur:
                # Pre-fetch job roles
                cur.execute("SELECT id, title, category FROM job_role;")
                roles = cur.fetchall()

                # Pre-fetch locations
                cur.execute("SELECT id, city, state, country, is_remote_friendly FROM location;")
                db_locations = cur.fetchall()

                for idx, posting in enumerate(scraped_records):
                    # 1. Normalize Company
                    cur.execute("SELECT id FROM company WHERE LOWER(TRIM(name)) = LOWER(TRIM(%s))", (posting.company,))
                    c_row = cur.fetchone()
                    if c_row:
                        company_id = c_row["id"]
                    else:
                        cur.execute(
                            "INSERT INTO company (name, industry, website) VALUES (%s, %s, %s) RETURNING id;",
                            (posting.company, "Software & Internet Technology", f"https://www.{re.sub(r'[^a-z0-9]', '', posting.company.lower())}.com")
                        )
                        company_id = cur.fetchone()["id"]

                    # 2. Normalize Location
                    is_remote = "remote" in posting.location.lower() or "work from home" in posting.location.lower()
                    city_candidate = location if location != "India" else "Bengaluru"
                    for known_hub in ["Bengaluru", "Hyderabad", "Pune", "Gurugram", "Noida", "Mumbai", "Chennai", "Delhi"]:
                        if known_hub.lower() in posting.location.lower():
                            city_candidate = known_hub
                            break

                    loc_id = None
                    for loc in db_locations:
                        if loc["city"].lower() == city_candidate.lower():
                            loc_id = loc["id"]
                            break

                    if not loc_id:
                        new_state = "Karnataka" if city_candidate == "Bengaluru" else "Metro"
                        cur.execute(
                            """
                            INSERT INTO location (city, state, country, is_remote_friendly)
                            VALUES (%s, %s, %s, %s)
                            ON CONFLICT (city, state, country) DO UPDATE SET city = EXCLUDED.city
                            RETURNING id;
                            """,
                            (city_candidate, new_state, "India", is_remote)
                        )
                        loc_id = cur.fetchone()["id"]
                        # Keep the cache in sync so later postings in this city reuse the row
                        db_locations.append({
                            "id": loc_id, "city": city_candidate, "state": new_state,
                            "country": "India", "is_remote_friendly": is_remote,
                        })

                    # 3. Match Job Role
                    target_role_id = 3 # Full Stack Engineer default
                    for r in roles:
                        if any(term in posting.title.lower() for term in r["title"].lower().split()):
                            target_role_id = r["id"]
                            break

                    # 4. Check for duplicate posting
                    cur.execute(
                        """
                        SELECT id FROM job_posting 
                        WHERE company_id = %s 
                          AND LOWER(title) = LOWER(%s) 
                          AND location_id = %s 
                          AND posted_date = %s;
                        """,
                        (company_id, posting.title, loc_id, posting.posted_date)
                    )
                    dup = cur.fetchone()

                    if dup:
                        posting_id = dup["id"]
                    else:
                        cur.execute(
                            """
                            INSERT INTO job_posting (
                                company_id, job_role_id, location_id, title,
                                experience_level, min_exp_yrs, salary_min, salary_max,
                                employment_type, posted_date, source_url, raw_description
                            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                            RETURNING id;
                            """,
                            (
                                company_id, target_role_id, loc_id, posting.title,
                                posting.experience_level, posting.min_exp_yrs,
                                posting.salary_min, posting.salary_max,
                                "Full-Time", posting.posted_date, posting.source_url,
                                posting.description[:2000]
                            )
                        )
                        posting_id = cur.fetchone()["id"]
                        newly_inserted += 1

                    # 5. Extract Canonical Skills
                    full_text = f"{posting.title} {posting.description}"
                    extracted_skills = matcher.extract_skills(full_text, explicit_tags=posting.explicit_skills)

                    skill_names = [s["skill_name"] for s in extracted_skills]

                    # Map skills into posting_skill
                    for s in extracted_skills:
                        cur.execute(
                            """
                            INSERT INTO posting_skill (posting_id, skill_id, is_required, weight)
                            VALUES (%s, %s, TRUE, 1.0)
                            ON CONFLICT (posting_id, skill_id) DO NOTHING;
                            """,
                            (posting_id, s["skill_id"])
                        )

                    scraper_manager.update_progress(
                        found=total_found,
                        processed=idx + 1,
                        inserted=newly_inserted,
                        skills=skill_names
                    )

                    if (idx + 1) % 5 == 0 or idx == total_found - 1:
                        scraper_manager.add_log(
                            f"⚙️ Processed {idx + 1}/{total_found} listings... Mapped skills: {', '.join(skill_names[:4]) or 'General'}"
                        )

                # 6. Refresh Materialized View
                cur.execute("REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;")

        scraper_manager.add_log("🔄 Refreshed Materialized View 'mv_skill_demand_dashboard'.")
        scraper_manager.complete_task(newly_inserted)

    except Exception as e:
        logger.exception("Scraper pipeline failed")
        scraper_manager.fail_task(str(e))
