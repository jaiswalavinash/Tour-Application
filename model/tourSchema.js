const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel')
// const validator = require('validator')
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour name must have less or equal 40 characters.'],
      minlength: [10, 'A tour name must have greater or equal 10 charachters.'],
      // validate:[validator.isAlpha,'Tour name must only contain character']
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy , medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be less or equal to 5.0'],
      set: (val) => Math.round(val * 10) / 10, // 4.6666 ,--> 4.7
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //  this only points to current doc on NEW document creation
          return val < this.price;
        },
      },
      message: 'Discount price ({VALUE}) should be below regular price',
    },
    summary: {
      type: String,
      trim: true,
    },
    descriptions: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a  cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // Start location is not really a document itself , it really just an object describing a certain point on earth.
      //In order to really create new documents and then embed them into another documents, we actually need to create an array.

      // The object which are written inside startLocation are Embedded Objects.

      // GeoJSON --> Geo Special Data.
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    // here we create embedded documents.
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User', // By refrencing we simply make relationship between two data set.
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// index property apply;

// tourSchema.index({price:1})  // price:1 means it is sorting by ascending order.
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({
  startLocation: '2dsphere',
});

// we define vurtual property in mongoose.
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});
// virtual populate
tourSchema.virtual('reviews', {
  ref: 'Review', // (Name of model)
  foreignField: 'tour',
  localField: '_id',
});

// DOCUMENTS MIDDLEWARE: runs before .save() and .create() not work  for update method.
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true }); // ---> this represents the documents before going to save into database.
  next();
});

// The below code are responsible for performing the embedding basically.

// tourSchema.pre('save',async function(next){
// const guidesPromises =  this.guides.map(async id=>await User.findById(id));
// this .guides = await Promise.all(guidesPromises);
// next();
// });

// tourSchema.pre('save',function(next){
// console.log('will save doc.....');
// next()
// })
//  tourSchema.post('save',function(doc,next){
//    console.log(doc);
//    next();
//  })

// QUERRY MIDDLEWARE
tourSchema.pre(/^find/, function (next) {
  // /^find/ --> It is regular expression. /^find/--> means anything starting with find.
  //tourSchema.pre('find',function(next){
  this.find({ secretTour: { $ne: true } }); // this refers to querry object
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Querry took ${Date.now() - this.start}milliseconds!`);
  next();
});

//  AGGREGATION MIDDLEWARE...

// tourSchema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });

// create collections...
const Tour = new mongoose.model('Tour', tourSchema);

module.exports = Tour;
