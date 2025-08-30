const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

//Function to get the curretn date with a 5:30 (330 minities) offset
const getIsDate = () => {
    const now = new Date();
    return new Date(now.getTime() + 330 * 60 * 1000); // Add 330 minitues in milliseconds
};

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: [true. "User ID required"],
    },
    tempUserId: {
        type: mongoose.Schema.Typed.ObjectId,
        ref: "TempUser",
    },
    otp: {
        type: String,
        required: true,
    },
    verificationToken: {
        type: String,
    },
    attempts: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
    },
    createdAt: { type: Date, default: () => getISTDate() },
    expiresAt: { type: Date },
});

//hasing the plain otp
otpSchema.pre("save", async function (next) {
    if (!this.isModified("otp")) return next();
    this.otp = await bcrypt.hash(this.otp, 10);
    next();
});

//otp validity checking method
otpSchema.method.isValidOTP = async function (otp) {
    try {
        return await bcrypt.compare(otp, this.otp);
    } catch (err) {
        return false; // Invalid OTP format or other errors
    }
};

// indexing to be added

const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;