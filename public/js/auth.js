// Authentication Logic
const AuthManager = {
  // Register new user
  register: async function(email, password) {
    try {
      const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Generate JWT token from backend
      const token = await this.generateJWT(user.uid, email);
      
      // Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', email);
      
      return { success: true, user };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Login existing user
  login: async function(email, password) {
    try {
      const userCredential = await firebaseAuth.signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      
      // Generate JWT token from backend
      const token = await this.generateJWT(user.uid, email);
      
      // Store token
      localStorage.setItem('authToken', token);
      localStorage.setItem('userId', user.uid);
      localStorage.setItem('userEmail', email);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  // Logout user
  logout: async function() {
    try {
      await firebaseAuth.signOut();
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      window.location.href = '/index.html';
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Generate JWT from backend
  generateJWT: async function(userId, email) {
    try {
      const response = await fetch('https://communicaton-web-app.onrender.com/api/token/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, email })
      });
      
      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('JWT generation error:', error);
      throw error;
    }
  },

  // Verify JWT token
  verifyToken: async function(token) {
    try {
      const response = await fetch('https://communicaton-web-app.onrender.com/api/token/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });
      
      const data = await response.json();
      return data.valid;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  },

  // Check if user is authenticated
  isAuthenticated: function() {
    const token = localStorage.getItem('authToken');
    return token !== null;
  },

  // Get current user data
  getCurrentUser: function() {
    return {
      userId: localStorage.getItem('userId'),
      email: localStorage.getItem('userEmail'),
      token: localStorage.getItem('authToken')
    };
  }
};

// Export for use in other files
window.AuthManager = AuthManager;
