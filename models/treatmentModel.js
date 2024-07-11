const mongoose = require('mongoose');
 
const treatmentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Appointment',
    },
    preliminary: {
      type: String,
      required: true,
    },
    restorative: {
      type: String,
      // required: true,
    },
    dentalHistory: {
      type: String,
      required: true,
    },
    surgical: {
      type: String,
      // required: true,
    },
    maintenance: {
      type: String,
      // required: true,
    },
    diagnosis:{
      type: String,
      required: true,
    },
    diseaseControl:{
      type: String,
      required: true,
    },
    medicalHistory:{
      type: String,
      // required: true,
    },
    doctor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    patient: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
 
  },
  {
    toJSON: { getters: true, virtuals: true },
  },
  
);

const Treatment = mongoose.model('Treatment', treatmentSchema);
module.exports = Treatment;
