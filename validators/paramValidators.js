const { param } = require("express-validator");

// Without this, an id like "/api/posts/not-a-real-id" reaches Mongoose,
// which throws a CastError — a non-operational error our errorHandler
// treats as an unexpected 500. Checking the id's shape here first turns
// that into a clean 400 before it ever touches the database.
function mongoIdParam(paramName) {
  return [
    param(paramName).isMongoId().withMessage(`${paramName} must be a valid id`),
  ];
}

module.exports = { mongoIdParam };
