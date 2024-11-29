class AppError extends Error {
  /**
   * Constructs a new operational error instance.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code of the error.
   */
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor); // Ensure stack trace is captured
  }
}

module.exports = AppError;
