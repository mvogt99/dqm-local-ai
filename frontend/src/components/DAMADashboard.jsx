/**
 * DAMA Dashboard Component
 *
 * Main container for DAMA data quality visualization.
 * Displays radar chart overview, per-table heatmap, trends, and alerts.
 *
 * V122: Created with corrections from Local AI output.
 * Corrections applied:
 * - Uses native fetch instead of axios
 * - Uses div-based tabs instead of antd
 * - Fetches from correct endpoints (/dama/overview, /dama/tables, etc.)
 */

import React, { useState, useEffect } from 'react';
import DAMARadarChart from './DAMARadarChart';
import './DAMADashboard.css';

const DAMADashboard = ({ apiBase }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [overview, setOverview] = useState(null);
  const [tables, setTables] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [overviewRes, tablesRes, trendsRes, alertsRes] = await Promise.all([
          fetch(`${apiBase}/dama/overview`),
          fetch(`${apiBase}/dama/tables`),
          fetch(`${apiBase}/dama/trends?days=30`),
          fetch(`${apiBase}/dama/alerts?threshold=70`),
        ]);

        if (!overviewRes.ok || !tablesRes.ok || !trendsRes.ok || !alertsRes.ok) {
          throw new Error('Failed to fetch DAMA data');
        }

        const [overviewData, tablesData, trendsData, alertsData] = await Promise.all([
          overviewRes.json(),
          tablesRes.json(),
          trendsRes.json(),
          alertsRes.json(),
        ]);

        setOverview(overviewData);
        setTables(tablesData);
        setTrends(trendsData);
        setAlerts(alertsData);
      } catch (err) {
        setError(err.message);
        console.error('DAMA Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [apiBase]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'tables', label: 'Tables' },
    { id: 'trends', label: 'Trends' },
    { id: 'alerts', label: `Alerts (${alerts.length})` },
  ];

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'high': return 'alert-card severity-high';
      case 'medium': return 'alert-card severity-medium';
      case 'low': return 'alert-card severity-low';
      default: return 'alert-card';
    }
  };

  const getHeatmapColor = (score) => {
    if (score >= 80) return '#28a745'; // Green
    if (score >= 60) return '#ffc107'; // Yellow
    if (score >= 40) return '#fd7e14'; // Orange
    return '#dc3545'; // Red
  };

  if (loading) {
    return <div className="dama-dashboard loading">Loading DAMA Dashboard...</div>;
  }

  if (error) {
    return <div className="dama-dashboard error">Error: {error}</div>;
  }

  return (
    <div className="dama-dashboard">
      <h2>DAMA Data Quality Dashboard</h2>

      {/* Tab Navigation */}
      <div className="dama-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`dama-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="dama-tab-content">
        {activeTab === 'overview' && overview && (
          <div className="radar-chart-container">
            <h3>Overall Quality Scores</h3>
            <DAMARadarChart data={overview} />
            <div className="score-summary">
              {Object.entries(overview).map(([dim, score]) => (
                <div key={dim} className="score-item">
                  <span className="dimension-name">{dim}</span>
                  <span
                    className="dimension-score"
                    style={{ color: getHeatmapColor(score) }}
                  >
                    {score.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'tables' && (
          <div className="heatmap-container">
            <h3>Per-Table Quality Scores</h3>
            <table className="heatmap-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Comp</th>
                  <th>Uniq</th>
                  <th>Valid</th>
                  <th>Acc</th>
                  <th>Integ</th>
                  <th>Cons</th>
                  <th>Time</th>
                  <th>Prec</th>
                  <th>Rel</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((table, idx) => (
                  <tr key={idx}>
                    <td>{table.table_name}</td>
                    <td style={{ backgroundColor: getHeatmapColor(table.completeness) }}>
                      {table.completeness.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.uniqueness) }}>
                      {table.uniqueness.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.validity) }}>
                      {table.validity.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.accuracy) }}>
                      {table.accuracy.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.integrity) }}>
                      {table.integrity.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.consistency) }}>
                      {table.consistency.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.timeliness) }}>
                      {table.timeliness.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.precision) }}>
                      {table.precision.toFixed(0)}
                    </td>
                    <td style={{ backgroundColor: getHeatmapColor(table.relevance) }}>
                      {table.relevance.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="trend-chart-container">
            <h3>Historical Trends (Last 30 Days)</h3>
            {trends.length > 0 ? (
              <div className="trends-table">
                <table className="heatmap-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Comp</th>
                      <th>Uniq</th>
                      <th>Valid</th>
                      <th>Acc</th>
                      <th>Integ</th>
                      <th>Cons</th>
                      <th>Time</th>
                      <th>Prec</th>
                      <th>Rel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trends.map((trend, idx) => (
                      <tr key={idx}>
                        <td>{trend.date}</td>
                        <td>{trend.completeness.toFixed(0)}</td>
                        <td>{trend.uniqueness.toFixed(0)}</td>
                        <td>{trend.validity.toFixed(0)}</td>
                        <td>{trend.accuracy.toFixed(0)}</td>
                        <td>{trend.integrity.toFixed(0)}</td>
                        <td>{trend.consistency.toFixed(0)}</td>
                        <td>{trend.timeliness.toFixed(0)}</td>
                        <td>{trend.precision.toFixed(0)}</td>
                        <td>{trend.relevance.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No trend data available</p>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-container">
            <h3>Quality Alerts</h3>
            {alerts.length > 0 ? (
              <div className="alerts-list">
                {alerts.map((alert, idx) => (
                  <div key={idx} className={getSeverityClass(alert.severity)}>
                    <div className="alert-header">
                      <span className="alert-table">{alert.table}</span>
                      <span className="alert-severity">{alert.severity.toUpperCase()}</span>
                    </div>
                    <div className="alert-body">
                      <strong>{alert.dimension}</strong> score is{' '}
                      <span className="alert-score">{alert.score.toFixed(1)}%</span>
                      {' '}(threshold: {alert.threshold}%)
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-alerts">No quality alerts - all dimensions above threshold!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DAMADashboard;
