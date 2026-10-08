from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from database import fetch_one, fetch_all, get_db
from routes.users import get_current_user_id

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

@router.post("/generate")
def generate_user_recommendation(user_id: int = Depends(get_current_user_id)):
    """
    Executes PostgreSQL generate_recommendation(p_user_id) function which uses
    recursive CTE to compute skill demand, exclude owned skills, traverse DAG prerequisites,
    and generate step-by-step roadmap with readiness scores.
    """
    user = fetch_one("SELECT target_role_id FROM app_user WHERE id = %s", (user_id,))
    if not user or not user["target_role_id"]:
        raise HTTPException(status_code=400, detail="User must have a target role set to generate recommendations.")

    # Call the stored function
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT generate_recommendation(%s) AS rec_id", (user_id,))
            res = cur.fetchone()
            rec_id = res["rec_id"]

    return get_recommendation_details(rec_id)

@router.get("/latest")
def get_latest_recommendation(user_id: int = Depends(get_current_user_id)):
    """Fetches the latest recommendation generated for current user"""
    latest = fetch_one("""
        SELECT id FROM recommendation 
        WHERE user_id = %s 
        ORDER BY generated_at DESC 
        LIMIT 1
    """, (user_id,))

    if not latest:
        # If no recommendation exists yet, attempt to generate one automatically
        return generate_user_recommendation(user_id)

    return get_recommendation_details(latest["id"])

def get_recommendation_details(rec_id: int):
    rec = fetch_one("""
        SELECT 
            r.id,
            r.user_id,
            r.target_role_id,
            jr.title AS target_role_title,
            jr.category AS role_category,
            r.readiness_score,
            r.generated_at
        FROM recommendation r
        JOIN job_role jr ON r.target_role_id = jr.id
        WHERE r.id = %s
    """, (rec_id,))

    if not rec:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    items = fetch_all("""
        SELECT 
            ri.id,
            ri.step_no,
            ri.skill_id,
            s.name AS skill_name,
            sc.name AS category_name,
            ri.prereq_skill_id,
            ps.name AS prereq_skill_name,
            ri.demand_pct,
            ri.reason
        FROM recommendation_item ri
        JOIN skill s ON ri.skill_id = s.id
        JOIN skill_category sc ON s.category_id = sc.id
        LEFT JOIN skill ps ON ri.prereq_skill_id = ps.id
        WHERE ri.recommendation_id = %s
        ORDER BY ri.step_no ASC, ri.demand_pct DESC
    """, (rec_id,))

    # Group items by step_no
    steps = {}
    for item in items:
        step = item["step_no"]
        if step not in steps:
            steps[step] = []
        steps[step].append(item)

    roadmap_steps = [{"step_no": k, "skills": v} for k, v in sorted(steps.items())]

    return {
        "recommendation": rec,
        "items": items,
        "roadmap_steps": roadmap_steps
    }
