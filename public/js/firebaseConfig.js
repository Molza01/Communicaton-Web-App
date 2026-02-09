// Firebase Configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDBE8-pukFCsEtJDaCPpetvmXrBJ3E-7Y8",
  authDomain: "communication-web-app-d92aa.firebaseapp.com",
  projectId: "communication-web-app-d92aa",
  storageBucket: "communication-web-app-d92aa.firebasestorage.app",
  messagingSenderId: "1021005252575",
  appId: "1:1021005252575:web:40ad27dc7b0eb0935be66a",
  measurementId: "G-6WFTYV3RP2"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Export for use in other files
window.firebase = firebase;  // Export firebase global for FieldValue access
window.firebaseAuth = auth;
window.firebaseDb = db;
window.firebaseStorage = storage;
