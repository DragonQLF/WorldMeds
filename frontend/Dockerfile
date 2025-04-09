# Stage 1: Build
FROM node:23-alpine AS build
WORKDIR /app

# Copy dependency definitions
COPY package.json package-lock.json* ./

# Install all dependencies (ensure react-scripts is included)
RUN npm install

# Copy the rest of your application’s source code
COPY . .

# Build the app for production
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

# Copy built assets from the build stage to Nginx's public folder
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80 for the container
EXPOSE 80

# Start Nginx when the container is launched
CMD ["nginx", "-g", "daemon off;"]
