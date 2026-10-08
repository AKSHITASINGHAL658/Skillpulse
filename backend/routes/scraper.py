import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Literal
from services.scraper import scraper_manager, run_pipeline

router = APIRouter(prefix="/scraper", tags=["Live Scraper Engine"])

class ScraperTriggerRequest(BaseModel):
    query: str = Field(..., example="Full Stack Developer")
    location: str = Field(default="Bengaluru", example="Bengaluru")
    source: Literal["all", "linkedin", "internshala", "indeed"] = Field(default="all")
    limit: int = Field(default=25, ge=1, le=100)

@router.post("/trigger")
def trigger_scraping(req: ScraperTriggerRequest, background_tasks: BackgroundTasks):
    current = scraper_manager.get_status()
    if current.get("status") == "running":
        return {
            "status": "already_running",
            "message": "A scraping task is currently active. Please monitor progress or wait for completion.",
            "task_id": current.get("active_task", {}).get("task_id")
        }

    task_id = str(uuid.uuid4())
    scraper_manager.start_task(
        task_id=task_id,
        query=req.query,
        location=req.location,
        source=req.source,
        limit=req.limit
    )

    # Dispatch to background task execution
    background_tasks.add_task(
        run_pipeline,
        task_id=task_id,
        query=req.query,
        location=req.location,
        source=req.source,
        limit=req.limit
    )

    return {
        "status": "queued",
        "task_id": task_id,
        "query": req.query,
        "location": req.location,
        "source": req.source,
        "limit": req.limit
    }

@router.get("/status")
def get_scraper_status():
    return scraper_manager.get_status()
