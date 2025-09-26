const asyncErrorHandler = require("../../utils/asyncErrorHandler")
const ResponseHandler = require("../../utils/apiResponseHandler")
const { ApiError, NotFoundError } = require("../../utils/customErrorHandler")
const User = require("../../models/user.model");
const Otp = require("../../models/otp.model");
const bcrypt = require("bcryptjs");
const { generateAccessAndRefreshToken } = require("./login.controller");
const TempUser = require("../../models/tempUser.model");
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

// SEND otp to email function
const sendEmailVerificationOTP = async ({
    _id,
    email,
    firstName,
    lastName,
    forPasswordReset = false,
}) => {
   try {
     // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
    const now = new Date();
    const expireAt = new Date(now.getTime() + 332 * 60 * 1000); // OTP expires in 10 minitues

    // Save OTP in the database
    const newOtp = new Otp({
        [forPasswordReset ? "userId" : "tempUserId"]: _id,
        otp,
        expiresAt: expireAt,
    });
    await newOtp.save();

    // Otp Email Content
    const subject = forPasswordReset ? "Password Reset Verification" : "Email Verification";
    const text = `Your Verification Code is ${otp}`;
    const htmlContent = forPasswordReset
        ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; overflow: hidden;">
        <div style="background-color: #000000; color: white; padding: 16px; text-align: center; font-size: 24px;">
          Password Reset
        </div>
        <div style="padding: 16px;">
          <p style="font-size: 16px;">Dear ${firstName} ${lastName},</p>
          <p style="font-size: 16px;">We received a request to reset your password. Please use the code below to verify your request:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #000000; background-color: #f9f9f9; padding: 10px 20px; border: 1px dashed #000000; border-radius: 4px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 16px;">If you did not request a password reset, you can safely ignore this email.</p>
          <p style="font-size: 16px;">Best Regards,<br>Strength</p>
        </div>
        <div style="background-color: #f5f5f5; color: #666; text-align: center; font-size: 14px; padding: 16px;">
          &copy; ${new Date().getFullYear()} Strength. All rights reserved.
        </div>
      </div>
    `
        : `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; overflow: hidden;">
        <div style="background-color: #000000; color: white; padding: 16px; text-align: center; font-size: 24px;">
          Email Verification
        </div>
        <div style="padding: 16px;">
          <p style="font-size: 16px;">Dear ${firstName} ${lastName},</p>
          <p style="font-size: 16px;">Thank you for initiating sign up process! Please use the verification code below to verify your email address:</p>
          <div style="text-align: center; margin: 24px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #000000; background-color: #f9f9f9; padding: 10px 20px; border: 1px dashed #000000; border-radius: 4px;">
              ${otp}
            </span>
          </div>
          <p style="font-size: 16px;">If you did not sign up for this account, please ignore this email or contact support if you have questions.</p>
          <p style="font-size: 16px;">Best Regards,<br>Strength</p>
        </div>
        <div style="background-color: #f5f5f5; color: #666; text-align: center; font-size: 14px; padding: 16px;">
          &copy; ${new Date().getFullYear()} Strength. All rights reserved.
        </div>
      </div>
    `;

    // Otp email sending format
    const { data, error: resendError } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject,
        html: htmlContent,
    });

    if (resendError) {
        console.error(resendError);
        throw new ApiError(500, "Failed to send OTP !");
    }
    console.log("OTP sent successfully !");
   } catch (error) {
    console.log(error);
    throw new ApiError(500, "Something went wrong ! Resend OTP !");
   }
};

// initiate signup function
const initiateSignup = asyncErrorHandler(async (req, res, next) => {
    const { email, firstName, lastName, dateOfBirth } = req.body;

    // Basic validation
    if (!email || !firstName || !lastName) {
        throw new ApiError(422, "Email and first name and last name are required for signup!");
    }

    // check if user already exists
    const existingUser = await User.findOne({ email }).select(
        "_id email isEmailVerified firstName"
    );

    if (existingUser && existingUser.isEmailVerified) {
        throw new ApiError(409, "Email already in use!");
    } else if (existingUser && !existingUser.isEmailVerified) {
        //Send OTP for verification
        await sendEmailVerificationOTP({
            _id: existingUser._id,
            email: existingUser.email,
            firstName: existingUser.firstName,
        });
        
        return res.status(201).json(
            new ResponseHandler(201, "OTP sent to email. Please verify to proceed.", {
                user: { _id: existingUser._id, email: existingUser.email },
            })
        );
    }

    //Create a temporary user
    const tempUser = new TempUser({
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(dateOfBirth && { dateOfBirth }),
        isEmailVerified: false,
    });
    await tempUser.save();

    // Send OTP
    await sendEmailVerificationOTP({
        _id: tempUser._id,
        email: tempUser.email,
        firstName: tempUser.firstName,
    });

    return res.status(201).json(
        new ResponseHandler(201, "OTP sent to email. Please verify to proceed.", {
            user: { _id: tempUser._id, email: tempUser.email },
        })
    );

});

// verify otp
const verifyOtp = asyncErrorHandler(async (req, res, next) => {
  const {_id,otp} = req.body;

  if(!_id || !otp) {
    throw new ApiError(422, "User ID and OTP are required");
  }

  //Fetch OTP from DB
  const otpRecord = await Otp.findOne({ tempUserId: _id }).sort({
    createdAt: -1,
  });

  const now = new Date();

  if(!otpRecord || otpRecord.expiresAt < now) {
    await Otp.deleteMany({ tempUserId: _id });
    throw new ApiError(400, "Invalid or expired OTP!");
  }

    const isMatch = await bcrypt.compare(otp, otpRecord.otp);
  if (!isMatch) {
    throw new ApiError(400, "Incorrect OTP!");
  }
  try {
    // Mark user as verified
    const user = await TempUser.findById(_id);

    user.isEmailVerified = true;
    await user.save();

    await Otp.deleteMany({ tempUserId: _id }); // Clean up used OTP

    return res
      .status(200)
      .json(new ResponseHandler(200, "Email verified! Complete your profile."));
  } catch (error) {
    console.log("Otp verifying failed", error);
    throw new ApiError(500, "An error occurred while verifying the otp");
  }
});

//resend otp
const resendOtp = asyncErrorHandler(async (req, res, next) => {
  const { _id, email } = req.body;

  const user = await TempUser.findById(_id);

  if (!user) {
    throw new NotFoundError("User not found !");
  }

  // Send OTP
  await sendEmailVerificationOTP({ _id, email });

  return res
    .status(201)
    .json(
      new ResponseHandler(
        201,
        "OTP sent to email again. Please verify to proceed."
      )
    );
});


// complete creating account
const completeSignup = asyncErrorHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password ) {
    throw new ApiError(
      422,
      "All fields, including location coordinates, are required to complete profile!"
    );
  }
  console.log("Complete signup called with email:", email);

  const tempUser = await TempUser.findOne({
    email,
    isEmailVerified: true,
  }).sort({ createdAt: -1 });
  console.log(tempUser);
  if (!tempUser) {
    throw new ApiError(404, "User not found or not verified!");
  }

  const tempUserData = tempUser.toObject();
  delete tempUserData._id;
  delete tempUserData.createdAt;
  delete tempUserData.updatedAt;

  // Create a new user
  const user = new User({
    ...tempUserData,
    password,
  });

  // Save user data
  await user.save();

  // Generate tokens
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  // Delete the particular temp user
  await TempUser.deleteOne({ _id: tempUser._id });

  return res.status(200).json(
    new ResponseHandler(
      200,
      "Profile completed! Account created successfully.",
      {
        accessToken,
        refreshToken,
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          headline: user.headline,
          dateOfBirth: user.dateOfBirth,
          age: user.age,
          address: user.address,
          isEmailVerified: user.isEmailVerified,
          isProfileComplete: user.isProfileComplete,
          isWatchConnected: user.isWatchConnected
        },
      }
    )
  );
});

module.exports = {
    initiateSignup,
    verifyOtp,
    resendOtp,
    completeSignup
}

