const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema(
  {
    description: {
      type: String,
      minlength: [10, 'Description cannot be less than 10 letters.'],
    },
    disease: {
      type: String,
      minlength: [5, 'Disease cannot be less than 20 letters.'],
    },
    department: {
      type: String,
      required: true,
      enum: [
        'Endodontics',
        'Operative',
        'Oral & maxillofacia surgery',
        'Removable prosthrodontics',
        'Fixed prosthrodontics',
        'Orthodontics',
        'Prosthodontics',
        'General',
      ],
    },
    governorate: {
      type: String,
      required: [true, 'Governorate cannot be empty!'],
    },
    status: {
      type: String,
      default: 'In Queue',
      enum: ['In Queue', 'Accepted', 'Submitted', 'Checked Up', 'Canceled'],
    },
    patient: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
    },
    appointment: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'Appointment',
    },
  },
  { timestamps: true }
);

const Reservation = mongoose.model('Reservation', reservationSchema);
module.exports = Reservation;
