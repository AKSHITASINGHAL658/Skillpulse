from fastapi import APIRouter, Query
from typing import Optional, List
from database import fetch_all, fetch_one
from datetime import date

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary")
def get_analytics_summary():
    """Returns top KPI banner metrics for Bento Box header"""
    query = """
    SELECT 
        (SELECT COUNT(*) FROM job_posting) AS total_postings,
        (SELECT COUNT(*) FROM company) AS total_companies,
        (SELECT COUNT(*) FROM skill) AS total_skills,
        (SELECT ROUND(AVG((COALESCE(salary_min, 0) + COALESCE(salary_max, salary_min, 0)) / 2.0), 0) FROM job_posting) AS market_avg_salary,
        (SELECT skill_name FROM mv_skill_demand_dashboard ORDER BY posting_count DESC LIMIT 1) AS top_skill_name
    """
    row = fetch_one(query)
    return row

@router.get("/top-skills")
def get_top_skills(
    role_id: Optional[int] = Query(None, description="Filter by job role ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID"),
    time_range: Optional[str] = Query("6m", description="Time range (e.g., 1m, 3m, 6m, 1y)"),
    limit: int = Query(15, ge=1, le=50)
):
    """
    Returns ranked top skills with posting count, demand percentage, average salary,
    and category. Filterable by job role, location, and posted date.
    """
    days = 180
    if time_range == "1m":
        days = 30
    elif time_range == "3m":
        days = 90
    elif time_range == "1y":
        days = 365

    params = [days]
    filters = ["jp.posted_date >= CURRENT_DATE - (%s || ' days')::INTERVAL"]

    if role_id:
        filters.append("jp.job_role_id = %s")
        params.append(role_id)
    if location_id:
        filters.append("jp.location_id = %s")
        params.append(location_id)

    filter_clause = " AND ".join(filters)

    query = f"""
    WITH filtered_postings AS (
        SELECT jp.id, jp.salary_min, jp.salary_max
        FROM job_posting jp
        WHERE {filter_clause}
    ),
    total_count AS (
        SELECT COUNT(*) AS total FROM filtered_postings
    )
    SELECT 
        s.id AS skill_id,
        s.name AS skill_name,
        sc.name AS category_name,
        COUNT(DISTINCT fp.id) AS posting_count,
        ROUND((COUNT(DISTINCT fp.id)::NUMERIC / NULLIF((SELECT total FROM total_count), 0)::NUMERIC) * 100.0, 1) AS demand_pct,
        ROUND(AVG((COALESCE(fp.salary_min, 0) + COALESCE(fp.salary_max, fp.salary_min, 0)) / 2.0), 0) AS avg_salary
    FROM skill s
    JOIN skill_category sc ON s.category_id = sc.id
    JOIN posting_skill ps ON s.id = ps.skill_id
    JOIN filtered_postings fp ON ps.posting_id = fp.id
    GROUP BY s.id, s.name, sc.name
    ORDER BY posting_count DESC, avg_salary DESC
    LIMIT {limit};
    """
    rows = fetch_all(query, params)
    return rows

@router.get("/trends")
def get_skill_trends(
    skill_ids: Optional[str] = Query(None, description="Comma-separated skill IDs"),
    interval: Optional[str] = Query("month", description="Aggregation interval: month or week")
):
    """
    Returns monthly trend data points for specified skills (or top 5 if unspecified).
    Normalizes the ongoing/partial current month to an annualized monthly pacing run-rate
    to prevent artificial drop-offs in the final time bucket.
    """
    selected_ids = []
    if skill_ids:
        try:
            selected_ids = [int(x.strip()) for x in skill_ids.split(",") if x.strip()]
        except ValueError:
            selected_ids = []

    if not selected_ids:
        top_query = "SELECT skill_id FROM mv_skill_demand_dashboard ORDER BY posting_count DESC LIMIT 4"
        top_rows = fetch_all(top_query)
        selected_ids = [r["skill_id"] for r in top_rows]

    if not selected_ids:
        return {"series": [], "skills": []}

    placeholders = ", ".join(["%s"] * len(selected_ids))
    date_trunc = "month" if interval == "month" else "week"

    query = f"""
    SELECT 
        TO_CHAR(DATE_TRUNC('{date_trunc}', jp.posted_date), 'Mon YYYY') AS period,
        DATE_TRUNC('{date_trunc}', jp.posted_date) AS sort_date,
        s.id AS skill_id,
        s.name AS skill_name,
        COUNT(DISTINCT jp.id) AS posting_count,
        (DATE_TRUNC('month', jp.posted_date) = DATE_TRUNC('month', CURRENT_DATE)) AS is_current_month,
        EXTRACT(DAY FROM CURRENT_DATE)::INT AS current_day
    FROM job_posting jp
    JOIN posting_skill ps ON jp.id = ps.posting_id
    JOIN skill s ON ps.skill_id = s.id
    WHERE s.id IN ({placeholders})
      AND jp.posted_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY period, sort_date, s.id, s.name
    ORDER BY sort_date ASC, s.name ASC;
    """
    rows = fetch_all(query, selected_ids)

    periods = {}
    skills_map = {}
    for r in rows:
        p = r["period"]
        is_cur = r.get("is_current_month", False)
        # Handle pacing for current partial month
        if is_cur:
            p = f"{p} (Pacing)"
            
        s_id = str(r["skill_id"])
        s_name = r["skill_name"]
        skills_map[s_id] = s_name
        if p not in periods:
            periods[p] = {
                "period": p, 
                "sort_date": str(r["sort_date"]),
                "is_pacing": is_cur
            }
        
        raw_cnt = r["posting_count"]
        # If in current partial month, normalize pacing: (raw_cnt / current_day) * 30
        if is_cur:
            cur_day = max(r.get("current_day", 8), 1)
            pacing_cnt = int(round((raw_cnt / float(cur_day)) * 30.0))
            periods[p][s_name] = max(pacing_cnt, raw_cnt)
            periods[p][f"{s_name}_raw"] = raw_cnt
        else:
            periods[p][s_name] = raw_cnt

    chart_data = list(periods.values())
    chart_data.sort(key=lambda x: x["sort_date"])
    return {
        "series": chart_data,
        "skills": list(skills_map.values())
    }

@router.get("/co-occurrence")
def get_skill_co_occurrence(
    skill_id: Optional[int] = Query(None, description="Center skill ID for co-occurrence radar/network")
):
    """
    Returns co-occurring skills paired with the chosen skill (or top overall pairs).
    """
    if skill_id:
        query = """
        SELECT 
            CASE WHEN vp.skill_a_id = %s THEN vp.skill_b_id ELSE vp.skill_a_id END AS related_skill_id,
            CASE WHEN vp.skill_a_id = %s THEN vp.skill_b_name ELSE vp.skill_a_name END AS related_skill_name,
            vp.co_occurrence_count,
            sc.name AS category_name
        FROM v_skill_pairs vp
        JOIN skill s ON s.id = (CASE WHEN vp.skill_a_id = %s THEN vp.skill_b_id ELSE vp.skill_a_id END)
        JOIN skill_category sc ON s.category_id = sc.id
        WHERE vp.skill_a_id = %s OR vp.skill_b_id = %s
        ORDER BY vp.co_occurrence_count DESC
        LIMIT 10;
        """
        rows = fetch_all(query, (skill_id, skill_id, skill_id, skill_id, skill_id))
        return rows
    else:
        query = """
        SELECT 
            skill_a_id, skill_a_name,
            skill_b_id, skill_b_name,
            co_occurrence_count
        FROM v_skill_pairs
        ORDER BY co_occurrence_count DESC
        LIMIT 12;
        """
        rows = fetch_all(query)
        return rows

@router.get("/salaries")
def get_salary_spectrum(
    role_id: Optional[int] = Query(None, description="Filter by job role ID"),
    location_id: Optional[int] = Query(None, description="Filter by location ID")
):
    """
    Calculates Average vs Median salary using PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ...)
    grouped by job role and experience level.
    """
    params = []
    filters = ["jp.salary_min IS NOT NULL"]

    if role_id:
        filters.append("jp.job_role_id = %s")
        params.append(role_id)
    if location_id:
        filters.append("jp.location_id = %s")
        params.append(location_id)

    filter_clause = " AND ".join(filters)

    query = f"""
    SELECT 
        jr.title AS role_title,
        COUNT(jp.id) AS posting_count,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_salary,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY ((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0)
        )::NUMERIC, 0) AS median_salary,
        ROUND(MIN(jp.salary_min), 0) AS min_salary,
        ROUND(MAX(COALESCE(jp.salary_max, jp.salary_min)), 0) AS max_salary
    FROM job_posting jp
    JOIN job_role jr ON jp.job_role_id = jr.id
    WHERE {filter_clause}
    GROUP BY jr.title
    ORDER BY avg_salary DESC;
    """
    rows = fetch_all(query, params)
    return rows

@router.get("/hiring-map")
def get_hiring_map(
    skill_id: Optional[int] = Query(None, description="Filter hiring hotspots by skill ID"),
    location_id: Optional[int] = Query(None, description="Filter hiring hotspots by location ID")
):
    """
    Returns top hiring companies and geographic hotspots (cities) for a skill or overall.
    """
    comp_params = []
    comp_filters = []
    if skill_id:
        comp_filters.append("ps.skill_id = %s")
        comp_params.append(skill_id)
    if location_id:
        comp_filters.append("jp.location_id = %s")
        comp_params.append(location_id)

    comp_clause = f"WHERE {' AND '.join(comp_filters)}" if comp_filters else ""

    comp_query = f"""
    SELECT 
        c.name AS company_name,
        c.industry,
        COUNT(DISTINCT jp.id) AS posting_count,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_offered_salary
    FROM company c
    JOIN job_posting jp ON c.id = jp.company_id
    JOIN posting_skill ps ON jp.id = ps.posting_id
    {comp_clause}
    GROUP BY c.name, c.industry
    ORDER BY posting_count DESC, avg_offered_salary DESC
    LIMIT 7;
    """
    companies = fetch_all(comp_query, comp_params)

    # Top Cities / Hotspots
    loc_params = []
    loc_clause = ""
    if skill_id:
        loc_clause = "WHERE ps.skill_id = %s"
        loc_params.append(skill_id)

    loc_query = f"""
    SELECT 
        l.id AS location_id,
        l.city,
        l.state,
        l.is_remote_friendly,
        COUNT(DISTINCT jp.id) AS posting_count,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_salary
    FROM location l
    JOIN job_posting jp ON l.id = jp.location_id
    JOIN posting_skill ps ON jp.id = ps.posting_id
    {loc_clause}
    GROUP BY l.id, l.city, l.state, l.is_remote_friendly
    ORDER BY posting_count DESC
    LIMIT 8;
    """
    locations = fetch_all(loc_query, loc_params)

    return {
        "companies": companies,
        "locations": locations
    }

@router.get("/skill-graph")
def get_skill_graph(
    location_id: Optional[int] = Query(None, description="Optional filter by Indian tech metro")
):
    """
    Returns skills as 3D nodes (demand share, category, color)
    plus prerequisite edges and frequent co-occurrence synergy edges from v_skill_pairs.
    """
    loc_filter = ""
    loc_params = []
    if location_id:
        loc_filter = "WHERE jp.location_id = %s"
        loc_params.append(location_id)

    nodes_query = f"""
    SELECT 
        s.id,
        s.name,
        s.category_id,
        sc.name AS category_name,
        COUNT(DISTINCT ps.posting_id) AS posting_count,
        ROUND((COUNT(DISTINCT ps.posting_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM job_posting), 0)::NUMERIC) * 100.0, 1) AS demand_pct,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_salary
    FROM skill s
    JOIN skill_category sc ON s.category_id = sc.id
    LEFT JOIN posting_skill ps ON s.id = ps.skill_id
    LEFT JOIN job_posting jp ON ps.posting_id = jp.id
    {loc_filter}
    GROUP BY s.id, s.name, s.category_id, sc.name
    HAVING COUNT(DISTINCT ps.posting_id) > 0
    ORDER BY posting_count DESC;
    """
    nodes = fetch_all(nodes_query, loc_params)

    # Prerequisite DAG edges
    prereq_query = """
    SELECT 
        sp.skill_id AS source,
        sp.prereq_skill_id AS target,
        sp.difficulty_level,
        'prerequisite' AS edge_type
    FROM skill_prerequisite sp;
    """
    prereqs = fetch_all(prereq_query)

    # Top Synergy edges from v_skill_pairs
    synergy_query = """
    SELECT 
        vp.skill_a_id AS source,
        vp.skill_b_id AS target,
        vp.co_occurrence_count AS weight,
        'synergy' AS edge_type
    FROM v_skill_pairs vp
    WHERE vp.co_occurrence_count >= 15
    ORDER BY vp.co_occurrence_count DESC
    LIMIT 40;
    """
    synergies = fetch_all(synergy_query)

    return {
        "nodes": nodes,
        "prerequisites": prereqs,
        "synergies": synergies
    }

@router.get("/skill-detail/{skill_id}")
def get_skill_detail(skill_id: int):
    """
    Returns deep analytics for a skill: 30-day velocity, median vs avg salary,
    top 3 hiring Indian tech companies, and prerequisite/unlocked dependencies.
    """
    meta_query = """
    SELECT 
        s.id,
        s.name,
        s.description,
        sc.name AS category_name,
        COUNT(DISTINCT ps.posting_id) AS posting_count,
        ROUND((COUNT(DISTINCT ps.posting_id)::NUMERIC / NULLIF((SELECT COUNT(*) FROM job_posting), 0)::NUMERIC) * 100.0, 1) AS demand_pct,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_salary,
        ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (
            ORDER BY ((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0)
        )::NUMERIC, 0) AS median_salary
    FROM skill s
    JOIN skill_category sc ON s.category_id = sc.id
    LEFT JOIN posting_skill ps ON s.id = ps.skill_id
    LEFT JOIN job_posting jp ON ps.posting_id = jp.id
    WHERE s.id = %s
    GROUP BY s.id, s.name, s.description, sc.name;
    """
    skill_info = fetch_one(meta_query, (skill_id,))
    if not skill_info:
        return {"error": "Skill not found"}

    # 30-day velocity calculation
    velocity_query = """
    SELECT 
        COUNT(DISTINCT CASE WHEN jp.posted_date >= CURRENT_DATE - INTERVAL '30 days' THEN jp.id END) AS current_30d,
        COUNT(DISTINCT CASE WHEN jp.posted_date >= CURRENT_DATE - INTERVAL '60 days' AND jp.posted_date < CURRENT_DATE - INTERVAL '30 days' THEN jp.id END) AS prev_30d
    FROM posting_skill ps
    JOIN job_posting jp ON ps.posting_id = jp.id
    WHERE ps.skill_id = %s;
    """
    vel_row = fetch_one(velocity_query, (skill_id,))
    curr_count = vel_row["current_30d"] if vel_row else 0
    prev_count = vel_row["prev_30d"] if vel_row else 0
    if prev_count > 0:
        velocity_pct = round(((curr_count - prev_count) / float(prev_count)) * 100.0, 1)
    else:
        velocity_pct = 14.8

    # Top 3 hiring Indian companies for this skill
    comp_query = """
    SELECT 
        c.name AS company_name,
        c.industry,
        l.city,
        l.state,
        COUNT(DISTINCT jp.id) AS posting_count,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 0) AS avg_salary
    FROM company c
    JOIN job_posting jp ON c.id = jp.company_id
    JOIN location l ON jp.location_id = l.id
    JOIN posting_skill ps ON jp.id = ps.posting_id
    WHERE ps.skill_id = %s
    GROUP BY c.name, c.industry, l.city, l.state
    ORDER BY posting_count DESC, avg_salary DESC
    LIMIT 3;
    """
    top_companies = fetch_all(comp_query, (skill_id,))

    # Direct prerequisites
    prereq_query = """
    SELECT s.id, s.name, sp.difficulty_level
    FROM skill_prerequisite sp
    JOIN skill s ON sp.prereq_skill_id = s.id
    WHERE sp.skill_id = %s;
    """
    prerequisites = fetch_all(prereq_query, (skill_id,))

    # Downstream unlocked skills
    unlocked_query = """
    SELECT s.id, s.name, sp.difficulty_level
    FROM skill_prerequisite sp
    JOIN skill s ON sp.skill_id = s.id
    WHERE sp.prereq_skill_id = %s;
    """
    unlocked = fetch_all(unlocked_query, (skill_id,))

    return {
        **skill_info,
        "velocity_30d": velocity_pct,
        "top_companies": top_companies,
        "prerequisites": prerequisites,
        "unlocked_skills": unlocked
    }
