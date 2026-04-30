const logger = require('../utils/logger');
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    let statusCode = 500;
    let message = 'Internal Server Error';
    const errors = [];

    if (err.name === 'ValidationError') {
      statusCode = 400;
      message = 'Validation Error';
      Object.values(err.errors).forEach((e) => {
        errors.push({ field: e.path, message: e.message });
      });
    } else if (err.code === 11000) {
      statusCode = 409;
      const field = Object.keys(err.keyPattern)[0];
      message = `${field} already exists`;
    } else if (err.name === 'CastError') {
      statusCode = 400;
      message = `Invalid ${err.path}: ${err.value}`;
    }

    error = new ApiError(statusCode, message, errors, err.stack);
  }

  if (error.statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} → ${error.statusCode}: ${error.message}`, {
      stack: error.stack,
      body: req.body,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} → ${error.statusCode}: ${error.message}`);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors?.length ? error.errors : undefined,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
  });
};

const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
};

module.exports = { errorHandler, notFound };
