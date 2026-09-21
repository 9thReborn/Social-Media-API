const { body } = require("express-validator");

const signupRules = [
  body("first_name").trim().notEmpty().withMessage("first_name is required"),
  body("last_name").trim().notEmpty().withMessage("last_name is required"),
  body("username")
    .trim()
    .notEmpty()
    .withMessage("username is required")
    .isLength({ min: 3, max: 30 })
    .withMessage("username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("username can only contain letters, numbers, and underscores"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("password is required")
    .isLength({ min: 8 })
    .withMessage("password must be at least 8 characters"),
];

const signinRules = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("email is required")
    .isEmail()
    .withMessage("email must be valid")
    .normalizeEmail(),
  body("password").notEmpty().withMessage("password is required"),
];

module.exports = { signupRules, signinRules };
