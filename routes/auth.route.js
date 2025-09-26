const express = require("express");
const {
    initiateSignup, 
    verifyOtp,
    resendOtp,
    completeSignup
} = require("../controllers/auth/signup.controller");
const Router = express.Router();

//signup routes
Router.route("/initiate-signup").post(initiateSignup);
Router.route("/verify-otp").post(verifyOtp);
Router.route("/resend-otp").post(resendOtp);
Router.route("/complete-signup").post(completeSignup);

module.exports = Router;