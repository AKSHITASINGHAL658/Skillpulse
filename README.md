# SkillPulse: Job-Market Skill Analytics & Career Recommendation System

SkillPulse is an enterprise-grade full-stack data analytics and personalized career roadmap recommendation platform designed to analyze job market trends, quantify skill demand momentum, and compute optimal learning paths using recursive dependency graphs.

---

## 1. System Architecture & Tech Stack

```
                                  +---------------------------------------+
                                  |   Next.js 15 (App Router, Bento UI)   |
                                  |   Tailwind CSS + Recharts + Lucide    |
                                  |   Port 3000                           |
                                  +-------------------+-------------------+
                                                      |
                                             RESTful API Requests
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        Python FastAPI Backend         |
                                  |        psycopg3 + Raw Analytical SQL  |
                                  |        Port 8000 (/docs available)    |
                                  +-------------------+-------------------+
                                                      |
                                         PostgreSQL Client Connection
                                                      |
                                                      v
    +-----------------------------------------------------------------------------------+
    |                         PostgreSQL 16 Relational Engine                           |
    |  - 13 BCNF Normalized Entities                                                    |
    |  - Recursive CTE DAG Traversal (`generate_recommendation`)                        |
    |  - Materialized View Aggregations (`mv_skill_demand_dashboard`)                   |
    |  - Co-occurrence Analytical Views (`v_skill_pairs`)                               |
    |  - Stored Procedures with Alias Normalization (`sp_import_posting`)               |
    +-----------------------------------------------------------------------------------+
```

---

## 2. PostgreSQL 16 Database Design

### 13 BCNF Entities & Relationships
1. **`company`**: Enterprise hiring organizations (`id`, `name`, `industry`, `website`).
2. **`location`**: Geographic tech hubs and remote availability (`id`, `city`, `state`, `country`, `is_remote_friendly`).
3. **`job_role`**: Standardized industry roles (`id`, `title`, `category`, `description`).
4. **`job_posting`**: Job vacancy postings with compensation ranges and constraints (`company_id`, `job_role_id`, `location_id`, `salary_min`, `salary_max`, `posted_date`).
5. **`skill_category`**: Taxonomical grouping (Languages, Backend Frameworks, Frontend & UI, Cloud, Storage, AI/ML).
6. **`skill`**: Canonical skills tracked (`id`, `name`, `category_id`, `description`).
7. **`skill_alias`**: Synonym and abbreviation mapping (`id`, `alias_name`, `skill_id`) resolving terms like `k8s` -> Kubernetes, `py` -> Python.
8. **`posting_skill`**: Many-to-many relationship mapping skills to job listings (`posting_id`, `skill_id`, `is_required`, `weight`).
9. **`skill_prerequisite`**: Directed acyclic graph (DAG) dependency edges (`skill_id`, `prereq_skill_id`, `difficulty_level`).
10. **`app_user`**: Users and career goals (`id`, `username`, `email`, `target_role_id`).
11. **`user_skill`**: User acquired inventory with 1–5 proficiency rating (`user_id`, `skill_id`, `proficiency`).
12. **`recommendation`**: Recommendation session header with overall readiness score (`user_id`, `target_role_id`, `readiness_score`).
13. **`recommendation_item`**: Step-by-step roadmap items assigned sequential step numbers based on prerequisite depth and demand share (`recommendation_id`, `skill_id`, `prereq_skill_id`, `step_no`, `demand_pct`, `reason`).

### Advanced Database Artifacts
- **Materialized View `mv_skill_demand_dashboard`**: Pre-aggregates frequency counts, market demand %, and salary percentiles.
- **View `v_skill_pairs`**: Self-joins posting skills to pre-compute co-occurrence synergy weights.
- **Stored Procedure `sp_import_posting`**: Atomically inserts postings, normalizes skills via alias table, and prevents duplicates on `(company_id, title, location_id, posted_date)`.
- **Recursive Function `generate_recommendation(p_user_id)`**:
  - Calculates skill demand % for the user's `target_role_id`.
  - Excludes skills the user already owns.
  - Traverses `skill_prerequisite` recursively using `WITH RECURSIVE` to ensure prerequisites are completed at earlier step numbers (`step_no`).
  - Computes user readiness score: `(owned_skills / required_skills) * 100`.

---

## 3. Backend Endpoints (FastAPI)

All endpoints mounted under `/api/v1`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/analytics/summary` | Top-level KPI counts and salary benchmarks |
| `GET` | `/analytics/top-skills` | Ranked skills with role, location & date filters |
| `GET` | `/analytics/trends` | 6-month monthly time-series for area charts |
| `GET` | `/analytics/co-occurrence` | Paired skill synergies from `v_skill_pairs` |
| `GET` | `/analytics/salaries` | Average vs Median salary (`PERCENTILE_CONT`) |
| `GET` | `/analytics/hiring-map` | Companies and metro tech hubs hiring for skills |
| `GET` | `/users/me` | Current user profile, target role, and owned skills |
| `POST` | `/users/skills` | Add / update skill proficiency rating (1–5 stars) |
| `DELETE` | `/users/skills/{id}` | Remove skill from user profile |
| `POST` | `/users/target-role` | Update target career role |
| `POST` | `/recommendations/generate` | Executes recursive CTE and returns roadmap DAG |
| `GET` | `/recommendations/latest` | Retrieves current user roadmap milestones |
| `POST` | `/admin/import-csv` | Multipart CSV upload executing `sp_import_posting` |
| `GET` | `/admin/aliases` | Lists current alias mappings |
| `POST` | `/admin/aliases` | Creates new canonical alias mapping |
| `POST` | `/admin/refresh-views` | Refreshes `mv_skill_demand_dashboard` |

---

## 4. Frontend UI (Next.js Bento Box)

- **Deep Dark Base Palette**: `#090D16` base, `#111827` card panels, Electric Indigo (`#6366F1`), Emerald (`#10B981`), Amber (`#F59E0B`).
- **Cell A (Large 2x2)**: Skill Demand Momentum Area Chart.
- **Cell B (Tall 1x2)**: Top Hiring Hotspots (Top organizations & metro hubs).
- **Cell C (Wide 2x1)**: Salary Spectrum Widget (Median vs Average salary comparison).
- **Cell D (1x1)**: Skill Co-occurrence Radar / Network preview.
- **Career Compass**:
  - Target Role selector & interactive 1–5 star skill inventory manager.
  - Target Role Readiness radial gauge (0–100%).
  - Step-by-Step DAG Learning Path Stepper (`Step No -> Prerequisite Skill -> Target Skill -> Market Demand %`).
- **Admin Portal**:
  - Drag-and-drop CSV batch uploader with instant feedback.
  - Canonical alias mapper.
  - Direct link to FastAPI Swagger docs (`/docs`).

---

## 5. Running the System

### PostgreSQL 16 (first-time setup)
```bash
brew services start postgresql@16
createdb skillpulse
psql -d skillpulse -f db/01_schema.sql
psql -d skillpulse -f db/02_seeds.sql
```

### FastAPI Backend
```bash
cd backend
pip3 install -r requirements.txt
# Homebrew Postgres has no "postgres" role; connect as your macOS user instead
DB_USER=$(whoami) python3 -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
Connection settings are read from `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
Interactive API Swagger documentation is accessible at: `http://127.0.0.1:8000/docs`

### Next.js Frontend
```bash
cd frontend
npm install
npm run dev -- -p 3000
```
Interactive Bento Box dashboard is accessible at: `http://localhost:3000`
