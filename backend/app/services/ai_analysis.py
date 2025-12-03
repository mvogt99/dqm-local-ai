
import httpx
import asyncpg
from typing import List, Dict

class AIAnalysisService:
    def __init__(self, db_pool: asyncpg.Pool):
        self.db_pool = db_pool

    async def analyze_failure(self, rule_result: Dict) -> Dict:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://localhost:8015/v1/chat/completions",
                json={"messages": [{"role": "user", "content": str(rule_result)}]}
            )
            response.raise_for_status()
            return response.json()

    async def suggest_root_causes(self, failures: List[Dict]) -> List[Dict]:
        batch_size = 10
        results = []
        for i in range(0, len(failures), batch_size):
            batch = failures[i:i + batch_size]
            tasks = [self.analyze_failure(failure) for failure in batch]
            batch_results = await asyncio.gather(*tasks)
            results.extend(batch_results)
        return results

    async def store_analysis(self, result_id: str, cause: str, confidence: float, model: str) -> None:
        async with self.db_pool.acquire() as connection:
            await connection.execute(
                "INSERT INTO root_cause_analysis (result_id, cause, confidence, model) VALUES ($1, $2, $3, $4)",
                result_id, cause, confidence, model
            )

    async def get_analysis_history(self, limit: int = 10) -> List[Dict]:
        async with self.db_pool.acquire() as connection:
            rows = await connection.fetch(
                "SELECT * FROM root_cause_analysis ORDER BY created_at DESC LIMIT $1", limit
            )
            return [dict(row) for row in rows]

