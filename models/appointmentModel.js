const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    from: {
      type: Date,
      required: true,
      validate: {
        validator: function (val) {
          return val.toDateString() === this.day;
        },
        message: 'Dates does not match!',
      },
      get: val => val.toLocaleTimeString(),
    },
    to: {
      type: Date,
      required: true,
      validate: {
        validator: function (val) {
          return val.toDateString() === this.day;
        },
        message: 'Dates does not match!',
      },
      get: val => val.toLocaleTimeString(),
    },
    day: {
      type: Date,
      required: true,
      get: val => val.toDateString(),
    },
    available: {
      type: Boolean,
      default: true,
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
    doctor: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { getters: true, virtuals: true },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
module.exports = Appointment;
