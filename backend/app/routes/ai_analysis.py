from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict

router = APIRouter()

class AnalysisRequest(BaseModel):
    data: Dict

class AnalysisResponse(BaseModel):
    id: str
    result: Dict

class BatchAnalysisRequest(BaseModel):
    analyses: List[AnalysisRequest]

class BatchAnalysisResponse(BaseModel):
    results: List[AnalysisResponse]

# In-memory storage for demonstration purposes
analyses_storage = {}

@router.post("/analyze/{result_id}", response_model=AnalysisResponse)
async def analyze_failure(result_id: str, request: AnalysisRequest):
    # Simulate analysis logic
    analysis_result = {"status": "analyzed", "details": request.data}
    analyses_storage[result_id] = analysis_result
    return AnalysisResponse(id=result_id, result=analysis_result)

@router.get("/analyses", response_model=List[AnalysisResponse])
async def get_all_analyses():
    return [AnalysisResponse(id=id, result=result) for id, result in analyses_storage.items()]

@router.get("/analyses/{id}", response_model=AnalysisResponse)
async def get_specific_analysis(id: str):
    if id not in analyses_storage:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return AnalysisResponse(id=id, result=analyses_storage[id])

@router.post("/batch-analyze", response_model=BatchAnalysisResponse)
async def batch_analyze(requests: BatchAnalysisRequest):
    results = []
    for request in requests.analyses:
        result_id = str(len(analyses_storage))  # Simple ID generation
        analysis_result = {"status": "analyzed", "details": request.data}
        analyses_storage[result_id] = analysis_result
        results.append(AnalysisResponse(id=result_id, result=analysis_result))
    return BatchAnalysisResponse(results=results)
