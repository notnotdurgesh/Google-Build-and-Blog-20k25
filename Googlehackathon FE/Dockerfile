# Multi-stage build for React app
# Stage 1: Build the React application
FROM node:20-alpine as build

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built application from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cloud Run expects the app to listen on port 8080 (or the PORT env var)
# Nginx will be configured to listen on port 8080

# Expose the port
EXPOSE 8080

ENV VITE_API_URL=https://node-api-service-1068269597576.europe-west1.run.app
ENV VITE_FASTAPI_URL=https://production-adk-agent-1068269597576.europe-west1.run.app

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]



