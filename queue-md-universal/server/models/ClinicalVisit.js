const mongoose = require('mongoose');

const clinicalVisitSchema = new mongoose.Schema({
  patientPhone: { type: String, required: true, index: true }, // Patient ka unique identifier
  patientName: { type: String, required: true },
  
  // Multi-tenant Isolation Keys (saas.md rule)
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  facilityType: { type: String, enum: ['clinic', 'pathlab', 'dental', 'physio'], required: true },
  
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Clinical Data
  diagnosis: { type: String, default: '' },
  prescriptionNotes: { type: String, default: '' },
  vitals: {
    bp: { type: String, default: '' },       // e.g., "120/80"
    weight: { type: Number, default: null }, // in kg
    temperature: { type: Number, default: null } // in F
  },
  
  status: { type: String, enum: ['completed', 'follow-up'], default: 'completed' },
  
  // Patient Uploaded Documents
  documents: [{
    url: { type: String, required: true },
    type: { type: String }, // 'image/jpeg' | 'application/pdf'
    uploadedBy: { type: String, enum: ['doctor', 'patient'], required: true },
    uploadedAt: { type: Date, default: Date.now },
    fileName: String
  }]
  
}, { timestamps: true });

// 🔥 SKILL.md Golden Rule: Compound Index for <200ms performance
clinicalVisitSchema.index({ patientPhone: 1, facilityId: 1, createdAt: -1 });

// 🔒 SECURITY: Enforce EMR field-level encryption for HIPAA compliance (Item 3)
const mongooseFieldEncryption = require('../utils/mongooseFieldEncryption');
clinicalVisitSchema.plugin(mongooseFieldEncryption, {
  fields: ['diagnosis', 'prescriptionNotes']
});

module.exports = mongoose.model('ClinicalVisit', clinicalVisitSchema);
