class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // "expected" error vs a genuine bug — see errorHandler.js
    Error.captureStackTrace(this, this.constructor);
  }
}


module.exports = AppError;