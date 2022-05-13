const express = require('express');
const tourController = require('../controllers/tourcontroller');
const authController = require('../controllers/authenticationController');
// const reviewController = require('../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoute');
const router = express.Router();

// POST / TOUR /234fad4 /reviews ---> Here this is called nested route. here reviews is the child of Tour
//  GET /tour/234fad4/reviews
//  GET /tour/234fad4/reviews/64887ndjsk. (64887ndjsk)--> id of reviews by which we can get reviews. (234fad4)-->id od tour by which we get tour.
// router
// .route('/:tourId/reviews')
// .post(
//   authController.protect,
//   authController.restrictTo('user'),
//   reviewController.createReview
// );

router.use('/:tourId/reviews', reviewRouter);

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin); // latlng--> latitude and longitude...

// tours-distance?distance=223&center=-40,45,unit=miles
// tours-distance/223/center/-40,45/unit/mi

router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances)

router
  .route('/')
  .get(tourController.getAllTours)
  .post(
    authController.restrictTo('admin', 'lead-guide'),
    tourController.createTour
  );

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
