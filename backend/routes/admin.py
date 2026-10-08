from fastapi import APIRouter, UploadFile, File, HTTPException
import csv
import io
from database import fetch_all, fetch_one, execute_sql, get_db
from models import AliasCreate

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.post("/import-csv")
async def import_csv_postings(file: UploadFile = File(...)):
    """
    Accepts CSV upload of job postings.
    Expected CSV columns:
    company_name, role_title, role_category, city, state, title, experience_level,
    min_exp_yrs, salary_min, salary_max, employment_type, posted_date, skills
    Calls stored procedure sp_import_posting for each row.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed.")

    content = await file.read()
    try:
        text = content.decode("utf-8")
    except UnicodeDecodeError:
        text = content.decode("latin-1")

    reader = csv.DictReader(io.StringIO(text))
    imported_count = 0
    skipped_count = 0
    errors = []

    with get_db() as conn:
        for idx, row in enumerate(reader, start=1):
            try:
                comp = row.get("company_name", "").strip()
                if not comp:
                    continue
                role_title = row.get("role_title", "").strip() or "Software Engineer"
                role_cat = row.get("role_category", "").strip() or "Software Engineering"
                city = row.get("city", "").strip() or "Remote"
                state = row.get("state", "").strip() or "Global"
                title = row.get("title", "").strip() or f"{role_title} Position"
                exp_lvl = row.get("experience_level", "Mid-Level").strip() or "Mid-Level"
                min_exp_raw = row.get("min_exp_yrs", "0").strip()
                min_exp = float(min_exp_raw) if min_exp_raw else 0.0
                sal_min_raw = row.get("salary_min", "").strip()
                sal_min = float(sal_min_raw) if sal_min_raw else None
                sal_max_raw = row.get("salary_max", "").strip()
                sal_max = float(sal_max_raw) if sal_max_raw else None
                emp_type = row.get("employment_type", "Full-Time").strip() or "Full-Time"
                p_date_raw = row.get("posted_date", "").strip()
                posted_date = p_date_raw if p_date_raw else None
                raw_skills = row.get("skills", "")
                
                skill_tokens = [s.strip() for s in raw_skills.split(",") if s.strip()]

                with conn.transaction():
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            CALL sp_import_posting(
                                %s::VARCHAR, %s::VARCHAR, %s::VARCHAR, %s::VARCHAR, %s::VARCHAR, %s::VARCHAR, %s::VARCHAR,
                                %s::NUMERIC, %s::NUMERIC, %s::NUMERIC, %s::VARCHAR,
                                COALESCE(%s::DATE, CURRENT_DATE), %s::TEXT[], NULL
                            )
                            """,
                            (
                                comp, role_title, role_cat, city, state, title, exp_lvl,
                                min_exp, sal_min, sal_max, emp_type, posted_date, skill_tokens
                            )
                        )
                imported_count += 1
            except Exception as e:
                skipped_count += 1
                errors.append(f"Row {idx}: {str(e)}")

        with conn.cursor() as cur:
            cur.execute("REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;")

    return {
        "status": "completed",
        "imported_rows": imported_count,
        "skipped_rows": skipped_count,
        "errors": errors[:5]
    }

@router.get("/aliases")
def list_aliases():
    query = """
    SELECT 
        sa.id,
        sa.alias_name,
        sa.skill_id,
        s.name AS canonical_skill_name,
        sc.name AS category_name
    FROM skill_alias sa
    JOIN skill s ON sa.skill_id = s.id
    JOIN skill_category sc ON s.category_id = sc.id
    ORDER BY s.name ASC, sa.alias_name ASC;
    """
    return fetch_all(query)

@router.post("/aliases")
def create_alias(payload: AliasCreate):
    query = """
    INSERT INTO skill_alias (alias_name, skill_id)
    VALUES (%s, %s)
    ON CONFLICT (alias_name) DO UPDATE SET skill_id = EXCLUDED.skill_id
    RETURNING id, alias_name, skill_id;
    """
    try:
        res = fetch_one(query, (payload.alias_name.lower().strip(), payload.skill_id))
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create alias: {str(e)}")

@router.post("/refresh-views")
def refresh_views():
    execute_sql("REFRESH MATERIALIZED VIEW mv_skill_demand_dashboard;")
    return {"status": "success", "message": "Materialized view refreshed"}
