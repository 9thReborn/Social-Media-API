const { validationResult } = require("express-validator");
const AppError = require("../utils/AppError");

// Runs after a chain of express-validator checks (see validators/*.js).
// Those checks don't throw by themselves — they just record problems onto
// `req`. This middleware is what actually reads that and turns it into a
// 400 response, so it must be the last thing in the route's middleware
// list, after the validation chain and before the controller.
function validate(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  // Collect into "field: message" pairs — easier to read than
  // express-validator's default array-of-objects shape.
  const details = errors.array().map((e) => `${e.path}: ${e.msg}`);
  next(new AppError(`Validation failed - ${details.join("; ")}`, 400));
}

module.exports = validate;
