function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    // Not an error we deliberately threw — likely a real bug. Log the full
    // thing server-side, but never leak internals to the client.
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Something went wrong on our end.",
    ...(process.env.NODE_ENV === "development" && !isOperational
      ? { stack: err.stack }
      : {}),
  });
}

module.exports = errorHandler;
