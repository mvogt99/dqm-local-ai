# Data Quality Management (DQM) Application

DQM is a comprehensive tool designed to enhance data quality by providing a suite of features for data profiling, quality rules management, AI-powered root cause analysis, and real-time monitoring.

## Features

- **Data Profiling**:
  - Null checks
  - Unique values
  - Distributions
- **Quality Rules Management**:
  - CRUD operations
  - Severity levels
- **AI-Powered Root Cause Analysis**:
  - Automated detection of data quality issues
- **Real-Time Monitoring**:
  - Continuous tracking of data quality metrics

## Architecture

The DQM application is built using the following technologies:

- **Backend**: FastAPI with SQLAlchemy for database interactions
- **Frontend**: React with Vite for a modern, fast development experience
- **Database**: PostgreSQL for robust data storage and retrieval
- **AI Integration**: Local AI for real-time analysis and root cause detection

## Setup Instructions

### Backend Setup

1. **Clone the repository**:
   ```sh
   git clone https://github.com/yourusername/dqm.git
   cd dqm/backend
   ```

2. **Install dependencies**:
   ```sh
   pip install -r requirements.txt
   ```

3. **Set environment variables**:
   Create a `.env` file in the `backend` directory and add the following:
   ```
   DATABASE_URL=postgresql://username:password@localhost/dbname
   SECRET_KEY=your_secret_key
   ```

4. **Run the application**:
   ```sh
   uvicorn main:app --reload
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```sh
   cd ../frontend
   ```

2. **Install dependencies**:
   ```sh
   npm install
   ```

3. **Start the development server**:
   ```sh
   npm run dev
   ```

## API Endpoints Documentation

### Data Profiling

- **Endpoint**: `/api/profile`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "table_name": "your_table_name",
    "database_name": "your_database_name"
  }
  ```
- **Response**:
  ```json
  {
    "null_checks": [...],
    "unique_values": [...],
    "distributions": [...]
  }
  ```

### Quality Rules Management

- **Endpoint**: `/api/rules`
- **Method**: `GET`
- **Response**:
  ```json
  [
    {
      "id": 1,
      "rule": "your_rule",
      "severity": "high"
    },
    ...
  ]
  ```

- **Endpoint**: `/api/rules`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "rule": "your_rule",
    "severity": "high"
  }
  ```
- **Response**:
  ```json
  {
    "id": 2,
    "rule": "your_rule",
    "severity": "high"
  }
  ```

- **Endpoint**: `/api/rules/{id}`
- **Method**: `PUT`
- **Request Body**:
  ```json
  {
    "rule": "updated_rule",
    "severity": "medium"
  }
  ```
- **Response**:
  ```json
  {
    "id": 2,
    "rule": "updated_rule",
    "severity": "medium"
  }
  ```

- **Endpoint**: `/api/rules/{id}`
- **Method**: `DELETE`
- **Response**:
  ```json
  {
    "message": "Rule deleted successfully"
  }
  ```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Make your changes and commit them (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
