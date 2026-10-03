/**
 * ApiError
 * --------
 * An Error that also carries an HTTP status code.
 * Services `throw new ApiError(404, 'Room not found')` and the global error
 * middleware turns it into a proper JSON response.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}
