const express = require('express');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const mongoSantizise = require('express-mongo-sanitize');
const XSS = require('xss-clean');
const hpp = require('hpp');
const reviewRouter = require('./routes/reviewRoute');
const viewRouter = require('./routes/viewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const cookieParser = require('cookie-parser');

const app = express();
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Global MiddleWares

// serving static files
app.use(express.static(path.join(__dirname, 'public'))); // this middleware is used to serve static file...
// Set security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// rate-Limiter is gonna do is to count thenumber of request coming from one IP and when there are too many request then it block these requests.
// limit requests from same API
const limiter = rateLimit({
  // this limiter is basically a middleware Function...
  max: 100,
  windowMiliseconds: 60 * 60 * 1000,
  message: 'Too many request from this IP, Please try again in an hour!',
});
app.use('/api', limiter);

// Body-Parser,reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization aginast NoSQL query injections.

app.use(mongoSantizise());

// Data Sanitization against XSS
app.use(XSS());

// Prevent parameter Pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// Test Middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Routes

app.use('/', viewRouter); //'/api/v1/tours'----> this is path and tourROuter----> middleware function
app.use('/api/v1/tours', tourRouter); //'/api/v1/tours'----> this is path and tourROuter----> middleware function
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

// if user put wrong url then we also need to handle that part
// app.all --> means all http request
// if we put the below code above app.use('/api/v1/tours) then it will execute first whether you put right paths as well. so always try to put in bottom.
app.all('*', (req, res, next) => {
  // res.status(404).json({
  //     status:'fail',
  //     message:`Can't find ${req.originalUrl} on the server!`
  // });
  // const err = new Error(`Can't find ${req.originalUrl} on the server!`)
  // err.status = 'fail';
  // err.statusCode = 404;

  // if next() function receives an arguments , no matter what it is,express will automatically know that there was an error.
  next(new AppError(`Can't find ${req.originalUrl} on the server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
