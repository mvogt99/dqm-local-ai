import pytest

# Test table whitelist
ALLOWED_TABLES = {"customers", "orders", "products"}

def validate_table(name):
    if name not in ALLOWED_TABLES:
        raise ValueError(f"Invalid table: {name}")
    return name

# Write 5 test cases
def test_valid_table():
    assert validate_table("customers") == "customers"

def test_invalid_table():
    with pytest.raises(ValueError) as excinfo:
        validate_table("invalid")
    assert "Invalid table" in str(excinfo.value)

def test_sql_injection_attempt():
    with pytest.raises(ValueError) as excinfo:
        validate_table("customers; DROP TABLE orders")
    assert "Invalid table" in str(excinfo.value)

def test_empty_string_rejected():
    with pytest.raises(ValueError) as excinfo:
        validate_table("")
    assert "Invalid table" in str(excinfo.value)

def test_none_value_rejected():
    with pytest.raises(ValueError) as excinfo:
        validate_table(None)
    assert "Invalid table" in str(excinfo.value)
