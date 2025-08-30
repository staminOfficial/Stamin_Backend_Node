const express = require("express");
const {
    initiateSignup,
} = require("../controllers/auth/signup.controller");


//signup routes
Router.route("/initiate-signup").post(initiateSignup);

module.exports = Router;