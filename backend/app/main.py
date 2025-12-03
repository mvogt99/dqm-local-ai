from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
import os

DATABASE_URL = "postgresql+asyncpg://dqm_user:dqm_password@dqm-postgres:5432/northwind"

engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

Base = declarative_base()

app = FastAPI(title="Data Quality Management Application")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust this for your React app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await engine.connect()

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session

@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}

from app.routes import data_profiling, data_quality, ai_analysis

app.include_router(data_profiling.router, prefix="/data-profiling", tags=["Data Profiling"])
app.include_router(data_quality.router, prefix="/data-quality", tags=["Data Quality"])
app.include_router(ai_analysis.router, prefix="/ai-analysis", tags=["AI Analysis"])
