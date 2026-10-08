-- ==============================================================================
-- SkillPulse: Job-Market Skill Analytics & Career Recommendation System
-- Comprehensive Seed Data Script (15+ Companies, 10 Locations, 8 Roles,
-- 40+ Skills, 20+ Prereqs, 200+ Job Postings, Aliases, Demo Users)
-- ==============================================================================

-- 1. COMPANIES (15 Companies)
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
ON CONFLICT (id) DO NOTHING;

SELECT setval('company_id_seq', (SELECT MAX(id) FROM company));

-- 2. LOCATIONS (10 Locations)
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
ON CONFLICT (id) DO NOTHING;

SELECT setval('location_id_seq', (SELECT MAX(id) FROM location));

-- 3. JOB ROLES (8 Roles)
INSERT INTO job_role (id, title, category, description) VALUES
(1, 'Java Backend Developer', 'Backend Engineering', 'Architects and maintains robust distributed enterprise services with Spring and microservices.'),
(2, 'Frontend Developer', 'Web Engineering', 'Builds rich interactive and accessible web interfaces using React, TypeScript, and modern styling.'),
(3, 'Full Stack Engineer', 'Full Stack Engineering', 'Delivers end-to-end features bridging responsive UI components and scalable backend APIs.'),
(4, 'Data Analyst', 'Data Analytics', 'Transforms business data into actionable dashboards, KPIs, and executive intelligence.'),
(5, 'Machine Learning Engineer', 'AI & Machine Learning', 'Designs, fine-tunes, and deploys scalable ML models, inference pipelines, and LLM systems.'),
(6, 'Cloud Architect', 'Cloud Infrastructure', 'Designs resilient multi-region cloud architectures, cost models, and serverless infrastructure.'),
(7, 'DevOps Engineer', 'Infrastructure & SRE', 'Automates CI/CD deployment pipelines, Kubernetes orchestration, and observability.'),
(8, 'Cybersecurity Analyst', 'Security Operations', 'Protects systems from vulnerabilities, threat modeling, and zero-trust identity architectures.')
ON CONFLICT (id) DO NOTHING;

SELECT setval('job_role_id_seq', (SELECT MAX(id) FROM job_role));

-- 4. SKILL CATEGORIES
INSERT INTO skill_category (id, name, description) VALUES
(1, 'Programming Languages', 'Core syntax and runtime paradigms'),
(2, 'Backend Frameworks', 'Web API frameworks and application servers'),
(3, 'Frontend & UI', 'Client-side technologies, libraries, and design systems'),
(4, 'Cloud & Infrastructure', 'Cloud platforms, serverless, and cloud-native services'),
(5, 'Databases & Storage', 'Relational, NoSQL, and vector storage engines'),
(6, 'DevOps & Tooling', 'CI/CD, containerization, and monitoring tools'),
(7, 'AI & Data Science', 'Data processing, statistical analysis, and machine learning')
ON CONFLICT (id) DO NOTHING;

SELECT setval('skill_category_id_seq', (SELECT MAX(id) FROM skill_category));

-- 5. SKILLS (45+ Skills across categories)
INSERT INTO skill (id, name, category_id, description) VALUES
-- Languages (1-10)
(1, 'Java', 1, 'Object-oriented language for enterprise-grade backend systems'),
(2, 'Python', 1, 'Versatile language for backend services, automation, and AI'),
(3, 'JavaScript', 1, 'High-level script language powering modern web browsers'),
(4, 'TypeScript', 1, 'Typed superset of JavaScript enhancing maintainability'),
(5, 'Go', 1, 'High performance compiled language for cloud microservices'),
(6, 'SQL', 1, 'Standard declarative language for relational database management'),
(7, 'C++', 1, 'Systems programming language with low latency and high efficiency'),
(8, 'Rust', 1, 'Memory-safe systems programming language with zero-cost abstractions'),

-- Backend Frameworks (9-14)
(9, 'Spring Boot', 2, 'Industry standard framework for standalone Java microservices'),
(10, 'FastAPI', 2, 'Modern high-performance async Python API framework'),
(11, 'Node.js', 2, 'Asynchronous event-driven JavaScript backend runtime'),
(12, 'Express.js', 2, 'Minimalist web framework for Node.js'),
(13, 'Django', 2, 'High-level Python web framework with batteries included'),
(14, 'Microservices Architecture', 2, 'Architectural pattern for decomposing monoliths into services'),

-- Frontend & UI (15-20)
(15, 'React', 3, 'Component-driven frontend UI library developed by Meta'),
(16, 'Next.js', 3, 'Production React framework with SSR, SSG, and App Router'),
(17, 'Tailwind CSS', 3, 'Utility-first CSS framework for rapid modern UI development'),
(18, 'HTML5 & CSS3', 3, 'Foundational semantic markup and styling standards'),
(19, 'Redux / Zustand', 3, 'Predictable state management patterns for React applications'),
(20, 'GraphQL', 3, 'Query language and runtime for declarative client API fetching'),

-- Cloud & Infrastructure (21-26)
(21, 'AWS', 4, 'Amazon Web Services comprehensive cloud ecosystem'),
(22, 'Google Cloud Platform', 4, 'Google enterprise cloud compute, analytics, and AI platform'),
(23, 'Microsoft Azure', 4, 'Enterprise cloud computing service by Microsoft'),
(24, 'Terraform', 4, 'Declarative Infrastructure as Code (IaC) provisioning tool'),
(25, 'Serverless Architecture', 4, 'Event-driven compute model using AWS Lambda / Cloud Functions'),
(26, 'Cloud Security & IAM', 4, 'Identity and access management policies in multi-cloud environments'),

-- Databases & Storage (27-33)
(27, 'PostgreSQL', 5, 'Advanced open-source relational database with JSON & recursive CTE support'),
(28, 'MySQL', 5, 'Popular open-source relational database management system'),
(29, 'MongoDB', 5, 'Document-oriented NoSQL database for flexible JSON structures'),
(30, 'Redis', 5, 'In-memory key-value cache and message broker with microsecond latency'),
(31, 'Elasticsearch', 5, 'Distributed search and analytics engine for text and logs'),
(32, 'Snowflake Data Warehouse', 5, 'Elastic cloud data warehouse for large-scale analytics'),
(33, 'Kafka', 5, 'Distributed event streaming platform for high-throughput messaging'),

-- DevOps & Tooling (34-39)
(34, 'Docker', 6, 'Containerization platform for isolated application environments'),
(35, 'Kubernetes', 6, 'Production-grade container orchestration and autoscaling engine'),
(36, 'CI/CD Pipelines (GitHub Actions / GitLab)', 6, 'Continuous integration and automated delivery pipelines'),
(37, 'Prometheus & Grafana', 6, 'Metrics collection and visual observability dashboards'),
(38, 'Git & Version Control', 6, 'Distributed version control and collaboration workflows'),
(39, 'Linux & Shell Scripting', 6, 'OS administration, bash scripting, and process diagnostics'),

-- AI & Data Science (40-46)
(40, 'Pandas & NumPy', 7, 'Core data manipulation and numerical vector computing in Python'),
(41, 'PyTorch', 7, 'Deep learning framework for neural networks and LLMs'),
(42, 'TensorFlow', 7, 'End-to-end open-source machine learning platform'),
(43, 'Scikit-Learn', 7, 'Machine learning toolkit for classification, regression, and clustering'),
(44, 'MLOps & MLflow', 7, 'Model lifecycle tracking, registry, and deployment pipelines'),
(45, 'Large Language Models (LLMs)', 7, 'Prompt engineering, RAG, and fine-tuning foundation models'),
(46, 'Tableau / PowerBI', 7, 'Business intelligence and interactive data storytelling software')
ON CONFLICT (id) DO NOTHING;

SELECT setval('skill_id_seq', (SELECT MAX(id) FROM skill));

-- 6. SKILL ALIASES
INSERT INTO skill_alias (alias_name, skill_id) VALUES
('py', 2),
('python3', 2),
('js', 3),
('javascript', 3),
('ts', 4),
('typescript', 4),
('golang', 5),
('postgres', 27),
('postgresql 16', 27),
('pg', 27),
('reactjs', 15),
('react.js', 15),
('nextjs', 16),
('next.js 14', 16),
('next', 16),
('tailwind', 17),
('tailwindcss', 17),
('spring', 9),
('springboot', 9),
('node', 11),
('nodejs', 11),
('k8s', 35),
('kube', 35),
('gh actions', 36),
('github actions', 36),
('aws cloud', 21),
('gcp', 22),
('azure', 23),
('pandas', 40),
('numpy', 40),
('llm', 45),
('generative ai', 45),
('genai', 45)
ON CONFLICT (alias_name) DO NOTHING;

-- 7. SKILL PREREQUISITES (25 Prerequisite dependency edges)
INSERT INTO skill_prerequisite (skill_id, prereq_skill_id, difficulty_level) VALUES
-- Java Backend track
(9, 1, 'Intermediate'),        -- Spring Boot requires Java
(14, 9, 'Advanced'),           -- Microservices requires Spring Boot
(33, 14, 'Advanced'),          -- Kafka requires Microservices
(27, 6, 'Intermediate'),       -- PostgreSQL requires SQL

-- Web Frontend track
(4, 3, 'Intermediate'),        -- TypeScript requires JavaScript
(15, 3, 'Beginner'),           -- React requires JavaScript
(15, 18, 'Beginner'),          -- React requires HTML/CSS
(16, 15, 'Intermediate'),      -- Next.js requires React
(16, 4, 'Intermediate'),       -- Next.js requires TypeScript
(17, 18, 'Beginner'),          -- Tailwind requires HTML/CSS
(19, 15, 'Intermediate'),      -- Redux/Zustand requires React
(20, 11, 'Intermediate'),      -- GraphQL requires Node.js

-- DevOps & Cloud track
(35, 34, 'Advanced'),          -- Kubernetes requires Docker
(34, 39, 'Intermediate'),      -- Docker requires Linux
(36, 38, 'Intermediate'),      -- CI/CD requires Git
(24, 21, 'Advanced'),          -- Terraform requires AWS
(25, 21, 'Intermediate'),      -- Serverless requires AWS
(37, 35, 'Advanced'),          -- Prometheus requires Kubernetes

-- Data & AI track
(40, 2, 'Beginner'),           -- Pandas requires Python
(43, 40, 'Intermediate'),      -- Scikit-Learn requires Pandas
(41, 40, 'Advanced'),          -- PyTorch requires Pandas
(42, 40, 'Advanced'),          -- TensorFlow requires Pandas
(44, 41, 'Advanced'),          -- MLOps requires PyTorch
(45, 41, 'Advanced'),          -- LLMs requires PyTorch
(46, 6, 'Beginner')            -- Tableau/PowerBI requires SQL
ON CONFLICT (skill_id, prereq_skill_id) DO NOTHING;

-- 8. DEMO USERS
-- Password hash for 'password123'
INSERT INTO app_user (id, username, email, password_hash, target_role_id) VALUES
(1, 'alex_dev', 'alex@example.com', '$2b$12$e6mO8f8r1Kq4O7QjC0H9m.6nEkmw7jX9lVqP4Z3W2s8kL1mN0pQ2i', 1), -- Targets Java Backend
(2, 'sarah_frontend', 'sarah@example.com', '$2b$12$e6mO8f8r1Kq4O7QjC0H9m.6nEkmw7jX9lVqP4Z3W2s8kL1mN0pQ2i', 2), -- Targets Frontend Dev
(3, 'marcus_ai', 'marcus@example.com', '$2b$12$e6mO8f8r1Kq4O7QjC0H9m.6nEkmw7jX9lVqP4Z3W2s8kL1mN0pQ2i', 5), -- Targets ML Engineer
(4, 'demo_user', 'demo@skillpulse.dev', '$2b$12$e6mO8f8r1Kq4O7QjC0H9m.6nEkmw7jX9lVqP4Z3W2s8kL1mN0pQ2i', 3) -- Targets Full Stack
ON CONFLICT (id) DO NOTHING;

SELECT setval('app_user_id_seq', (SELECT MAX(id) FROM app_user));

-- User skills for Alex (owns Java and SQL)
INSERT INTO user_skill (user_id, skill_id, proficiency) VALUES
(1, 1, 4), -- Alex has Java (4/5)
(1, 6, 3), -- Alex has SQL (3/5)
(1, 38, 4), -- Alex has Git (4/5)
(2, 3, 4), -- Sarah has JS
(2, 18, 5), -- Sarah has HTML/CSS
(3, 2, 5), -- Marcus has Python
(3, 40, 4) -- Marcus has Pandas
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- 9. SEED 220+ REALISTIC JOB POSTINGS WITH MAPPED SKILLS
-- Use a programmatic PL/pgSQL block to populate realistic distributed postings
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
    FOR i IN 1..220 LOOP
        -- Select role with distribution
        r := (i % 8) + 1;
        v_role_id := r;
        v_comp_id := ((i * 3 + 2) % v_comp_count) + 1;
        v_loc_id := ((i * 7 + 1) % v_loc_count) + 1;
        v_date := CURRENT_DATE - ((i * 2) % 180); -- Past 6 months
        
        -- Titles and salaries based on role
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

        -- Insert job posting
        INSERT INTO job_posting (
            company_id, job_role_id, location_id, title,
            experience_level, min_exp_yrs, salary_min, salary_max,
            employment_type, posted_date, source_url
        ) VALUES (
            v_comp_id, v_role_id, v_loc_id, v_title || ' #' || i,
            v_exp_lvl, v_exp_yrs, v_sal_min, v_sal_max,
            'Full-Time', v_date, 'https://careers.example.com/job/' || i
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
                (v_post_id, 18, TRUE, 0.8),  -- HTML/CSS
                (v_post_id, 19, (i % 3 = 0), 0.7)   -- Redux
                ON CONFLICT DO NOTHING;
            WHEN 3 THEN -- Full Stack
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 4, TRUE, 1.0),   -- TypeScript
                (v_post_id, 15, TRUE, 0.95), -- React
                (v_post_id, 11, TRUE, 0.9),  -- Node.js
                (v_post_id, 27, TRUE, 0.85), -- PostgreSQL
                (v_post_id, 16, (i % 2 = 0), 0.8), -- Next.js
                (v_post_id, 34, FALSE, 0.7), -- Docker
                (v_post_id, 21, (i % 3 = 0), 0.75) -- AWS
                ON CONFLICT DO NOTHING;
            WHEN 4 THEN -- Data Analyst
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 6, TRUE, 1.0),   -- SQL
                (v_post_id, 2, TRUE, 0.85),  -- Python
                (v_post_id, 40, TRUE, 0.9),  -- Pandas
                (v_post_id, 46, TRUE, 0.95), -- Tableau
                (v_post_id, 32, (i % 2 = 0), 0.8), -- Snowflake
                (v_post_id, 27, FALSE, 0.7)  -- PostgreSQL
                ON CONFLICT DO NOTHING;
            WHEN 5 THEN -- ML Engineer
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 2, TRUE, 1.0),   -- Python
                (v_post_id, 40, TRUE, 0.95), -- Pandas
                (v_post_id, 41, TRUE, 0.9),  -- PyTorch
                (v_post_id, 43, TRUE, 0.85), -- Scikit-Learn
                (v_post_id, 45, (i % 2 = 0), 0.9), -- LLMs
                (v_post_id, 44, (i % 3 = 0), 0.8), -- MLOps
                (v_post_id, 34, FALSE, 0.75) -- Docker
                ON CONFLICT DO NOTHING;
            WHEN 6 THEN -- Cloud Architect
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 21, TRUE, 1.0),  -- AWS
                (v_post_id, 24, TRUE, 0.95), -- Terraform
                (v_post_id, 35, TRUE, 0.9),  -- Kubernetes
                (v_post_id, 26, TRUE, 0.85), -- Cloud Security
                (v_post_id, 25, (i % 2 = 0), 0.8), -- Serverless
                (v_post_id, 22, (i % 3 = 0), 0.75) -- GCP
                ON CONFLICT DO NOTHING;
            WHEN 7 THEN -- DevOps
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 34, TRUE, 1.0),  -- Docker
                (v_post_id, 35, TRUE, 0.95), -- Kubernetes
                (v_post_id, 36, TRUE, 0.9),  -- CI/CD
                (v_post_id, 39, TRUE, 0.85), -- Linux
                (v_post_id, 24, (i % 2 = 0), 0.8), -- Terraform
                (v_post_id, 37, (i % 2 = 0), 0.8), -- Prometheus
                (v_post_id, 21, (i % 3 = 0), 0.75) -- AWS
                ON CONFLICT DO NOTHING;
            ELSE -- Cybersecurity
                INSERT INTO posting_skill (posting_id, skill_id, is_required, weight) VALUES
                (v_post_id, 39, TRUE, 0.9),  -- Linux
                (v_post_id, 26, TRUE, 1.0),  -- Cloud Security
                (v_post_id, 2, FALSE, 0.8),  -- Python
                (v_post_id, 21, (i % 2 = 0), 0.8), -- AWS
                (v_post_id, 38, TRUE, 0.75)  -- Git
                ON CONFLICT DO NOTHING;
        END CASE;
    END LOOP;
END $$;

-- 10. REFRESH MATERIALIZED VIEW
REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;

-- 11. GENERATE INITIAL RECOMMENDATIONS FOR SEED USERS
SELECT generate_recommendation(1);
SELECT generate_recommendation(2);
SELECT generate_recommendation(3);
SELECT generate_recommendation(4);
