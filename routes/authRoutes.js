const express = require("express");
const authController = require("../controllers/authController");
const validate = require('../middleware/validate');
const { signupRules, signinRules } = require('../validators/authValidators');
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/signup",
  authLimiter,
  signupRules,
  validate,
  authController.signup,
);
router.post(
  "/signin",
  authLimiter,
  signinRules,
  validate,
  authController.signin
);

module.exports = router;
