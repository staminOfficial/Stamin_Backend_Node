const { ApiError } = require("../utils/customErrorHandler");

// Helper function for sending errors
const sendError = (res, error) => {
  res.status(error.statusCode).json({
    status: error.status,
    message: error.message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }), // Include stack trace only in development
  });
};

// Specific error handlers
const handleCastError = (err) => {
  const message = `Invalid value for ${err.path}: ${err.value}!`;
  return new ApiError(400, message);
};

const handleDuplicateKeyError = (err) => {
  const key = Object.keys(err.keyValue).join(", ");
  const message = `Duplicate value for field(s): ${key}. Please use another value.`;
  return new ApiError(400, message);
};

const handleValidationError = (err) => {
  const message = Object.values(err.errors)
    .map((error) => error.message)
    .join(". ");
  return new ApiError(400, message);
};

// Global error handling middleware
module.exports = (error, req, res, next) => {
  // Default properties for all errors
  error.statusCode = error.statusCode || 500;
  error.status = error.status || "error";

  // Log error details for debugging (production logs can be sent to an external service like Sentry)
  if (process.env.NODE_ENV === "production" && !error.isOperational) {
    console.error("UNEXPECTED ERROR:", error);
  }

  if (process.env.NODE_ENV === "development") {
    // Development mode - send detailed errors
    sendError(res, error);
  } else {
    // Production mode - sanitize errors before sending
    let sanitizedError = { ...error, message: error.message };

    // Handle specific Mongoose errors
    if (error.name === "CastError") sanitizedError = handleCastError(error);
    if (error.code === 11000) sanitizedError = handleDuplicateKeyError(error);
    if (error.name === "ValidationError")
      sanitizedError = handleValidationError(error);

    // Send sanitized error to client
    sendError(res, sanitizedError);
  }
};
