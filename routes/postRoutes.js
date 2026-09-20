const express = require("express");
const postController = require("../controllers/postController");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// Public routes first.
router.get('/', postController.listPosts);


// Registered BEFORE /:id — otherwise Express would match "mine" as the
// value of :id and this route would never be reached.
router.get('/mine', requireAuth, postController.listMyPosts);

// NOTE: when the owner's-own-posts endpoint (e.g. GET /mine) is added, it
// MUST be registered above this line — otherwise Express will match "mine"
// as the value of :id here and it will never reach the /mine handler.
router.get('/:id', optionalAuth, postController.getPost);

// Every route below requires a logged-in user — creating, editing,
// publishing, and deleting are all owner-only actions (req #7, #9, #10, #11).
router.post("/", requireAuth, postController.createPost);
router.patch("/:id", requireAuth, postController.updatePost);
router.patch("/:id/publish", requireAuth, postController.publishPost);
router.delete("/:id", requireAuth, postController.deletePost);

// GET routes (public listing + single post + "my posts") come in the next
// step — they need optionalAuth and pagination, which deserve their own pass.

module.exports = router;
