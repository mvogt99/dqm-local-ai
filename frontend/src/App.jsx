import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { MultiTableSelector, DatabaseConnectionManager } from './components';

const API_BASE = 'http://localhost:8001';

const App = () => {
  const [activeTab, setActiveTab] = useState('Tables');
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [selectedTables, setSelectedTables] = useState([]);
  const [profileData, setProfileData] = useState(null);
  const [rules, setRules] = useState([]);
  const [customRules, setCustomRules] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddRule, setShowAddRule] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [executing, setExecuting] = useState(null);
  const [newRule, setNewRule] = useState({
    name: '',
    column: '',
    rule_type: 'null_check',
    severity: 'warning',
    definition: ''
  });

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

  // Batch profile multiple tables
  const batchProfileTables = async () => {
    if (selectedTables.length === 0) {
      setError('Please select at least one table');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post(`${API_BASE}/data-profiling/profile/batch`, {
        tables: selectedTables
      });
      const result = response.data;
      alert(`Batch profiling complete!\nSuccessful: ${result.successful}\nFailed: ${result.failed}`);
      // If only one table, show its profile
      if (selectedTables.length === 1 && result.profiles[0]?.success) {
        setSelectedTable(selectedTables[0]);
        setProfileData(result.profiles[0].profile_data);
      }
    } catch (err) {
      console.error('Error batch profiling:', err);
      setError('Failed to batch profile: ' + (err.response?.data?.detail || err.message));
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

      // Build comprehensive issues list from ALL rules (auto-generated + custom)
      const allRules = getAllRules();
      const issues = allRules.length > 0
        ? allRules.map(r => ({
            rule_type: r.rule_type,
            column: r.column,
            severity: r.severity,
            reason: r.reason || r.definition,
            is_custom: r.is_custom || false
          }))
        : [{ rule_type: 'general', description: 'No specific issues identified' }];

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

  const addCustomRule = async () => {
    if (!newRule.name || !newRule.column) {
      setError('Please fill in rule name and column');
      return;
    }

    const rule = {
      name: newRule.name,
      table: selectedTable,
      column: newRule.column,
      rule_type: newRule.rule_type,
      severity: newRule.severity,
      definition: newRule.definition || `SELECT * FROM ${selectedTable} WHERE ${newRule.column} IS NULL`,
      reason: 'User-defined rule',
      is_custom: true
    };

    try {
      // Try to save to backend
      await axios.post(`${API_BASE}/data-quality/rules`, rule);
    } catch (err) {
      console.log('Note: Backend rule storage not available, storing locally');
    }

    setCustomRules([...customRules, rule]);
    setNewRule({ name: '', column: '', rule_type: 'null_check', severity: 'warning', definition: '' });
    setShowAddRule(false);
  };

  const removeCustomRule = (index) => {
    setCustomRules(customRules.filter((_, i) => i !== index));
  };

  const getAllRules = () => [...rules, ...customRules];

  // Execute a single rule
  const executeRule = async (rule, index) => {
    setExecuting(index);
    try {
      // For generated rules without IDs, we need to create them first
      let ruleId = rule.id;
      if (!ruleId) {
        // Create the rule first
        const createResponse = await axios.post(`${API_BASE}/data-quality/rules`, {
          name: rule.name,
          table: selectedTable,
          column: rule.column,
          rule_type: rule.rule_type,
          definition: rule.definition || `SELECT * FROM ${selectedTable} WHERE ${rule.column} IS NULL`,
          severity: rule.severity || 'warning'
        });
        ruleId = createResponse.data.id;
      }

      const response = await axios.post(`${API_BASE}/data-quality/rules/${ruleId}/execute`);
      setExecutionResults(prev => ({
        ...prev,
        [index]: response.data
      }));
    } catch (err) {
      console.error('Error executing rule:', err);
      setExecutionResults(prev => ({
        ...prev,
        [index]: { error: err.response?.data?.detail || err.message }
      }));
    } finally {
      setExecuting(null);
    }
  };

  // Execute all rules
  const executeAllRules = async () => {
    const allRules = getAllRules();
    setLoading(true);
    setError(null);

    for (let i = 0; i < allRules.length; i++) {
      await executeRule(allRules[i], i);
    }

    setLoading(false);
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
            <li onClick={() => handleTabChange('Settings')} className={activeTab === 'Settings' ? 'active' : ''}>Settings</li>
          </ul>
        </nav>
      </header>

      <main>
        {error && <div className="error">{error}</div>}
        {loading && <div className="loading">Loading...</div>}

        {activeTab === 'Tables' && (
          <div className="tables-section">
            <h2>Database Tables</h2>
            <p>Select tables to profile (click for single, use checkboxes for batch):</p>
            {tables.length === 0 && !loading ? (
              <p>No tables found. Check backend connection.</p>
            ) : (
              <>
                <MultiTableSelector
                  tables={tables}
                  selectedTables={selectedTables}
                  onSelectionChange={setSelectedTables}
                  disabled={loading}
                />
                <div className="table-actions" style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={batchProfileTables}
                    disabled={selectedTables.length === 0 || loading}
                    className="primary"
                  >
                    Profile Selected ({selectedTables.length})
                  </button>
                </div>
                <h3 style={{ marginTop: '20px' }}>Quick Select (Single Table)</h3>
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
              </>
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
                {/* Rules Table */}
                {getAllRules().length > 0 && (
                  <table className="data-table rules-table">
                    <thead>
                      <tr>
                        <th>Rule Name</th>
                        <th>Column</th>
                        <th>Type</th>
                        <th>Severity</th>
                        <th>Reason</th>
                        <th>Result</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {getAllRules().map((rule, idx) => (
                        <tr key={idx} className={`rule-row ${rule.severity || 'warning'}`}>
                          <td>{rule.name}</td>
                          <td><strong>{rule.column}</strong></td>
                          <td>
                            <span className={`rule-type-badge ${rule.rule_type}`}>
                              {rule.rule_type?.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span className={`severity-badge ${rule.severity || 'warning'}`}>
                              {rule.severity || 'warning'}
                            </span>
                          </td>
                          <td>{rule.reason || '-'}</td>
                          <td>
                            {executionResults[idx] ? (
                              executionResults[idx].error ? (
                                <span className="result-error">Error</span>
                              ) : (
                                <span className={`result-badge ${executionResults[idx].passed ? 'passed' : 'failed'}`}>
                                  {executionResults[idx].passed ? 'PASS' : 'FAIL'} ({executionResults[idx].pass_rate?.toFixed(1)}%)
                                </span>
                              )
                            ) : '-'}
                          </td>
                          <td>
                            <button
                              className="execute-btn"
                              onClick={() => executeRule(rule, idx)}
                              disabled={executing === idx}
                            >
                              {executing === idx ? 'Running...' : 'Execute'}
                            </button>
                            {rule.is_custom && (
                              <button
                                className="remove-btn"
                                onClick={() => removeCustomRule(customRules.indexOf(rule))}
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Add Rule Form */}
                {showAddRule && (
                  <div className="add-rule-form">
                    <h3>Add Custom Rule</h3>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Rule Name</label>
                        <input
                          type="text"
                          value={newRule.name}
                          onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                          placeholder="e.g., check_customer_email"
                        />
                      </div>
                      <div className="form-group">
                        <label>Column</label>
                        <select
                          value={newRule.column}
                          onChange={(e) => setNewRule({...newRule, column: e.target.value})}
                        >
                          <option value="">Select column</option>
                          {profileData?.columns?.map(col => (
                            <option key={col.column_name} value={col.column_name}>
                              {col.column_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Rule Type</label>
                        <select
                          value={newRule.rule_type}
                          onChange={(e) => setNewRule({...newRule, rule_type: e.target.value})}
                        >
                          <option value="null_check">Null Check</option>
                          <option value="not_null">Not Null</option>
                          <option value="unique_check">Unique Check</option>
                          <option value="range_check">Range Check</option>
                          <option value="pattern_check">Pattern Check</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Severity</label>
                        <select
                          value={newRule.severity}
                          onChange={(e) => setNewRule({...newRule, severity: e.target.value})}
                        >
                          <option value="info">Info</option>
                          <option value="warning">Warning</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label>SQL Definition (optional)</label>
                      <textarea
                        value={newRule.definition}
                        onChange={(e) => setNewRule({...newRule, definition: e.target.value})}
                        placeholder="SELECT * FROM table WHERE column IS NULL"
                      />
                    </div>
                    <div className="form-actions">
                      <button onClick={addCustomRule} className="primary">Add Rule</button>
                      <button onClick={() => setShowAddRule(false)}>Cancel</button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="rules-actions">
                  <button onClick={fetchRules} disabled={!selectedTable || loading}>
                    {loading ? 'Generating...' : rules.length > 0 ? 'Regenerate Rules' : 'Generate Rules'}
                  </button>
                  <button
                    onClick={executeAllRules}
                    disabled={!selectedTable || loading || getAllRules().length === 0}
                    className="primary"
                  >
                    {loading ? 'Executing...' : 'Execute All Rules'}
                  </button>
                  <button onClick={() => setShowAddRule(!showAddRule)} className="secondary">
                    {showAddRule ? 'Cancel' : '+ Add Custom Rule'}
                  </button>
                </div>
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
                {analysis && analysis.status === 'success' && analysis.analysis && (
                  <div className="analysis-results">
                    <div className="confidence">
                      Insights Found: {analysis.analysis.insight_count || analysis.analysis.insights?.length || 0}
                    </div>
                    <h3>Analysis for {analysis.analysis.table_name}</h3>
                    <p>Analysis completed at {new Date(analysis.analysis.analysis_timestamp).toLocaleString()}</p>

                    {analysis.analysis.insights && analysis.analysis.insights.length > 0 && (
                      <>
                        <h3>Data Quality Insights</h3>
                        <div className="insights-list">
                          {analysis.analysis.insights.map((insight, idx) => (
                            <div key={idx} className={`insight-card ${insight.severity}`}>
                              <div className="insight-header">
                                <span className={`severity-badge ${insight.severity}`}>{insight.severity}</span>
                                <span className="category">{insight.category}</span>
                              </div>
                              <p className="description">{insight.description}</p>
                              <p className="recommendation"><strong>Recommendation:</strong> {insight.recommendation}</p>
                              {insight.affected_columns && (
                                <p className="columns">Affected: {insight.affected_columns.join(', ')}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {analysis && analysis.status !== 'success' && (
                  <div className="analysis-error">
                    <p>Analysis failed: {analysis.error || 'Unknown error'}</p>
                  </div>
                )}
                <button onClick={runAnalysis} disabled={!selectedTable || loading}>
                  {loading ? 'Analyzing...' : analysis ? 'Re-run Analysis' : 'Run AI Analysis'}
                </button>
              </>
            )}
          </div>
        )}

        {activeTab === 'Settings' && (
          <div className="settings-section">
            <h2>Settings</h2>
            <DatabaseConnectionManager apiBase={API_BASE} />
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
