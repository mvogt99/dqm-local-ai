
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const App = () => {
  const [activeTab, setActiveTab] = useState('Tables');
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/data');
        setData(response.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="App">
      <header className="App-header">
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
        {activeTab === 'Tables' && <div>Tables Data: {JSON.stringify(data)}</div>}
        {activeTab === 'Profiling Results' && <div>Profiling Results Data: {JSON.stringify(data)}</div>}
        {activeTab === 'Data Quality Rules' && <div>Data Quality Rules Data: {JSON.stringify(data)}</div>}
        {activeTab === 'Root Cause Analysis' && <div>Root Cause Analysis Data: {JSON.stringify(data)}</div>}
      </main>
    </div>
  );
};

export default App;


```css
.App {
  font-family: Arial, sans-serif;
  background-color: #121212;
  color: #ffffff;
  margin: 0;
  padding: 0;
}

.App-header {
  background-color: #1e1e1e;
  padding: 20px;
  text-align: center;
}

nav ul {
  list-style-type: none;
  padding: 0;
}

nav ul li {
  display: inline;
  margin-right: 20px;
  cursor: pointer;
}

nav ul li.active {
  font-weight: bold;
}

main {
  padding: 20px;
}

