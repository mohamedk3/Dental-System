const { promisify } = require('util');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const JWT = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'User must have a name.'],
    minlength: [3, 'User must be at least 3 characters.'],
    validate: {
      validator: function (val) {
        return validator.isAlpha(val, 'en-US', { ignore: ' ' });
      },
      message: 'Name can only contain characters',
    },
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'User must have an email.'],
    validate: [validator.isEmail, 'Invalid email form.'],
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minlength: [8, 'Password must be at least 8 characters.'],
    maxlength: [64, 'Password must be less than 65 characters.'],
    select: false,
  },
  passwordChangedAt: Date,
  role: {
    type: String,
    required: [true, 'User must have a role.'],
    enum: {
      values: ['patient', 'doctor'],
      message: 'User must be a patient or a doctor.',
    },
  },
  phoneNum: {
    type: String,
    required: [true, 'User must have a phone num.'],
    validate: {
      validator: function (val) {
        return validator.isMobilePhone(val, 'ar-EG');
      },
      message: 'Invalid phone number.',
    },
    unique: true,
  },
  age: {
    type: Number,
    min: [5, 'Age must be greater than 4 yrs.'],
    max: [90, 'Age must be less than 91 yrs.'],
    validate: {
      validator: function (val) {
        return !(this.role === 'patient' && !val);
      },
      message: 'Patient must have an age!',
    },
  },
  address: {
    type: String,
    required: true,
    minlength: [8, 'Address must be at least 8 characters.'],
  },
  academicYear: {
    type: Number,
    min: 1,
    max: 5,
    validate: {
      validator: function (val) {
        return !(this.role === 'doctor' && !val);
      },
      message: 'Doctor must provide an academic year!',
    },
  },
  college: {
    type: String,
    trim: true,
  },
  confirmed: {
    type: Boolean,
    default: false,
    select: false,
  },
});

// MIDDLEWARES
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash user pass
  this.password = await bcrypt.hash(this.password, 12);

  // Modifies this prob when password is changed and doc is not new
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;

  next();
});

// INSTANCE METHODS
userSchema.methods.correctPassword = async function (
  candidatePassword,
  patientPassword
) {
  return await bcrypt.compare(candidatePassword, patientPassword);
};

userSchema.methods.checkChangedPassword = function (jwtTimestamp) {
  if (this.passwordChangedAt) {
    const changedAtTimestamp = this.passwordChangedAt.getTime() / 1000;

    return changedAtTimestamp > jwtTimestamp;
  }

  return false;
};

userSchema.methods.signJWT = async function (expiresIn) {
  return await promisify(JWT.sign)({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: expiresIn,
  });
};

const User = mongoose.model('User', userSchema);
module.exports = User;
