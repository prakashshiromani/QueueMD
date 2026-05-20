const mongoose = require('mongoose');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // e.g., "token:64f1a2b3c9d0e1f2g3h4i5j6:clinic"
  seq: { type: Number, default: 0 }
});

module.exports = mongoose.model('Counter', counterSchema);
