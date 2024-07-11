const express = require('express');
const authController = require('../controllers/authController');
const treatmentController = require('../controllers/treatmentController');

const router = express.Router();

router.use(authController.protect);

router
  .route('/')
  .get(
    authController.restrictTo('doctor'),
    treatmentController.getAllTreatments
  )
  .post(
    authController.restrictTo('doctor'),
    treatmentController.createTreatment
  );

router
  .route('/:id')
  .get(treatmentController.getTreatment)
  .patch(
    authController.restrictTo('doctor'),
    treatmentController.updateTreatment
  )
  .delete(treatmentController.DeleteTreatment);

module.exports = router;
