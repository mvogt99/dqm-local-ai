import asyncpg
import re
from collections import Counter

class DataProfilingService:
    def __init__(self, dsn):
        self.dsn = dsn

    async def connect(self):
        return await asyncpg.connect(self.dsn)

    async def null_check(self, table, column):
        async with self.connect() as conn:
            result = await conn.fetchrow(f"SELECT COUNT(*) FROM {table} WHERE {column} IS NULL")
            return result['count']

    async def uniqueness_check(self, table, column):
        async with self.connect() as conn:
            result = await conn.fetchrow(f"SELECT COUNT(*) FROM (SELECT {column} FROM {table} GROUP BY {column} HAVING COUNT(*) > 1) AS subquery")
            return result['count']

    async def value_distribution(self, table, column):
        async with self.connect() as conn:
            result = await conn.fetch(f"SELECT {column}, COUNT(*) FROM {table} GROUP BY {column}")
            return dict(result)

    async def pattern_check(self, table, column, regex):
        async with self.connect() as conn:
            result = await conn.fetchrow(f"SELECT COUNT(*) FROM {table} WHERE {column} ~ '{regex}'")
            return result['count']

    async def statistical_profile(self, table, column):
        async with self.connect() as conn:
            result = await conn.fetchrow(f"SELECT MIN({column}) AS min, MAX({column}) AS max, AVG({column}) AS avg, STDDEV({column}) AS stddev FROM {table}")
            return result

    async def profile_all_columns(self, table):
        async with self.connect() as conn:
            columns = await conn.fetchrow(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
            results = {}
            for column in columns['column_name']:
                results[column] = {
                    'nulls': await self.null_check(table, column),
                    'duplicates': await self.uniqueness_check(table, column),
                    'distribution': await self.value_distribution(table, column),
                    'pattern_matches': await self.pattern_check(table, column, r'.*'),  # Replace with actual regex
                    'stats': await self.statistical_profile(table, column)
                }
            return results

    async def store_results(self, table, results):
        async with self.connect() as conn:
            for column, data in results.items():
                await conn.execute(f"INSERT INTO data_profiling_results (table_name, column_name, nulls, duplicates, distribution, pattern_matches, min, max, avg, stddev) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)",
                                   table, column, data['nulls'], data['duplicates'], data['distribution'], data['pattern_matches'], data['stats']['min'], data['stats']['max'], data['stats']['avg'], data['stats']['stddev'])
