import asyncio
from asyncpg import connect, exceptions

class DataQualityRulesService:
    def __init__(self, dsn):
        self.dsn = dsn

    async def suggest_rules(self, profiling_results):
        # This is a placeholder for logic to analyze profiling results and suggest rules
        suggested_rules = []
        # Example logic (to be replaced with actual analysis)
        for result in profiling_results:
            if result['null_percentage'] > 0.1:
                suggested_rules.append({
                    'name': f"{result['table']}_{result['column']}_null_check",
                    'table': result['table'],
                    'column': result['column'],
                    'rule_type': 'null_check',
                    'definition': f"SELECT COUNT(*) FROM {result['table']} WHERE {result['column']} IS NULL",
                    'severity': 'medium'
                })
        return suggested_rules

    async def create_rule(self, name, table, column, rule_type, definition, severity):
        async with connect(self.dsn) as conn:
            try:
                await conn.execute('''
                    INSERT INTO data_quality_rules (name, table_name, column_name, rule_type, definition, severity)
                    VALUES ($1, $2, $3, $4, $5, $6)
                ''', name, table, column, rule_type, definition, severity)
            except exceptions.PostgresError as e:
                print(f"An error occurred while creating the rule: {e}")

    async def execute_rule(self, rule_id):
        async with connect(self.dsn) as conn:
            try:
                rule = await conn.fetchrow('SELECT * FROM data_quality_rules WHERE id = $1', rule_id)
                if not rule:
                    print("Rule not found")
                    return
                query = rule['definition']
                failures = await conn.fetch(query)
                await conn.execute('''
                    INSERT INTO data_quality_results (rule_id, failures)
                    VALUES ($1, $2)
                ''', rule_id, str(failures))
            except exceptions.PostgresError as e:
                print(f"An error occurred while executing the rule: {e}")

    async def get_all_rules(self):
        async with connect(self.dsn) as conn:
            try:
                rules = await conn.fetch('SELECT * FROM data_quality_rules WHERE active = TRUE')
                return [dict(rule) for rule in rules]
            except exceptions.PostgresError as e:
                print(f"An error occurred while fetching rules: {e}")
                return []

    async def get_failures(self, rule_id):
        async with connect(self.dsn) as conn:
            try:
                failures = await conn.fetch('SELECT failures FROM data_quality_results WHERE rule_id = $1', rule_id)
                return [str(failure['failures']) for failure in failures]
            except exceptions.PostgresError as e:
                print(f"An error occurred while fetching failures: {e}")
                return []
