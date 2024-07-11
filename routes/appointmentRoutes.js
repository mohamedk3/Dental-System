const express = require('express');
const authController = require('../controllers/authController');
const appointmentController = require('../controllers/appointmentController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(
    authController.restrictTo('doctor'),
    appointmentController.getAllAppointments
  )
  .post(
    authController.restrictTo('doctor'),
    appointmentController.createAppointment
  );

router
  .route('/:id')
  .get(appointmentController.getAppointment)
  .patch(
    authController.restrictTo('patient'),
    appointmentController.updateAppointment
  )
  .delete(appointmentController.DeleteAppointment);

module.exports = router;
