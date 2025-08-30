const express = require("express");
const cors = require("cors");
const { ApiError } = require("./utils/customErrorHandler");
const globalErrorHandler = require("./controllers/error.controller");

//import routes
const authRouter = require("./routes/auth.route");

const app = express();


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS options
const corsOptions = {
  origin: process.env.CLIENT_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Origin",
    "Access-Control-Allow-Methods",
    "Last-Event-ID",
  ],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// ✅ Health check route (before mounting /api/v1)
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({ message: "Everything is working fine!" });
});

// Routes
app.use("/api/v1", authRouter);
//more routers here....

// Default route for undefined endpoints
app.all("*", (req, res, next) => {
  next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// Global error handler
app.use(globalErrorHandler);

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", {
    message: err.message,
    stack: err.stack,
  });
  process.exit(1); // Optional: restart via PM2
});

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", {
    message: err.message,
    stack: err.stack,
  });
});

module.exports = app;
