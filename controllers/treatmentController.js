const Treatment = require('../models/treatmentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

// exports.createTreatment = catchAsync(async (req, res, next) => {
//   const newTreatment = await Treatment.create({
//     ...req.body,
//     doctor: req.user.id,
//   });

//   res.status(201).json({
//     message: 'success',
//     data: newTreatment,
//   });
// });
  
exports.createTreatment = catchAsync(async (req, res, next) => {
  const { appointment, patient, preliminary, restorative, dentalHistory, surgical,
    maintenance, diagnosis, diseaseControl, medicalHistory } = req.body;


  const newTreatment = await Treatment.create({
    appointment, patient, preliminary, restorative, dentalHistory, surgical,
    maintenance, diagnosis, diseaseControl, medicalHistory,
    doctor: req.user.id,
  });

  res.status(201).json({
    message: 'success',
    data: newTreatment,
  });
});



exports.getTreatment = catchAsync(async (req, res, next) => {
  const treatment = await Treatment.findById(req.params.id).lean();

  if (!treatment)
    return next(new AppError('No Treatment was found with that ID.', 404));

  res.status(200).json({
    message: 'success',
    data: treatment,
  });
});

exports.getAllTreatments = catchAsync(async (req, res, next) => {
  // Sort Treatments based on date
  let patient = req.query.patient

  // Only gets this doctor's Treatments
  const query = Treatment.find({ patient });

  const features = new APIFeatures(query, req.query)
    .filter()
    .sort()
    .limitFields();
  // .paginate();
  const treatments = await features.query;

  res.status(200).json({
    message: 'success',
    results: treatments.length,
    data: treatments,
  });
});

exports.updateTreatment = catchAsync(async (req, res, next) => {
  const treatment = await Treatment.findByIdAndUpdate(
    req.params.id,
    req.body
  );

  if (!treatment)
    return next(new AppError('No Treatment was found with that ID.', 401));

  res.status(200).json({
    message: 'success',
    data: treatment,
  });
});

exports.DeleteTreatment = catchAsync(async (req, res, next) => {
  await Treatment.findByIdAndDelete(req.params.id);

  res.status(204).json({
    message: 'success',
    data: null,
  });
});