require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const commentRoutes = require("./routes/commentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT;

app.use(express.json()); // parses JSON request bodies into req.body

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/posts/:postId/comments", commentRoutes);

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