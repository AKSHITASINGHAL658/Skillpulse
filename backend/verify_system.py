import sys
import psycopg
from psycopg.rows import dict_row

DB_URI = "postgresql://postgres:@127.0.0.1:5432/skillpulse"

def test_db():
    print("--- 1. Testing Database Connection & Schema ---")
    with psycopg.connect(DB_URI, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # Check tables
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
                ORDER BY table_name;
            """)
            tables = [r["table_name"] for r in cur.fetchall()]
            print(f"Base Tables ({len(tables)}): {tables}")
            
            # Check row counts
            for t in tables:
                cur.execute(f"SELECT COUNT(*) as cnt FROM {t}")
                cnt = cur.fetchone()["cnt"]
                print(f"  {t}: {cnt} rows")

            # Check Materialized View
            cur.execute("SELECT COUNT(*) as cnt FROM mv_skill_demand_dashboard")
            print(f"  mv_skill_demand_dashboard: {cur.fetchone()['cnt']} rows")

            # Check View
            cur.execute("SELECT COUNT(*) as cnt FROM v_skill_pairs")
            print(f"  v_skill_pairs: {cur.fetchone()['cnt']} rows")

            # Test generate_recommendation function
            print("\n--- 2. Testing generate_recommendation(1) ---")
            cur.execute("SELECT generate_recommendation(1) AS rec_id;")
            rec_id = cur.fetchone()["rec_id"]
            print(f"  Generated Recommendation ID: {rec_id}")

            cur.execute("""
                SELECT ri.step_no, s.name as skill, ri.demand_pct, ri.reason
                FROM recommendation_item ri
                JOIN skill s ON ri.skill_id = s.id
                WHERE ri.recommendation_id = %s
                ORDER BY ri.step_no, ri.demand_pct DESC
            """, (rec_id,))
            items = cur.fetchall()
            print(f"  Roadmap items count: {len(items)}")
            for item in items[:5]:
                print(f"    Step {item['step_no']}: {item['skill']} ({item['demand_pct']}%) - {item['reason']}")

def test_api():
    print("\n--- 3. Testing Backend HTTP Endpoints ---")
    import urllib.request
    import json

    endpoints = [
        ("GET", "http://127.0.0.1:8000/health"),
        ("GET", "http://127.0.0.1:8000/docs"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/summary"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/top-skills?time_range=6m"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/trends?skill_ids=1,2&interval=month"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/co-occurrence?skill_id=1"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/salaries"),
        ("GET", "http://127.0.0.1:8000/api/v1/analytics/hiring-map?skill_id=1"),
        ("GET", "http://127.0.0.1:8000/api/v1/meta/roles"),
        ("GET", "http://127.0.0.1:8000/api/v1/meta/locations"),
        ("GET", "http://127.0.0.1:8000/api/v1/meta/skills"),
        ("GET", "http://127.0.0.1:8000/api/v1/admin/aliases"),
        ("GET", "http://127.0.0.1:8000/api/v1/users/me"),
        ("GET", "http://127.0.0.1:8000/api/v1/recommendations/latest"),
    ]

    all_passed = True
    for method, url in endpoints:
        try:
            req = urllib.request.Request(url, method=method)
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = resp.read()
                print(f"  [OK {resp.status}] {url} ({len(data)} bytes)")
        except Exception as e:
            print(f"  [FAIL] {url} -> {e}")
            all_passed = False

    return all_passed

if __name__ == "__main__":
    test_db()
    ok = test_api()
    if ok:
        print("\nAll systems operational and verified!")
    else:
        print("\nSome tests failed!")
        sys.exit(1)
