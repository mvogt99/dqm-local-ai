"""
DAMA Dashboard API Routes

Provides endpoints for DAMA dimension scores, trends, and alerts.
V122: Created with corrections from Local AI output.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from app.services.dama_service import ALL_DAMA_DIMENSIONS, DAMAService

router = APIRouter(prefix="/dama", tags=["DAMA Dashboard"])


# Pydantic models for responses
class OverviewResponse(BaseModel):
    """Overall DAMA dimension scores."""

    completeness: float = Field(default=0.0, ge=0, le=100)
    uniqueness: float = Field(default=0.0, ge=0, le=100)
    validity: float = Field(default=0.0, ge=0, le=100)
    accuracy: float = Field(default=0.0, ge=0, le=100)
    integrity: float = Field(default=0.0, ge=0, le=100)
    consistency: float = Field(default=0.0, ge=0, le=100)
    timeliness: float = Field(default=0.0, ge=0, le=100)
    precision: float = Field(default=0.0, ge=0, le=100)
    relevance: float = Field(default=0.0, ge=0, le=100)


class TableScores(BaseModel):
    """DAMA scores for a single table."""

    table_name: str
    completeness: float = 0.0
    uniqueness: float = 0.0
    validity: float = 0.0
    accuracy: float = 0.0
    integrity: float = 0.0
    consistency: float = 0.0
    timeliness: float = 0.0
    precision: float = 0.0
    relevance: float = 0.0


class TrendEntry(BaseModel):
    """DAMA scores for a specific date."""

    date: str
    completeness: float = 0.0
    uniqueness: float = 0.0
    validity: float = 0.0
    accuracy: float = 0.0
    integrity: float = 0.0
    consistency: float = 0.0
    timeliness: float = 0.0
    precision: float = 0.0
    relevance: float = 0.0


class Alert(BaseModel):
    """Quality alert for a dimension below threshold."""

    table: str
    dimension: str
    score: float
    threshold: float
    severity: str = "medium"  # high, medium, low


# Service instance
_service: Optional[DAMAService] = None


def get_service() -> DAMAService:
    """Get or create DAMAService instance."""
    global _service
    if _service is None:
        _service = DAMAService()
    return _service


@router.get("/overview", response_model=OverviewResponse)
async def get_overview():
    """
    Get overall DAMA dimension scores across all tables.
    Returns radar chart data with scores 0-100 for each dimension.
    """
    service = get_service()
    scores = service.get_overview_scores()
    return OverviewResponse(**scores)


@router.get("/tables", response_model=List[TableScores])
async def get_tables():
    """
    Get DAMA dimension scores per table.
    Returns heatmap data for per-table quality visualization.
    """
    service = get_service()
    table_scores = service.get_table_scores()
    return [TableScores(**ts) for ts in table_scores]


@router.get("/tables/{table_name}", response_model=TableScores)
async def get_table_scores(table_name: str):
    """
    Get DAMA dimension scores for a specific table.
    """
    service = get_service()
    all_tables = service.get_table_scores()
    for ts in all_tables:
        if ts["table_name"] == table_name:
            return TableScores(**ts)
    raise HTTPException(status_code=404, detail=f"Table '{table_name}' not found")


@router.get("/trends", response_model=List[TrendEntry])
async def get_trends(days: int = Query(default=30, ge=1, le=365)):
    """
    Get historical DAMA scores over time.
    Returns line chart data for trend visualization.
    """
    service = get_service()
    trends = service.get_trends(days=days)
    return [TrendEntry(**t) for t in trends]


@router.get("/alerts", response_model=List[Alert])
async def get_alerts(threshold: float = Query(default=70.0, ge=0, le=100)):
    """
    Get quality alerts for dimensions below threshold.
    Returns alerts sorted by severity (worst first).
    """
    service = get_service()
    alerts = service.get_alerts(threshold=threshold)
    return [Alert(**a) for a in alerts]


@router.get("/dimensions")
async def get_dimensions():
    """
    Get list of all DAMA dimensions.
    """
    return {"dimensions": ALL_DAMA_DIMENSIONS, "count": len(ALL_DAMA_DIMENSIONS)}
