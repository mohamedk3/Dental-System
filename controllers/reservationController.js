const Reservation = require('../models/reservationModel');
const Appointment = require('../models/appointmentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');
const io = require('../utils/socket');

exports.createReservation = catchAsync(async (req, res, next) => {
  const newReservation = await Reservation.create({
    ...req.body,
    patient: req.user.id,
  });

  res.status(201).json({
    message: 'success',
    data: newReservation,
  });
});

exports.getReservation = catchAsync(async (req, res, next) => {
  const reservation = await Reservation.findById(req.params.id).populate([
    {
      path: 'patient',
    },
    {
      path: 'doctor',
    },
    {
      path: 'appointment',
      select: '-doctor -available -department',
    },
  ]);

  if (!reservation)
    return next(new AppError('No reservation was found with that ID.', 404));

  res.status(200).json({
    message: 'success',
    data: reservation,
  });
});

exports.getAllReservations = catchAsync(async (req, res, next) => {
  const query = Reservation.find();

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields();
  // .paginate();
  const reservations = await features.query.populate([
    {
      path: 'patient',
    },
    {
      path: 'doctor',
    },
    {
      path: 'appointment',
      select: '-doctor -available -department',
    },
  ]);

  res.status(200).json({
    message: 'success',
    results: reservations.length,
    data: reservations,
  });
});

const filterBody = (allowedFields, obj) => {
  for (const key in obj) {
    if (!allowedFields.includes(key)) delete obj[key];
  }

  return obj;
};

exports.patientUpdate = (req, res, next) => {
  // Works only if the user is a patient
  if (req.user.role !== 'patient') return next();

  req.filteredBody = filterBody(['status'], req.body);

  // If a patient tries manipulating a reservation
  if (req.filteredBody.status !== 'Canceled')
    return next(
      new AppError('Patient can only place or cancel a reservation', 400)
    );

  req.filteredReference = { patient: req.user.id };
  req.errMessage =
    'No reservation belongs to this user was found with that ID.';

  next();
};

exports.doctorUpdate = catchAsync(async (req, res, next) => {
  // Works only if the user is a doctor
  if (req.user.role !== 'doctor') return next();

  // Doctor assigning new reservation to himself
  if (req.body.status === 'Accepted') {
    const reservation = await Reservation.findById(req.params.id);

    // Check if the doctor already accepted this reservation
    if (String(reservation.doctor) === String(req.user.id))
      return next(
        new AppError('You have already accepted this reservation!', 400)
      );

    // Check if the reservation is accepted by another doctor
    if (reservation.doctor)
      return next(
        new AppError(
          'This reservation is already accepted by another doctor!',
          400
        )
      );

    const appointment = await Appointment.findOneAndUpdate(
      {
        doctor: req.user.id,
        department: reservation.department,
        available: true,
      },
      { available: false }
    );

    // There is a reserved appointment
    // if (appointment && !appointment.available)
    //   return next(
    //     new AppError('No empty appointment was found for this department!', 404)
    //   );

    // There is no appointment
    if (!appointment)
      return next(
        new AppError(
          'No appointment was found for this department! Add a new appointment first.',
          404
        )
      );

    // Everything is okay => assign the appointment to the reservation
    req.filteredBody = { doctor: req.user.id, appointment: appointment._id };
  } else {
    // Doctor changes the status or description of his appointment
    req.filteredReference = { doctor: req.user.id };
    req.errMessage =
      'No reservation belongs to this doctor was found with that ID.';
  }
  req.filteredBody = {
    ...req.filteredBody,
    ...filterBody(['status', 'description'], req.body),
  };

  next();
});

exports.updateReservation = catchAsync(async (req, res, next) => {
  const { filteredBody, filteredReference, errMessage } = req;

  const reservation = await Reservation.findOneAndUpdate(
    { _id: req.params.id, ...filteredReference },
    filteredBody,
    {
      new: true,
      runValidators: true,
    }
  ).populate('doctor');
  if (!reservation) return next(new AppError(errMessage, 401));

  // Live notification
  if (req.body.status === 'Accepted')
    io.getIO().emit('reservations', { action: 'reserve', data: reservation });

  res.status(200).json({
    message: 'success',
    data: reservation,
  });
});

exports.deleteReservation = catchAsync(async (req, res, next) => {
  await Reservation.findByIdAndDelete(req.params.id);

  res.status(204).json({
    message: 'success',
    data: null,
  });
});



exports.getInQueueReservations = catchAsync(async (req, res, next) => {
  const query = Reservation.find({ status: 'In Queue' }); // Add filtering condition

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields();
  // .paginate();
  const reservations = await features.query.populate([
    {
      path: 'patient',
    },
    {
      path: 'doctor',
    },
    {
      path: 'appointment',
      select: '-doctor -available -department',
    },
  ]);

  res.status(200).json({
    message: 'success',
    results: reservations.length,
    data: reservations,
  });
});
