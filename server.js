require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

const app = express();
const PORT = process.env.PORT;


app.use(helmet());

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : "*";
app.use(cors({ origin: allowedOrigins }));

// Rate limiting applied globally; auth routes get a second, stricter limiter
// layered on top of this one (see routes/authRoutes.js).
app.use(generalLimiter);

// Caps request body size at 10kb — nothing this API accepts (a post, a
// comment, a signup form) legitimately needs more than that, so this is a
// cheap guard against someone sending an enormous payload to waste server
// resources.
app.use(express.json({ limit: '10kb' }));

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts/:postId/comments", commentRoutes);
app.use("/api/users", userRoutes);

// Must be registered AFTER all routes — Express identifies "error-handling
// middleware" purely by it having 4 parameters (err, req, res, next), and
// only routes/middleware registered before it will have errors forwarded here.
app.use(errorHandler);

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start the server:", err.message);
  process.exit(1);
});

module.exports = app;