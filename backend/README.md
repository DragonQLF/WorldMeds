
# WorldMeds Backend

This directory contains the backend API server for the WorldMeds project - a global medicine price index visualization tool.

## Technology Stack

- Node.js
- Express.js
- MySQL
- WebSockets for real-time updates
- RESTful API architecture

## Project Structure

- `controllers`: Business logic for handling requests
- `middleware`: Request processing middleware (authentication, validation)
- `models`: Data models representing database entities
- `routes`: API route definitions
- `utils`: Utility functions for common operations
- `server.js`: Main application entry point
- `db.js`: Database connection and configuration
- `config.js`: Application configuration
- `websocket.js`: WebSocket server setup

## API Endpoints

The backend provides the following key API endpoints:

### Authentication
- `POST /api/login`: User login
- `POST /api/register`: User registration
- `POST /api/forgot-password`: Password reset request

### Countries
- `GET /api/countries`: List all countries with basic price data
- `GET /api/countries-average-prices`: Get average medicine prices for all countries
- `GET /api/country/:countryId/details`: Get detailed information about a specific country
- `GET /api/country/:countryId/medicines`: Get all medicines available in a specific country
- `GET /api/country/:countryId/top-medicines`: Get top 5 most purchased medicines in a country
- `GET /api/country/:countryId/summary`: Get summary statistics for a country

### Medicines
- `GET /api/global-average-medicine-price`: Get global average medicine price
- `GET /api/comparison/medicines`: Compare medicine prices between countries

### Search
- `GET /api/search/countries`: Search for countries by name
- `GET /api/search/medicines`: Search for medicines by name

### Date Filtering

Most endpoints support date filtering with the following query parameters:
- `date`: Specific date (YYYY-MM-DD)
- `start` & `end`: Date range
- `month`: Month (YYYY-MM)

### Admin
- `POST /api/admin/country`: Create a new country
- `PUT /api/admin/country/:id`: Update a country
- `POST /api/admin/medicine`: Create a new medicine
- `PUT /api/admin/medicine/:id`: Update a medicine
- `DELETE /api/admin/medicine/:id`: Delete a medicine

## Setting Up the Database

The backend uses a MySQL database. The schema is defined in `init.sql`, which will automatically initialize the database when running with Docker Compose.

## Environment Variables

The backend requires the following environment variables:

```
PORT=3001
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=worldmeds
JWT_SECRET=your_secret_key
ALLOWED_ORIGINS=http://localhost:3000,http://localhost
```

These can be set in a `.env` file or passed directly to the application.

## Development Setup

### Prerequisites

- Node.js 18+
- MySQL 8+

### Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create and configure the database:
   ```bash
   mysql -u root -p < init.sql
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. The API will be available at http://localhost:3001

## Docker Deployment

The backend is designed to run in a Docker container as part of the full application stack. See the root README for instructions on running the complete application with Docker Compose.

## Data Processing

The backend includes utilities for processing medicine price data:
- Currency conversion to USD
- Normalization of medicine prices
- Calculation of aggregated metrics
- Time-series data analysis

These utilities are primarily found in the `utils` directory.
