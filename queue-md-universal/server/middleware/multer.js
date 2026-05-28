const multer = require('multer');

const storage = multer.memoryStorage();

// 🔒 SECURITY: Magic byte signatures for allowed file types (L-05)
// MIME type from header can be spoofed — magic bytes cannot.
const FILE_SIGNATURES = {
  // JPEG: FF D8 FF
  jpeg: [0xFF, 0xD8, 0xFF],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  // GIF: 47 49 46 38
  gif: [0x47, 0x49, 0x46, 0x38],
  // WebP: 52 49 46 46 (RIFF) + offset 8: 57 45 42 50 (WEBP)
  webp: [0x52, 0x49, 0x46, 0x46],
  // PDF: 25 50 44 46 (%PDF)
  pdf: [0x25, 0x50, 0x44, 0x46],
};

/**
 * Validates magic bytes of file buffer against expected signatures.
 * This prevents MIME type spoofing attacks (e.g., disguising an exe as a jpg).
 */
const validateMagicBytes = (buffer, mimetype) => {
  if (!buffer || buffer.length < 8) return false;

  const bytes = Array.from(buffer.slice(0, 8));

  if (mimetype === 'image/jpeg') {
    return FILE_SIGNATURES.jpeg.every((b, i) => bytes[i] === b);
  }
  if (mimetype === 'image/png') {
    return FILE_SIGNATURES.png.every((b, i) => bytes[i] === b);
  }
  if (mimetype === 'image/gif') {
    return FILE_SIGNATURES.gif.every((b, i) => bytes[i] === b);
  }
  if (mimetype === 'image/webp') {
    // RIFF check at offset 0, WEBP at offset 8 (need more bytes)
    return FILE_SIGNATURES.webp.every((b, i) => bytes[i] === b);
  }
  if (mimetype === 'application/pdf') {
    return FILE_SIGNATURES.pdf.every((b, i) => bytes[i] === b);
  }
  return false;
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // First layer: MIME type check
    if (!file.mimetype.startsWith('image/') && file.mimetype !== 'application/pdf') {
      return cb(new Error('Only image and PDF files are allowed!'), false);
    }
    // Note: Magic byte validation happens AFTER upload in the controller
    // because multer fileFilter doesn't have access to the buffer yet.
    // Use the validateMagicBytes export in your controller after upload.
    cb(null, true);
  },
});

// 🔒 Export the validator so controllers can call it after receiving the file buffer
upload.validateMagicBytes = validateMagicBytes;

module.exports = upload;
