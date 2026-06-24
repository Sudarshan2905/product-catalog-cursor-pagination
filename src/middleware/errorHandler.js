const { Error: MongooseError } = require('mongoose');

/**
 * Global error handling middleware.
 * Must have 4 parameters so Express treats it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Mongoose ValidationError
  if (err instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err instanceof MongooseError.CastError) {
    statusCode = 400;
    message = `Invalid value for field '${err.path}'`;
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value for '${field}'`;
  }

  // Cursor decode errors
  if (err.message === 'Invalid or malformed cursor') {
    statusCode = 400;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('❌', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
