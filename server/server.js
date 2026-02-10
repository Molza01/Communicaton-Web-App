const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const tokenRoutes = require('./routes/token');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      'https://communicaton-web-app.web.app',
      'https://communicaton-web-app.firebaseapp.com',
      'http://localhost:3000',
      'http://localhost:5000',
      'http://127.0.0.1:5000'
    ],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors({
  origin: [
    'https://communicaton-web-app.web.app',
    'https://communicaton-web-app.firebaseapp.com',
    'http://localhost:3000',
    'http://localhost:5000',
    'http://127.0.0.1:5000'
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes

app.use('/api/token', tokenRoutes);

// Store active rooms and users
const rooms = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, userId, userName }) => {
    socket.join(roomId);
    
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Map());
    }
    
    const room = rooms.get(roomId);
    room.set(userId, { socketId: socket.id, userName });
    
    // Notify others in the room about new user
    socket.to(roomId).emit('user-joined', { userId, userName, socketId: socket.id });
    
    // Send list of existing users to the new user
    const existingUsers = Array.from(room.entries())
      .filter(([id]) => id !== userId)
      .map(([id, data]) => ({ userId: id, userName: data.userName, socketId: data.socketId }));
    
    socket.emit('existing-users', existingUsers);
    
    // Broadcast updated participants list to ALL users in room (including new user)
    const allParticipants = Array.from(room.entries())
      .map(([id, data]) => ({ userId: id, userName: data.userName }));
    
    io.to(roomId).emit('participants-update', {
      participants: allParticipants,
      count: room.size
    });
    
    console.log(`User ${userId} joined room ${roomId}. Total users: ${room.size}`);
  });

  // WebRTC signaling - offer
  socket.on('offer', ({ offer, to, from }) => {
    // 'to' is the target socketId, send directly to that socket
    io.to(to).emit('offer', { offer, from });
  });

  // WebRTC signaling - answer
  socket.on('answer', ({ answer, to, from }) => {
    // 'to' is the target socketId, send directly to that socket
    io.to(to).emit('answer', { answer, from });
  });

  // WebRTC signaling - ICE candidate
  socket.on('ice-candidate', ({ candidate, to, from }) => {
    // 'to' is the target socketId, send directly to that socket
    io.to(to).emit('ice-candidate', { candidate, from });
  });

  // Screen sharing started
  socket.on('screen-sharing-started', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-screen-sharing', { userId });
  });

  // Screen sharing stopped
  socket.on('screen-sharing-stopped', ({ roomId, userId }) => {
    socket.to(roomId).emit('user-screen-stopped', { userId });
  });

  // Whiteboard drawing events
  socket.on('drawing', ({ roomId, data }) => {
    socket.to(roomId).emit('drawing', data);
  });

  // Clear whiteboard
  socket.on('clear-canvas', ({ roomId }) => {
    socket.to(roomId).emit('clear-canvas');
  });

  // Chat message
  socket.on('chat-message', ({ roomId, message }) => {
    io.to(roomId).emit('chat-message', message);
  });

  // Leave room
  socket.on('leave-room', ({ roomId, userId }) => {
    handleUserLeave(socket, roomId, userId);
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    // Find and remove user from all rooms
    rooms.forEach((room, roomId) => {
      room.forEach((data, userId) => {
        if (data.socketId === socket.id) {
          handleUserLeave(socket, roomId, userId);
        }
      });
    });
  });
});

// Helper function to handle user leaving
function handleUserLeave(socket, roomId, userId) {
  if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    room.delete(userId);
    
    // Notify others that user left
    socket.to(roomId).emit('user-left', { userId });
    
    if (room.size === 0) {
      rooms.delete(roomId);
    } else {
      // Broadcast updated participants list to remaining users
      const allParticipants = Array.from(room.entries())
        .map(([id, data]) => ({ userId: id, userName: data.userName }));
      
      io.to(roomId).emit('participants-update', {
        participants: allParticipants,
        count: room.size
      });
    }
    
    socket.leave(roomId);
    
    console.log(`User ${userId} left room ${roomId}. Remaining users: ${room.size}`);
  }
}

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

