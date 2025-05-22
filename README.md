
# WorldMeds - Global Medicine Price Index

WorldMeds is a comprehensive web application that tracks and visualizes medicine price variations across countries and regions. This tool helps users understand the financial impact of medicine prices globally and provides transparent data visualization to support informed decision-making by patients, healthcare providers, and policy makers.

## Project Overview

The WorldMeds application allows users to:

1. Compare medicine prices across different countries using an interactive map
2. Analyze the evolution of medicine prices over time through a specialized Medicine Price Index (MPI)
3. Visualize price differences between regions through intuitive color-coded interfaces
4. Search for specific medicines to see their price variations globally
5. Track inflation trends specific to the pharmaceutical sector

## Key Features

- **Interactive Global Map**: Visualize medicine price variations with color-coded indicators
- **Price Comparison**: Compare prices of essential medicines between multiple countries
- **Time-Based Analysis**: Track price changes over months and years
- **Specialized Medicine Price Index**: Monitor inflation specific to the pharmaceutical sector
- **Detailed Country Profiles**: Access in-depth medicine pricing data for each country
- **Search Functionality**: Find specific medicines and compare their prices globally

## Technology Stack

### Backend
- Node.js with Express
- MySQL database
- WebSocket for real-time updates
- RESTful API architecture

### Frontend
- React with TypeScript
- Tailwind CSS for styling
- Shadcn UI components
- React Simple Maps for geographic visualizations
- Recharts for data visualization

## Project Structure

The application is structured into three main components:

1. **Frontend**: React application for the user interface
2. **Backend**: Node.js API server for data processing and serving
3. **Database**: MySQL database for storing medicine and country data

All components are containerized using Docker for easy deployment and scaling.

## Getting Started

See the README files in the individual directories for specific setup instructions:

- [Frontend README](./frontend/README.md)
- [Backend README](./backend/README.md)

## Docker Deployment

This project uses Docker Compose to orchestrate the services. To start the application:

```bash
docker-compose up -d
```

This will launch:
- The frontend React application on port 3000
- The backend API server on port 3001
- MySQL database on port 3306

## Contributors

This project is maintained by [Your Organization/Name]. Contributions are welcome through pull requests or issues.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
