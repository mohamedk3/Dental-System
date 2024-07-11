const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const reservationRouter = require('./routes/reservationRoutes');
const appointmentRouter = require('./routes/appointmentRoutes');
const treatmentRoutes = require('./routes/treatmentRoutes');
const authRouter = require('./routes/authRoutes');

const app = express();

// GLOBAL MIDDLEWARES
// Allowing CORS
app.use(cors());
app.options('*', cors());

// Set security for HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Limit requests from same IP
const limiter = rateLimit({
  max: process.env.MAX_REQUESTS_NUM,
  windowMs: process.env.MAX_REQUESTS_TIME_SECS * 1000,
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter);

// Parse body data
app.use(express.json());
app.use(cookieParser());

// Dev logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Data sanitization against noSQL query injection
app.use(mongoSanitize());

// Data sanitization against QSS attacks
app.use(xss());

// Prevent parameter pollution => multi param values to be sent for the same field
app.use(
  hpp({
    whitelist: ['department'],
  })
);

// ROUTES
app.use('/api/v1/reservations', reservationRouter);
app.use('/api/v1/appointments', appointmentRouter);
app.use('/api/v1/treatments', treatmentRoutes);
app.use('/api/v1/auth', authRouter);

// UNHANDLED ROUTES - GLOBAL ERROR HANDLER
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;