# Dockerfile for the backend
FROM node:20.5.0

# Create the application directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (adjust as necessary)
EXPOSE 3000

# Add a health check to ensure the server is running
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application as a non-root user
RUN useradd -m appuser
USER appuser

# Start the application
CMD ["npm", "start"]
