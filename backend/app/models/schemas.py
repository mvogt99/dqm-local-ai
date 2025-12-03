from enum import Enum
from typing import List, Dict, Optional
from pydantic import BaseModel, validator, root_validator, Field


class RuleType(Enum):
    """Enumeration of different types of data quality rules."""
    NULL_CHECK = "null_check"
    UNIQUE_CHECK = "unique_check"
    RANGE_CHECK = "range_check"
    PATTERN_CHECK = "pattern_check"
    FOREIGN_KEY_CHECK = "foreign_key_check"


class Severity(Enum):
    """Enumeration of severity levels for data quality issues."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class ProfileType(Enum):
    """Enumeration of different types of data profiles."""
    COMPLETENESS = "completeness"
    UNIQUENESS = "uniqueness"
    DISTRIBUTION = "distribution"
    PATTERN = "pattern"


class TableProfile(BaseModel):
    """Model representing the profile of a table."""
    table_name: str = Field(..., description="Name of the table.")
    column_profiles: List['ColumnProfile'] = Field(..., description="Profiles of each column in the table.")

    @root_validator(pre=True)
    def check_column_profiles(cls, values):
        if not values.get('column_profiles'):
            raise ValueError("At least one column profile must be provided.")
        return values


class ColumnProfile(BaseModel):
    """Model representing the profile of a column."""
    column_name: str = Field(..., description="Name of the column.")
    data_type: str = Field(..., description="Data type of the column.")
    profile_type: ProfileType = Field(..., description="Type of the profile.")
    statistics: Dict[str, float] = Field(..., description="Statistical information about the column.")

    @validator('statistics')
    def validate_statistics(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Statistics must be a dictionary.")
        return v


class DataQualityRule(BaseModel):
    """Model representing a data quality rule."""
    rule_id: int = Field(..., description="Unique identifier for the rule.")
    rule_type: RuleType = Field(..., description="Type of the rule.")
    target_table: str = Field(..., description="Table to which the rule applies.")
    target_column: Optional[str] = Field(None, description="Column to which the rule applies, if applicable.")
    parameters: Dict[str, any] = Field(..., description="Parameters required for the rule.")
    severity: Severity = Field(..., description="Severity level of the rule.")

    @validator('parameters')
    def validate_parameters(cls, v):
        if not isinstance(v, dict):
            raise ValueError("Parameters must be a dictionary.")
        return v


class RuleResult(BaseModel):
    """Model representing the result of a data quality rule execution."""
    rule_id: int = Field(..., description="Identifier of the executed rule.")
    passed: bool = Field(..., description="Whether the rule was passed or not.")
    message: Optional[str] = Field(None, description="Message describing the result of the rule execution.")


class AIAnalysisRequest(BaseModel):
    """Model representing a request for AI analysis."""
    table_profile: TableProfile = Field(..., description="Profile of the table to analyze.")
    rules: List[DataQualityRule] = Field(..., description="List of data quality rules to apply.")
    context: Optional[str] = Field(None, description="Additional context for the analysis.")

    @root_validator(pre=True)
    def check_rules(cls, values):
        if not values.get('rules'):
            raise ValueError("At least one data quality rule must be provided.")
        return values


class AIAnalysisResponse(BaseModel):
    """Model representing the response from an AI analysis."""
    rule_results: List[RuleResult] = Field(..., description="Results of the data quality rule executions.")
    summary: str = Field(..., description="Summary of the analysis results.")
    recommendations: Optional[List[str]] = Field(None, description="Recommendations based on the analysis results.")

    @root_validator(pre=True)
    def check_rule_results(cls, values):
        if not values.get('rule_results'):
            raise ValueError("At least one rule result must be provided.")
        return values