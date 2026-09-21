const { body } = require("express-validator");

const createPostRules = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("title is required")
    .isLength({ max: 200 })
    .withMessage("title must be 200 characters or fewer"),
  body("content").trim().notEmpty().withMessage("content is required"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("tags must be an array of strings"),
  body("tags.*")
    .optional()
    .isString()
    .trim()
    .isLength({ max: 30 })
    .withMessage("each tag must be 30 characters or fewer"),
];

// Same fields as createPostRules, but every field is optional — an update
// can touch just one of title/content/tags. `.optional()` means "skip the
// rest of this chain if the field is absent," it does NOT mean the field
// is allowed to be present-but-empty.
const updatePostRules = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("title cannot be empty")
    .isLength({ max: 200 }),
  body("content")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("content cannot be empty"),
  body("tags")
    .optional()
    .isArray()
    .withMessage("tags must be an array of strings"),
  body("tags.*").optional().isString().trim().isLength({ max: 30 }),
];

module.exports = { createPostRules, updatePostRules };
