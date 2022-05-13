const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  const message = `Invallid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};
// const handleDuplicateFieldsDB=err=>{
//     const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
//     const message = `Duplicate field value: ${value}.Please use Another value!`
//     return new AppError(message,400)
// }
const handleValidationErrorDB = (err) => {
  const message = `Invallid Input Data.`;
  return new AppError(message, 400);
};
const handleJWTError = (err) =>
  new AppError('Invallid Token please login Again', 401);
const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired! Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
  //B) RENDERED WEBSITE
  console.error('ERROR 🎆', err);

  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  //A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error:send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error:don't leak error details....
    // 1) log error
    console.error('ERROR 🎆', err);
    // 2) send Generic message...
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
  //B) RENDERED WEBSITES
  // A) Operational, trusted error:send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //B) Programming or other unknown error:don't leak error details....
  // 1) log error
  console.error('ERROR 🎆', err);
  // 2) send Generic message...
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.',
  });
};
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    if (err.name === 'CastError') err = handleCastErrorDB(err);

    // // if(error.code ===11000) error = handleDuplicateFieldsDB(error)

    // }

    if (err.name === 'ValidationError') err = handleValidationErrorDB(err);
    if (err.name === 'JsonWebTokenError') err = handleJWTError(err);
    if (err.name === 'TokenExpiredError') err = handleJWTExpiredError(err);
    sendErrorProd(err, req, res);
  }
};
