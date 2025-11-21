# PROBEAT STUDIO 🎵

An AI-powered music production platform that combines conversational AI with professional step sequencing. Create piano compositions through natural language conversations with Google Gemini 2.5 Pro, then fine-tune them in a full-featured digital audio workstation.

## 🌟 What is PROBEAT Studio?

PROBEAT Studio is a comprehensive music creation platform featuring:

- **🤖 Conversational AI Music Generation**: Chat with an intelligent AI agent powered by Google Gemini 2.5 Pro to create piano compositions
- **🎹 Professional Step Sequencer**: 88-key piano roll with drag-and-drop editing and real-time audio synthesis
- **🔊 High-Quality Audio Engine**: Tone.js-powered synthesis with professional effects processing
- **💾 Preset Management**: Save, load, and share your musical creations
- **☁️ Cloud Infrastructure**: Scalable backend services with Google Cloud Platform integration

## 🏗️ Architecture Overview

PROBEAT Studio consists of three interconnected services:

### Frontend (React + TypeScript)
- **Location**: `Googlehackathon FE/`
- **Technology**: React 19.2.0, TypeScript, Vite, Tailwind CSS, Tone.js
- **Purpose**: User interface for music creation and editing
- **Port**: 5173 (development)

### Express API Gateway (Node.js)
- **Location**: `Googlehackathon BE/express-service/`
- **Technology**: Node.js, Express.js, Firebase Admin SDK
- **Purpose**: REST API gateway, data persistence, AI service proxy
- **Port**: 3000

### FastAPI AI Service (Python)
- **Location**: `Googlehackathon BE/fastapi-service/`
- **Technology**: Python 3.11+, FastAPI, Google ADK, Gemini 2.5 Pro
- **Purpose**: AI agent management, conversational music generation
- **Port**: 8000

### Service Communication Flow
```
User Request → React Frontend (5173) → Express Gateway (3000) → FastAPI AI Service (8000)
                                                                 ↓
Google Gemini 2.5 Pro ← FastAPI AI Service ← Express Gateway ← React Frontend
                                                                 ↓
Firestore Database ← Express Gateway ← React Frontend
```

## 🎵 Key Features

### AI-Powered Music Creation
- Natural language music composition through chat interface
- Google Gemini 2.5 Pro integration for intelligent music generation
- Music theory research using Google Search API
- Conversational refinement and iteration

### Professional Audio Workstation
- Full 88-key piano range (A0 to C8)
- Step sequencer with 16th note resolution
- Real-time audio synthesis with Tone.js
- Professional effects: reverb, delay, distortion, filtering
- Per-track volume, panning, and audio parameters

### Data Management & Sharing
- Preset saving and loading
- Public beat sharing through Firestore
- Cross-session continuity
- Export/import capabilities

### Developer-Friendly Architecture
- RESTful API design
- Comprehensive TypeScript interfaces
- Modular component architecture
- Scalable microservices design

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0** - UI framework with hooks and concurrent features
- **TypeScript** - Type-safe JavaScript development
- **Vite 7.2.2** - Fast build tool and development server
- **Tailwind CSS 4.x** - Utility-first CSS framework
- **Tone.js 15.1.22** - Professional audio synthesis and effects
- **Axios 1.13.2** - HTTP client for API communication
- **@hello-pangea/dnd 18.0.1** - Drag and drop functionality

### Express API Gateway
- **Node.js 18+** - JavaScript runtime
- **Express.js 4.18.2** - Web application framework
- **Firebase Admin SDK 11.11.0** - Google Cloud integration
- **Axios 1.13.2** - HTTP client for service communication
- **CORS 2.8.5** - Cross-origin resource sharing
- **dotenv 16.3.1** - Environment variable management

### FastAPI AI Service
- **Python 3.11+** - High-performance Python runtime
- **FastAPI** - Modern Python web framework
- **Google ADK** - Agent Development Kit for Gemini integration
- **Gemini 2.5 Pro** - Advanced AI language model
- **Google Search API** - Research and music theory lookup
- **Uvicorn** - ASGI server for high-performance async operations

### Infrastructure & Cloud
- **Google Cloud Platform** - Cloud infrastructure provider
- **Google Cloud Firestore** - NoSQL document database
- **Google Cloud Vertex AI** - AI and machine learning platform
- **Google Cloud Run** - Containerized deployment platform

## 🚀 Getting Started

### Prerequisites

Before running PROBEAT Studio, ensure you have:

- **Node.js 18+** and npm/yarn (for frontend and Express service)
- **Python 3.11+** and pip (for FastAPI service)
- **Google Cloud Platform account** with billing enabled
- **Modern web browser** with Web Audio API support (Chrome 88+, Firefox 85+, Safari 14+, Edge 88+)

### Google Cloud Setup

1. **Create a Google Cloud Project**
   ```bash
   gcloud projects create your-project-id
   gcloud config set project your-project-id
   ```

2. **Enable Required APIs**
   ```bash
   # Enable Firestore API
   gcloud services enable firestore.googleapis.com

   # Enable Vertex AI API for Gemini
   gcloud services enable aiplatform.googleapis.com

   # Enable Custom Search API (for music research)
   gcloud services enable customsearch.googleapis.com
   ```

3. **Create Service Accounts**

   **For Express Service (Firestore + API Gateway):**
   ```bash
   gcloud iam service-accounts create probeat-express-service \
     --description="Service account for PROBEAT Express API" \
     --display-name="PROBEAT Express Service Account"

   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-express-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/datastore.user"
   ```

   **For FastAPI AI Service (Gemini + Search):**
   ```bash
   gcloud iam service-accounts create probeat-ai-service \
     --description="Service account for PROBEAT AI Service" \
     --display-name="PROBEAT AI Service Account"

   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-ai-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-ai-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/cloudsearch.serviceAgent"
   ```

4. **Generate Service Account Keys**
   ```bash
   # For Express service
   gcloud iam service-accounts keys create Googlehackathon\ BE/express-service/service-account-key.json \
     --iam-account=probeat-express-service@your-project-id.iam.gserviceaccount.com

   # For FastAPI service
   gcloud iam service-accounts keys create Googlehackathon\ BE/fastapi-service/service-account-key.json \
     --iam-account=probeat-ai-service@your-project-id.iam.gserviceaccount.com
   ```

## 📦 Installation

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd Googlehackathon
```

### 2. Frontend Setup
```bash
cd "Googlehackathon FE"

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
# API Configuration
VITE_API_URL=http://localhost:3000/api
EOF
```

### 3. Express Service Setup
```bash
cd "../Googlehackathon BE/express-service"

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
# Server Configuration
PORT=3000

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id

# Service Account Key
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# AI Service Configuration
FASTAPI_URL=http://127.0.0.1:8000
EOF
```

### 4. FastAPI Service Setup
```bash
cd "../fastapi-service"

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# Linux/Mac:
source .venv/bin/activate

# Install Google ADK
pip install google-adk

# Install other dependencies
pip install -r requirements.txt

# Create environment file
cat > .env << EOF
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id

# Optional: Service Account Key
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# FastAPI Configuration
HOST=127.0.0.1
PORT=8000

# AI Agent Configuration
AGENT_MODEL=gemini-2.5-pro
AGENT_NAME=music_generation_agent
EOF
```

## 🏃 Running the Application

### Development Mode

1. **Start FastAPI AI Service** (Terminal 1)
   ```bash
   cd "Googlehackathon BE/fastapi-service"
   source .venv/bin/activate  # Linux/Mac
   # .venv\Scripts\activate   # Windows
   adk api_server
   ```
   Service will be available at: `http://localhost:8000`

2. **Start Express API Gateway** (Terminal 2)
   ```bash
   cd "Googlehackathon BE/express-service"
   npm run dev
   ```
   Service will be available at: `http://localhost:3000`

3. **Start React Frontend** (Terminal 3)
   ```bash
   cd "Googlehackathon FE"
   npm run dev
   ```
   Application will be available at: `http://localhost:5173`

### Production Mode

1. **FastAPI Service**
   ```bash
   cd "Googlehackathon BE/fastapi-service"
   source .venv/bin/activate
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. **Express Service**
   ```bash
   cd "Googlehackathon BE/express-service"
   npm start
   ```

3. **Frontend**
   ```bash
   cd "Googlehackathon FE"
   npm run build
   npm run preview
   ```

### Health Checks

- **Express Service**: `GET http://localhost:3000/health`
- **FastAPI Service**: `GET http://localhost:8000/docs` (API documentation)
- **Frontend**: `http://localhost:5173` (main application)

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:3000/api
```

#### Express Service (.env)
```env
# Server Configuration
PORT=3000

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id

# Service Account Key (optional for production)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# AI Service Configuration
FASTAPI_URL=http://127.0.0.1:8000
```

#### FastAPI Service (.env)
```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT=your-project-id

# Service Account Key (optional for development)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# FastAPI Configuration
HOST=127.0.0.1
PORT=8000

# AI Agent Configuration
AGENT_MODEL=gemini-2.5-pro
AGENT_NAME=music_generation_agent
```

### Audio Engine Configuration

The frontend uses Tone.js with the following default settings:
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 32-bit float
- **Latency**: Browser default (typically 128 samples)
- **Audio Context**: Initialized on first user interaction

### Firestore Configuration

**Collections:**
- `public_beats` - User-created presets accessible to all users
- `all_beats` - Legacy collection for general data storage

**Document Structure:**
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

## 📡 API Documentation

### Express API Gateway Endpoints

#### Preset Management
```http
GET    /api/presets              # Get all public presets
GET    /api/presets/current      # Get latest preset
POST   /api/presets              # Create new preset
DELETE /api/presets/:id          # Delete preset by ID
```

#### AI Chat Integration
```http
POST   /api/llm                  # Send message to AI agent
POST   /api/create-session       # Initialize chat session
```

#### Generic Data Operations
```http
POST   /api/save                 # Save arbitrary data to Firestore
GET    /api/data                 # Retrieve all saved data
```

### FastAPI AI Service Endpoints

#### Core Agent Endpoints
```http
POST   /run                      # Execute agent with user message
GET    /apps/{app_name}          # List available apps
POST   /apps/{app_name}/users/{user_id}/sessions/{session_id}  # Create session
```

### Request/Response Formats

#### AI Chat Request
```json
{
  "appName": "multi_tool_agent",
  "userId": "user_1234567890_abc123",
  "sessionId": "session_1234567890_def456",
  "newMessage": {
    "role": "user",
    "parts": [
      {
        "text": "Create a happy piano melody in C major"
      }
    ]
  }
}
```

#### AI Response Format
```json
{
  "response": [
    {
      "content": {
        "parts": [
          {
            "text": "I'll create a cheerful piano melody for you! Here's a C major composition..."
          }
        ]
      }
    }
  ],
  "generatedJson": {
    "id": "unique-beat-id",
    "name": "Happy Piano Melody",
    "description": "A cheerful C major piano composition",
    "bpm": 120,
    "stepCount": 64,
    "tracks": [...]
  },
  "hasGeneratedJson": true
}
```

## 🎛️ User Interface Guide

### Main Components

#### Control Panel
- **Transport Controls**: Play/pause with visual feedback
- **BPM Control**: Tempo adjustment (60-200 BPM)
- **Master Effects**: Reverb and delay controls
- **Quick Actions**: Randomize pattern, clear grid

#### Sequencer Grid
- **88-Key Piano Range**: Full range from A0 to C8
- **Step Sequencing**: Visual grid with 16th note resolution
- **Octave Filtering**: Show/hide specific octaves
- **Drag & Drop**: Mouse-based note painting

#### Track Settings
- **ADSR Envelope**: Attack, decay, sustain, release controls
- **Filter Controls**: Cutoff frequency and resonance
- **Distortion**: Wave shaping effects
- **Per-Track Volume**: Individual level control (-60dB to +6dB)

#### AI Chat Interface
- **Conversational AI**: Natural language music creation
- **Real-time Responses**: Streaming chat with Gemini AI
- **Preset Generation**: Automatic beat creation from conversations

### Keyboard Shortcuts
- **Space**: Play/pause transport
- **Enter**: Send chat message (when focused)
- **Mouse Drag**: Paint notes on sequencer grid

## 🔊 Audio Features

### Synthesis Engine
- **PolySynth**: Single shared synthesizer for all piano notes
- **Triangle Oscillator**: Warm, rich piano tone
- **Envelope Shaping**: ADSR parameters per note

### Effects Processing
- **Master Reverb**: Hall/room simulation (0-100% wet)
- **Master Delay**: Echo effects with feedback control
- **Limiter**: Prevents audio clipping and distortion
- **Per-Track Volume**: Individual level control

### Performance Optimization
- **Lazy Loading**: Audio context initialized on user interaction
- **Efficient Rendering**: Memoized components prevent unnecessary re-renders
- **Web Audio API**: Hardware-accelerated audio processing

## 🧪 Development Workflow

### Local Development Setup
1. Configure all environment variables
2. Start FastAPI service and verify it's responding
3. Start Express service and test Firestore connectivity
4. Start React frontend and verify API communication
5. Test end-to-end functionality: chat → AI generation → sequencer playback

### Testing Strategy

#### API Testing
```bash
# Test Express service
curl -X GET http://localhost:3000/api/presets

# Test FastAPI service
curl -X POST http://localhost:8000/run \
  -H "Content-Type: application/json" \
  -d '{"appName": "multi_tool_agent", "userId": "test", "sessionId": "test", "newMessage": {"role": "user", "parts": [{"text": "Create a C major scale"}]}}'
```

#### Code Quality
- **Frontend**: TypeScript strict mode, ESLint, Prettier
- **Express**: ESLint with Node.js rules
- **FastAPI**: PEP 8, type hints, comprehensive docstrings

### Debugging

#### Common Issues

**Audio Not Playing**
- Ensure browser allows autoplay
- Check Web Audio API support
- Verify Tone.js is properly initialized

**API Connection Failed**
- Check service startup order (FastAPI → Express → Frontend)
- Verify environment variables
- Confirm port availability

**Firestore Connection Issues**
- Validate service account key permissions
- Check GCP project configuration
- Verify Firestore API is enabled

**AI Service Unavailable**
- Confirm FastAPI service is running on port 8000
- Check Google Cloud authentication
- Verify API quotas and limits

## 🚀 Deployment

### Production Considerations

#### Security
- Use HTTPS in production
- Implement proper authentication and authorization
- Set up API key management for external services
- Configure CORS policies appropriately

#### Performance
- Implement caching for frequently accessed data
- Use CDN for static assets
- Optimize bundle sizes
- Set up monitoring and alerting

#### Scalability
- Horizontal scaling for API services
- Database connection pooling
- Session state management
- Load balancing configuration

### Docker Deployment

#### Express Service
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### FastAPI Service
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Frontend
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Cloud Deployment Options

#### Google Cloud Platform
- **Cloud Run**: Containerized deployment for all services
- **App Engine**: Node.js and Python runtimes
- **Kubernetes Engine**: Full orchestration control

#### Other Platforms
- **AWS**: Elastic Beanstalk, ECS, Lambda
- **Azure**: App Service, Container Instances
- **Heroku**: Git-based deployment

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **API Response Times**: Target <200ms for all endpoints
- **AI Generation Success Rate**: Valid JSON output percentage
- **User Engagement**: Session duration, feature usage
- **Error Rates**: Service availability and reliability

### Logging Configuration
- **Express Service**: Console logging with request/response details
- **FastAPI Service**: Structured logging with Python logging module
- **Frontend**: Client-side error tracking and analytics

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch from `main`
3. Set up all three services locally
4. Make your changes with comprehensive testing
5. Submit a pull request with detailed description

### Code Standards
- **Frontend**: Follow React and TypeScript best practices
- **Express**: Use async/await patterns, proper error handling
- **FastAPI**: Follow PEP 8, include type hints and docstrings
- **General**: Write comprehensive tests, update documentation

### Pull Request Process
1. Ensure all services start and communicate properly
2. Test end-to-end functionality
3. Update relevant documentation
4. Add appropriate tests
5. Request review from maintainers

## 📄 License

This project is licensed under the MIT License - see the individual service README files for details.

## 📞 Support & Documentation

### Getting Help
- **Issues**: Create GitHub issues for bugs and feature requests
- **Discussions**: Use GitHub Discussions for questions and community support
- **Documentation**: Check individual service READMEs for detailed technical docs

### Service-Specific Documentation
- **Frontend**: `Googlehackathon FE/README.md`
- **Express Service**: `Googlehackathon BE/express-service/README.md`
- **FastAPI Service**: `Googlehackathon BE/fastapi-service/README.md`

### Troubleshooting Resources
- Google Cloud Platform documentation
- Tone.js audio framework documentation
- FastAPI and Express.js framework documentation
- React and TypeScript documentation

---

**Done with love and dedication by Reddy Durgeshwant** ❤️

*PROBEAT Studio - Where AI meets musical creativity*
