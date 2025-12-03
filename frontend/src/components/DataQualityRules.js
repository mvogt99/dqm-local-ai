
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DataQualityRules = () => {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    name: '',
    table: '',
    column: '',
    type: '',
    definition: ''
  });
  const [results, setResults] = useState({ pass: 0, fail: 0 });
  const [darkTheme, setDarkTheme] = useState(false);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      const response = await axios.get('/data-quality/rules');
      setRules(response.data);
    } catch (error) {
      console.error('Error fetching rules:', error);
    }
  };

  const createRule = async () => {
    try {
      await axios.post('/data-quality/rules', newRule);
      fetchRules();
      setNewRule({
        name: '',
        table: '',
        column: '',
        type: '',
        definition: ''
      });
    } catch (error) {
      console.error('Error creating rule:', error);
    }
  };

  const executeRule = async (id) => {
    try {
      await axios.post(`/data-quality/rules/${id}/execute`);
      fetchRules();
    } catch (error) {
      console.error('Error executing rule:', error);
    }
  };

  const suggestRules = async () => {
    try {
      const response = await axios.get('/data-quality/rules/suggest');
      setRules([...rules, ...response.data]);
    } catch (error) {
      console.error('Error suggesting rules:', error);
    }
  };

  const toggleTheme = () => {
    setDarkTheme(!darkTheme);
  };

  return (
    <div className={`container ${darkTheme ? 'dark-theme' : ''}`}>
      <h1>Data Quality Rules</h1>
      <button onClick={suggestRules}>Suggest Rules</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
      <form onSubmit={(e) => { e.preventDefault(); createRule(); }}>
        <input
          type="text"
          value={newRule.name}
          onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
          placeholder="Name"
        />
        <input
          type="text"
          value={newRule.table}
          onChange={(e) => setNewRule({ ...newRule, table: e.target.value })}
          placeholder="Table"
        />
        <input
          type="text"
          value={newRule.column}
          onChange={(e) => setNewRule({ ...newRule, column: e.target.value })}
          placeholder="Column"
        />
        <input
          type="text"
          value={newRule.type}
          onChange={(e) => setNewRule({ ...newRule, type: e.target.value })}
          placeholder="Type"
        />
        <textarea
          value={newRule.definition}
          onChange={(e) => setNewRule({ ...newRule, definition: e.target.value })}
          placeholder="Definition"
        />
        <button type="submit">Create Rule</button>
      </form>
      <ul>
        {rules.map(rule => (
          <li key={rule.id}>
            {rule.name} - {rule.table}.{rule.column} - {rule.type}
            <button onClick={() => executeRule(rule.id)}>Execute</button>
            <span>Pass: {rule.results.pass}</span>
            <span>Fail: {rule.results.fail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DataQualityRules;


```css
/* Add this CSS in a separate file or within a style tag */
.container {
  font-family: Arial, sans-serif;
}

.dark-theme {
  background-color: #333;
  color: #fff;
}

.container input,
.container textarea,
.container button {
  margin: 5px;
  padding: 5px;
}

.container button {
  background-color: #007bff;
  color: #fff;
  border: none;
  cursor: pointer;
}

.container button:hover {
  background-color: #0056b3;
}

