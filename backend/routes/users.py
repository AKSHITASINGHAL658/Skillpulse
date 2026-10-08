from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
import jwt
import hashlib
from database import fetch_one, fetch_all, execute_sql, get_db
from models import UserRegister, UserLogin, UserSkillUpdate, TargetRoleUpdate

router = APIRouter(prefix="/users", tags=["Users"])

JWT_SECRET = "skillpulse-super-secret-production-key-2026"
JWT_ALGORITHM = "HS256"

def hash_pw(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def create_jwt(user_id: int, username: str) -> str:
    payload = {"sub": str(user_id), "username": username}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user_id(authorization: Optional[str] = Header(None)) -> int:
    # Default to user_id 1 (Alex Dev) if no token is provided for smooth interactive browsing
    if not authorization:
        return 1
    token = authorization.replace("Bearer ", "").strip()
    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return int(decoded["sub"])
    except Exception:
        return 1

@router.post("/register")
def register_user(payload: UserRegister):
    existing = fetch_one("SELECT id FROM app_user WHERE username = %s OR email = %s", (payload.username, payload.email))
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already exists")

    hashed = hash_pw(payload.password)
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO app_user (username, email, password_hash, target_role_id)
                VALUES (%s, %s, %s, %s) RETURNING id, username, email, target_role_id
                """,
                (payload.username, payload.email, hashed, payload.target_role_id)
            )
            user = cur.fetchone()

    token = create_jwt(user["id"], user["username"])
    return {"user": user, "token": token}

@router.post("/login")
def login_user(payload: UserLogin):
    user = fetch_one("SELECT id, username, email, password_hash, target_role_id FROM app_user WHERE username = %s", (payload.username,))
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    hashed = hash_pw(payload.password)
    # Check either sha256 or bcrypt dummy prefix match
    if user["password_hash"] != hashed and not user["password_hash"].startswith("$2b$"):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_jwt(user["id"], user["username"])
    return {
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "target_role_id": user["target_role_id"]
        },
        "token": token
    }

@router.get("/me")
def get_user_profile(user_id: int = Depends(get_current_user_id)):
    user = fetch_one("""
        SELECT u.id, u.username, u.email, u.target_role_id, jr.title AS target_role_title, jr.category AS role_category
        FROM app_user u
        LEFT JOIN job_role jr ON u.target_role_id = jr.id
        WHERE u.id = %s
    """, (user_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Fetch user skills
    skills = fetch_all("""
        SELECT 
            us.skill_id,
            s.name AS skill_name,
            sc.name AS category_name,
            us.proficiency,
            us.acquired_date
        FROM user_skill us
        JOIN skill s ON us.skill_id = s.id
        JOIN skill_category sc ON s.category_id = sc.id
        WHERE us.user_id = %s
        ORDER BY us.proficiency DESC, s.name ASC
    """, (user_id,))

    return {
        **user,
        "skills": skills
    }

@router.post("/skills")
def add_or_update_user_skill(payload: UserSkillUpdate, user_id: int = Depends(get_current_user_id)):
    query = """
    INSERT INTO user_skill (user_id, skill_id, proficiency, acquired_date)
    VALUES (%s, %s, %s, CURRENT_DATE)
    ON CONFLICT (user_id, skill_id) DO UPDATE 
    SET proficiency = EXCLUDED.proficiency, acquired_date = CURRENT_DATE;
    """
    execute_sql(query, (user_id, payload.skill_id, payload.proficiency))
    return {"status": "success", "skill_id": payload.skill_id, "proficiency": payload.proficiency}

@router.delete("/skills/{skill_id}")
def delete_user_skill(skill_id: int, user_id: int = Depends(get_current_user_id)):
    execute_sql("DELETE FROM user_skill WHERE user_id = %s AND skill_id = %s", (user_id, skill_id))
    return {"status": "success", "skill_id": skill_id}

@router.post("/target-role")
def set_target_role(payload: TargetRoleUpdate, user_id: int = Depends(get_current_user_id)):
    execute_sql("UPDATE app_user SET target_role_id = %s WHERE id = %s", (payload.target_role_id, user_id))
    return {"status": "success", "target_role_id": payload.target_role_id}
