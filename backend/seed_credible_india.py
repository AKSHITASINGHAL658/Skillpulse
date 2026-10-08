import psycopg
import random
from datetime import date, timedelta

DB_URI = "postgresql://postgres:@127.0.0.1:5432/skillpulse"

COMPANIES = [
    {"id": 1, "name": "Flipkart", "industry": "E-Commerce & Supply Chain", "website": "https://flipkart.com", "target_count": 55, "base_salary": 2700000, "salary_spread": 450000},
    {"id": 2, "name": "Swiggy", "industry": "Consumer Tech & Logistics", "website": "https://swiggy.com", "target_count": 44, "base_salary": 2500000, "salary_spread": 400000},
    {"id": 3, "name": "Zomato", "industry": "Quick Commerce & FoodTech", "website": "https://zomato.com", "target_count": 31, "base_salary": 2200000, "salary_spread": 350000},
    {"id": 4, "name": "Razorpay", "industry": "Fintech & Neo-Banking", "website": "https://razorpay.com", "target_count": 49, "base_salary": 2900000, "salary_spread": 450000},
    {"id": 5, "name": "CRED", "industry": "Fintech & Premium Rewards", "website": "https://cred.club", "target_count": 28, "base_salary": 3300000, "salary_spread": 500000},
    {"id": 6, "name": "PhonePe", "industry": "Fintech & UPI Ecosystem", "website": "https://phonepe.com", "target_count": 58, "base_salary": 2650000, "salary_spread": 400000},
    {"id": 7, "name": "Zerodha", "industry": "Fintech & Capital Markets", "website": "https://zerodha.com", "target_count": 22, "base_salary": 3100000, "salary_spread": 450000},
    {"id": 8, "name": "Jio Platforms", "industry": "Telecom & Digital Cloud", "website": "https://jio.com", "target_count": 60, "base_salary": 2100000, "salary_spread": 350000},
    {"id": 9, "name": "Tata Consultancy Services", "industry": "Global Enterprise IT", "website": "https://tcs.com", "target_count": 72, "base_salary": 1650000, "salary_spread": 300000},
    {"id": 10, "name": "Infosys", "industry": "Digital & AI Services", "website": "https://infosys.com", "target_count": 68, "base_salary": 1550000, "salary_spread": 280000},
    {"id": 11, "name": "Microsoft India (IDC)", "industry": "Cloud, AI & Systems", "website": "https://microsoft.com/en-in", "target_count": 46, "base_salary": 3600000, "salary_spread": 550000},
    {"id": 12, "name": "Google India", "industry": "Cloud, AI & Android", "website": "https://google.co.in", "target_count": 42, "base_salary": 3800000, "salary_spread": 600000},
    {"id": 13, "name": "Amazon India", "industry": "Retail & AWS Infrastructure", "website": "https://amazon.in", "target_count": 52, "base_salary": 3500000, "salary_spread": 500000},
    {"id": 14, "name": "Atlassian India", "industry": "Productivity & Enterprise SaaS", "website": "https://atlassian.com", "target_count": 35, "base_salary": 3750000, "salary_spread": 550000},
    {"id": 15, "name": "Uber India Tech", "industry": "Mobility & Logistics Platforms", "website": "https://uber.com", "target_count": 64, "base_salary": 3450000, "salary_spread": 500000},
]

LOCATIONS = [
    (1, 'Bengaluru', 'Karnataka', 'India', True, 0.32),
    (2, 'Hyderabad', 'Telangana', 'India', True, 0.22),
    (3, 'Pune', 'Maharashtra', 'India', True, 0.14),
    (4, 'Gurugram', 'Haryana', 'India', True, 0.12),
    (5, 'Noida', 'Uttar Pradesh', 'India', False, 0.06),
    (6, 'Mumbai', 'Maharashtra', 'India', True, 0.06),
    (7, 'Chennai', 'Tamil Nadu', 'India', False, 0.04),
    (8, 'Remote (India)', 'Pan-India', 'India', True, 0.04),
]

ROLE_SKILL_MAPPINGS = {
    1: {"skills": [1, 9, 6, 27, 14, 34, 33, 21], "titles": ["Senior Java Backend Engineer", "Staff Java Platform Architect", "Java Microservices Specialist", "Backend Software Engineer (Java)", "Enterprise Java Systems Lead"]},
    2: {"skills": [3, 4, 15, 16, 17, 18, 19, 20], "titles": ["Senior React Frontend Architect", "Staff Web Applications Engineer", "UI/UX React Engineer", "Next.js Frontend Developer", "Design Systems Engineer"]},
    3: {"skills": [3, 4, 15, 11, 27, 34, 21, 16], "titles": ["Full Stack Product Engineer", "Senior Full Stack Architect (Node/React)", "Staff Software Engineer", "Founding Full Stack Engineer", "Principal Applications Engineer"]},
    4: {"skills": [6, 2, 40, 46, 27, 32], "titles": ["Lead Business Intelligence Analyst", "Senior Product Data Analyst", "Analytics Engineer (SQL/Snowflake)", "Quantitative Data Analyst", "Staff Marketing Analytics Specialist"]},
    5: {"skills": [2, 40, 41, 42, 43, 45, 44, 34, 21], "titles": ["Applied ML Scientist", "Senior AI / LLM Systems Engineer", "Computer Vision Research Engineer", "Staff Deep Learning Engineer", "GenAI Infrastructure Engineer"]},
    6: {"skills": [21, 24, 35, 34, 23, 22, 26, 25], "titles": ["Principal Cloud Solutions Architect", "Enterprise AWS Infrastructure Architect", "Multi-Cloud Security Architect", "Staff Cloud Systems Architect", "Cloud Foundation Lead"]},
    7: {"skills": [34, 35, 36, 39, 38, 24, 21, 37], "titles": ["Senior DevOps Engineer", "Staff Site Reliability Engineer (SRE)", "Kubernetes Infrastructure Specialist", "CI/CD Platform Automations Lead", "Principal Observability Engineer"]},
    8: {"skills": [39, 26, 2, 38, 34, 21], "titles": ["Cybersecurity Defense Architect", "Senior Cloud Security Engineer", "Threat Detection & Response Lead", "Application Security Specialist", "Zero Trust Identity Engineer"]},
}

def seed():
    with psycopg.connect(DB_URI) as conn:
        with conn.cursor() as cur:
            # Clear old postings
            cur.execute("TRUNCATE TABLE posting_skill CASCADE;")
            cur.execute("TRUNCATE TABLE recommendation_item CASCADE;")
            cur.execute("TRUNCATE TABLE recommendation CASCADE;")
            cur.execute("TRUNCATE TABLE job_posting CASCADE;")
            cur.execute("TRUNCATE TABLE company CASCADE;")
            cur.execute("TRUNCATE TABLE location CASCADE;")

            # Insert Companies
            for c in COMPANIES:
                cur.execute(
                    "INSERT INTO company (id, name, industry, website) VALUES (%s, %s, %s, %s);",
                    (c["id"], c["name"], c["industry"], c["website"])
                )
            cur.execute("SELECT setval('company_id_seq', (SELECT MAX(id) FROM company));")

            # Insert Locations
            for loc in LOCATIONS:
                cur.execute(
                    "INSERT INTO location (id, city, state, country, is_remote_friendly) VALUES (%s, %s, %s, %s, %s);",
                    (loc[0], loc[1], loc[2], loc[3], loc[4])
                )
            cur.execute("SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));")

            today = date(2026, 10, 8)
            posting_id_counter = 1

            # Seed postings per company to hit exact target count and median salary
            for comp in COMPANIES:
                target_count = comp["target_count"]
                base_sal = comp["base_salary"]
                spread = comp["salary_spread"]
                comp_id = comp["id"]

                for i in range(target_count):
                    role_id = (i % 8) + 1
                    role_info = ROLE_SKILL_MAPPINGS[role_id]

                    # Distribute locations based on weights
                    r_val = (i * 17 + comp_id * 3) % 100 / 100.0
                    acc = 0
                    loc_id = LOCATIONS[0][0]
                    for loc in LOCATIONS:
                        acc += loc[5]
                        if r_val <= acc:
                            loc_id = loc[0]
                            break

                    # Distribute dates evenly across 180 days (past 6 months)
                    days_back = int((i * 180.0) / target_count)
                    post_date = today - timedelta(days=days_back)

                    # Balanced salary around base_salary
                    delta_factor = ((i % 11) - 5) / 5.0 # -1.0 to +1.0
                    sal_min = int(base_sal + (delta_factor * spread))
                    sal_max = int(sal_min + random.randint(300000, 650000))
                    
                    title = role_info["titles"][i % len(role_info["titles"])]
                    exp_yrs = 3.0 + ((i % 6) * 1.2)
                    exp_lvl = "Senior" if exp_yrs >= 6 else "Mid-Level" if exp_yrs >= 3 else "Entry-Level"

                    cur.execute(
                        """
                        INSERT INTO job_posting (
                            id, company_id, job_role_id, location_id, title,
                            experience_level, min_exp_yrs, salary_min, salary_max,
                            employment_type, posted_date, source_url
                        ) VALUES (
                            %s, %s, %s, %s, %s,
                            %s, %s, %s, %s,
                            'Full-Time', %s, %s
                        ) RETURNING id;
                        """,
                        (
                            posting_id_counter, comp_id, role_id, loc_id, f"{title} #{posting_id_counter}",
                            exp_lvl, exp_yrs, sal_min, sal_max,
                            post_date, f"https://careers.skillpulse.in/jobs/{posting_id_counter}"
                        )
                    )

                    # Assign skills
                    for s_id in role_info["skills"]:
                        # Required if index < 4, otherwise weighted
                        is_req = (role_info["skills"].index(s_id) < 4) or ((i + s_id) % 3 != 0)
                        weight = 1.0 if is_req else 0.75
                        cur.execute(
                            """
                            INSERT INTO posting_skill (posting_id, skill_id, is_required, weight)
                            VALUES (%s, %s, %s, %s) ON CONFLICT DO NOTHING;
                            """,
                            (posting_id_counter, s_id, is_req, weight)
                        )

                    posting_id_counter += 1

            cur.execute("SELECT setval('job_posting_id_seq', (SELECT MAX(id) FROM job_posting));")

            # Refresh Materialized View
            cur.execute("REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;")

            # Generate default recommendation for user 1
            cur.execute("SELECT generate_recommendation(1);")

        conn.commit()

    print(f"Credible Indian Tech Market Data successfully seeded! Total postings: {posting_id_counter - 1}")

if __name__ == "__main__":
    seed()
