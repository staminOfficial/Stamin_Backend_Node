const express = require("express");
const {
    initiateSignup,
} = require("../controllers/auth/signup.controller");
const Router = express.Router();

//signup routes
Router.route("/initiate-signup").post(initiateSignup);

module.exports = Router;