<<<<<<< HEAD
FROM node:20.5.0 AS build
=======
# Use Node 20 Alpine as base image
FROM node:23-alpine AS builder
>>>>>>> 7c404fe8b7f255102553ea19c930376d3251dc8d

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all files
COPY . .

# Build the application
RUN npm run build

<<<<<<< HEAD
FROM nginx:1.25-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
=======
# Production stage
FROM nginx:alpine AS production

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config if needed
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
>>>>>>> 7c404fe8b7f255102553ea19c930376d3251dc8d
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]