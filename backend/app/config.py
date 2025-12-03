import os

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://dqm_user:dqm_password@localhost:5432/northwind"
)

LOCAL_AI_RTX5090_URL = os.getenv("LOCAL_AI_RTX5090_URL", "http://localhost:8004/v1")
LOCAL_AI_RTX3050_URL = os.getenv("LOCAL_AI_RTX3050_URL", "http://localhost:8015/v1")

CORS_ORIGINS = ["http://localhost:3000", "http://localhost:5173"]
