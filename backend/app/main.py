from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import actions, health, incidents, rca, reports, timeline, toolbox
from app.config import settings
from app.database import Base, engine
from app import models  # noqa: F401

Base.metadata.create_all(bind=engine)

app = FastAPI(title="IncidentTrace", description="Human-reviewed incident investigation and safety learning", version="1.0.0")
origins = [origin.strip() for origin in settings.cors_origins.split(",") if origin.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
for router in (health.router, incidents.router, timeline.router, rca.router, actions.router, toolbox.router, reports.router):
    app.include_router(router)


@app.get("/")
def root():
    return {
        "service": "IncidentTrace API",
        "docs": "/docs",
        "health": "/health",
    }
