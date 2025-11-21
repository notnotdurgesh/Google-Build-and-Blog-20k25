# PROBEAT STUDIO - Frontend

A modern, AI-powered music production platform built with React, TypeScript, and Tone.js. Create piano compositions through conversational AI and professional step sequencing.

## 🎵 Features

- **AI-Powered Music Generation**: Conversational interface with Google Gemini 2.5 Pro
- **Professional Step Sequencer**: 88-key piano roll with drag-and-drop editing
- **Real-time Audio Engine**: High-quality Tone.js synthesis with effects processing
- **Preset Management**: Save, load, and share music compositions
- **Responsive Design**: Works seamlessly across all devices

## 🏗️ Architecture

### Technology Stack
- **Framework**: React 19.2.0 with TypeScript
- **Build Tool**: Vite 7.2.2
- **Styling**: Tailwind CSS 4.x
- **Audio Engine**: Tone.js 15.1.22
- **HTTP Client**: Axios 1.13.2
- **Drag & Drop**: @hello-pangea/dnd 18.0.1

### Component Structure
```
src/
├── components/           # Reusable UI components
│   ├── ControlPanel.tsx  # Transport & master controls
│   ├── SequencerGrid.tsx # Main piano roll interface
│   ├── TrackSettings.tsx # Per-track audio parameters
│   ├── SaveModal.tsx     # Beat persistence dialog
│   └── ChatBox.tsx       # AI conversation interface
├── pages/               # Route-based pages
│   ├── HomePage.tsx     # Landing & preset browser
│   └── StudioPage.tsx   # Main DAW interface
├── hooks/               # Custom React hooks
│   └── useSequencer.ts  # Audio engine state management
├── services/            # External API integrations
│   ├── api.ts           # REST API client
│   └── chatService.ts   # AI chat management
└── lib/utils.ts         # Utility functions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Modern web browser with Web Audio API support

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Googlehackathon\ FE
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**

   Create a `.env` file in the root directory:
   ```env
   # API Configuration
   VITE_API_URL=http://localhost:3000/api

   # Optional: Custom port
   # PORT=5173
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   The application will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
# or
yarn build

# Preview production build
npm run preview
# or
yarn preview
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api` | Yes |

### Audio Engine Configuration

The application uses Tone.js for audio synthesis. Audio context is initialized on first user interaction to comply with browser autoplay policies.

### API Integration

The frontend communicates with the backend through RESTful APIs:
- **Preset Service**: CRUD operations for music presets
- **Chat Service**: AI conversation and music generation

## 🎛️ User Interface

### Main Components

#### Control Panel
- **Play/Pause**: Transport controls with visual feedback
- **BPM Control**: Tempo adjustment (60-200 BPM)
- **Master Effects**: Reverb and delay controls
- **Quick Actions**: Randomize pattern, clear grid

#### Sequencer Grid
- **88-Key Piano**: Full range from A0 to C8
- **Step Sequencing**: Visual grid with 16th note resolution
- **Octave Filtering**: Show/hide specific octaves
- **Drag & Drop**: Mouse-based note painting

#### Track Settings
- **Audio Parameters**: Attack, decay, sustain, release
- **Filter Controls**: Cutoff frequency and resonance
- **Distortion**: Wave shaping effects
- **Preset Management**: Save/load track configurations

#### AI Chat Interface
- **Conversational AI**: Natural language music creation
- **Real-time Responses**: Streaming chat with Gemini AI
- **Preset Generation**: Automatic beat creation from conversations

## 🔊 Audio Features

### Synthesis Engine
- **PolySynth**: Single shared synthesizer for all piano notes
- **Triangle Oscillator**: Warm, rich piano tone
- **Envelope Shaping**: ADSR parameters per note

### Effects Processing
- **Master Reverb**: Hall/room simulation (0-100% wet)
- **Master Delay**: Echo effects with feedback
- **Limiter**: Prevents audio clipping
- **Per-Track Volume**: Individual level control (-60dB to +6dB)

### Performance Optimization
- **Lazy Loading**: Audio context initialized on user interaction
- **Efficient Rendering**: Memoized components prevent unnecessary re-renders
- **Web Audio API**: Hardware-accelerated audio processing

## 🧪 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: Code linting with React rules
- **Prettier**: Code formatting (via IDE)

### Browser Support
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 🔗 API Integration

### Backend Communication

The frontend expects a REST API backend with these endpoints:

```javascript
// Preset Management
GET    /api/presets              // List public presets
GET    /api/presets/current      // Get latest preset
POST   /api/presets              // Create new preset
DELETE /api/presets/:id          // Delete preset

// AI Chat
POST   /api/llm                  // Send chat message
POST   /api/create-session       // Initialize chat session
```

### Data Models

#### Preset Structure
```typescript
interface Preset {
  id: string;
  name: string;
  description: string;
  bpm: number;
  stepCount: number;
  tracks: Track[];
}
```

#### Track Structure
```typescript
interface Track {
  id: string;
  name: string;
  type: 'piano';
  steps: boolean[];
  mute: boolean;
  solo: boolean;
  volume: number;
  pan: number;
  settings: TrackSettings;
  hidden: boolean;
}
```

## 📱 User Experience

### Workflow
1. **Discovery**: Browse presets and public beats on homepage
2. **AI Creation**: Use chat interface to generate custom beats
3. **Studio Editing**: Fine-tune compositions in the sequencer
4. **Persistence**: Save and share finished compositions
5. **Iteration**: Return to chat for refinements

### Keyboard Shortcuts
- **Space**: Play/pause transport
- **Enter**: Send chat message (when focused)
- **Mouse Drag**: Paint notes on sequencer grid

## 🐛 Troubleshooting

### Common Issues

**Audio Not Playing**
- Ensure browser allows autoplay
- Check Web Audio API support
- Try refreshing the page

**Chat Not Working**
- Verify backend services are running
- Check network connectivity
- Confirm API URLs in environment

**Performance Issues**
- Close other browser tabs
- Ensure stable internet connection
- Try refreshing the page

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the API documentation

---

Done with love and frustration 😅 by Reddy Durgeshwant
