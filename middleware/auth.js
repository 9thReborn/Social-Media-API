const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");
const AppError = require("../utils/AppError");

function extractToken(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return null;
  return header.slice(7);
}

// Use on routes that REQUIRE a logged-in user (create post, follow, like).
// Rejects the request with 401 if there's no valid, unexpired token.
async function requireAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) throw new AppError("Authentication required", 401);

    const payload = verifyToken(token); // throws if expired/invalid/tampered
    const user = await User.findById(payload.sub);
    if (!user) throw new AppError("User for this token no longer exists", 401);

    req.user = user; // downstream controllers read req.user, never re-verify
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }
    next(err);
  }
}

// Use on routes that BEHAVE DIFFERENTLY for logged-in vs anonymous users but
// don't require login (list published posts, view a single post — #5, #6).
// Never rejects the request — just attaches req.user when a valid token
// happens to be present, and silently continues without one otherwise.
async function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub);
    if (user) req.user = user;
  } catch (err) {
    // An invalid/expired token on an optional route isn't an error worth
    // blocking the request over — it's equivalent to "not logged in".
  }
  next();
}

module.exports = { requireAuth, optionalAuth };