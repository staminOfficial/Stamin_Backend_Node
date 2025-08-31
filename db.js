const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;
    console.log("Connecting to:", uri);
    await mongoose.connect(uri);
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
  }
};

module.exports = connectDB;
