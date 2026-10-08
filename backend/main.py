from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import analytics, users, recommendations, admin, meta, scraper

app = FastAPI(
    title="SkillPulse API",
    version="1.0.0",
    description="Job-Market Skill Analytics & Career Recommendation Engine"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API v1 Routers
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(recommendations.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(meta.router, prefix="/api/v1")
app.include_router(scraper.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "system": "SkillPulse",
        "status": "online",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
