from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
import app.models
from app.routes.tickets import router as tickets_router, run_migration

app = FastAPI(title="Support Ticketing CRM API")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


@app.on_event("startup")
async def startup() -> None:
    await run_migration()


app.include_router(tickets_router)


@app.get("/api/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
