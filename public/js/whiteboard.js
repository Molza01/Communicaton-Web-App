// Whiteboard functionality
class Whiteboard {
  constructor(canvasId, roomId, socket) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.roomId = roomId;
    this.socket = socket;
    this.isDrawing = false;
    this.currentColor = '#000000';
    this.lineWidth = 2;
    this.lastX = null;
    this.lastY = null;
    
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
    
    this.lastX = x;
    this.lastY = y;
    
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
    
    // Emit drawing data to other users via Socket.io
    this.socket.emit('drawing', {
      roomId: this.roomId,
      data: {
        x0: this.lastX / this.canvas.width,
        y0: this.lastY / this.canvas.height,
        x1: x / this.canvas.width,
        y1: y / this.canvas.height,
        color: this.currentColor,
        lineWidth: this.lineWidth
      }
    });
    
    this.lastX = x;
    this.lastY = y;
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
    
    // Emit clear event via Socket.io
    this.socket.emit('clear-canvas', {
      roomId: this.roomId
    });
  }

  // Listen to Socket.io for remote drawing events
  listenToRemoteDrawing() {
    this.socket.on('drawing', (data) => {
      const x0 = data.x0 * this.canvas.width;
      const y0 = data.y0 * this.canvas.height;
      const x1 = data.x1 * this.canvas.width;
      const y1 = data.y1 * this.canvas.height;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x0, y0);
      this.ctx.strokeStyle = data.color;
      this.ctx.lineWidth = data.lineWidth;
      this.ctx.lineTo(x1, y1);
      this.ctx.stroke();
    });
    
    this.socket.on('clear-canvas', () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    });
  }
}

// Export for use in other files
window.Whiteboard = Whiteboard;
