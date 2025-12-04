"""
Audit Logging Routes
Provides endpoints for viewing audit logs
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel

from app.services.audit_service import get_audit_service, AuditLogEntry

router = APIRouter(
    prefix="/audit",
    tags=["Audit Logs"]
)


class AuditLogResponse(BaseModel):
    """Response model for audit log entry."""
    id: int
    timestamp: datetime
    user_id: Optional[str]
    action: str
    entity_type: str
    entity_id: str
    old_value: Optional[str]
    new_value: Optional[str]
    ip_address: Optional[str]
    details: Optional[dict]

    class Config:
        from_attributes = True


class AuditLogListResponse(BaseModel):
    """Response model for list of audit logs."""
    logs: List[AuditLogResponse]
    count: int
    limit: int
    offset: int


@router.get("/logs", response_model=AuditLogListResponse)
async def get_audit_logs(
    entity_type: Optional[str] = Query(None, description="Filter by entity type"),
    entity_id: Optional[str] = Query(None, description="Filter by entity ID"),
    action: Optional[str] = Query(None, description="Filter by action type"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    start_date: Optional[datetime] = Query(None, description="Filter logs after this date"),
    end_date: Optional[datetime] = Query(None, description="Filter logs before this date"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """
    Retrieve audit logs with optional filtering.

    Supports filtering by entity type, entity ID, action, user, and date range.
    """
    try:
        service = await get_audit_service()
        logs = await service.get_audit_logs(
            entity_type=entity_type,
            entity_id=entity_id,
            action=action,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )

        return AuditLogListResponse(
            logs=[AuditLogResponse(
                id=log.id,
                timestamp=log.timestamp,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                old_value=log.old_value,
                new_value=log.new_value,
                ip_address=log.ip_address,
                details=log.details
            ) for log in logs],
            count=len(logs),
            limit=limit,
            offset=offset
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audit logs: {str(e)}")


@router.get("/logs/entity/{entity_type}/{entity_id}", response_model=AuditLogListResponse)
async def get_entity_history(
    entity_type: str,
    entity_id: str,
    limit: int = Query(50, ge=1, le=500, description="Maximum results")
):
    """
    Get complete audit history for a specific entity.

    Returns all audit log entries for the specified entity.
    """
    try:
        service = await get_audit_service()
        logs = await service.get_entity_history(
            entity_type=entity_type,
            entity_id=entity_id,
            limit=limit
        )

        return AuditLogListResponse(
            logs=[AuditLogResponse(
                id=log.id,
                timestamp=log.timestamp,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                old_value=log.old_value,
                new_value=log.new_value,
                ip_address=log.ip_address,
                details=log.details
            ) for log in logs],
            count=len(logs),
            limit=limit,
            offset=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve entity history: {str(e)}")


@router.get("/logs/recent/{action}", response_model=AuditLogListResponse)
async def get_recent_actions(
    action: str,
    limit: int = Query(20, ge=1, le=100, description="Maximum results")
):
    """
    Get recent audit logs for a specific action type.

    Useful for monitoring recent creates, updates, deletes, etc.
    """
    try:
        service = await get_audit_service()
        logs = await service.get_recent_actions(action=action, limit=limit)

        return AuditLogListResponse(
            logs=[AuditLogResponse(
                id=log.id,
                timestamp=log.timestamp,
                user_id=log.user_id,
                action=log.action,
                entity_type=log.entity_type,
                entity_id=log.entity_id,
                old_value=log.old_value,
                new_value=log.new_value,
                ip_address=log.ip_address,
                details=log.details
            ) for log in logs],
            count=len(logs),
            limit=limit,
            offset=0
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve recent actions: {str(e)}")
