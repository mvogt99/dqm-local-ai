
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RootCauseAnalysis = () => {
  const [failedResults, setFailedResults] = useState([]);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    fetchFailedResults();
    fetchHistory();
  }, []);

  const fetchFailedResults = async () => {
    try {
      const response = await axios.get('/api/dq/results');
      setFailedResults(response.data.filter(result => !result.passed));
    } catch (error) {
      console.error('Failed to fetch failed DQ results:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/ai-analysis/analyses');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch analysis history:', error);
    }
  };

  const analyzeFailure = async (resultId) => {
    try {
      const response = await axios.post(`/api/ai-analysis/analyze/${resultId}`);
      setAnalysisResults(response.data);
    } catch (error) {
      console.error('Failed to analyze failure:', error);
    }
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  return (
    <div className={`root-cause-analysis ${darkTheme ? 'dark-theme' : ''}`}>
      <h1>Root Cause Analysis</h1>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <h2>Failed DQ Results</h2>
      <ul>
        {failedResults.map(result => (
          <li key={result.id}>
            {result.name} - <button onClick={() => analyzeFailure(result.id)}>Analyze</button>
          </li>
        ))}
      </ul>
      {analysisResults.length > 0 && (
        <>
          <h2>AI-Suggested Root Causes</h2>
          <ul>
            {analysisResults.map(cause => (
              <li key={cause.id}>
                {cause.cause} - Confidence: {cause.confidence.toFixed(2)}
              </li>
            ))}
          </ul>
        </>
      )}
      <h2>Analysis History</h2>
      <ul>
        {history.map(analysis => (
          <li key={analysis.id}>
            {analysis.result.name} - {analysis.timestamp}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RootCauseAnalysis;


```css
.root-cause-analysis {
  font-family: Arial, sans-serif;
  padding: 20px;
}

.dark-theme {
  background-color: #333;
  color: #fff;
}

button {
  margin-right: 10px;
}

