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

    // console.log(
    //   "Access token : ",
    //   accessToken,
    //   " refresh token : ",
    //   refreshToken
    // );

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "error while generating access and refresh tokens");
  }
};


// User login controller
const userLogin = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    throw new ApiError(
      422,
      "Email or Username along with password are required!"
    );
  }

  // Check if the user exists and is verified
  const user = await User.findOne({ email });
  console.log(user);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Email not verified! Please verify your email first."
    );
  }
  if (!user.password || !user.address) {
    throw new ApiError(403, "Signup process is not completed !");
  }

  // Validate the password
  const isPasswordMatch = await user.isValidPassword(password);
  if (!isPasswordMatch) {
    throw new ApiError(401, "Invalid password!");
  }

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const { password: _, refreshToken: __, ...safeUser } = user._doc;

  // Return success response with tokens and user details
  return res.status(200).json(
    new ResponseHandler(200, "Login successful!", {
      accessToken,
      refreshToken,
      user: safeUser,
    })
  );
});



const refreshAccessToken = async (req, res) => {
  const incomingRefreshToken = req.body.refreshToken;

  // console.log("Incoming : ", incomingRefreshToken);

  if (!incomingRefreshToken) {
    throw new ApiError(401, "refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "user not found or token is invalid");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "invalid refresh token");
    }

    const { accessToken, refreshToken: newrefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    // console.log(accessToken, newrefreshToken);

    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-refresh-token", newrefreshToken);

    return res.status(200).json(
      new ResponseHandler(200, "Access token refreshed successfully!", {
        accessToken,
        refreshToken: newrefreshToken,
      })
    );
  } catch (error) {
    throw new ApiError(401, error?.message || "invalid refresh token");
  }
};


module.exports = {
  userLogin,
  generateAccessAndRefreshToken,
  refreshAccessToken
};