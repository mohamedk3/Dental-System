const express = require('express');
const reservationController = require('../controllers/reservationController');
const authController = require('../controllers/authController');

const router = express.Router();

router.use(authController.protect);
router
  .route('/')
  .post(
    authController.restrictTo('patient'),
    reservationController.createReservation
  )
  .get(reservationController.getAllReservations)

router
    .route('/inQueue')
    .get(reservationController.getInQueueReservations);

router
  .route('/:id')
  .get(reservationController.getReservation)
  .patch(
    reservationController.patientUpdate,
    reservationController.doctorUpdate,
    reservationController.updateReservation
  )
  .delete(reservationController.deleteReservation);

module.exports = router;
