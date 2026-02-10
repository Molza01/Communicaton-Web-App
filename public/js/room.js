// Room functionality with WebRTC, Screen Sharing, Chat, and File Sharing
class RoomManager {
  constructor(roomId, userId, userName) {
    this.roomId = roomId;
    this.userId = userId;
    this.userName = userName;
    this.socket = io('https://communicaton-web-app.onrender.com', {
  transports: ['websocket']
});
    this.peers = new Map();
    this.localStream = null;
    this.screenStream = null;
    this.isScreenSharing = false;
    this.whiteboard = null;
    
    this.configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    this.init();
  }

  async init() {
    try {
      // Get local media stream
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      // Display local video
      this.addVideoStream(this.userId, this.localStream, this.userName + ' (You)');
      
      // Setup socket listeners
      this.setupSocketListeners();
      
      // Join room
      this.socket.emit('join-room', {
        roomId: this.roomId,
        userId: this.userId,
        userName: this.userName
      });
      
      // Initialize whiteboard
      this.whiteboard = new Whiteboard('whiteboard', this.roomId);
      this.whiteboard.listenToRemoteDrawing();
      
      // Setup UI event listeners
      this.setupUIListeners();
      
      // Listen to chat messages
      this.listenToChatMessages();
      
      // Listen to file uploads
      this.listenToFileUploads();
      
    } catch (error) {
      console.error('Error initializing room:', error);
      alert('Failed to access camera/microphone. Please grant permissions.');
    }
  }

  setupSocketListeners() {
    // User joined
    this.socket.on('user-joined', ({ userId, userName, socketId }) => {
      console.log('User joined:', userId, userName);
      this.createPeerConnection(userId, userName, socketId, true);
    });

    // Existing users in room
    this.socket.on('existing-users', (users) => {
      console.log('Existing users:', users);
      users.forEach(({ userId, userName, socketId }) => {
        this.createPeerConnection(userId, userName, socketId, false);
      });
    });

    // Participants update (member count and list)
    this.socket.on('participants-update', ({ participants, count }) => {
      console.log('Participants update:', count, participants);
      this.updateParticipantsList(participants, count);
    });

    // Receive offer
    this.socket.on('offer', async ({ offer, from }) => {
      const peer = this.peers.get(from);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.connection.createAnswer();
        await peer.connection.setLocalDescription(answer);
        
        this.socket.emit('answer', {
          answer: answer,
          to: peer.socketId,
          from: this.socket.id
        });
      }
    });

    // Receive answer
    this.socket.on('answer', async ({ answer, from }) => {
      const peer = this.peers.get(from);
      if (peer) {
        await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    // Receive ICE candidate
    this.socket.on('ice-candidate', async ({ candidate, from }) => {
      const peer = this.peers.get(from);
      if (peer && candidate) {
        await peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    // User left
    this.socket.on('user-left', ({ userId }) => {
      console.log('User left:', userId);
      this.removeVideoStream(userId);
      this.peers.delete(userId);
    });

    // Chat message
    this.socket.on('chat-message', (message) => {
      this.displayChatMessage(message);
    });
  }

  async createPeerConnection(userId, userName, remoteSocketId, isInitiator) {
    const peerConnection = new RTCPeerConnection(this.configuration);
    
    const peer = {
      connection: peerConnection,
      socketId: remoteSocketId,  // Store the REMOTE user's socketId
      userName: userName
    };
    
    this.peers.set(userId, peer);

    // Add local stream tracks to peer connection
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream);
    });

    // Handle incoming stream
    peerConnection.ontrack = (event) => {
      this.addVideoStream(userId, event.streams[0], userName);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('ice-candidate', {
          candidate: event.candidate,
          to: peer.socketId,
          from: this.socket.id
        });
      }
    };

    // If initiator, create and send offer
    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.socket.emit('offer', {
        offer: offer,
        to: peer.socketId,
        from: this.socket.id
      });
    }
  }

  addVideoStream(userId, stream, label) {
    // Check if video already exists
    if (document.getElementById(`video-${userId}`)) {
      return;
    }

    const videoGrid = document.getElementById('video-grid');
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `video-container-${userId}`;

    const video = document.createElement('video');
    video.id = `video-${userId}`;
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    
    // Mute local video to prevent echo
    if (userId === this.userId) {
      video.muted = true;
    }

    const videoLabel = document.createElement('div');
    videoLabel.className = 'video-label';
    videoLabel.textContent = label;

    videoContainer.appendChild(video);
    videoContainer.appendChild(videoLabel);
    videoGrid.appendChild(videoContainer);
  }

  removeVideoStream(userId) {
    const videoContainer = document.getElementById(`video-container-${userId}`);
    if (videoContainer) {
      videoContainer.remove();
    }
  }

  updateParticipantsList(participants, count) {
    // Update member count in UI
    const memberCountElement = document.getElementById('member-count');
    if (memberCountElement) {
      memberCountElement.textContent = count;
    }

    // Update participants list
    const participantsList = document.getElementById('participants-list');
    if (participantsList) {
      participantsList.innerHTML = '';
      
      participants.forEach(({ userId, userName }) => {
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';
        participantItem.textContent = userId === this.userId ? `${userName} (You)` : userName;
        participantsList.appendChild(participantItem);
      });
    }
  }

  async toggleScreenShare() {
    if (!this.isScreenSharing) {
      try {
        this.screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        const videoTrack = this.screenStream.getVideoTracks()[0];
        
        // Replace video track in all peer connections
        this.peers.forEach((peer) => {
          const sender = peer.connection.getSenders().find(s => s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Replace local video
        const localVideo = document.getElementById(`video-${this.userId}`);
        if (localVideo) {
          localVideo.srcObject = this.screenStream;
        }

        this.isScreenSharing = true;
        document.getElementById('screen-share-btn').textContent = 'Stop Sharing';
        document.getElementById('screen-share-btn').classList.add('active');

        // Handle screen share stop
        videoTrack.onended = () => {
          this.stopScreenShare();
        };

        this.socket.emit('screen-sharing-started', {
          roomId: this.roomId,
          userId: this.userId
        });

      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      this.stopScreenShare();
    }
  }

  stopScreenShare() {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    // Restore camera video
    const videoTrack = this.localStream.getVideoTracks()[0];
    
    this.peers.forEach((peer) => {
      const sender = peer.connection.getSenders().find(s => s.track.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    const localVideo = document.getElementById(`video-${this.userId}`);
    if (localVideo) {
      localVideo.srcObject = this.localStream;
    }

    this.isScreenSharing = false;
    document.getElementById('screen-share-btn').textContent = 'Share Screen';
    document.getElementById('screen-share-btn').classList.remove('active');

    this.socket.emit('screen-sharing-stopped', {
      roomId: this.roomId,
      userId: this.userId
    });
  }

  toggleVideo() {
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      const btn = document.getElementById('video-btn');
      btn.textContent = videoTrack.enabled ? 'Stop Video' : 'Start Video';
      btn.classList.toggle('active', videoTrack.enabled);
    }
  }

  toggleAudio() {
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      const btn = document.getElementById('audio-btn');
      btn.textContent = audioTrack.enabled ? 'Mute' : 'Unmute';
      btn.classList.toggle('active', audioTrack.enabled);
    }
  }

  async sendChatMessage(message) {
    if (!message.trim()) return;

    const encryptedMessage = EncryptionUtil.encrypt(message);
    
    const chatMessage = {
      sender: this.userName,
      senderId: this.userId,
      message: encryptedMessage,
      timestamp: new Date().toISOString()
    };

    // Save to Firestore
    try {
      await firebaseDb.collection('rooms').doc(this.roomId).collection('messages').add(chatMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  listenToChatMessages() {
    firebaseDb.collection('rooms').doc(this.roomId).collection('messages')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const message = change.doc.data();
            this.displayChatMessage(message);
          }
        });
      });
  }

  displayChatMessage(message) {
    const chatMessages = document.getElementById('chat-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';

    const decryptedMessage = EncryptionUtil.decrypt(message.message);
    
    const time = new Date(message.timestamp).toLocaleTimeString();
    
    messageDiv.innerHTML = `
      <div class="chat-sender">${message.sender}</div>
      <div class="chat-text">${decryptedMessage || '[Encrypted]'}</div>
      <div class="chat-time">${time}</div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  async uploadFile(file) {
    if (!file) return;

    try {
      const storageRef = firebaseStorage.ref();
      const fileRef = storageRef.child(`rooms/${this.roomId}/${Date.now()}_${file.name}`);
      
      // Upload file
      const snapshot = await fileRef.put(file);
      const downloadURL = await snapshot.ref.getDownloadURL();

      // Save file metadata to Firestore
      await firebaseDb.collection('rooms').doc(this.roomId).collection('files').add({
        name: file.name,
        url: downloadURL,
        uploadedBy: this.userName,
        uploaderId: this.userId,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file.');
    }
  }

  listenToFileUploads() {
    firebaseDb.collection('rooms').doc(this.roomId).collection('files')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        const fileList = document.getElementById('file-list');
        fileList.innerHTML = '';

        snapshot.forEach((doc) => {
          const file = doc.data();
          this.displayFile(file);
        });
      });
  }

  displayFile(file) {
    const fileList = document.getElementById('file-list');
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    fileItem.innerHTML = `
      <div class="file-name" title="${file.name}">${file.name}</div>
      <button class="file-download" onclick="window.open('${file.url}', '_blank')">Download</button>
    `;

    fileList.appendChild(fileItem);
  }

  setupUIListeners() {
    // Video toggle
    document.getElementById('video-btn').addEventListener('click', () => {
      this.toggleVideo();
    });

    // Audio toggle
    document.getElementById('audio-btn').addEventListener('click', () => {
      this.toggleAudio();
    });

    // Screen share
    document.getElementById('screen-share-btn').addEventListener('click', () => {
      this.toggleScreenShare();
    });

    // Leave room
    document.getElementById('leave-btn').addEventListener('click', () => {
      this.leaveRoom();
    });

    // Chat send
    document.getElementById('send-chat-btn').addEventListener('click', () => {
      const input = document.getElementById('chat-input');
      this.sendChatMessage(input.value);
      input.value = '';
    });

    // Chat enter key
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.sendChatMessage(e.target.value);
        e.target.value = '';
      }
    });

    // File upload
    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadFile(file);
        e.target.value = '';
      }
    });

    // Whiteboard color
    document.getElementById('color-picker').addEventListener('change', (e) => {
      this.whiteboard.setColor(e.target.value);
    });

    // Clear whiteboard
    document.getElementById('clear-board-btn').addEventListener('click', () => {
      this.whiteboard.clear();
    });
  }

  leaveRoom() {
    // Stop all tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.screenStream) {
      this.screenStream.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    this.peers.forEach((peer) => {
      peer.connection.close();
    });

    // Emit leave event
    this.socket.emit('leave-room', {
      roomId: this.roomId,
      userId: this.userId
    });

    // Redirect to dashboard
    window.location.href = '/dashboard.html';
  }
}

// Export for use in room.html
window.RoomManager = RoomManager;
