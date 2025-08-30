const mongoose = require("mongoose");

// Function to get the current date with a 5:30 (330 minutes) offset
const getISTDate = () => {
  const now = new Date();
  return new Date(now.getTime() + 330 * 60 * 1000); // Add 330 minutes in milliseconds
};

const tempUserSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, default: null },
    email: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, defaul: () => getISTDate() },
    updatedAt: { type: Date, default: () => getISTDate() },
});

module.exports = mongoose.model("TempUser", tempUserSchema);