const AppError = require('../utils/appError');

const handleCastErrorDB = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = err => {
  let message, dupValue;

  // Handle duplicated reviews/bookings
  // if (err?.keyPattern?.user && err?.keyPattern?.tour) {
  //   dupValue = err.errmsg.match(/(?<=natours\.).*?(?=\s)/)[0];
  //   message = `You can not add a ${dupValue.slice(
  //     0,
  //     -1
  //   )} for the same tour twice!`;
  //   return new AppError(message, 400);
  // }

  const dupKey = Object.keys(err?.keyValue)[0];
  dupValue = Object.values(err?.keyValue)[0];
  message = `This ${dupKey}: (${dupValue}) is already in use! Please use another one.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(errEl => errEl.message);
  const message = `Invalid input data; ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// const handleCustomEVError = err => {
//   err.message = err.errorsArr
//     .map(errEl => `Invalid ${errEl.param}; ${errEl.msg}`)
//     .join(' ');
//   return err;
// };

const handleJWTError = () =>
  new AppError('Invalid token, please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired, please log in again', 401);

const handleErrorProd = err => {
  if (err.code === 11000) {
    err = handleDuplicateFieldsDB(err);
  } else if (err.name === 'CastError') {
    err = handleCastErrorDB(err);
  } else if (err.name === 'ValidationError') {
    err = handleValidationErrorDB(err);
  } else if (err.name === 'JsonWebTokenError') {
    err = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    err = handleJWTExpiredError();
  }
  // else if (err.message === 'CustomExpressValidatorError') {
  //   err = handleCustomEVError(err);
  // }

  return err;
};

const sendErrorOperationalProd = (err, res) => {
  // Operational, trusted errors => send message to client
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

const sendErrorProgrammingProd = (err, res) => {
  // Programming, unknown errors => don't leak error details

  // 1) Log the error for us
  console.error(`ERROR 💥💣💥\n`, err);

  // 2) Send a generic message to client
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

const sendErrorProd = (err, res) => {
  err = handleErrorProd(err, res);

  if (err.isOperational) sendErrorOperationalProd(err, res);
  else sendErrorProgrammingProd(err, res);
};
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'fail';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    sendErrorProd(err, res);
  }
};

module.exports = globalErrorHandler;
