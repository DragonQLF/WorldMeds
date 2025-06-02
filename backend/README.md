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
- `POST /api/auth/signup`: Register a new user (Body: `firstName`, `lastName`, `email`, `password`)
- `POST /api/auth/login`: User login (Body: `email`, `password`)
- `POST /api/auth/forgot-password`: Request password reset (Body: `email`)
- `POST /api/auth/reset-password`: Reset password using token (Body: `token`, `newPassword`)
- `POST /api/auth/verify-email`: Verify user's email using token (Body: `token`)

### Countries
- `GET /api/countries`: List all countries with basic price data
- `GET /api/countries-average-prices`: Get average medicine prices for all countries
- `GET /api/country/:countryId/details`: Get detailed information about a specific country (Path: `countryId`)
- `GET /api/country/:countryId/medicines`: Get all medicines available in a specific country (Path: `countryId`)
- `GET /api/country/:countryId/top-medicines`: Get top 5 most purchased medicines in a country (Path: `countryId`)
- `GET /api/country/:countryId/summary`: Get summary statistics for a country (Path: `countryId`)

### Medicines
- `GET /api/global-average-medicine-price`: Get global average medicine price
- `GET /api/comparison/medicines`: Compare medicine prices between countries
- `GET /api/medicines`: Get all medicines with average price and country count

### Comparison
- `GET /api/comparison/available-months`: Get a list of months with available data
- `GET /api/comparison/countries`: Search for countries with available medicine data (supports filtering by medicine and date) (Query: `q`, `month`, `date`, `medicines`, `countries`)
- `GET /api/comparison/medicines`: Search for medicines with available data (supports filtering by country and date) (Query: `q`, `countries`, `medicines`, `month`, `date`, `start`, `end`)
- `GET /api/comparison/all-countries`: Get all countries with average price and total medicines (Query: `month`, `date`)
- `GET /api/comparison/all-medicines`: Get all medicines with average price and country count
- `GET /api/comparison/compare`: Get detailed comparison data for specified medicines and countries (Query: `medicines`, `countries`, `month`, `date`)

### Search
- `GET /api/search/countries`: Search for countries by name (Query: `q`)
- `GET /api/search/medicines`: Search for medicines by name (Query: `q`)

### Date Filtering

Most endpoints support date filtering with the following query parameters:
- `date`: Specific date (YYYY-MM-DD)
- `start` & `end`: Date range
- `month`: Month (YYYY-MM)

### Users (Protected Routes - require authentication)
- `GET /api/users/profile`: Get the authenticated user's profile
- `PUT /api/users/profile`: Update the authenticated user's profile (Body: `firstName`, `lastName`, `email`)
- `PUT /api/users/change-password`: Change the authenticated user's password (Body: `currentPassword`, `newPassword`)

### Admin (Protected Routes - require admin privileges)
- `GET /api/admin/stats`: Get dashboard statistics
- `GET /api/admin/users`: Get all users
- `POST /api/admin/users`: Create a new user (Body: `firstName`, `lastName`, `email`, `password`, `role`)
- `GET /api/admin/users/:id`: Get user by ID (Path: `id`)
- `PUT /api/admin/users/:id`: Update user by ID (Path: `id`, Body: `firstName`, `lastName`, `email`, `role`)
- `DELETE /api/admin/users/:id`: Delete user by ID (Path: `id`)
- `GET /api/admin/medicines`: Get all medicines
- `POST /api/admin/medicines`: Create a new medicine (Body: `name`, `dosage`)
- `GET /api/admin/medicines/:id`: Get medicine by ID (Path: `id`)
- `PUT /api/admin/medicines/:id`: Update medicine by ID (Path: `id`, Body: `name`, `dosage`)
- `DELETE /api/admin/medicines/:id`: Delete medicine by ID (Path: `id`)
- `GET /api/admin/medicines/:id/transactions`: Get transactions for a medicine (Path: `id`)
- `GET /api/admin/medicines/:id/countries`: Get countries where a medicine is available (Path: `id`)
- `GET /api/admin/countries`: Get all countries
- `POST /api/admin/countries`: Create a new country (Body: `name`, `currency`, `iso_code`)
- `GET /api/admin/countries/:id`: Get country by ID (Path: `id`)
- `PUT /api/admin/countries/:id`: Update country by ID (Path: `id`, Body: `name`, `currency`, `iso_code`)
- `DELETE /api/admin/countries/:id`: Delete country by ID (Path: `id`)
- `GET /api/admin/countries/:id/medicines`: Get medicines available in a country (Path: `id`)

## Setting Up the Database

The backend uses a MySQL database. The schema is defined in `init.sql`, which will automatically initialize the database when running with Docker Compose.

## Database Schema

The backend uses a MySQL database with the following main tables:

- `countries`: Stores information about countries, including currency and ISO code.
- `medicines`: Stores information about medicines, including name and dosage.
- `medicine_countries`: Stores price and purchase data for medicines in specific countries for a given month, linking to the `countries` and `medicines` tables.
- `users`: Stores user information, including authentication details and role.

The schema is defined in the `init.sql` file.

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
