import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Modal, Form, Badge } from 'react-bootstrap';
import axios from 'axios';

const RulesPanel = ({ theme }) => {
  const [rules, setRules] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newRule, setNewRule] = useState({ name: '', severity: 'low' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/rules');
        setRules(response.data);
      } catch (err) {
        setError('Failed to fetch rules');
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, []);

  const handleAddRule = async () => {
    try {
      setLoading(true);
      const response = await axios.post('/api/rules', newRule);
      setRules([...rules, response.data]);
      setNewRule({ name: '', severity: 'low' });
      setShowModal(false);
    } catch (err) {
      setError('Failed to add rule');
    } finally {
      setLoading(false);
    }
  };

  const handleEditRule = async (id, updatedRule) => {
    try {
      setLoading(true);
      const response = await axios.put(`/api/rules/${id}`, updatedRule);
      setRules(rules.map(rule => (rule.id === id ? response.data : rule)));
    } catch (err) {
      setError('Failed to update rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (id) => {
    try {
      setLoading(true);
      await axios.delete(`/api/rules/${id}`);
      setRules(rules.filter(rule => rule.id !== id));
    } catch (err) {
      setError('Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteRule = async (id) => {
    try {
      setLoading(true);
      const response = await axios.post(`/api/rules/${id}/execute`);
      alert(`Rule ${id} executed: ${response.data}`);
    } catch (err) {
      setError('Failed to execute rule');
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setNewRule({ name: '', severity: 'low' });
  };

  const handleModalShow = () => setShowModal(true);

  const handleRuleChange = (e) => {
    setNewRule({ ...newRule, [e.target.name]: e.target.value });
  };

  const severityBadge = (severity) => {
    switch (severity) {
      case 'critical':
        return <Badge bg="danger">Critical</Badge>;
      case 'high':
        return <Badge bg="warning">High</Badge>;
      case 'medium':
        return <Badge bg="yellow">Medium</Badge>;
      case 'low':
        return <Badge bg="success">Low</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  const themeStyles = {
    backgroundColor: theme === 'dark' ? '#333' : '#fff',
    color: theme === 'dark' ? '#fff' : '#333',
  };

  return (
    <div style={themeStyles}>
      <Button variant="primary" onClick={handleModalShow}>
        Add New Rule
      </Button>
      <Modal show={showModal} onHide={handleModalClose}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Rule</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="name">
              <Form.Label>Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newRule.name}
                onChange={handleRuleChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="severity">
              <Form.Label>Severity</Form.Label>
              <Form.Select
                name="severity"
                value={newRule.severity}
                onChange={handleRuleChange}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleModalClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleAddRule}>
            Add Rule
          </Button>
        </Modal.Footer>
      </Modal>
      <ul>
        {rules.map(rule => (
          <li key={rule.id}>
            {rule.name} {severityBadge(rule.severity)}
            <Button variant="primary" onClick={() => handleExecuteRule(rule.id)}>
              Execute
            </Button>
            <Button variant="warning" onClick={() => handleEditRule(rule.id, { ...rule, name: 'Updated Name' })}>
              Edit
            </Button>
            <Button variant="danger" onClick={() => handleDeleteRule(rule.id)}>
              Delete
            </Button>
          </li>
        ))}
      </ul>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
    </div>
  );
};

RulesPanel.propTypes = {
  theme: PropTypes.string.isRequired,
};

export default RulesPanel;