FROM node:18-slim

WORKDIR /app
COPY package*.json ./
RUN npm install --production

# 1. Copy the key file into the container
COPY service-account-key.json ./service-account-key.json

COPY . .

# Cloud Run expects the app to listen on port 8080 (or the PORT env var)
ENV PORT=8080
ENV FASTAPI_URL=https://production-adk-agent-1068269597576.europe-west1.run.app

# 2. Tell Firebase Admin where to find the key
ENV GOOGLE_APPLICATION_CREDENTIALS="/app/service-account-key.json"

EXPOSE 8080

# Start command
CMD ["node", "index.js"]