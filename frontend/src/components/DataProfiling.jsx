
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  background-color: #121212;
  color: #ffffff;
  padding: 20px;
`;

const Select = styled.select`
  background-color: #282828;
  color: #ffffff;
  border: 1px solid #444444;
  padding: 8px;
  margin-bottom: 10px;
`;

const Button = styled.button`
  background-color: #007bff;
  color: #ffffff;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  background-color: #333333;
  color: #ffffff;
  padding: 8px;
`;

const Td = styled.td`
  border: 1px solid #444444;
  padding: 8px;
`;

const DataProfiling = () => {
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const response = await fetch('/data-profiling/tables');
        const data = await response.json();
        setTables(data);
      } catch (err) {
        setError(err);
      }
    };

    fetchTables();
  }, []);

  const handleTableChange = (e) => {
    setSelectedTable(e.target.value);
  };

  const handleRunProfiling = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/data-profiling/profile/${selectedTable}/run`, {
        method: 'POST',
      });
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Select value={selectedTable} onChange={handleTableChange}>
        <option value="">Select a table</option>
        {tables.map((table) => (
          <option key={table} value={table}>
            {table}
          </option>
        ))}
      </Select>
      <Button onClick={handleRunProfiling} disabled={!selectedTable || loading}>
        {loading ? 'Running...' : 'Run Profiling'}
      </Button>
      {error && <p>Error: {error.message}</p>}
      {results && (
        <Table>
          <thead>
            <tr>
              <Th>Column</Th>
              <Th>Nulls</Th>
              <Th>Duplicates</Th>
              <Th>Stats</Th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(results).map(([column, data]) => (
              <tr key={column}>
                <Td>{column}</Td>
                <Td>{data.nulls}</Td>
                <Td>{data.duplicates}</Td>
                <Td>{JSON.stringify(data.stats)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
};

export default DataProfiling;

