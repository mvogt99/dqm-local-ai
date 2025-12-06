"""
DAMA (Data Management Association) Dashboard Service

Aggregates data quality scores by DAMA dimensions from rule execution history.
All 9 DAMA dimensions: completeness, uniqueness, validity, accuracy,
integrity, consistency, timeliness, precision, relevance.

V122: Created with corrections from Local AI output.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

import chromadb

# DAMA dimension to rule type mapping
DAMA_DIMENSION_MAP = {
    "completeness": ["null_check", "required_field", "not_null"],
    "uniqueness": ["unique", "duplicate_check", "primary_key"],
    "validity": ["format", "regex", "enum", "range"],
    "accuracy": ["reference", "lookup", "cross_reference"],
    "integrity": ["foreign_key", "referential", "constraint"],
    "consistency": ["cross_field", "business_rule", "derived"],
    "timeliness": ["freshness", "age", "staleness"],
    "precision": ["decimal_places", "significant_digits", "rounding"],
    "relevance": ["applicability", "context", "scope"],
}

ALL_DAMA_DIMENSIONS = list(DAMA_DIMENSION_MAP.keys())


class DAMAService:
    """Service for DAMA dimension scoring and aggregation."""

    def __init__(self, host: str = "localhost", port: int = 8100):
        """Initialize with ChromaDB connection."""
        self.client = chromadb.HttpClient(host=host, port=port)
        self.collection = self.client.get_or_create_collection("rule_executions")

    def get_dimension_for_rule_type(self, rule_type: str) -> Optional[str]:
        """Map a rule type to its DAMA dimension."""
        rule_type_lower = rule_type.lower()
        for dimension, rule_types in DAMA_DIMENSION_MAP.items():
            if any(rt in rule_type_lower for rt in rule_types):
                return dimension
        return None

    def get_overview_scores(self) -> Dict[str, float]:
        """
        Get overall scores per DAMA dimension across all tables.
        Returns dict with dimension names and scores (0-100).
        """
        # Get all rule execution results
        results = self.collection.get(include=["metadatas"])

        if not results["ids"]:
            # Return default scores if no data
            return {dim: 0.0 for dim in ALL_DAMA_DIMENSIONS}

        # Aggregate scores by dimension
        dimension_scores: Dict[str, List[float]] = {dim: [] for dim in ALL_DAMA_DIMENSIONS}

        metadatas = results.get("metadatas", [])
        for meta in metadatas:
            if not meta:
                continue
            rule_type = meta.get("rule_type", "")
            pass_rate = float(meta.get("pass_rate", "0"))
            dimension = self.get_dimension_for_rule_type(rule_type)
            if dimension:
                dimension_scores[dimension].append(pass_rate)

        # Calculate average for each dimension
        overview = {}
        for dim, scores in dimension_scores.items():
            if scores:
                overview[dim] = round(sum(scores) / len(scores), 2)
            else:
                overview[dim] = 0.0

        return overview

    def get_table_scores(self) -> List[Dict[str, Any]]:
        """
        Get DAMA dimension scores per table.
        Returns list of dicts with table_name and dimension scores.
        """
        results = self.collection.get(include=["metadatas"])

        if not results["ids"]:
            return []

        # Group by table
        table_data: Dict[str, Dict[str, List[float]]] = {}

        metadatas = results.get("metadatas", [])
        for meta in metadatas:
            if not meta:
                continue
            table_name = meta.get("table_name", "unknown")
            rule_type = meta.get("rule_type", "")
            pass_rate = float(meta.get("pass_rate", "0"))
            dimension = self.get_dimension_for_rule_type(rule_type)

            if table_name not in table_data:
                table_data[table_name] = {dim: [] for dim in ALL_DAMA_DIMENSIONS}

            if dimension:
                table_data[table_name][dimension].append(pass_rate)

        # Calculate averages per table
        table_scores = []
        for table_name, dimensions in table_data.items():
            scores = {"table_name": table_name}
            for dim, values in dimensions.items():
                if values:
                    scores[dim] = round(sum(values) / len(values), 2)
                else:
                    scores[dim] = 0.0
            table_scores.append(scores)

        return table_scores

    def get_trends(self, days: int = 30) -> List[Dict[str, Any]]:
        """
        Get historical trends of DAMA scores over time.
        Returns list of dicts with date and dimension scores.
        """
        results = self.collection.get(include=["metadatas"])

        if not results["ids"]:
            return []

        # Group by date
        date_data: Dict[str, Dict[str, List[float]]] = {}

        metadatas = results.get("metadatas", [])
        for meta in metadatas:
            if not meta:
                continue
            timestamp = meta.get("timestamp", meta.get("executed_at", ""))
            if not timestamp:
                continue

            # Extract date part
            date_str = timestamp[:10] if len(timestamp) >= 10 else timestamp
            rule_type = meta.get("rule_type", "")
            pass_rate = float(meta.get("pass_rate", "0"))
            dimension = self.get_dimension_for_rule_type(rule_type)

            if date_str not in date_data:
                date_data[date_str] = {dim: [] for dim in ALL_DAMA_DIMENSIONS}

            if dimension:
                date_data[date_str][dimension].append(pass_rate)

        # Calculate averages per date and sort
        trends = []
        for date_str, dimensions in sorted(date_data.items())[-days:]:
            entry = {"date": date_str}
            for dim, values in dimensions.items():
                if values:
                    entry[dim] = round(sum(values) / len(values), 2)
                else:
                    entry[dim] = 0.0
            trends.append(entry)

        return trends

    def get_alerts(self, threshold: float = 70.0) -> List[Dict[str, Any]]:
        """
        Get quality alerts for dimensions scoring below threshold.
        Returns list of alerts with table, dimension, score, and threshold.
        """
        table_scores = self.get_table_scores()
        alerts = []

        for table in table_scores:
            table_name = table["table_name"]
            for dim in ALL_DAMA_DIMENSIONS:
                score = table.get(dim, 0.0)
                if score < threshold and score > 0:
                    alerts.append(
                        {
                            "table": table_name,
                            "dimension": dim,
                            "score": score,
                            "threshold": threshold,
                            "severity": (
                                "high" if score < 50 else "medium" if score < threshold else "low"
                            ),
                        }
                    )

        # Sort by score ascending (worst first)
        alerts.sort(key=lambda x: x["score"])
        return alerts
