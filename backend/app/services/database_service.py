from typing import Any, Dict, List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.sql import text
from sqlalchemy.exc import SQLAlchemyError
from pydantic import BaseModel, validator
import re

# Define the allowed tables
ALLOWED_TABLES = {
    "customers", "orders", "products", "employees", "suppliers",
    "categories", "shippers", "order_details", "territories", "regions"
}

# Database URL (replace with your actual database URL)
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/dbname"

# Create an asynchronous engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Create a session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class SecurityError(Exception):
    """Custom exception for security-related errors."""
    pass

class InputModel(BaseModel):
    """Base model for input validation."""
    table_name: str
    columns: List[str]
    filters: Optional[Dict[str, Any]] = None

    @validator('table_name')
    def validate_table_name(cls, v):
        if v not in ALLOWED_TABLES:
            raise SecurityError(f"Table '{v}' is not allowed.")
        return v

    @validator('columns')
    def validate_columns(cls, v, values):
        # Here you would typically check against the actual schema of the table
        # For simplicity, we assume all columns are valid
        return v

    @validator('*', pre=True, always=True)
    def sanitize_strings(cls, v):
        if isinstance(v, str):
            # Simple sanitization to prevent SQL injection
            if re.search(r"[;--]", v):
                raise SecurityError("Invalid input detected.")
        return v

async def get_table_schema(table_name: str) -> List[str]:
    """Retrieve the schema of a given table."""
    async with AsyncSessionLocal() as session:
        try:
            result = await session.execute(text(f"SELECT column_name FROM information_schema.columns WHERE table_name = :table_name"), {"table_name": table_name})
            columns = [row[0] for row in result]
            return columns
        except SQLAlchemyError as e:
            raise HTTPException(status_code=500, detail=str(e))

async def execute_query(input_data: InputModel) -> List[Dict[str, Any]]:
    """
    Execute a query on the specified table with the given columns and filters.
    
    Args:
        input_data (InputModel): The input data containing table name, columns, and filters.
    
    Returns:
        List[Dict[str, Any]]: The result of the query.
    
    Raises:
        SecurityError: If the table or column names are invalid.
        HTTPException: If there is an error executing the query.
    """
    # Validate table name
    if input_data.table_name not in ALLOWED_TABLES:
        raise SecurityError(f"Table '{input_data.table_name}' is not allowed.")

    # Validate columns against the table schema
    schema_columns = await get_table_schema(input_data.table_name)
    for column in input_data.columns:
        if column not in schema_columns:
            raise SecurityError(f"Column '{column}' does not exist in table '{input_data.table_name}'.")

    # Construct the query
    columns_str = ", ".join(input_data.columns)
    query = f"SELECT {columns_str} FROM {input_data.table_name}"

    # Add filters if provided
    if input_data.filters:
        conditions = []
        for key, value in input_data.filters.items():
            if key not in schema_columns:
                raise SecurityError(f"Filter column '{key}' does not exist in table '{input_data.table_name}'.")
            conditions.append(f"{key} = :{key}")
        query += " WHERE " + " AND ".join(conditions)

    async with AsyncSessionLocal() as session:
        try:
            # Execute the query with bound parameters
            result = await session.execute(text(query), input_data.filters or {})
            rows = [dict(row) for row in result]
            return rows
        except SQLAlchemyError as e:
            await session.rollback()
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            await session.close()

# Example usage
# async def main():
#     input_data = InputModel(table_name="customers", columns=["customer_id", "company_name"], filters={"country": "USA"})
#     result = await execute_query(input_data)
#     print(result)

# import asyncio
# asyncio.run(main())