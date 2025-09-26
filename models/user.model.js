const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

// Function to get the current date with a 5:30 (330 minutes) offset
const getISTDate = () => {
  const now = new Date();
  return new Date(now.getTime() + 330 * 60 * 1000); // Add 330 minutes in milliseconds
};

const userSchema = new mongoose.Schema(
    {
        id: { type: String, default: () => uuidv4() },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        username: { type: String },
        isEmailVerified: { type: Boolean, default: false },
        password: { type: String },
        profilePic: { type: String },
        coverPic: { type: String },
        headline: {
            type: String,
            required: true,
            default: "Hey! I am on Stamin",
        },
        dateOfBirth: { type: Date, required: true },
        address: {
            city: String,
            state: String,
            country: String,
            location: {
                type: { type: String, enum: ["Point"], default: "Point" },
                coordinates: { type: [Number], default: [0,0] },
            },
        },
        refreshToken: {
            type: String,
        },
        isProfileComplete: { type: Boolean, default: false },
        isWatchConnected: { type: Boolean, default: false },
    }
);

// 🔑 Add token generation methods
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_ACCESS_SECRET,   // must be defined in .env
    { expiresIn: "15m" }             // adjust expiry as needed
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET,  // must be defined in .env
    { expiresIn: "7d" }
  );
};

module.exports = mongoose.model("User", userSchema);