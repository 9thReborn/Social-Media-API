const express = require("express");
const postController = require("../controllers/postController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Every route below requires a logged-in user — creating, editing,
// publishing, and deleting are all owner-only actions (req #7, #9, #10, #11).
router.post("/", requireAuth, postController.createPost);
router.patch("/:id", requireAuth, postController.updatePost);
router.patch("/:id/publish", requireAuth, postController.publishPost);
router.delete("/:id", requireAuth, postController.deletePost);

// GET routes (public listing + single post + "my posts") come in the next
// step — they need optionalAuth and pagination, which deserve their own pass.

module.exports = router;
