// Whiteboard functionality
class Whiteboard {
  constructor(canvasId, roomId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.roomId = roomId;
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.lineWidth = 2;
    
    this.setupCanvas();
    this.setupEventListeners();
  }

  setupCanvas() {
    // Set canvas size
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    
    // Set default styles
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
  }

  setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
    this.canvas.addEventListener('mousemove', (e) => this.draw(e));
    this.canvas.addEventListener('mouseup', () => this.stopDrawing());
    this.canvas.addEventListener('mouseout', () => this.stopDrawing());

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.canvas.dispatchEvent(mouseEvent);
    });

    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const mouseEvent = new MouseEvent('mouseup', {});
      this.canvas.dispatchEvent(mouseEvent);
    });
  }

  startDrawing(e) {
    this.isDrawing = true;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
  }

  draw(e) {
    if (!this.isDrawing) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.ctx.strokeStyle = this.currentColor;
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.lineTo(x, y);
    this.ctx.stroke();
    
    // Emit drawing data to other users via Firestore
    this.saveDrawingToFirestore({
      x: x / this.canvas.width,
      y: y / this.canvas.height,
      color: this.currentColor,
      lineWidth: this.lineWidth,
      type: 'draw'
    });
  }

  stopDrawing() {
    if (this.isDrawing) {
      this.isDrawing = false;
      this.ctx.beginPath();
    }
  }

  setColor(color) {
    this.currentColor = color;
  }

  setLineWidth(width) {
    this.lineWidth = width;
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Emit clear event to Firestore
    this.saveDrawingToFirestore({
      type: 'clear'
    });
  }

  // Save drawing data to Firestore for real-time sync
  async saveDrawingToFirestore(data) {
    try {
      await firebaseDb.collection('whiteboards').doc(this.roomId).collection('drawings').add({
        ...data,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving drawing to Firestore:', error);
    }
  }

  // Listen to Firestore for remote drawing events
  listenToRemoteDrawing() {
    let lastX = null;
    let lastY = null;

    firebaseDb.collection('whiteboards').doc(this.roomId).collection('drawings')
      .orderBy('timestamp', 'asc')
      .onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const data = change.doc.data();
            
            if (data.type === 'clear') {
              this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
              lastX = null;
              lastY = null;
            } else if (data.type === 'draw') {
              const x = data.x * this.canvas.width;
              const y = data.y * this.canvas.height;
              
              if (lastX !== null && lastY !== null) {
                this.ctx.beginPath();
                this.ctx.moveTo(lastX, lastY);
                this.ctx.strokeStyle = data.color;
                this.ctx.lineWidth = data.lineWidth;
                this.ctx.lineTo(x, y);
                this.ctx.stroke();
              }
              
              lastX = x;
              lastY = y;
            }
          }
        });
      });
  }
}

// Export for use in other files
window.Whiteboard = Whiteboard;
