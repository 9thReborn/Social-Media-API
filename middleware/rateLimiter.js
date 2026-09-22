const rateLimit = require("express-rate-limit");

const isTestEnv = process.env.NODE_ENV === "test";

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isTestEnv ? 100000 : 300, // 300 requests per IP per window
  standardHeaders: true, // adds RateLimit-* response headers
  legacyHeaders: false, // omit the older X-RateLimit-* headers
  message: {
    status: "error",
    message: "Too many requests, please try again later",
  },
});

// Applied only to signup/signin. Much stricter 
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTestEnv ? 100000 : 10, // 10 signup/signin attempts per IP per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many auth attempts, please try again later",
  },
});

module.exports = { generalLimiter, authLimiter };
