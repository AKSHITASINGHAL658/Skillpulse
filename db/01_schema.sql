-- ==============================================================================
-- SkillPulse: Job-Market Skill Analytics & Career Recommendation System
-- Complete 13-Table BCNF Database Schema, Views, Procedures & Triggers
-- Compatible with PostgreSQL 16
-- ==============================================================================

-- Drop existing views, procedures, and tables if needed
DROP MATERIALIZED VIEW IF EXISTS mv_skill_demand_dashboard CASCADE;
DROP VIEW IF EXISTS v_skill_pairs CASCADE;
DROP VIEW IF EXISTS v_user_skill_gaps CASCADE;

DROP TABLE IF EXISTS recommendation_item CASCADE;
DROP TABLE IF EXISTS recommendation CASCADE;
DROP TABLE IF EXISTS user_skill CASCADE;
DROP TABLE IF EXISTS app_user CASCADE;
DROP TABLE IF EXISTS skill_prerequisite CASCADE;
DROP TABLE IF EXISTS posting_skill CASCADE;
DROP TABLE IF EXISTS skill_alias CASCADE;
DROP TABLE IF EXISTS skill CASCADE;
DROP TABLE IF EXISTS skill_category CASCADE;
DROP TABLE IF EXISTS job_posting CASCADE;
DROP TABLE IF EXISTS job_role CASCADE;
DROP TABLE IF EXISTS location CASCADE;
DROP TABLE IF EXISTS company CASCADE;

-- ------------------------------------------------------------------------------
-- 1. Table: company
-- ------------------------------------------------------------------------------
CREATE TABLE company (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 2. Table: location
-- ------------------------------------------------------------------------------
CREATE TABLE location (
    id SERIAL PRIMARY KEY,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    country VARCHAR(100) NOT NULL DEFAULT 'USA',
    is_remote_friendly BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_location UNIQUE (city, state, country)
);

-- ------------------------------------------------------------------------------
-- 3. Table: job_role
-- ------------------------------------------------------------------------------
CREATE TABLE job_role (
    id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 4. Table: job_posting
-- ------------------------------------------------------------------------------
CREATE TABLE job_posting (
    id SERIAL PRIMARY KEY,
    company_id INT NOT NULL REFERENCES company(id) ON DELETE CASCADE,
    job_role_id INT NOT NULL REFERENCES job_role(id) ON DELETE CASCADE,
    location_id INT NOT NULL REFERENCES location(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    experience_level VARCHAR(50) NOT NULL DEFAULT 'Mid-Level',
    min_exp_yrs NUMERIC(4, 1) NOT NULL DEFAULT 0 CHECK (min_exp_yrs >= 0),
    salary_min NUMERIC(12, 2) CHECK (salary_min >= 0),
    salary_max NUMERIC(12, 2),
    employment_type VARCHAR(50) NOT NULL DEFAULT 'Full-Time',
    posted_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source_url VARCHAR(500),
    raw_description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    CONSTRAINT uq_posting_record UNIQUE (company_id, title, location_id, posted_date)
);

-- ------------------------------------------------------------------------------
-- 5. Table: skill_category
-- ------------------------------------------------------------------------------
CREATE TABLE skill_category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ------------------------------------------------------------------------------
-- 6. Table: skill
-- ------------------------------------------------------------------------------
CREATE TABLE skill (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category_id INT NOT NULL REFERENCES skill_category(id) ON DELETE RESTRICT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 7. Table: skill_alias
-- ------------------------------------------------------------------------------
CREATE TABLE skill_alias (
    id SERIAL PRIMARY KEY,
    alias_name VARCHAR(100) NOT NULL UNIQUE,
    skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- 8. Table: posting_skill
-- ------------------------------------------------------------------------------
CREATE TABLE posting_skill (
    posting_id INT NOT NULL REFERENCES job_posting(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    is_required BOOLEAN NOT NULL DEFAULT TRUE,
    weight NUMERIC(3, 2) NOT NULL DEFAULT 1.0 CHECK (weight BETWEEN 0.1 AND 1.0),
    PRIMARY KEY (posting_id, skill_id)
);

-- ------------------------------------------------------------------------------
-- 9. Table: skill_prerequisite
-- ------------------------------------------------------------------------------
CREATE TABLE skill_prerequisite (
    skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    prereq_skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    difficulty_level VARCHAR(50) NOT NULL DEFAULT 'Intermediate',
    PRIMARY KEY (skill_id, prereq_skill_id),
    CONSTRAINT chk_no_self_prereq CHECK (skill_id <> prereq_skill_id)
);

-- ------------------------------------------------------------------------------
-- 10. Table: app_user
-- ------------------------------------------------------------------------------
CREATE TABLE app_user (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    target_role_id INT REFERENCES job_role(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- 11. Table: user_skill
-- ------------------------------------------------------------------------------
CREATE TABLE user_skill (
    user_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    proficiency INT NOT NULL CHECK (proficiency BETWEEN 1 AND 5),
    acquired_date DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (user_id, skill_id)
);

-- ------------------------------------------------------------------------------
-- 12. Table: recommendation
-- ------------------------------------------------------------------------------
CREATE TABLE recommendation (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
    target_role_id INT NOT NULL REFERENCES job_role(id) ON DELETE CASCADE,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    readiness_score NUMERIC(5, 2) NOT NULL DEFAULT 0 CHECK (readiness_score BETWEEN 0 AND 100)
);

-- ------------------------------------------------------------------------------
-- 13. Table: recommendation_item
-- ------------------------------------------------------------------------------
CREATE TABLE recommendation_item (
    id SERIAL PRIMARY KEY,
    recommendation_id INT NOT NULL REFERENCES recommendation(id) ON DELETE CASCADE,
    skill_id INT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
    prereq_skill_id INT REFERENCES skill(id) ON DELETE SET NULL,
    step_no INT NOT NULL CHECK (step_no > 0),
    demand_pct NUMERIC(5, 2) NOT NULL CHECK (demand_pct BETWEEN 0 AND 100),
    reason TEXT,
    CONSTRAINT uq_rec_item_skill UNIQUE (recommendation_id, skill_id)
);

-- ==============================================================================
-- ANALYTIC INDEXES
-- ==============================================================================
CREATE INDEX idx_posting_date ON job_posting(posted_date);
CREATE INDEX idx_posting_role ON job_posting(job_role_id);
CREATE INDEX idx_posting_location ON job_posting(location_id);
CREATE INDEX idx_postskill_skill ON posting_skill(skill_id);
CREATE INDEX idx_postskill_posting ON posting_skill(posting_id);
CREATE INDEX idx_user_skill_user ON user_skill(user_id);
CREATE INDEX idx_recommendation_user ON recommendation(user_id);
CREATE INDEX idx_alias_lookup ON skill_alias(LOWER(alias_name));

-- ==============================================================================
-- ANALYTICAL VIEWS & MATERIALIZED VIEWS
-- ==============================================================================

-- 1. Co-occurrence View: Pairs of skills appearing together in job postings
CREATE OR REPLACE VIEW v_skill_pairs AS
SELECT 
    ps1.skill_id AS skill_a_id,
    s1.name AS skill_a_name,
    ps2.skill_id AS skill_b_id,
    s2.name AS skill_b_name,
    COUNT(DISTINCT ps1.posting_id) AS co_occurrence_count
FROM posting_skill ps1
JOIN posting_skill ps2 
    ON ps1.posting_id = ps2.posting_id 
   AND ps1.skill_id < ps2.skill_id
JOIN skill s1 ON ps1.skill_id = s1.id
JOIN skill s2 ON ps2.skill_id = s2.id
GROUP BY ps1.skill_id, s1.name, ps2.skill_id, s2.name;

-- 2. Materialized View: mv_skill_demand_dashboard
-- Aggregates skill frequencies, top roles, and average salaries
CREATE MATERIALIZED VIEW mv_skill_demand_dashboard AS
WITH skill_stats AS (
    SELECT 
        s.id AS skill_id,
        s.name AS skill_name,
        sc.name AS category_name,
        COUNT(DISTINCT jp.id) AS posting_count,
        ROUND(AVG((COALESCE(jp.salary_min, 0) + COALESCE(jp.salary_max, jp.salary_min, 0)) / 2.0), 2) AS avg_salary,
        MIN(COALESCE(jp.salary_min, 0)) AS min_salary,
        MAX(COALESCE(jp.salary_max, jp.salary_min, 0)) AS max_salary
    FROM skill s
    JOIN skill_category sc ON s.category_id = sc.id
    LEFT JOIN posting_skill ps ON s.id = ps.skill_id
    LEFT JOIN job_posting jp ON ps.posting_id = jp.id
    GROUP BY s.id, s.name, sc.name
),
top_roles AS (
    SELECT 
        ps.skill_id,
        jr.title AS top_role_title,
        COUNT(*) AS role_posting_count,
        ROW_NUMBER() OVER (PARTITION BY ps.skill_id ORDER BY COUNT(*) DESC) AS rnk
    FROM posting_skill ps
    JOIN job_posting jp ON ps.posting_id = jp.id
    JOIN job_role jr ON jp.job_role_id = jr.id
    GROUP BY ps.skill_id, jr.title
)
SELECT 
    ss.skill_id,
    ss.skill_name,
    ss.category_name,
    ss.posting_count,
    ROUND((ss.posting_count::NUMERIC / NULLIF((SELECT COUNT(*) FROM job_posting), 0)) * 100.0, 2) AS market_demand_pct,
    COALESCE(ss.avg_salary, 0) AS avg_salary,
    COALESCE(ss.min_salary, 0) AS min_salary,
    COALESCE(ss.max_salary, 0) AS max_salary,
    COALESCE(tr.top_role_title, 'General Tech') AS primary_role
FROM skill_stats ss
LEFT JOIN top_roles tr ON ss.skill_id = tr.skill_id AND tr.rnk = 1;

CREATE UNIQUE INDEX idx_mv_skill_demand_id ON mv_skill_demand_dashboard(skill_id);

-- Refresh procedure
CREATE OR REPLACE PROCEDURE sp_refresh_dashboard_mv()
LANGUAGE plpgsql
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_skill_demand_dashboard;
END;
$$;

-- ==============================================================================
-- STORED PROCEDURES & TRIGGERS
-- ==============================================================================

-- 1. sp_import_posting: Ingests raw job rows, maps aliases via skill_alias to canonical skill_id,
-- avoids duplicates based on (company_id, title, location_id, posted_date)
CREATE OR REPLACE PROCEDURE sp_import_posting(
    p_company_name VARCHAR(255),
    p_role_title VARCHAR(150),
    p_role_category VARCHAR(100),
    p_city VARCHAR(100),
    p_state VARCHAR(100),
    p_title VARCHAR(255),
    p_exp_level VARCHAR(50),
    p_min_exp NUMERIC,
    p_salary_min NUMERIC,
    p_salary_max NUMERIC,
    p_employment_type VARCHAR(50),
    p_posted_date DATE,
    p_skill_tokens TEXT[], -- comma/array of raw skill names or aliases
    OUT p_posting_id INT
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_company_id INT;
    v_role_id INT;
    v_location_id INT;
    v_token TEXT;
    v_canonical_skill_id INT;
BEGIN
    -- 1. Ensure Company
    SELECT id INTO v_company_id FROM company WHERE LOWER(name) = LOWER(p_company_name);
    IF v_company_id IS NULL THEN
        INSERT INTO company (name) VALUES (p_company_name) RETURNING id INTO v_company_id;
    END IF;

    -- 2. Ensure Role
    SELECT id INTO v_role_id FROM job_role WHERE LOWER(title) = LOWER(p_role_title);
    IF v_role_id IS NULL THEN
        INSERT INTO job_role (title, category) 
        VALUES (p_role_title, COALESCE(p_role_category, 'Software Engineering')) 
        RETURNING id INTO v_role_id;
    END IF;

    -- 3. Ensure Location
    SELECT id INTO v_location_id FROM location WHERE LOWER(city) = LOWER(p_city) AND LOWER(COALESCE(state, '')) = LOWER(COALESCE(p_state, ''));
    IF v_location_id IS NULL THEN
        INSERT INTO location (city, state, country, is_remote_friendly) 
        VALUES (p_city, p_state, 'USA', (LOWER(p_city) = 'remote')) 
        RETURNING id INTO v_location_id;
    END IF;

    -- 4. Check for duplicate posting
    SELECT id INTO p_posting_id 
    FROM job_posting 
    WHERE company_id = v_company_id 
      AND LOWER(title) = LOWER(p_title) 
      AND location_id = v_location_id 
      AND posted_date = p_posted_date;

    IF p_posting_id IS NULL THEN
        INSERT INTO job_posting (
            company_id, job_role_id, location_id, title,
            experience_level, min_exp_yrs, salary_min, salary_max,
            employment_type, posted_date
        ) VALUES (
            v_company_id, v_role_id, v_location_id, p_title,
            COALESCE(p_exp_level, 'Mid-Level'), COALESCE(p_min_exp, 0),
            p_salary_min, p_salary_max,
            COALESCE(p_employment_type, 'Full-Time'), COALESCE(p_posted_date, CURRENT_DATE)
        ) RETURNING id INTO p_posting_id;
    END IF;

    -- 5. Map skills (checking direct canonical match first, then skill_alias)
    IF p_skill_tokens IS NOT NULL THEN
        FOREACH v_token IN ARRAY p_skill_tokens
        LOOP
            v_canonical_skill_id := NULL;
            v_token := TRIM(v_token);
            IF v_token <> '' THEN
                -- Try direct match in skill table
                SELECT id INTO v_canonical_skill_id FROM skill WHERE LOWER(name) = LOWER(v_token);
                
                -- If not found, lookup in skill_alias
                IF v_canonical_skill_id IS NULL THEN
                    SELECT skill_id INTO v_canonical_skill_id FROM skill_alias WHERE LOWER(alias_name) = LOWER(v_token);
                END IF;

                -- If canonical skill is found, map to posting
                IF v_canonical_skill_id IS NOT NULL THEN
                    INSERT INTO posting_skill (posting_id, skill_id, is_required, weight)
                    VALUES (p_posting_id, v_canonical_skill_id, TRUE, 1.0)
                    ON CONFLICT (posting_id, skill_id) DO NOTHING;
                END IF;
            END IF;
        END LOOP;
    END IF;
END;
$$;

-- 2. generate_recommendation: Implements recursive CTE
CREATE OR REPLACE FUNCTION generate_recommendation(p_user_id INT)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_role_id INT;
    v_recommendation_id INT;
    v_total_role_postings INT;
    v_owned_skills_count INT;
    v_required_skills_count INT;
    v_readiness_score NUMERIC(5,2);
BEGIN
    -- Fetch target role for user
    SELECT target_role_id INTO v_target_role_id FROM app_user WHERE id = p_user_id;
    IF v_target_role_id IS NULL THEN
        RAISE EXCEPTION 'User % does not have a target role selected.', p_user_id;
    END IF;

    -- Total postings for this role
    SELECT COUNT(*) INTO v_total_role_postings FROM job_posting WHERE job_role_id = v_target_role_id;
    IF v_total_role_postings = 0 THEN
        v_total_role_postings := 1; -- avoid division by zero
    END IF;

    -- Count total skills needed for this role and how many user owns
    WITH role_skills AS (
        SELECT DISTINCT ps.skill_id
        FROM job_posting jp
        JOIN posting_skill ps ON jp.id = ps.posting_id
        WHERE jp.job_role_id = v_target_role_id
    )
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN us.skill_id IS NOT NULL THEN 1 END)
    INTO v_required_skills_count, v_owned_skills_count
    FROM role_skills rs
    LEFT JOIN user_skill us ON rs.skill_id = us.skill_id AND us.user_id = p_user_id;

    IF v_required_skills_count > 0 THEN
        v_readiness_score := ROUND((v_owned_skills_count::NUMERIC / v_required_skills_count::NUMERIC) * 100.0, 2);
    ELSE
        v_readiness_score := 0.0;
    END IF;

    -- Create new recommendation header
    INSERT INTO recommendation (user_id, target_role_id, readiness_score)
    VALUES (p_user_id, v_target_role_id, v_readiness_score)
    RETURNING id INTO v_recommendation_id;

    -- Recursive CTE to calculate roadmap:
    -- Traverses prerequisites hierarchy and assigns step numbers
    WITH RECURSIVE 
    -- 1. Demand of skills for target role (not already possessed by user)
    missing_skills AS (
        SELECT 
            ps.skill_id,
            ROUND((COUNT(DISTINCT jp.id)::NUMERIC / v_total_role_postings::NUMERIC) * 100.0, 2) AS demand_pct
        FROM job_posting jp
        JOIN posting_skill ps ON jp.id = ps.posting_id
        WHERE jp.job_role_id = v_target_role_id
          AND ps.skill_id NOT IN (SELECT skill_id FROM user_skill WHERE user_id = p_user_id)
        GROUP BY ps.skill_id
    ),
    -- 2. Traverse prerequisites recursively to find full dependency DAG
    prereq_graph AS (
        -- Anchor: Base prerequisites (skills that have NO prerequisites of their own among the needed set)
        SELECT 
            sp.prereq_skill_id AS current_skill_id,
            NULL::INT AS parent_skill_id,
            1 AS depth,
            COALESCE(ms.demand_pct, 50.0) AS demand_pct
        FROM missing_skills ms
        JOIN skill_prerequisite sp ON ms.skill_id = sp.skill_id
        WHERE sp.prereq_skill_id NOT IN (SELECT skill_id FROM user_skill WHERE user_id = p_user_id)
        
        UNION ALL
        
        -- Recursive step: Target skill depends on prerequisite
        SELECT 
            sp.skill_id AS current_skill_id,
            pg.current_skill_id AS parent_skill_id,
            pg.depth + 1 AS depth,
            COALESCE(ms.demand_pct, 50.0) AS demand_pct
        FROM prereq_graph pg
        JOIN skill_prerequisite sp ON pg.current_skill_id = sp.prereq_skill_id
        LEFT JOIN missing_skills ms ON sp.skill_id = ms.skill_id
        WHERE pg.depth < 10 -- cycle prevention
    ),
    all_needed_skills AS (
        -- Combine missing skills directly requested and prerequisites discovered
        SELECT 
            current_skill_id AS skill_id,
            parent_skill_id AS prereq_skill_id,
            depth AS raw_step,
            demand_pct
        FROM prereq_graph
        UNION
        SELECT 
            skill_id,
            NULL::INT AS prereq_skill_id,
            1 AS raw_step,
            demand_pct
        FROM missing_skills
        WHERE skill_id NOT IN (SELECT current_skill_id FROM prereq_graph)
    ),
    ordered_plan AS (
        SELECT 
            skill_id,
            prereq_skill_id,
            demand_pct,
            DENSE_RANK() OVER (ORDER BY raw_step ASC, demand_pct DESC) AS step_no,
            ROW_NUMBER() OVER (PARTITION BY skill_id ORDER BY raw_step ASC) AS dedup_rank
        FROM all_needed_skills
        WHERE skill_id NOT IN (SELECT skill_id FROM user_skill WHERE user_id = p_user_id)
    )
    INSERT INTO recommendation_item (recommendation_id, skill_id, prereq_skill_id, step_no, demand_pct, reason)
    SELECT 
        v_recommendation_id,
        op.skill_id,
        op.prereq_skill_id,
        op.step_no,
        op.demand_pct,
        CASE 
            WHEN op.prereq_skill_id IS NOT NULL THEN 'Foundational prerequisite required before advanced topics'
            WHEN op.demand_pct >= 70 THEN 'Critical core requirement with >70% market demand'
            WHEN op.demand_pct >= 40 THEN 'High priority skill frequently required for this role'
            ELSE 'Recommended booster skill for competitive edge'
        END AS reason
    FROM ordered_plan op
    WHERE op.dedup_rank = 1
    ORDER BY op.step_no ASC, op.demand_pct DESC;

    RETURN v_recommendation_id;
END;
$$;
