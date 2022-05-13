const express = require('express');
const reviewController = require('../controllers/reviewController');
const authController = require('../controllers/authenticationController');
const router = express.Router({ mergeParams: true });
// POST / TOUR /234fad4 /reviews ---> Here this is called nested route. here reviews is the child of Tour
// GET / TOUR /234fad4 /reviews ---> Here this is called nested route. here reviews is the child of Tour

router.use(authController.protect);
router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'), // only user are able to post review.
    reviewController.setTourUserIds,
    reviewController.createReview
  );
router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );
module.exports = router;
