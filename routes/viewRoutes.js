const express = require('express');
const viewController = require('../controllers/viewsController');
const authController = require('../controllers/authenticationController');
const router = express.Router();

router.get('/', authController.isLoggedIn, viewController.getOverview);
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);
router.get('/signUp', viewController.getSignUpForm);
router.get('/me', authController.protect, viewController.getAccount);
router.post(
  '/submit-user-data',
  authController.protect,
  viewController.updateUserData
);

//  /login

module.exports = router;
