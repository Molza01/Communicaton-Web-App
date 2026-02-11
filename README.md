# Real-Time Communication Web App

A complete real-time communication platform featuring multi-user video calling, screen sharing, collaborative whiteboard, encrypted chat, and file sharing.

## 🚀 Features

- **Multi-User Video Calling**: WebRTC-powered peer-to-peer video streaming
- **Screen Sharing**: Share your screen with all participants
- **Real-Time Whiteboard**: Collaborative drawing board synced via Firebase Firestore
- **Encrypted Chat**: AES-encrypted messaging stored in Firestore
- **File Sharing**: Upload and share files via Firebase Storage
- **Authentication**: Secure login/register with Firebase Auth + JWT tokens
- **Modern Dark UI**: Beautiful, responsive design with smooth animations

## 📋 Tech Stack

### Frontend
- HTML5
- CSS3 (Modern Dark Theme)
- Vanilla JavaScript
- Firebase SDK (Auth, Firestore, Storage)

### Backend
- Node.js
- Express.js
- Socket.io (WebRTC signaling)
- JWT (Authentication)
- bcrypt (Password hashing)
- CryptoJS (AES encryption)

## 📁 Project Structure

```
realtime-communication-app/
├── server/
│   ├── server.js                 # Main Express server with Socket.io
│   ├── routes/
│   │   └── token.js              # JWT token generation/verification routes
│   └── middleware/
│       └── verifyToken.js        # JWT verification middleware
├── public/
│   ├── index.html                # Login/Register page
│   ├── dashboard.html            # Create/Join room page
│   ├── room.html                 # Video call room page
│   ├── css/
│   │   └── style.css             # Modern dark theme styles
│   └── js/
│       ├── firebaseConfig.js     # Firebase initialization
│       ├── auth.js               # Authentication logic
│       ├── room.js               # WebRTC room management
│       ├── whiteboard.js         # Collaborative whiteboard
│       └── encryption.js         # AES encryption utilities
├── package.json
├── .env                          # Environment variables
└── README.md
```

## 🛠️ Setup Instructions

### 1. Clone or Download the Project

Navigate to the project directory:
```bash
cd realtime-communication-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project" or "Create a Project"
3. Enter a project name (e.g., "realtime-communication-app")
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 4. Enable Firebase Services

#### Enable Authentication:
1. In Firebase Console, go to **Build** → **Authentication**
2. Click "Get Started"
3. Click on "Email/Password" under "Sign-in method"
4. Enable "Email/Password"
5. Click "Save"

#### Enable Firestore:
1. Go to **Build** → **Firestore Database**
2. Click "Create Database"
3. Select "Start in test mode" (for development)
4. Choose a location (e.g., us-central)
5. Click "Enable"

#### Enable Storage:
1. Go to **Build** → **Storage**
2. Click "Get Started"
3. Select "Start in test mode" (for development)
4. Click "Next" and "Done"

### 5. Get Firebase Configuration

1. In Firebase Console, click the **gear icon** → **Project Settings**
2. Scroll down to "Your apps"
3. Click the **Web icon** (`</>`)
4. Register your app (name: "Real-Time Communication App")
5. Copy the Firebase configuration object

### 6. Configure the Application

#### Update `public/js/firebaseConfig.js`:
Replace the placeholder values with your Firebase configuration:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

#### Update `.env` file:
Edit the `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development

# JWT Secret (Change to a random string)
JWT_SECRET=my_super_secret_jwt_key_12345

# AES Encryption Key (32 characters for AES-256)
AES_SECRET_KEY=my_32_character_encryption_key

# Firebase Configuration (Optional - for server-side if needed)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
```

#### Update `public/js/encryption.js`:
Match the encryption key with your `.env` file:

```javascript
const ENCRYPTION_KEY = 'my_32_character_encryption_key'; // Same as .env
```

### 7. Update Firestore Security Rules (Production)

For production, update Firestore rules in Firebase Console:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId}/{document=**} {
      allow read, write: if request.auth != null;
    }
    match /whiteboards/{roomId}/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 8. Update Storage Security Rules (Production)

For production, update Storage rules in Firebase Console:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /rooms/{roomId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🚀 Running the Application

### Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

The server will start at: **https://communicaton-web-app.onrender.com**

### Access the Application

1. Open your browser and navigate to: **https://communicaton-web-app.onrender.com**
2. You'll see the login/register page
3. Create a new account or login with existing credentials
4. After login, you'll be redirected to the dashboard
5. Create a new room or join an existing one with a room ID

## 🧪 Testing Multi-User Locally

### Option 1: Multiple Browser Windows
1. Open **http://localhost:5000** in your browser
2. Register/Login with User 1
3. Create a room and copy the Room ID
4. Open a **new incognito/private window**
5. Navigate to **http://localhost:5000**
6. Register/Login with User 2 (different email)
7. Join the room using the Room ID from User 1
8. Both users should now see each other's video streams

### Option 2: Different Browsers
1. Open **http://localhost:5000** in Chrome
2. Register/Login and create a room
3. Open **http://localhost:5000** in Firefox
4. Register/Login with a different account
5. Join the same room using the Room ID

### Option 3: Different Devices
1. Find your local IP address:
   - Windows: `ipconfig` (look for IPv4 Address)
   - Mac/Linux: `ifconfig` or `ip addr`
2. On Device 1: Access **http://localhost:5000**
3. On Device 2: Access **http://YOUR_IP:5000** (e.g., http://192.168.1.100:5000)
4. Create/join the same room on both devices

## 🎯 How to Use

### Creating a Room
1. Login to the dashboard
2. Click "Create New Room"
3. Optionally enter a room name
4. Click "Create Room"
5. Share the Room ID with others

### Joining a Room
1. Login to the dashboard
2. Enter the Room ID in "Join Existing Room"
3. Click "Join Room"

### In the Room
- **Video Controls**: Toggle camera on/off
- **Audio Controls**: Mute/unmute microphone
- **Screen Share**: Share your screen with participants
- **Whiteboard**: Draw collaboratively with others
- **Chat**: Send encrypted messages
- **File Sharing**: Upload and share files

## 🔒 Security Features

- **Firebase Authentication**: Secure email/password authentication
- **JWT Tokens**: Server-side token verification
- **AES Encryption**: Chat messages encrypted before storage
- **WebRTC**: Peer-to-peer encrypted video streams
- **Firestore Security Rules**: Database access control

## 🐛 Troubleshooting

### Camera/Microphone Not Working
- Grant browser permissions for camera and microphone
- Check if another application is using the camera
- Try a different browser

### Cannot Connect to Other Users
- Ensure both users are in the same room
- Check firewall settings
- Verify Socket.io connection (check browser console)

### Firebase Errors
- Verify Firebase configuration in `firebaseConfig.js`
- Check Firebase Console for service status
- Ensure Firestore and Storage are enabled

### Port Already in Use
- Change the PORT in `.env` file
- Kill the process using port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  taskkill /PID <PID> /F
  
  # Mac/Linux
  lsof -ti:5000 | xargs kill -9
  ```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 5000) | Yes |
| JWT_SECRET | Secret key for JWT tokens | Yes |
| AES_SECRET_KEY | 32-character key for AES encryption | Yes |
| FIREBASE_* | Firebase configuration values | Yes |

## 🔄 Future Enhancements

- [ ] Recording functionality
- [ ] Virtual backgrounds
- [ ] Reactions and emojis
- [ ] Breakout rooms
- [ ] Meeting scheduling
- [ ] Mobile app (React Native)

## 📄 License

ISC

## 👨‍💻 Author

Built with ❤️ using WebRTC, Firebase, and Socket.io

---

**Note**: This application is designed for development and testing. For production deployment, ensure proper security configurations, HTTPS, and production-grade STUN/TURN servers for WebRTC.
