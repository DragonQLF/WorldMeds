
# WorldMeds Frontend

This directory contains the frontend application for the WorldMeds project - a global medicine price index visualization tool.

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI Component Library
- React Simple Maps for geographic visualizations
- Recharts for charts and graphs
- React Query for data fetching
- Vite for development and building

## Project Structure

- `src/components`: UI components organized by feature
  - `admin`: Admin-specific components
  - `auth`: Authentication-related components
  - `comparison`: Comparison view components
  - `layout`: Layout components (sidebar, header, etc.)
  - `map`: Interactive map components
  - `search`: Search functionality components
  - `ui`: Reusable UI components from Shadcn UI
- `src/contexts`: React context providers
- `src/hooks`: Custom React hooks
- `src/lib`: Utility functions and API client
- `src/pages`: Main page components
- `src/services`: Service layer for API communication

## Key Features

- **Interactive World Map**: Visualize medicine prices globally with color-coded indicators
- **Country Details**: In-depth medicine pricing data for each country
- **Time-Based Filtering**: View data for specific time periods
- **Price Comparison**: Compare medicine prices between countries
- **Search Functionality**: Find specific countries or medicines
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Mode**: User-selectable theme

## Environment Variables

The frontend requires the following environment variables:

```
VITE_API_URL=http://localhost:3001/api
VITE_CURRENCY_API_URL=https://latest.currency-api.pages.dev/v1/currencies/usd.json
```

These can be set in a `.env` file in the frontend directory.

## Development Setup

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Access the application at http://localhost:3000

## Building for Production

To create a production build:

```bash
npm run build
```

This will generate optimized files in the `dist` directory.

## Docker Deployment

The frontend is designed to run in a Docker container as part of the full application stack. See the root README for instructions on running the complete application with Docker Compose.

When running in Docker, the application is served by Nginx and properly configured to communicate with the backend API.

## Code Conventions

- Use TypeScript for type safety
- Follow React functional component patterns with hooks
- Use the Shadcn UI component library when possible
- Implement responsive design using Tailwind CSS
- Organize related files by feature area
