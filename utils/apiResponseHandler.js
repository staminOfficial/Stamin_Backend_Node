class ResponseHandler {
  constructor(statusCode, message = "success", data) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    if (process.env.NODE_ENV === "development") {
      this.worker = process.pid;
      this.timeStamp = Date.now();
    }
  }
}

module.exports = ResponseHandler;
