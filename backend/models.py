from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime

class UserRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6)
    target_role_id: Optional[int] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserSkillUpdate(BaseModel):
    skill_id: int
    proficiency: int = Field(..., ge=1, le=5)

class TargetRoleUpdate(BaseModel):
    target_role_id: int

class RecommendationRequest(BaseModel):
    user_id: Optional[int] = None

class AliasCreate(BaseModel):
    alias_name: str
    skill_id: int
