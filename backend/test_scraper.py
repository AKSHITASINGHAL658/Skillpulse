import urllib.request
import json
import time
import sys
import psycopg

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

DB_URI = "postgresql://postgres:@127.0.0.1:5432/skillpulse"
API_BASE = "http://127.0.0.1:8000/api/v1"

def test_scraper_service():
    print("=== Testing SkillPulse Scraper Engine ===")

    # 1. Check Initial Status
    req = urllib.request.Request(f"{API_BASE}/scraper/status")
    with urllib.request.urlopen(req) as resp:
        status_data = json.loads(resp.read().decode())
        print(f"1. Initial Scraper Status: {status_data['status']}")

    # 2. Trigger an Ingestion Run (Internshala + JobSpy)
    payload = {
        "query": "Java Backend",
        "location": "Bengaluru",
        "source": "all",
        "limit": 6
    }
    req = urllib.request.Request(
        f"{API_BASE}/scraper/trigger",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req) as resp:
        trigger_res = json.loads(resp.read().decode())
        print(f"2. Trigger Response: {trigger_res}")
        task_id = trigger_res.get("task_id")
        assert task_id, "Missing task_id in response!"

    # 3. Poll for Completion (up to 30 seconds)
    print("3. Polling for background pipeline completion...")
    for i in range(20):
        time.sleep(1.5)
        req = urllib.request.Request(f"{API_BASE}/scraper/status")
        with urllib.request.urlopen(req) as resp:
            st = json.loads(resp.read().decode())
            cur_status = st.get("status")
            task = st.get("active_task", {})
            logs = task.get("logs", [])
            last_log = logs[-1] if logs else ""
            print(f"   [{i+1}] Status: {cur_status} | Found: {task.get('total_found', 0)} | Inserted: {task.get('newly_inserted', 0)} | Skills Extracted: {task.get('skills_extracted_count', 0)} | Last Log: {last_log}")
            if cur_status in ["completed", "failed"]:
                break

    assert cur_status == "completed", f"Scraper task failed or did not complete in time! Final status: {cur_status}"

    # 4. Verify Database Records
    print("\n4. Verifying Database Ingestion & Skill Mappings...")
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM job_posting;")
            posting_count = cur.fetchone()[0]
            print(f"   Total job_posting rows: {posting_count}")

            cur.execute("SELECT COUNT(*) FROM posting_skill;")
            skill_map_count = cur.fetchone()[0]
            print(f"   Total posting_skill mappings: {skill_map_count}")

            cur.execute("SELECT COUNT(*) FROM mv_skill_demand_dashboard;")
            mv_count = cur.fetchone()[0]
            print(f"   Total mv_skill_demand_dashboard rows: {mv_count}")

            # Check recent postings with their mapped skills
            cur.execute("""
                SELECT jp.id, jp.title, c.name as company, l.city, 
                       ARRAY_AGG(s.name) as mapped_skills
                FROM job_posting jp
                JOIN company c ON jp.company_id = c.id
                JOIN location l ON jp.location_id = l.id
                LEFT JOIN posting_skill ps ON jp.id = ps.posting_id
                LEFT JOIN skill s ON ps.skill_id = s.id
                GROUP BY jp.id, jp.title, c.name, l.city
                ORDER BY jp.id DESC
                LIMIT 5;
            """)
            recent = cur.fetchall()
            print("\n   Most recent 5 job postings in PostgreSQL:")
            for r in recent:
                print(f"     • [ID: {r[0]}] '{r[1]}' at {r[2]} ({r[3]}) -> Skills: {r[4]}")

    print("\n=== ALL SCRAPER ENGINE TESTS PASSED! ===")

if __name__ == "__main__":
    test_scraper_service()
