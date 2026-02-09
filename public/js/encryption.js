// AES Encryption/Decryption using CryptoJS
// Note: In production, use environment variables for the secret key

const ENCRYPTION_KEY = 'your_32_character_secret_key_here'; // Must match server .env

const EncryptionUtil = {
  // Encrypt text
  encrypt: function(text) {
    try {
      const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
      return encrypted;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  },

  // Decrypt text
  decrypt: function(encryptedText) {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
      const text = decrypted.toString(CryptoJS.enc.Utf8);
      return text;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }
};

// Export for use in other files
window.EncryptionUtil = EncryptionUtil;
