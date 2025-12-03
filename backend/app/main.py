import logging
import time
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable, Awaitable

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "message": %(message)s}',
    datefmt="%Y-%m-%dT%H:%M:%S",
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Database setup
DATABASE_URL = "sqlite+aiosqlite:///./dqm.db"
engine = create_async_engine(DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
Base = declarative_base()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up...")
    # Initialize database connection pool here if needed
    await engine.connect()
    yield
    logger.info("Shutting down...")
    # Cleanup connections here if needed
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

# Middleware for request timing
class RequestTimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable[[Request], Awaitable[Response]]) -> Response:
        start_time = time.time()
        response = await call_next(request)
        process_time = (time.time() - start_time) * 1000
        logger.info(
            f"Completed {request.method} {request.url.path} in {process_time:.2f}ms with status code {response.status_code}"
        )
        return response

app.add_middleware(RequestTimingMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )

@app.exception_handler(ValueError)
async def value_error_exception_handler(request: Request, exc: ValueError):
    logger.error(f"Value error: {exc}")
    return JSONResponse(
        status_code=400,
        content={"detail": str(exc)},
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error(f"HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"Starlette HTTP error: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

# Dependency to get the database session
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as db:
        yield db

# Routers (mock implementations)
from fastapi import APIRouter

profile_router = APIRouter(prefix="/api/profile", tags=["Profile"])
rules_router = APIRouter(prefix="/api/rules", tags=["Rules"])
analysis_router = APIRouter(prefix="/api/analysis", tags=["Analysis"])

@profile_router.get("/")
async def read_profiles(db: AsyncSession = Depends(get_db)):
    # Mock implementation
    return {"profiles": []}

@rules_router.get("/")
async def read_rules(db: AsyncSession = Depends(get_db)):
    # Mock implementation
    return {"rules": []}

@analysis_router.get("/")
async def read_analysis(db: AsyncSession = Depends(get_db)):
    # Mock implementation
    return {"analysis": []}

app.include_router(profile_router)
app.include_router(rules_router)
app.include_router(analysis_router)

# Example of raising an exception
@app.get("/test-error")
async def test_error():
    raise ValueError("This is a test error")

@app.get("/test-http-error")
async def test_http_error():
    raise HTTPException(status_code=404, detail="This is a test HTTP error")

@app.get("/test-starlette-error")
async def test_starlette_error():
    raise StarletteHTTPException(status_code=403, detail="This is a test Starlette error")