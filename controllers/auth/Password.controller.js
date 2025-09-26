const User = require("../../models/user.model");
const OTP = require("../../models/otp.model");
const bcrypt = require("bcryptjs");
const asyncErrorHandler = require("../../utils/asyncErrorHandler");
const { ApiError } = require("../../utils/customErrorHandler");
const ResponseHandler = require("../../utils/apiResponseHandler");
const { sendEmailVerificationOTP } = require("./signup.controller");


  //Creating new password
  const setNewPassword = asyncErrorHandler(async (req, res, next) => {
    const { resetToken, newPassword } = req.body;
  
    if (!resetToken || !newPassword) {
      throw new ApiError(400, "Reset token and new password are required.");
    }
  
    if (newPassword.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters long.");
    }
  
    // Extract userId from resetToken (your format is userId.timestamp)
    const userId = resetToken.split(".")[0];
    const user = await User.findById(userId);
  
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
  
    user.password = newPassword;
    await user.save();
  
    return res
      .status(200)
      .json(new ResponseHandler(200, "Password updated successfully."));
  });