class ResponseError extends Error {
  constructor(status, message) {
    super(message || "Something went wrong.");
    this.status = status || 400;
  }
}

module.exports = ResponseError;
