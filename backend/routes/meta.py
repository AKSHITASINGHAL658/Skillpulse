from fastapi import APIRouter
from database import fetch_all

router = APIRouter(prefix="/meta", tags=["Metadata"])

@router.get("/roles")
def get_roles():
    return fetch_all("SELECT id, title, category, description FROM job_role ORDER BY title ASC;")

@router.get("/locations")
def get_locations():
    return fetch_all("SELECT id, city, state, country, is_remote_friendly FROM location ORDER BY city ASC;")

@router.get("/skills")
def get_skills():
    return fetch_all("""
        SELECT s.id, s.name, sc.name AS category_name, s.category_id, s.description
        FROM skill s
        JOIN skill_category sc ON s.category_id = sc.id
        ORDER BY s.name ASC;
    """)

@router.get("/categories")
def get_categories():
    return fetch_all("SELECT id, name, description FROM skill_category ORDER BY name ASC;")
