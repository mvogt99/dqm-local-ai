from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

router = APIRouter()

class Rule(BaseModel):
    id: Optional[int] = None
    name: str
    description: str
    condition: str

class ExecutionResult(BaseModel):
    id: int
    rule_id: int
    success: bool
    failures: Optional[List[Dict[str, Any]]] = None

class SuggestedRule(BaseModel):
    name: str
    description: str
    condition: str
    confidence_score: float

# In-memory storage for demonstration purposes
rules_store = []
execution_results_store = []

@router.get("/rules", response_model=List[Rule])
def list_rules():
    return rules_store

@router.post("/rules", response_model=Rule, status_code=201)
def create_rule(rule: Rule):
    rule.id = len(rules_store) + 1
    rules_store.append(rule)
    return rule

@router.get("/rules/{rule_id}", response_model=Rule)
def get_rule_details(rule_id: int):
    for rule in rules_store:
        if rule.id == rule_id:
            return rule
    raise HTTPException(status_code=404, detail="Rule not found")

@router.post("/rules/{rule_id}/execute", response_model=ExecutionResult)
def execute_rule(rule_id: int):
    rule = next((r for r in rules_store if r.id == rule_id), None)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    # Simulate execution and result
    success = True  # This should be determined by actual rule execution logic
    failures = []  # This should contain failure details if any
    
    execution_result = ExecutionResult(id=len(execution_results_store) + 1, rule_id=rule_id, success=success, failures=failures)
    execution_results_store.append(execution_result)
    return execution_result

@router.get("/rules/suggest", response_model=List[SuggestedRule])
def suggest_rules():
    # Simulate suggestion logic
    suggested_rules = [
        SuggestedRule(name="Example Rule", description="An example rule", condition="data['column'] > 0", confidence_score=0.95)
    ]
    return suggested_rules

@router.get("/results", response_model=List[ExecutionResult])
def get_execution_results():
    return execution_results_store

@router.get("/results/{result_id}/failures", response_model=List[Dict[str, Any]])
def get_failure_details(result_id: int):
    execution_result = next((r for r in execution_results_store if r.id == result_id), None)
    if not execution_result:
        raise HTTPException(status_code=404, detail="Execution result not found")
    return execution_result.failures if execution_result.failures else []
