# API Documentation

## DQM API Reference

Both **DQM LOCAL AI** and **DQM Expert AI** share the same API structure with minor implementation differences.

| Application | Base URL | Port |
|-------------|----------|------|
| LOCAL AI | http://localhost:8001 | 8001 |
| Expert AI | http://localhost:8002 | 8002 |

---

## Table of Contents

1. [Health & Info](#health--info)
2. [Data Profiling](#data-profiling)
3. [Data Quality Rules](#data-quality-rules)
4. [AI Analysis](#ai-analysis)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

---

## Health & Info

### GET /health
Check application health status.

**Response:**
```json
{
  "status": "healthy",
  "app": "dqm-local-ai",
  "version": "1.0.0"
}
```

### GET /
Get API information.

**Response:**
```json
{
  "name": "DQM LOCAL AI",
  "version": "1.0.0",
  "generated_by": "RTX 5090 + RTX 3050",
  "endpoints": ["/api/profile", "/api/rules", "/api/analysis"]
}
```

---

## Data Profiling

### GET /data-profiling/tables
List all available tables from the database.

**Response:** `List[str]`
```json
["customers", "orders", "products", "employees", "order_details", "categories", "shippers", "suppliers"]
```

**Security:** Only tables in the whitelist are returned.

---

### GET /data-profiling/profile/{table_name}
Profile a specific table with comprehensive statistics.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `table_name` | string | Name of the table to profile |

**Response:**
```json
{
  "table_name": "customers",
  "row_count": 91,
  "column_count": 11,
  "columns": [
    {
      "column_name": "customer_id",
      "data_type": "character",
      "is_nullable": false,
      "null_count": 0,
      "null_percent": 0.0,
      "unique_count": 91,
      "min_value": null,
      "max_value": null,
      "sample_values": ["ALFKI", "ANATR", "ANTON", "AROUT", "BERGS"]
    },
    {
      "column_name": "company_name",
      "data_type": "character varying",
      "is_nullable": false,
      "null_count": 0,
      "null_percent": 0.0,
      "unique_count": 91,
      "min_value": null,
      "max_value": null,
      "sample_values": ["Alfreds Futterkiste", "Ana Trujillo Emparedados y helados"]
    }
  ]
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 400 | Table not in whitelist |
| 500 | Database error |

---

### POST /data-profiling/profile/{table_name}/run
Run profiling on a table (alias for GET profile).

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `table_name` | string | Name of the table to profile |

**Response:** Same as GET /data-profiling/profile/{table_name}

---

## Data Quality Rules

### GET /data-quality/rules
List all data quality rules.

**Response:** `List[RuleResponse]`
```json
[
  {
    "id": 1,
    "name": "Customer ID Not Null",
    "table": "customers",
    "column": "customer_id",
    "rule_type": "NULL_CHECK",
    "definition": "SELECT * FROM customers WHERE customer_id IS NULL",
    "severity": "high",
    "is_active": true
  }
]
```

---

### POST /data-quality/rules
Create a new data quality rule.

**Request Body:**
```json
{
  "name": "Customer ID Not Null",
  "table": "customers",
  "column": "customer_id",
  "rule_type": "NULL_CHECK",
  "definition": "SELECT * FROM customers WHERE customer_id IS NULL",
  "severity": "high"
}
```

**Request Schema:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Human-readable rule name |
| table | string | Yes | Target table |
| column | string | Yes | Target column |
| rule_type | string | Yes | Rule type (NULL_CHECK, UNIQUE, RANGE, PATTERN) |
| definition | string | Yes | SQL query or rule definition |
| severity | string | No | Severity level (low, medium, high) - default: medium |

**Response:**
```json
{
  "message": "Rule created successfully",
  "name": "Customer ID Not Null"
}
```

**Status:** 201 Created

---

### GET /data-quality/rules/{rule_id}
Get a specific data quality rule.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | integer | ID of the rule |

**Response:**
```json
{
  "id": 1,
  "name": "Customer ID Not Null",
  "table": "customers",
  "column": "customer_id",
  "rule_type": "NULL_CHECK",
  "definition": "SELECT * FROM customers WHERE customer_id IS NULL",
  "severity": "high",
  "is_active": true
}
```

**Error Responses:**
| Status | Description |
|--------|-------------|
| 404 | Rule not found |

---

### POST /data-quality/rules/{rule_id}/execute
Execute a data quality rule against the database.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `rule_id` | integer | ID of the rule to execute |

**Response:**
```json
{
  "rule_id": 1,
  "executed": true,
  "failures_count": 3,
  "failures": [
    "Row 15: customer_id is NULL",
    "Row 42: customer_id is NULL",
    "Row 78: customer_id is NULL"
  ]
}
```

---

### POST /data-quality/suggest
Suggest data quality rules based on profiling results.

**Request Body:** `List[Dict]`
```json
[
  {
    "column_name": "customer_id",
    "data_type": "character",
    "null_percent": 0.0,
    "unique_count": 91
  },
  {
    "column_name": "contact_name",
    "data_type": "character varying",
    "null_percent": 5.5,
    "unique_count": 89
  }
]
```

**Response:**
```json
{
  "suggestions": [
    {
      "name": "customer_id_not_null",
      "table": "customers",
      "column": "customer_id",
      "rule_type": "NULL_CHECK",
      "reason": "Column has 0% null values, likely required"
    },
    {
      "name": "customer_id_unique",
      "table": "customers",
      "column": "customer_id",
      "rule_type": "UNIQUE",
      "reason": "Column has 100% unique values"
    }
  ]
}
```

---

### GET /data-quality/results
Get all rule execution results.

**Response:**
```json
{
  "results": [
    {
      "rule_id": 1,
      "failures_count": 0,
      "has_failures": false
    },
    {
      "rule_id": 2,
      "failures_count": 5,
      "has_failures": true
    }
  ]
}
```

---

## AI Analysis

### POST /ai-analysis/analyze/{table_name}
Analyze violations for a specific table using LOCAL AI.

**Path Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `table_name` | string | Name of the table being analyzed |

**Request Body:**
```json
{
  "violations": [
    {
      "rule_type": "NULL_CHECK",
      "column": "contact_name",
      "violation_count": 5
    },
    {
      "rule_type": "UNIQUE",
      "column": "email",
      "violation_count": 2
    }
  ],
  "profile_data": {
    "row_count": 91,
    "column_count": 11,
    "columns": [...]
  }
}
```

**Response:**
```json
{
  "root_causes": [
    "Missing data during customer registration process",
    "Legacy data migration from old system",
    "Form validation not enforced at entry point"
  ],
  "recommendations": [
    "Add NOT NULL constraint after data cleanup",
    "Implement client-side validation for required fields",
    "Create data entry audit process"
  ],
  "confidence_score": 0.85,
  "additional_rules": [
    {
      "rule_type": "NOT_NULL",
      "description": "contact_name - Required customer contact field"
    },
    {
      "rule_type": "UNIQUE",
      "description": "email - Should be unique per customer"
    }
  ]
}
```

**AI Model Used:** Qwen2.5-Coder-32B-Instruct-AWQ (RTX 5090)

---

### GET /ai-analysis/analyses
Get stored analysis results.

**Response:**
```json
{
  "message": "Analyses are not persisted yet",
  "note": "Each analysis is computed on-demand using LOCAL AI"
}
```

**Note:** Analysis results are not persisted. Use POST /ai-analysis/analyze for on-demand analysis.

---

### GET /ai-analysis/analyses/{analysis_id}
Get a specific analysis by ID.

**Response:** 404 Not Found (persistence not yet implemented)

---

### POST /ai-analysis/batch-analyze
Analyze violations for multiple tables in batch.

**Request Body:**
```json
{
  "tables": [
    {
      "table_name": "customers",
      "violations": [
        {"rule_type": "NULL_CHECK", "column": "contact_name", "violation_count": 5}
      ],
      "profile_data": {"row_count": 91, "column_count": 11}
    },
    {
      "table_name": "orders",
      "violations": [
        {"rule_type": "RANGE", "column": "order_date", "violation_count": 2}
      ],
      "profile_data": {"row_count": 830, "column_count": 14}
    }
  ]
}
```

**Response:**
```json
{
  "analyzed_count": 2,
  "results": [
    {
      "table_name": "customers",
      "analysis": {
        "root_causes": [...],
        "recommendations": [...],
        "confidence_score": 0.85,
        "additional_rules": [...]
      }
    },
    {
      "table_name": "orders",
      "analysis": {
        "root_causes": [...],
        "recommendations": [...],
        "confidence_score": 0.78,
        "additional_rules": [...]
      }
    }
  ]
}
```

---

## Error Handling

### Error Response Format
All errors return a consistent JSON structure:

```json
{
  "detail": "Error message describing the issue",
  "type": "ExceptionTypeName"
}
```

### Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, table not in whitelist) |
| 404 | Not Found |
| 500 | Internal Server Error |

### Common Errors

**Table Not in Whitelist:**
```json
{
  "detail": "Table 'secret_table' is not in the whitelist. Allowed: ['customers', 'orders', ...]"
}
```

**AI Service Unavailable:**
```json
{
  "root_causes": ["Unable to complete AI analysis - service unavailable"],
  "recommendations": ["Check LOCAL AI service status", "Review violations manually"],
  "confidence_score": 0.0,
  "additional_rules": []
}
```

---

## Examples

### cURL Examples

#### Health Check
```bash
curl http://localhost:8001/health
```

#### List Tables
```bash
curl http://localhost:8001/data-profiling/tables
```

#### Profile a Table
```bash
curl http://localhost:8001/data-profiling/profile/customers
```

#### Create a Rule
```bash
curl -X POST http://localhost:8001/data-quality/rules \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer ID Not Null",
    "table": "customers",
    "column": "customer_id",
    "rule_type": "NULL_CHECK",
    "definition": "SELECT * FROM customers WHERE customer_id IS NULL",
    "severity": "high"
  }'
```

#### Execute a Rule
```bash
curl -X POST http://localhost:8001/data-quality/rules/1/execute
```

#### AI Analysis
```bash
curl -X POST http://localhost:8001/ai-analysis/analyze/customers \
  -H "Content-Type: application/json" \
  -d '{
    "violations": [
      {"rule_type": "NULL_CHECK", "column": "contact_name", "violation_count": 5}
    ],
    "profile_data": {
      "row_count": 91,
      "column_count": 11
    }
  }'
```

### Python Examples

```python
import httpx

# Base URL
BASE_URL = "http://localhost:8001"

# Health check
response = httpx.get(f"{BASE_URL}/health")
print(response.json())

# List tables
response = httpx.get(f"{BASE_URL}/data-profiling/tables")
tables = response.json()
print(f"Available tables: {tables}")

# Profile a table
response = httpx.get(f"{BASE_URL}/data-profiling/profile/customers")
profile = response.json()
print(f"Row count: {profile['row_count']}")

# Create a rule
rule = {
    "name": "Customer Email Required",
    "table": "customers",
    "column": "email",
    "rule_type": "NULL_CHECK",
    "definition": "SELECT * FROM customers WHERE email IS NULL",
    "severity": "medium"
}
response = httpx.post(f"{BASE_URL}/data-quality/rules", json=rule)
print(response.json())

# AI Analysis
async with httpx.AsyncClient() as client:
    response = await client.post(
        f"{BASE_URL}/ai-analysis/analyze/customers",
        json={
            "violations": [
                {"rule_type": "NULL_CHECK", "column": "email", "violation_count": 3}
            ],
            "profile_data": {"row_count": 91, "column_count": 11}
        }
    )
    analysis = response.json()
    print(f"Root causes: {analysis['root_causes']}")
    print(f"Confidence: {analysis['confidence_score']}")
```

---

## OpenAPI Schema

The full OpenAPI schema is available at:
- **LOCAL AI:** http://localhost:8001/docs (Swagger UI)
- **LOCAL AI:** http://localhost:8001/redoc (ReDoc)
- **Expert AI:** http://localhost:8002/docs (Swagger UI)
- **Expert AI:** http://localhost:8002/redoc (ReDoc)

---

*Generated for DQM LOCAL AI and DQM Expert AI*
