const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");

const userController = require("../controller/users.js");

// ================= SIGNUP =================

// GET signup page
router.get("/signup", userController.renderSignupForm);

// POST signup
router.post("/signup", 
    wrapAsync(userController.signup)
);


// ================= LOGIN =================

// GET login page
router.get("/login", userController.renderLoginForm);

// POST login
router.post(
    "/login",
    saveRedirectUrl,
    passport.authenticate("local", {
        failureRedirect: "/login",
        failureFlash: true,
    }),
   userController.login
);


// ================= LOGOUT =================

router.get("/logout", userController.logout);


// ================= EXPORT =================

module.exports = router;