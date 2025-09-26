const asyncErrorHandler = require("../../utils/asyncErrorHandler")
const ResponseHandler = require("../../utils/apiResponseHandler")
const { ApiError, NotFoundError } = require("../../utils/customErrorHandler")
const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const bcrypt = require("bcryptjs");
const TempUser = require("../../models/tempUser.model");

// Helper function to generate tokens
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    console.log(
      "Access token : ",
      accessToken,
      " refresh token : ",
      refreshToken
    );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "error while generating access and refresh tokens");
  }
};

module.exports = {
  generateAccessAndRefreshToken,
};