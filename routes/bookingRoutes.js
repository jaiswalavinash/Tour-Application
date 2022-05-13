const express = require('express');
const bookingController = require('../controllers/bookingController');
const authController = require('../controllers/authenticationController');
const router = new express.Router();

router.get(
  '/checkout-session/:tourId',
  authController.protect,
  bookingController.getCheckoutSession
);

module.exports = router;
