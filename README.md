# ScreenShare V2 - Modern Remote Desktop Application

A production-ready remote screen sharing application built with modern technologies following enterprise architecture patterns.

## 🏗️ Architecture

**Based on the comprehensive architecture guide with proven tech stack:**

- **Signaling Server**: Node.js + NestJS + Socket.IO + MongoDB
- **Web Client**: React + TypeScript + WebRTC
- **Host Agent**: Tauri (Rust) + Native Screen Capture
- **Database**: MongoDB (flexible for real-time session data)
- **Cache**: Redis (for session state)
- **TURN/STUN**: coturn servers (production deployment)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Rust (for Tauri agent)
- MongoDB (local or cloud)
- Redis (optional for development)

### Development Setup

1. **Install dependencies:**
```bash
cd screenshare-v2
npm install
```

2. **Start all services:**
```bash
# Terminal 1: Start signaling server
npm run dev:signaling

# Terminal 2: Start web client
npm run dev:client

# Terminal 3: Start desktop agent
npm run dev:agent
```

3. **Access the application:**
- Web Client: http://localhost:3000
- Signaling Server: http://localhost:3001
- Desktop Agent: Native Tauri app

## 🎯 Features

### Core Features (Following Architecture Guide)

✅ **WebRTC P2P Connection**
- Direct peer-to-peer screen sharing
- TURN fallback for NAT traversal
- ICE candidate gathering

✅ **Real-time Signaling**
- Socket.IO based signaling server
- Session management
- Participant coordination

✅ **Screen Capture**
- Native Rust-based screen capture
- Hardware acceleration support
- Cross-platform compatibility

✅ **Security**
- JWT-based authentication
- DTLS + SRTP encryption
- Session-level permissions

### Advanced Features (Roadmap)

🔄 **Input Control**
- Remote mouse/keyboard input
- DataChannel-based events
- Rate limiting & validation

🔄 **Performance Optimization**
- Hardware encoding (H.264)
- Adaptive bitrate
- Dirty-rect updates

🔄 **Production Features**
- Multi-region TURN servers
- Session recording
- Audit logging
- RBAC permissions

## 📁 Project Structure

```
screenshare-v2/
├── apps/
│   ├── signaling/          # NestJS signaling server
│   │   ├── src/
│   │   │   ├── signaling/  # WebSocket gateway
│   │   │   ├── auth/       # JWT authentication
│   │   │   └── session/    # Session management
│   │   └── package.json
│   │
│   ├── client/             # React web client
│   │   ├── src/
│   │   │   ├── contexts/   # React contexts
│   │   │   ├── hooks/      # WebRTC hooks
│   │   │   ├── pages/      # UI pages
│   │   │   └── components/ # Reusable components
│   │   └── package.json
│   │
│   └── agent/              # Tauri desktop agent
│       ├── src-tauri/      # Rust backend
│       │   ├── src/
│       │   │   ├── screen_capture.rs
│       │   │   ├── webrtc_client.rs
│       │   │   └── signaling.rs
│       │   └── Cargo.toml
│       └── src/            # Frontend UI (optional)
│
└── packages/
    ├── shared/             # Shared types/utils
    └── ui/                 # Shared UI components
```

## 🔧 Development

### Running Components Individually

**Signaling Server:**
```bash
cd apps/signaling
npm run dev
# Runs on http://localhost:3001
```

**Web Client:**
```bash
cd apps/client
npm run dev
# Runs on http://localhost:3000
```

**Desktop Agent:**
```bash
cd apps/agent
npm run tauri dev
# Opens native Tauri window
```

### Environment Variables

Create `.env` files in each app:

**apps/signaling/.env:**
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017/screenshare
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

**apps/client/.env:**
```
REACT_APP_SIGNALING_URL=http://localhost:3001
```

## 🧪 Testing

### Manual Testing Flow

1. **Start all services** (signaling + client + agent)

2. **Host side (Desktop Agent):**
   - Open Tauri app
   - Click "Generate Session ID"
   - Click "Start Sharing"
   - Share session ID with client

3. **Client side (Web Browser):**
   - Open http://localhost:3000/viewer/SESSION_ID
   - Should connect and display host's screen

4. **Expected behavior:**
   - WebRTC connection established
   - Host's screen visible in browser
   - Real-time screen updates

### Debug Information

Both client and agent show connection status:
- 🟢 Connected / 🟡 Connecting / 🔴 Failed
- WebRTC connection state
- Signaling server status

## 🚀 Production Deployment

### Prerequisites

- Kubernetes cluster
- MongoDB Atlas or self-hosted
- Redis cluster
- TURN/STUN servers (coturn)
- Load balancer (NGINX)

### Deployment Steps

1. **Deploy signaling server** with auto-scaling
2. **Set up TURN servers** in multiple regions
3. **Configure MongoDB** with replica sets
4. **Deploy web client** to CDN
5. **Distribute desktop agent** with auto-updater

See `deployment/` folder for Kubernetes manifests.

## 📚 Architecture Details

This implementation follows the **Remote ScreenShare & Desktop Access Architecture Guide**:

- ✅ P2P WebRTC with TURN fallback
- ✅ Socket.IO signaling coordination
- ✅ Native screen capture (Rust/Tauri)
- ✅ JWT authentication & session management
- ✅ MongoDB for flexible session storage
- ✅ Scalable microservices architecture

### Session Flow

1. **Authentication**: Client gets JWT token
2. **Session Creation**: Host creates session ID
3. **Signaling**: Both connect to signaling server
4. **ICE Gathering**: STUN/TURN candidate discovery
5. **SDP Exchange**: WebRTC offer/answer via signaling
6. **P2P Connection**: Direct connection established
7. **Screen Streaming**: H.264 encoded frames over WebRTC
8. **Input Events**: Mouse/keyboard via DataChannel

## 🔒 Security

- **Encryption**: DTLS + SRTP (WebRTC standard)
- **Authentication**: JWT tokens with expiration
- **Authorization**: Session-level access control
- **Validation**: Input rate limiting & sanitization
- **Audit**: Session logging and monitoring

## 🎯 Performance

- **Hardware Acceleration**: NVENC, Quick Sync, VA-API
- **Adaptive Quality**: Dynamic bitrate based on network
- **Efficient Updates**: Only changed screen regions
- **Low Latency**: Direct P2P connection when possible

## 🛠️ Contributing

1. Follow the architecture guide patterns
2. Add tests for new features
3. Update documentation
4. Ensure security best practices

## 📄 License

MIT License - See LICENSE file for details