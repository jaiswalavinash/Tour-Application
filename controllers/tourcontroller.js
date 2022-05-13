const multer = require('multer');
const sharp = require('sharp');

const Tour = require('../model/tourSchema');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new AppError('Not an image! Please upload only images', 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, // imageCover and images name must be match with tourSchema.
  { name: 'images', maxCount: 3 },
]);
// upload.single('image')
// upload.array('images',5)

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Cover images
  req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/tours/${req.body.imageCover}`);

  // 2) Images
  req.body.images = [];
  await Promise.all(
    req.files.images.map(async (file, i) => {
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;

      await sharp(file.buffer)
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`public/img/tours/${filename}`);
      req.body.images.push(filename);
    })
  );
  next();
});

exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = factory.getAll(Tour);

exports.getTour = factory.getOne(Tour, { path: 'reviews' }); // {path:'reviews'}--> this is only written for populate options.

// In order to get rid our try catch blocks,we simply wraped our Asynchronous function inside of the cathcAsync function that we just created.
// this function will then return a new anonymous function which is this one here (the function written inside the return statements) which will then
// be assigned to createTour. And Basically it is createTour function here that will get call as soon as a new Tour should be created using the CreateTour
// handler

// global error handling Middleware....

exports.createTour = factory.createOne(Tour);

// try {
//   // const newTour = new Tour({})
//   // newTour.save()

// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     messsage: err,
//   });
// }

exports.updateTour = factory.updateOne(Tour); // Tour is the name of Model
exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour =catchAsync(async (req, res,next) => {
//   const tour =   await Tour.findByIdAndDelete(req.params.id); //we don't need to save delete data into another variable bcz we don't need to send data back to client in delete operation.
//     if(!tour){
//       return next(new AppError('No tour found with that ID',404))
//     }
//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
// });  // we create factory function for this delete methods.

exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },

    //We can't use 'match' multiple times.

    // {
    //     $match:{_id:{$ne:'EASY'}}
    // }
  ]);
  res.status(200).json({
    stats: 'success',
    data: {
      stats,
    },
  });
});
// $match---> It is basically to select the documents.
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: {
        _id: 0,
      },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

// /tours-within/:distance/center/:latlng/unit/:unit

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // we use distructuring to get all the variable at once.
  const [lat, lng] = latlng.split(',');
  const radius = unit === 'mi' ? distance / 3693.2 : distance / 6378.1; //3693.2 is radius of earth in miles and 6378.1 is the radius of earth in km.

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });
  res.status(200).json({
    status: 'Success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; // we use distructuring to get all the variable at once.
  const [lat, lng] = latlng.split(',');

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

  if (!lat || !lng) {
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat,lng',
        400
      )
    );
  }
  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [lng * 1, lat * 1],
        },
        distanceField: 'distance',
        distanceMultiplier: multiplier,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'Success',
    data: {
      data: distances,
    },
  });
});
