const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();

router.post('/sign-up', authController.signUp);
router.get('/sign-up/confirm/:token', authController.confirmSignUp);
router.post('/login', authController.login);

router.post(
  '/update-password',
  authController.protect,
  authController.updatePassword
);

router.get('/logout', authController.protect, authController.logout);

router
  .route('/update-me')
  .patch(authController.protect, authController.updateMe);

module.exports = router;
