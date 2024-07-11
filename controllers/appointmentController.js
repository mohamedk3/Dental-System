const Appointment = require('../models/appointmentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.createAppointment = catchAsync(async (req, res, next) => {
  const newAppointment = await Appointment.create({
    ...req.body,
    doctor: req.user.id,
  });

  res.status(201).json({
    message: 'success',
    data: newAppointment,
  });
});


exports.getAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment)
    return next(new AppError('No appointment was found with that ID.', 404));

  res.status(200).json({
    message: 'success',
    data: appointment,
  });
});

exports.getAllAppointments = catchAsync(async (req, res, next) => {
  // Sort appointments based on date
  req.query.sort = 'from';

  // Only gets this doctor's appointments
  const query = Appointment.find({ doctor: req.user.id });

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields();
  // .paginate();
  const appointments = await features.query;

  res.status(200).json({
    message: 'success',
    results: appointments.length,
    data: appointments,
  });
});

exports.updateAppointment = catchAsync(async (req, res, next) => {
  const appointment = await Appointment.findByIdAndUpdate(
    req.params.id,
    req.body
  );

  if (!appointment)
    return next(new AppError('No appointment was found with that ID.', 401));

  res.status(200).json({
    message: 'success',
    data: appointment,
  });
});

exports.DeleteAppointment = catchAsync(async (req, res, next) => {
  await Appointment.findByIdAndDelete(req.params.id);

  res.status(204).json({
    message: 'success',
    data: null,
  });
});