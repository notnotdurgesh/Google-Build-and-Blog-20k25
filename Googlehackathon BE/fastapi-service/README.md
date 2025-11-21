# PROBEAT STUDIO - FastAPI AI Service

Python FastAPI service providing AI-powered music generation using Google Gemini 2.5 Pro and ADK framework. Handles conversational music creation and intelligent beat generation.

## 🎯 Purpose

The FastAPI AI service is the intelligent core of PROBEAT Studio:

- **AI Agent Management**: Hosts Gemini 2.5 Pro agents for music creation
- **Conversational Interface**: Natural language processing for music requests
- **Music Generation**: Creates piano compositions in JSON format compatible with the frontend
- **Search Integration**: Leverages Google Search for music theory research
- **Session Management**: Maintains conversation context across interactions

## 🏗️ Architecture

### Technology Stack
- **Framework**: FastAPI (Python web framework)
- **AI Engine**: Google ADK (Agent Development Kit)
- **Language Model**: Gemini 2.5 Pro
- **Search Tools**: Google Search API integration
- **ASGI Server**: Uvicorn (high-performance async server)
- **Environment**: Python 3.11+ with virtual environment

### Service Dependencies
- **Frontend**: React application (via Express proxy)
- **Database**: No direct database access (uses Express service)
- **External APIs**: Google Gemini API, Google Search API

### Agent Architecture
```
User Request
    ↓
Express API Gateway
    ↓
FastAPI /run Endpoint
    ↓
Google ADK Agent
    ├── Gemini 2.5 Pro LLM
    ├── Google Search Tool
    └── Conversation Context
    ↓
Music JSON Generation
    ↓
Return to Frontend
```

## 🚀 Getting Started

### Prerequisites
- Python 3.11 or higher
- pip (Python package manager)
- Google Cloud Platform account with Gemini API access
- Virtual environment support (venv)

### Installation

1. **Navigate to service directory**
   ```bash
   cd Googlehackathon\ BE\fastapi-service
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv .venv

   # Activate virtual environment
   # Windows:
   .venv\Scripts\activate
   # Linux/Mac:
   source .venv/bin/activate
   ```

3. **Install Google ADK**
   ```bash
   pip install google-adk
   ```

4. **Install Additional Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Environment Configuration**

   Create a `.env` file in the service root:
   ```env
   # Google Cloud Configuration
   GOOGLE_CLOUD_PROJECT=your-project-id

   # Optional: Service Account Key
   # GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

   # FastAPI Configuration
   HOST=127.0.0.1
   PORT=8000

   # AI Agent Configuration
   AGENT_MODEL=gemini-2.5-pro
   AGENT_NAME=music_generation_agent
   ```

5. **Google Cloud Authentication**

   **Option A: Service Account Key File (Recommended for Production)**
   ```bash
   # Create a service account for AI services
   gcloud iam service-accounts create probeat-ai-service \
     --description="Service account for PROBEAT AI Service" \
     --display-name="PROBEAT AI Service Account"

   # Grant necessary permissions for Vertex AI and Gemini
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-ai-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   # Grant permissions for Google Search (if using search tools)
   gcloud projects add-iam-policy-binding your-project-id \
     --member="serviceAccount:probeat-ai-service@your-project-id.iam.gserviceaccount.com" \
     --role="roles/cloudsearch.serviceAgent"

   # Generate and download the key
   gcloud iam service-accounts keys create service-account-key.json \
     --iam-account=probeat-ai-service@your-project-id.iam.gserviceaccount.com

   # Set environment variable
   export GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
   ```

   **Option B: Application Default Credentials (Development Only)**
   ```bash
   gcloud auth application-default login
   gcloud config set project your-project-id
   ```

   **Enable Required APIs**
   ```bash
   # Enable Vertex AI API for Gemini
   gcloud services enable aiplatform.googleapis.com

   # Enable Custom Search API (if using search tools)
   gcloud services enable customsearch.googleapis.com
   ```

### Testing Setup

Verify the installation:
```bash
# Check Python version
python --version

# Check FastAPI installation
python -c "import fastapi; print('FastAPI available')"

# Check Google ADK
python -c "import google.adk; print('Google ADK available')"
```

## 🏃 Running the Service

### Development Mode
```bash
# Ensure virtual environment is activated
# Then run:
adk api_server
```

### Service Health
- **Port**: 8000 (configurable via PORT environment variable)
- **API Documentation**: `https://google.github.io/adk-docs/get-started/quickstart/#run-your-agent` (Official)

## 📡 API Endpoints

### Core Agent Endpoints
```http
POST   /run                    # Execute agent with user message
GET    /apps/{app_name}        # List available apps
POST   /apps/{app_name}/users/{user_id}/sessions/{session_id}  # Create session
```

### Request/Response Format

#### Agent Execution Request
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

#### Agent Response Format
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
    "tracks": [
      {
        "id": "piano-C4",
        "name": "C4",
        "type": "piano",
        "steps": [true, false, false, false, ...],
        "mute": false,
        "solo": false,
        "volume": -5,
        "pan": 0,
        "settings": {
          "pitch": 0,
          "decay": 0.5,
          "attack": 0.01,
          "distortion": 0,
          "sustain": 0.3,
          "release": 0.8,
          "cutoff": 20000,
          "resonance": 1
        },
        "hidden": false
      }
    ]
  },
  "hasGeneratedJson": true
}
```

## 🤖 AI Agent Configuration

### Agent Definition

The music generation agent is defined in `multi_tool_agent/agent.py`:

```python
root_agent = Agent(
    name="music_generation_agent",
    model="gemini-2.5-pro",
    description="Conversational AI for piano composition generation",
    instruction=COMPREHENSIVE_MUSIC_INSTRUCTION,
    tools=[google_search]
)
```

### Music Generation Prompt

The agent is programmed with detailed music theory knowledge:

- **Piano Range**: Full 88-key range (A0 to C8)
- **MIDI Mapping**: C4 = 60 (reference point)
- **Step Sequencing**: Boolean arrays for 16th note resolution
- **Audio Parameters**: ADSR envelopes, filter settings, effects
- **Composition Rules**: Valid JSON structure for frontend compatibility

### Tool Integration

#### Google Search Tool
```python
google_search = Tool(
    name="google_search",
    description="Search for music theory, chord progressions, melodies",
    parameters={
        "query": "music-related search terms",
        "num_results": "number of results (1-10)"
    }
)
```

Used for:
- Song structure research
- Chord progression analysis
- Melody inspiration
- Music theory validation

## 🔧 Configuration Details

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | - | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Service account key path | - | No* |
| `HOST` | Server host | `127.0.0.1` | No |
| `PORT` | Server port | `8000` | No |
| `AGENT_MODEL` | Gemini model version | `gemini-2.5-pro` | No |
| `AGENT_NAME` | Agent identifier | `music_generation_agent` | No |

*Required if not using Application Default Credentials

### Agent Parameters

#### Model Configuration
- **Temperature**: 0.7 (creative but consistent)
- **Max Tokens**: 4096 (sufficient for JSON output)
- **Safety Settings**: Content filtering enabled

#### Behavioral Settings
- **Conversational**: Asks clarifying questions
- **Iterative**: Supports refinement requests
- **Educational**: Explains music theory concepts
- **Helpful**: Provides composition guidance

## 🔗 Service Integration

### Express Service Communication

The FastAPI service is called through the Express gateway:

```javascript
// Express proxy call
const response = await axios.post(`${FASTAPI_URL}/run`, {
  appName: "multi_tool_agent",
  userId: userId,
  sessionId: sessionId,
  newMessage: {
    role: "user",
    parts: [{ text: userMessage }]
  }
});
```

### Response Processing

The Express service processes AI responses:

```javascript
// Extract JSON from Gemini response
function extractGeneratedJson(responseData) {
  // Parse markdown code blocks
  // Extract JSON from response parts
  // Return structured music data
}
```

### Error Handling

Comprehensive error handling for:
- Invalid JSON generation
- API rate limits
- Network connectivity issues
- Authentication failures

## 🎵 Music Generation Logic

### Composition Algorithm

1. **User Analysis**: Parse natural language request
2. **Style Determination**: Identify genre, mood, tempo preferences
3. **Research Phase**: Search for similar compositions if needed
4. **Structure Planning**: Determine BPM, step count, key signature
5. **Melody Generation**: Create main musical ideas
6. **Harmony Creation**: Add chord progressions and accompaniment
7. **Rhythm Design**: Implement timing and note durations
8. **Parameter Setting**: Configure audio synthesis parameters
9. **JSON Formatting**: Structure data for frontend consumption

### Quality Assurance

- **Format Validation**: Ensures JSON matches Track interface
- **Range Checking**: Validates parameter values and note ranges
- **Logic Verification**: Checks boolean array lengths and patterns
- **Completeness**: Verifies all required fields are present

## 🧪 Development Workflow

### Local Testing

1. **Start the service**
   ```bash
   uvicorn main:app --reload
   ```

2. **Test with curl**
   ```bash
   curl -X POST http://localhost:8000/run \
     -H "Content-Type: application/json" \
     -d '{
       "appName": "multi_tool_agent",
       "userId": "test_user",
       "sessionId": "test_session",
       "newMessage": {
         "role": "user",
         "parts": [{"text": "Create a simple C major scale"}]
       }
     }'
   ```

3. **Check API documentation**
   - Visit `http://localhost:8000/docs` for interactive API docs
   - Test endpoints directly from the browser

### Debugging Tips

**Agent Not Responding**
- Check Google Cloud authentication
- Verify API quotas and limits
- Review agent logs for errors

**Invalid JSON Output**
- Examine the raw agent response
- Check for markdown formatting issues
- Validate against Track interface requirements

**Search Tool Issues**
- Confirm Google Search API access
- Check query formatting
- Review search result parsing

## 🚀 Deployment

### Production Considerations

#### Performance Optimization
- Use multiple workers for concurrent requests
- Implement request caching for repeated queries
- Monitor API usage and implement rate limiting

#### Security Measures
- Use HTTPS in production
- Implement API key authentication
- Set up proper CORS policies
- Monitor for abuse and implement safeguards

#### Scalability
- Horizontal scaling with load balancer
- Session state management for user context
- Database integration for conversation history

### Docker Deployment
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Cloud Deployment Options
- **Google Cloud Run**: Containerized deployment
- **Google App Engine**: Python runtime
- **AWS Elastic Beanstalk**: Python platform
- **Heroku**: Git-based deployment with Python buildpack

## 📊 Monitoring & Analytics

### Key Metrics to Track
- **Response Time**: AI generation latency
- **Success Rate**: Valid JSON output percentage
- **User Satisfaction**: Conversation quality metrics
- **API Usage**: Google Cloud service consumption

### Logging Configuration
```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('ai_service.log'),
        logging.StreamHandler()
    ]
)
```

## 🐛 Troubleshooting

### Common Issues

**Authentication Failed**
```
Error: Could not load the default credentials
```
- Run `gcloud auth application-default login`
- Verify project ID in environment variables
- Check service account key permissions

**Agent Creation Failed**
```
Error: Agent model not available
```
- Verify Gemini API is enabled in GCP
- Check model name spelling
- Confirm API quotas are not exceeded

**Invalid Response Format**
```
Error: Could not parse JSON from response
```
- Check agent prompt formatting
- Verify markdown code block parsing
- Review Track interface requirements

**Search Tool Not Working**
```
Error: Search API access denied
```
- Enable Custom Search API in GCP
- Configure search engine ID
- Check API key permissions

## 🤝 Contributing

### Code Standards
- Follow PEP 8 style guidelines
- Add type hints for function parameters
- Write comprehensive docstrings
- Include unit tests for new features

### Agent Development
- Test prompts thoroughly before deployment
- Document behavioral changes
- Maintain backward compatibility
- Update response format specifications

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For technical support:
- Review Google ADK documentation
- Check Gemini API documentation
- Test with provided curl examples
- Create issues for bugs or improvements

## 🔗 Related Documentation

- [Google ADK Documentation](https://google.github.io/adk-docs/)
- [Gemini API Guide](https://ai.google.dev/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [PROBEAT Studio Frontend Docs](../FE/README.md)

---

Done with love and frustration 😅 by Reddy Durgeshwant
