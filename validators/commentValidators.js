const { body } = require("express-validator");

const createCommentRules = [
  body("content")
    .trim()
    .notEmpty()
    .withMessage("content is required")
    .isLength({ max: 1000 })
    .withMessage("content must be 1000 characters or fewer"),
];

module.exports = { createCommentRules };
