# PROBEAT STUDIO - Express API Gateway

Node.js Express service serving as the API gateway for PROBEAT Studio. Handles preset management, AI chat proxying, and Google Firestore integration.

## 🎯 Purpose

The Express service acts as a middleware layer between the frontend and backend services:

- **API Gateway**: Unified REST API for frontend communication
- **Data Persistence**: CRUD operations for music presets in Firestore
- **AI Proxy**: Routes chat requests to the FastAPI AI service
- **Authentication**: Manages Google Cloud service account credentials
- **CORS Handling**: Cross-origin request management for web clients

## 🏗️ Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18.2
- **Database**: Google Firestore (Firebase Admin SDK 11.11.0)
- **HTTP Client**: Axios 1.13.2
- **Security**: CORS 2.8.5, dotenv 16.3.1
- **Development**: Nodemon 3.0.1

### Service Dependencies
- **Frontend**: React application (port 5173)
- **AI Service**: FastAPI service (port 8000)
- **Database**: Google Cloud Firestore

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Google Cloud Platform account with Firestore enabled
- Service account key with Firestore permissions

### Installation

1. **Navigate to service directory**
   ```bash
   cd Googlehackathon\ BE\express-service
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**

   Run the setup script to configure environment variables:
   ```bash
   npm run setup
   # or
   node setup-env.js
   ```

   This will create a `.env` file with required variables.

4. **Manual Environment Configuration**

   Create a `.env` file in the service root:
   ```env
   # Server Configuration
   PORT=3000

   # Google Cloud Configuration
   GOOGLE_CLOUD_PROJECT=your-project-id

   # Service Account Key (if using key file)
   GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

   # AI Service Configuration
   FASTAPI_URL=http://127.0.0.1:8000
   ```

5. **Google Cloud Setup**

   **Option A: Service Account Key File (Recommended for Production)**
   ```bash
   # Create a service account
   gcloud iam service-accounts create probeat-express-service \
     --description="Service account for PROBEAT Express API" \
     --display-name="PROBEAT Express Service Account"

   # Grant necessary permissions for Firestore
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-express-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/datastore.user"

   # Generate and download the key
   gcloud iam service-accounts keys create service-account-key.json \
     --iam-account=probeat-express-service@your-project-id.iam.gserviceaccount.com

   # The key file will be created in your current directory
   # Move it to the express service directory if needed
   ```

   **Option B: Application Default Credentials (Development Only)**
   ```bash
   gcloud auth application-default login
   gcloud config set project your-project-id
   ```

### Testing Setup

Run the test script to verify Firestore connectivity:
```bash
npm run test
# or
node test.js
```

This will:
- Initialize Firebase Admin SDK
- Test read/write operations to Firestore
- Verify collection access
- Clean up test data

## 🏃 Running the Service

### Development Mode
```bash
npm run dev
# or
yarn dev
```

Starts with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
# or
yarn start
```

Runs the service directly with Node.js.

### Service Health
- **Port**: 3000 (configurable via PORT environment variable)
- **Health Check**: GET `http://localhost:3000/health`
- **API Base URL**: `http://localhost:3000/api`

## 📡 API Endpoints

### Preset Management
```http
GET    /api/presets              # Get all public presets
GET    /api/presets/current      # Get latest preset
POST   /api/presets              # Create new preset
DELETE /api/presets/:id          # Delete preset by ID
```

### AI Chat Integration
```http
POST   /api/llm                  # Send message to AI agent
POST   /api/create-session       # Initialize chat session
```

### Generic Data Operations
```http
POST   /api/save                 # Save arbitrary data to Firestore
GET    /api/data                 # Retrieve all saved data
```

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `PORT` | Server port | `3000` | No |
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | - | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | - | No* |
| `FASTAPI_URL` | FastAPI service URL | `http://127.0.0.1:8000` | Yes |

*Required if not using Application Default Credentials

### Firestore Configuration

#### Collections
- **`public_beats`**: User-created presets accessible to all users
- **`all_beats`**: Legacy collection for general data storage

#### Document Structure (Presets)
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "bpm": "number",
  "stepCount": "number",
  "tracks": "Track[]",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## 🔗 Service Integration

### Frontend Communication

The Express service provides a unified API for the React frontend:

```javascript
// Frontend API calls
const API_BASE_URL = 'http://localhost:3000/api';

// Example: Fetch presets
fetch(`${API_BASE_URL}/presets`)
  .then(res => res.json())
  .then(presets => console.log(presets));
```

### AI Service Proxy

Routes AI chat requests to the FastAPI service:

```javascript
// Chat message flow
POST /api/llm
  ↓
Proxy to FastAPI /run
  ↓
Gemini AI processing
  ↓
JSON response with generated music data
  ↑
Return to frontend
```

### Data Validation

Input validation for all endpoints:
- **Preset Creation**: Validates name, description, BPM, tracks array
- **Track Data**: Ensures proper boolean arrays and parameter ranges
- **AI Requests**: Validates message format and session data

## 🛡️ Security & Authentication

### CORS Configuration
```javascript
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
};
```

### Input Sanitization
- JSON parsing with error handling
- Parameter validation using custom middleware
- SQL injection prevention (NoSQL context)

### Rate Limiting (Recommended)
Consider implementing rate limiting for production:
```javascript
const rateLimit = require('express-rate-limit');
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

## 🔍 Monitoring & Debugging

### Logging
Console logging for key operations:
- Firebase initialization status
- API request/response details
- Error conditions with stack traces

### Health Checks
```javascript
// Basic health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    firestore: 'connected' // Add actual checks
  });
});
```

### Common Issues

**Firebase Connection Failed**
- Verify GOOGLE_CLOUD_PROJECT is set correctly
- Check service account key file permissions
- Ensure Firestore API is enabled in GCP

**CORS Errors**
- Confirm frontend URL in CORS configuration
- Check request headers and methods

**AI Service Unavailable**
- Verify FastAPI service is running on port 8000
- Check FASTAPI_URL environment variable
- Review network connectivity between services

## 🧪 Development Workflow

### Local Development Setup
1. Configure environment variables
2. Run test script to verify Firestore connection
3. Start service in development mode
4. Test API endpoints with frontend or tools like Postman

### Testing Strategy
```bash
# Run connectivity tests
npm run test

# API testing with curl
curl -X GET http://localhost:3000/api/presets

# Test with preset creation
curl -X POST http://localhost:3000/api/presets \
  -H "Content-Type: application/json" \
  -d @test-preset.json
```

## 🚀 Deployment

### Production Considerations
- Use environment-specific configuration files
- Implement proper logging and monitoring
- Set up health checks and auto-scaling
- Configure SSL/TLS certificates
- Use managed database instances

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### Cloud Deployment
- **Google Cloud Run**: Containerized deployment
- **Google App Engine**: Node.js runtime
- **AWS Elastic Beanstalk**: Node.js platform
- **Heroku**: Git-based deployment

## 📊 Performance Optimization

### Database Queries
- Use compound indexes for frequently queried fields
- Implement pagination for large result sets
- Cache frequently accessed data

### API Response Times
- Target: <200ms for API responses
- Optimize Firestore queries
- Use connection pooling for database access

## 🤝 Contributing

1. Follow the existing code structure and patterns
2. Add appropriate error handling and logging
3. Test new endpoints thoroughly
4. Update documentation for API changes
5. Ensure backward compatibility

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For technical support:
- Check the troubleshooting section
- Review GCP Firestore documentation
- Test with the provided test script
- Create issues for bugs or feature requests

---

Done with love and frustration 😅 by Reddy Durgeshwant
