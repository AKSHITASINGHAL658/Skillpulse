import psycopg

DB_URI = "postgresql://postgres:@127.0.0.1:5432/skillpulse"

sql = """
-- Truncate dependent posting data to reload fresh India-oriented market data
TRUNCATE TABLE posting_skill CASCADE;
TRUNCATE TABLE recommendation_item CASCADE;
TRUNCATE TABLE recommendation CASCADE;
TRUNCATE TABLE job_posting CASCADE;
TRUNCATE TABLE company CASCADE;
TRUNCATE TABLE location CASCADE;

-- 1. COMPANIES (Indian Tech Titans & Global Capability Centers in India)
INSERT INTO company (id, name, industry, website) VALUES
(1, 'Flipkart', 'E-Commerce & Supply Chain', 'https://flipkart.com'),
(2, 'Swiggy', 'Consumer Tech & Logistics', 'https://swiggy.com'),
(3, 'Zomato', 'Quick Commerce & FoodTech', 'https://zomato.com'),
(4, 'Razorpay', 'Fintech & Neo-Banking', 'https://razorpay.com'),
(5, 'CRED', 'Fintech & Premium Rewards', 'https://cred.club'),
(6, 'PhonePe', 'Fintech & UPI Ecosystem', 'https://phonepe.com'),
(7, 'Zerodha', 'Fintech & Capital Markets', 'https://zerodha.com'),
(8, 'Jio Platforms', 'Telecom & Digital Cloud', 'https://jio.com'),
(9, 'Tata Consultancy Services', 'Global Enterprise IT', 'https://tcs.com'),
(10, 'Infosys', 'Digital & AI Services', 'https://infosys.com'),
(11, 'Microsoft India (IDC)', 'Cloud, AI & Systems', 'https://microsoft.com/en-in'),
(12, 'Google India', 'Cloud, AI & Android', 'https://google.co.in'),
(13, 'Amazon India', 'Retail & AWS Infrastructure', 'https://amazon.in'),
(14, 'Atlassian India', 'Productivity & Enterprise SaaS', 'https://atlassian.com'),
(15, 'Uber India Tech', 'Mobility & Logistics Platforms', 'https://uber.com')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, industry = EXCLUDED.industry, website = EXCLUDED.website;

SELECT setval('company_id_seq', (SELECT MAX(id) FROM company));

-- 2. LOCATIONS (Top Indian Tech Metros & Hubs)
INSERT INTO location (id, city, state, country, is_remote_friendly) VALUES
(1, 'Bengaluru', 'Karnataka', 'India', TRUE),
(2, 'Hyderabad', 'Telangana', 'India', TRUE),
(3, 'Pune', 'Maharashtra', 'India', TRUE),
(4, 'Gurugram', 'Haryana', 'India', TRUE),
(5, 'Noida', 'Uttar Pradesh', 'India', FALSE),
(6, 'Mumbai', 'Maharashtra', 'India', TRUE),
(7, 'Chennai', 'Tamil Nadu', 'India', FALSE),
(8, 'Remote (India)', 'Pan-India', 'India', TRUE),
(9, 'Ahmedabad', 'Gujarat', 'India', TRUE),
(10, 'Kolkata', 'West Bengal', 'India', FALSE)
ON CONFLICT (id) DO UPDATE SET city = EXCLUDED.city, state = EXCLUDED.state, country = EXCLUDED.country, is_remote_friendly = EXCLUDED.is_remote_friendly;

SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));

-- 3. SEED REALISTIC INDIAN TECH JOB POSTINGS WITH SALARIES IN INR (LPA)
DO $$
DECLARE
    v_comp_count INT := 15;
    v_loc_count INT := 10;
    v_post_id INT;
    v_role_id INT;
    v_comp_id INT;
    v_loc_id INT;
    v_date DATE;
    v_sal_min NUMERIC;
    v_sal_max NUMERIC;
    v_exp_yrs NUMERIC;
    v_title VARCHAR(255);
    v_exp_lvl VARCHAR(50);
    i INT;
    r INT;
BEGIN
    FOR i IN 1..240 LOOP
        r := (i % 8) + 1;
        v_role_id := r;
        v_comp_id := ((i * 3 + 2) % v_comp_count) + 1;
        v_loc_id := ((i * 7 + 1) % v_loc_count) + 1;
        v_date := CURRENT_DATE - ((i * 2) % 180);
        
        CASE v_role_id
            WHEN 1 THEN -- Java Backend (16L - 38L)
                v_title := (ARRAY['Senior Java Backend Engineer', 'Staff Java Platform Engineer', 'Java Microservices Developer', 'Backend Software Engineer (Java/Spring)', 'Lead Enterprise Java Architect'])[((i % 5) + 1)];
                v_sal_min := 1600000 + ((i % 6) * 200000);
                v_sal_max := v_sal_min + 500000 + ((i % 4) * 250000);
                v_exp_yrs := 3.0 + ((i % 5) * 1.5);
                v_exp_lvl := CASE WHEN v_exp_yrs >= 7 THEN 'Senior' WHEN v_exp_yrs >= 4 THEN 'Mid-Level' ELSE 'Entry-Level' END;
            WHEN 2 THEN -- Frontend Developer (14L - 32L)
                v_title := (ARRAY['Senior React Frontend Architect', 'Frontend Software Engineer', 'UI/UX React Engineer', 'Web Applications Engineer', 'Next.js Frontend Developer'])[((i % 5) + 1)];
                v_sal_min := 1400000 + ((i % 5) * 180000);
                v_sal_max := v_sal_min + 400000 + ((i % 3) * 200000);
                v_exp_yrs := 2.0 + ((i % 4) * 1.5);
                v_exp_lvl := CASE WHEN v_exp_yrs >= 6 THEN 'Senior' WHEN v_exp_yrs >= 3 THEN 'Mid-Level' ELSE 'Entry-Level' END;
            WHEN 3 THEN -- Full Stack (16L - 42L)
                v_title := (ARRAY['Full Stack Software Engineer', 'Senior Full Stack Developer (Node/React)', 'Principal Full Stack Architect', 'Full Stack Product Engineer', 'Founding Full Stack Engineer'])[((i % 5) + 1)];
                v_sal_min := 1600000 + ((i % 7) * 220000);
                v_sal_max := v_sal_min + 600000 + ((i % 4) * 250000);
                v_exp_yrs := 3.0 + ((i % 5) * 1.2);
                v_exp_lvl := 'Mid-Level';
            WHEN 4 THEN -- Data Analyst (9L - 22L)
                v_title := (ARRAY['Senior Data Analyst', 'Lead Product Data Analyst', 'Business Intelligence Analyst', 'Analytics Engineer (SQL/Snowflake)', 'Quantitative Data Analyst'])[((i % 5) + 1)];
                v_sal_min := 900000 + ((i % 6) * 150000);
                v_sal_max := v_sal_min + 350000 + ((i % 4) * 150000);
                v_exp_yrs := 2.0 + ((i % 4) * 1.0);
                v_exp_lvl := 'Mid-Level';
            WHEN 5 THEN -- ML Engineer (24L - 65L)
                v_title := (ARRAY['Machine Learning Engineer', 'Senior AI / LLM Systems Engineer', 'Computer Vision Research Engineer', 'Applied ML Scientist', 'Deep Learning Infrastructure Engineer'])[((i % 5) + 1)];
                v_sal_min := 2400000 + ((i % 8) * 350000);
                v_sal_max := v_sal_min + 800000 + ((i % 5) * 350000);
                v_exp_yrs := 4.0 + ((i % 5) * 1.5);
                v_exp_lvl := 'Senior';
            WHEN 6 THEN -- Cloud Architect (28L - 72L)
                v_title := (ARRAY['Principal Cloud Solutions Architect', 'Enterprise AWS Cloud Architect', 'Multi-Cloud Infrastructure Architect', 'Cloud Security & Network Architect', 'Senior Cloud Platform Engineer'])[((i % 5) + 1)];
                v_sal_min := 2800000 + ((i % 6) * 400000);
                v_sal_max := v_sal_min + 1000000 + ((i % 4) * 400000);
                v_exp_yrs := 6.0 + ((i % 5) * 1.5);
                v_exp_lvl := 'Lead / Principal';
            WHEN 7 THEN -- DevOps Engineer (15L - 38L)
                v_title := (ARRAY['Senior DevOps Engineer', 'Site Reliability Engineer (SRE)', 'Kubernetes Platform Engineer', 'CI/CD Infrastructure Automations Lead', 'DevOps & Cloud Engineer'])[((i % 5) + 1)];
                v_sal_min := 1500000 + ((i % 6) * 220000);
                v_sal_max := v_sal_min + 500000 + ((i % 4) * 200000);
                v_exp_yrs := 3.5 + ((i % 4) * 1.5);
                v_exp_lvl := 'Mid-Level';
            ELSE -- Cybersecurity (14L - 32L)
                v_title := (ARRAY['Cybersecurity Defense Analyst', 'Cloud Security Engineer', 'Senior Threat Detection Specialist', 'Security Operations Center (SOC) Analyst', 'Application Security Engineer'])[((i % 5) + 1)];
                v_sal_min := 1400000 + ((i % 6) * 180000);
                v_sal_max := v_sal_min + 450000 + ((i % 3) * 180000);
                v_exp_yrs := 3.0 + ((i % 4) * 1.2);
                v_exp_lvl := 'Mid-Level';
        END CASE;

        INSERT INTO job_posting (
            company_id, job_role_id, location_id, title,
            experience_level, min_exp_yrs, salary_min, salary_max,
            employment_type, posted_date, source_url
        ) VALUES (
            v_comp_id, v_role_id, v_loc_id, v_title || ' #' || i,
            v_exp_lvl, v_exp_yrs, v_sal_min, v_sal_max,
            'Full-Time', v_date, 'https://careers.skillpulse.in/job/' || i
        ) RETURNING id INTO v_post_id;

        -- Map skills according to role
        CASE v_role_id
            WHEN 1 THEN -- Java Backend
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 1, TRUE, 1.0),   -- Java
                (v_post_id, 9, TRUE, 0.95),  -- Spring Boot
                (v_post_id, 6, TRUE, 0.9),   -- SQL
                (v_post_id, 27, FALSE, 0.8), -- PostgreSQL
                (v_post_id, 14, TRUE, 0.85), -- Microservices
                (v_post_id, 34, FALSE, 0.7), -- Docker
                (v_post_id, 33, (i % 2 = 0), 0.75), -- Kafka
                (v_post_id, 21, (i % 3 = 0), 0.7)  -- AWS
                ON CONFLICT DO NOTHING;
            WHEN 2 THEN -- Frontend Dev
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 3, TRUE, 1.0),   -- JavaScript
                (v_post_id, 4, TRUE, 0.95),  -- TypeScript
                (v_post_id, 15, TRUE, 1.0),  -- React
                (v_post_id, 16, (i % 2 = 0), 0.85), -- Next.js
                (v_post_id, 17, TRUE, 0.9),  -- Tailwind CSS
                (v_post_id, 18, TRUE, 0.8),  -- HTML5/CSS3
                (v_post_id, 19, (i % 3 = 0), 0.75), -- Redux/Zustand
                (v_post_id, 20, (i % 4 = 0), 0.7)   -- GraphQL
                ON CONFLICT DO NOTHING;
            WHEN 3 THEN -- Full Stack
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 3, TRUE, 0.95),  -- JavaScript
                (v_post_id, 4, TRUE, 0.9),   -- TypeScript
                (v_post_id, 15, TRUE, 0.9),  -- React
                (v_post_id, 11, TRUE, 0.9),  -- Node.js
                (v_post_id, 27, TRUE, 0.85), -- PostgreSQL
                (v_post_id, 34, FALSE, 0.75),-- Docker
                (v_post_id, 21, (i % 2 = 0), 0.8), -- AWS
                (v_post_id, 16, (i % 3 = 0), 0.75) -- Next.js
                ON CONFLICT DO NOTHING;
            WHEN 4 THEN -- Data Analyst
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 6, TRUE, 1.0),   -- SQL
                (v_post_id, 2, TRUE, 0.9),   -- Python
                (v_post_id, 40, TRUE, 0.85), -- Pandas & NumPy
                (v_post_id, 46, TRUE, 0.95), -- Tableau / PowerBI
                (v_post_id, 27, FALSE, 0.7), -- PostgreSQL
                (v_post_id, 32, (i % 2 = 0), 0.8) -- Snowflake
                ON CONFLICT DO NOTHING;
            WHEN 5 THEN -- ML Engineer
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 2, TRUE, 1.0),   -- Python
                (v_post_id, 40, TRUE, 0.9),  -- Pandas & NumPy
                (v_post_id, 41, TRUE, 0.95), -- PyTorch
                (v_post_id, 42, (i % 2 = 0), 0.8), -- TensorFlow
                (v_post_id, 43, TRUE, 0.85), -- Scikit-Learn
                (v_post_id, 45, (i % 2 = 0), 0.9), -- LLMs
                (v_post_id, 44, (i % 3 = 0), 0.8), -- MLOps
                (v_post_id, 34, FALSE, 0.75),-- Docker
                (v_post_id, 21, (i % 2 = 0), 0.75) -- AWS
                ON CONFLICT DO NOTHING;
            WHEN 6 THEN -- Cloud Architect
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 21, TRUE, 1.0),  -- AWS
                (v_post_id, 24, TRUE, 0.95), -- Terraform
                (v_post_id, 35, TRUE, 0.9),  -- Kubernetes
                (v_post_id, 34, TRUE, 0.85), -- Docker
                (v_post_id, 23, (i % 2 = 0), 0.8), -- Azure
                (v_post_id, 22, (i % 3 = 0), 0.75),-- GCP
                (v_post_id, 26, TRUE, 0.85), -- Cloud Security & IAM
                (v_post_id, 25, (i % 2 = 0), 0.8)  -- Serverless
                ON CONFLICT DO NOTHING;
            WHEN 7 THEN -- DevOps Engineer
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 34, TRUE, 1.0),  -- Docker
                (v_post_id, 35, TRUE, 0.95), -- Kubernetes
                (v_post_id, 36, TRUE, 0.95), -- CI/CD
                (v_post_id, 39, TRUE, 0.9),  -- Linux
                (v_post_id, 38, TRUE, 0.85), -- Git
                (v_post_id, 24, (i % 2 = 0), 0.85), -- Terraform
                (v_post_id, 21, TRUE, 0.85), -- AWS
                (v_post_id, 37, (i % 2 = 0), 0.8)  -- Prometheus
                ON CONFLICT DO NOTHING;
            ELSE -- Cybersecurity Analyst
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 39, TRUE, 0.9),  -- Linux
                (v_post_id, 26, TRUE, 0.95), -- Cloud Security & IAM
                (v_post_id, 2, (i % 2 = 0), 0.8),   -- Python
                (v_post_id, 38, TRUE, 0.8),  -- Git
                (v_post_id, 34, FALSE, 0.7), -- Docker
                (v_post_id, 21, (i % 2 = 0), 0.75) -- AWS
                ON CONFLICT DO NOTHING;
        END CASE;
    END LOOP;
END;
$$;

-- Refresh Materialized View with updated data
REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;

-- Generate demo recommendation for user 1
SELECT generate_recommendation(1);
"""

with psycopg.connect(DB_URI) as conn:
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.commit()
print("India market seed data applied successfully!")
