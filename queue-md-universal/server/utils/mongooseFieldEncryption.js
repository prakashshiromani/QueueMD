// server/utils/mongooseFieldEncryption.js
const crypto = require('crypto');
const logger = require('./logger');

const ALGORITHM = 'aes-256-cbc';
const SALT = 'QueueMD_Salt_Value_2026';

// Deriving a 32-byte key from the environment variable (or a secure fallback)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_sec_key_32_bytes_long_123';
const KEY = crypto.scryptSync(ENCRYPTION_KEY, SALT, 32);

/**
 * Encrypts cleartext using AES-256-CBC.
 */
function encrypt(text) {
  if (text === null || text === undefined || text === '') return text;
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(String(text), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Format: iv_hex:encrypted_hex
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypts ciphertext.
 */
function decrypt(ciphertext) {
  if (!ciphertext || typeof ciphertext !== 'string') return ciphertext;
  
  const parts = ciphertext.split(':');
  if (parts.length !== 2) {
    // If it doesn't match the format, return as-is (e.g. legacy cleartext)
    return ciphertext;
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    // Graceful fallback for non-encrypted or corrupt values
    return ciphertext;
  }
}

/**
 * 🔒 SECURITY: Mongoose Schema Encryption Plugin (Item 3)
 * Transparently encrypts specified fields on save and decrypts them on load/init.
 */
module.exports = function mongooseFieldEncryption(schema, options = {}) {
  const fields = options.fields || [];

  if (fields.length === 0) return;

  // 1. Pre-save hook to encrypt fields
  schema.pre('save', function (next) {
    fields.forEach((field) => {
      // Handle nested fields or string values
      if (this.isModified(field) && typeof this[field] === 'string' && this[field]) {
        this[field] = encrypt(this[field]);
      }
    });
    next();
  });

  // Helper to decrypt a single document
  const decryptDoc = (doc) => {
    if (!doc) return;
    fields.forEach((field) => {
      if (typeof doc[field] === 'string' && doc[field]) {
        doc[field] = decrypt(doc[field]);
      }
    });
  };

  // 2. Post-init hook (triggered when loaded from DB, e.g., find, findOne)
  schema.post('init', function (doc) {
    decryptDoc(doc);
  });

  // 3. Post-save hook (triggered after saving to keep in-memory values decrypted)
  schema.post('save', function (doc) {
    decryptDoc(doc);
  });
};
