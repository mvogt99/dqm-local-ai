import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8001';

const App = () => {
  const [activeTab, setActiveTab] = useState('Tables');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [rules, setRules] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_BASE}/data-profiling/tables`);
      setTables(response.data);
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Failed to fetch tables: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (tableName) => {
    try {
      setLoading(true);
      setError(null);
      setSelectedTable(tableName);
      const response = await axios.get(`${API_BASE}/data-profiling/profile/${tableName}`);
      setProfileData(response.data);
    } catch (err) {
      console.error('Error profiling table:', err);
      setError('Failed to profile table: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    if (!selectedTable) {
      setError('Please select a table first');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE}/data-quality/suggest`, {
        table_name: selectedTable
      });
      setRules(response.data.rules || response.data || []);
    } catch (err) {
      console.error('Error fetching rules:', err);
      setError('Failed to fetch rules: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!selectedTable) {
      setError('Please profile a table first');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const issues = rules.length > 0
        ? rules.filter(r => r.severity === 'high').map(r => r.description || r.rule_type)
        : ['No specific issues identified'];

      const response = await axios.post(`${API_BASE}/ai-analysis/analyze`, {
        table_name: selectedTable,
        profile_data: profileData || {},
        issues: issues
      });
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error running analysis:', err);
      setError('Failed to run analysis: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>DQM - LOCAL AI</h1>
        <nav>
          <ul>
            <li onClick={() => handleTabChange('Tables')} className={activeTab === 'Tables' ? 'active' : ''}>Tables</li>
            <li onClick={() => handleTabChange('Profiling Results')} className={activeTab === 'Profiling Results' ? 'active' : ''}>Profiling Results</li>
            <li onClick={() => handleTabChange('Data Quality Rules')} className={activeTab === 'Data Quality Rules' ? 'active' : ''}>Data Quality Rules</li>
            <li onClick={() => handleTabChange('Root Cause Analysis')} className={activeTab === 'Root Cause Analysis' ? 'active' : ''}>Root Cause Analysis</li>
          </ul>
        </nav>
      </header>

      <main>
        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {activeTab === 'Tables' && (
          <div className="tables-section">
            <h2>Database Tables</h2>
            <p>Select a table to profile:</p>
            {tables.length === 0 && !loading ? (
              <p>No tables found. Check backend connection.</p>
            ) : (
              <div className="table-grid">
                {tables.map(table => (
                  <div
                    key={table}
                    className={`table-card ${selectedTable === table ? 'selected' : ''}`}
                    onClick={() => fetchProfile(table)}
                  >
                    {table}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'Profiling Results' && (
          <div className="profile-section">
            <h2>Profiling Results {selectedTable && `- ${selectedTable}`}</h2>
            {!profileData ? (
              <p>Select a table from the Tables tab to see profiling results.</p>
            ) : (
              <div className="profile-results">
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Row Count</span>
                    <span className="stat-value">{profileData.row_count || 0}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Column Count</span>
                    <span className="stat-value">{profileData.column_count || 0}</span>
                  </div>
                </div>
                <h3>Column Details</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Type</th>
                      <th>Null %</th>
                      <th>Unique</th>
                      <th>Sample Values</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profileData.columns && profileData.columns.map(col => (
                      <tr key={col.column_name}>
                        <td>{col.column_name}</td>
                        <td>{col.data_type}</td>
                        <td>{(col.null_percent || 0).toFixed(1)}%</td>
                        <td>{col.unique_count || 0}</td>
                        <td>{col.sample_values ? col.sample_values.slice(0, 3).map(v => String(v)).join(', ') : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'Data Quality Rules' && (
          <div className="rules-section">
            <h2>Data Quality Rules {selectedTable && `- ${selectedTable}`}</h2>
            {!selectedTable ? (
              <p>Select a table from the Tables tab first.</p>
            ) : (
              <>
                {rules.length > 0 && (
                  <div className="rules-list">
                    {rules.map((rule, idx) => (
                      <div key={idx} className={`rule-card ${rule.severity || 'medium'}`}>
                        <div className="rule-header">
                          <span className="rule-type">{rule.rule_type || rule.type || 'Rule'}</span>
                          <span className={`severity ${rule.severity || 'medium'}`}>{rule.severity || 'medium'}</span>
                        </div>
                        <p className="rule-desc">{rule.description || rule.message || 'Quality rule'}</p>
                        {rule.sql_check && <code className="rule-sql">{rule.sql_check}</code>}
                      </div>
                    ))}
                  </div>
                )}
                <button onClick={fetchRules} disabled={!selectedTable || loading}>
                  {loading ? 'Generating...' : rules.length > 0 ? 'Regenerate Rules' : 'Generate Rules'}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'Root Cause Analysis' && (
          <div className="analysis-section">
            <h2>AI Root Cause Analysis {selectedTable && `- ${selectedTable}`}</h2>
            {!selectedTable ? (
              <p>Select and profile a table first from the Tables tab.</p>
            ) : (
              <>
                {analysis && (
                  <div className="analysis-results">
                    <div className="confidence">
                      Confidence: {((analysis.confidence || 0) * 100).toFixed(0)}%
                    </div>
                    <h3>Analysis</h3>
                    <p>{analysis.analysis || analysis.summary || 'Analysis completed.'}</p>
                    {analysis.root_causes && analysis.root_causes.length > 0 && (
                      <>
                        <h3>Root Causes</h3>
                        <ul>
                          {analysis.root_causes.map((cause, idx) => (
                            <li key={idx}>{cause}</li>
                          ))}
                        </ul>
                      </>
                    )}
                    {analysis.recommendations && analysis.recommendations.length > 0 && (
                      <>
                        <h3>Recommendations</h3>
                        <ul>
                          {analysis.recommendations.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}
                <button onClick={runAnalysis} disabled={!selectedTable || loading}>
                  {loading ? 'Analyzing...' : analysis ? 'Re-run Analysis' : 'Run AI Analysis'}
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
