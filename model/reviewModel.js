// review  / rating / createdAt / ref to tour belongs to  / ref to user.

const mongoose = require('mongoose');
const Tour = require('./tourSchema');
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'review must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Preventing duplicate Review...
reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Populate
reviewSchema.pre(/^find/, function (next) {
  // this.populate({
  //   path: 'tour',
  //   select: 'name',
  // }).populate({
  //   path: 'user',
  //   select: 'name photo',
  // });

  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

// Average rating calculations...
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);
  // console.log(stats);
  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: stats[0].nRating,
      ratingsAverage: stats[0].avgRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewSchema.post('save', function () {
  // Post method doesnot have next function.
  // this point to current review

  // constructor is bassically the model who created that documents...

  this.constructor.calcAverageRatings(this.tour); // tour represents to tourId which are defined inside group method.
});

const Review = new mongoose.model('Review', reviewSchema);
module.exports = Review;

// nested routes...

// POST / TOUR /234fad4 /reviews ---> Here this is called nested route. here reviews is the child of Tour
//  GET /tour/234fad4/reviews
//  GET /tour/234fad4/reviews/64887ndjsk. (64887ndjsk)--> id of reviews by which we can get reviews. (234fad4)-->id od tour by which we get tour.
