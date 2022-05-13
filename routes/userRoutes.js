const express = require('express');
const userController = require('../controllers/usercontroller');
const authController = require('../controllers/authenticationController');

const router = express.Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

// Protect All routes after this middleware
router.use(authController.protect); // This will protect all the route which are coming after that.

router.patch('/updateMyPassword', authController.updatePassword);

router.get(
  // This route is basically to get the information about the login user.
  '/me',
  userController.getMe,
  userController.getUsers
);

router.patch(
  '/updateMe',
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteMe', userController.deleteMe);

// From this point All rotes are protected as well as restricted...

router.use(authController.restrictTo('admin')); // All of the route which are written after this router is only executed by administrator.
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUsers)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
