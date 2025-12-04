"""
Database Management Routes - Dynamic Configuration
Enhanced by Expert AI (Claude Opus 4.5)

V74: Dynamic database configuration endpoints
- List configured connections
- Add new database connections
- Switch active connection
- Test connection
- Remove connections
"""
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from app.config.database import get_database_manager, DatabaseConnection

router = APIRouter(
    prefix="/database",
    tags=["Database Configuration"]
)


class ConnectionCreate(BaseModel):
    """Request model for creating a database connection."""
    name: str = Field(..., description="Connection name/identifier")
    host: str = Field(..., description="Database host")
    port: int = Field(5432, description="Database port")
    database: str = Field(..., description="Database name")
    username: str = Field(..., description="Database username")
    password: str = Field(..., description="Database password")
    db_type: str = Field("postgresql", description="Database type")
    description: Optional[str] = Field(None, description="Connection description")


class ConnectionSwitch(BaseModel):
    """Request model for switching active connection."""
    name: str = Field(..., description="Connection name to switch to")


@router.get("/connections")
async def list_connections():
    """
    List all configured database connections.

    Returns a list of all database connections with their status.
    The active connection is marked.
    """
    try:
        manager = get_database_manager()
        connections = manager.list_connections()
        return {
            "connections": connections,
            "active": manager.get_active_connection_name(),
            "count": len(connections)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list connections: {str(e)}")


@router.get("/connections/active")
async def get_active_connection():
    """
    Get the currently active database connection.

    Returns details of the active connection.
    """
    try:
        manager = get_database_manager()
        name = manager.get_active_connection_name()
        conn = manager.get_connection(name)
        if not conn:
            raise HTTPException(status_code=404, detail="No active connection found")

        return {
            "name": conn.name,
            "host": conn.host,
            "port": conn.port,
            "database": conn.database,
            "db_type": conn.db_type,
            "description": conn.description
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get active connection: {str(e)}")


@router.post("/connections", status_code=201)
async def add_connection(connection: ConnectionCreate):
    """
    Add a new database connection configuration.

    Does not automatically switch to the new connection.
    Use POST /database/connections/switch to change the active connection.
    """
    try:
        manager = get_database_manager()

        db_conn = DatabaseConnection(
            name=connection.name,
            host=connection.host,
            port=connection.port,
            database=connection.database,
            username=connection.username,
            password=connection.password,
            db_type=connection.db_type,
            description=connection.description
        )

        manager.add_connection(db_conn)

        return {
            "message": f"Connection '{connection.name}' added successfully",
            "name": connection.name
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add connection: {str(e)}")


@router.post("/connections/switch")
async def switch_connection(request: ConnectionSwitch):
    """
    Switch to a different database connection.

    Makes the specified connection the active one for all subsequent operations.
    """
    try:
        manager = get_database_manager()
        manager.set_active_connection(request.name)

        return {
            "message": f"Switched to connection '{request.name}'",
            "active": request.name
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to switch connection: {str(e)}")


@router.post("/connections/{name}/test")
async def test_connection(name: str):
    """
    Test a database connection.

    Attempts to connect to the specified database and returns connection details.
    """
    try:
        manager = get_database_manager()
        result = await manager.test_connection(name)

        if result["status"] == "failed":
            raise HTTPException(
                status_code=503,
                detail={
                    "message": "Connection test failed",
                    "connection": name,
                    "error": result.get("error")
                }
            )

        return result
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to test connection: {str(e)}")


@router.delete("/connections/{name}", status_code=204)
async def remove_connection(name: str):
    """
    Remove a database connection configuration.

    Cannot remove the default connection.
    If the removed connection was active, switches to default.
    """
    try:
        manager = get_database_manager()
        removed = manager.remove_connection(name)

        if not removed:
            raise HTTPException(status_code=404, detail=f"Connection '{name}' not found")

        return None
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove connection: {str(e)}")


@router.get("/health")
async def database_health():
    """
    Check the health of the active database connection.

    Returns connection status and basic database information.
    """
    try:
        manager = get_database_manager()
        result = await manager.test_connection()

        status_code = 200 if result["status"] == "connected" else 503

        return {
            "status": "healthy" if result["status"] == "connected" else "unhealthy",
            "connection": result["connection"],
            "database_version": result.get("database_version"),
            "tables_found": result.get("tables_found"),
            "error": result.get("error")
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e)
        }
