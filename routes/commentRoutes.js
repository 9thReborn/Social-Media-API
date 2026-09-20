const express = require("express");
const commentController = require("../controllers/commentController");
const { requireAuth } = require("../middleware/auth");

// mergeParams: true — without this, :postId from wherever this router gets
// mounted (server.js mounts it at /api/posts/:postId/comments) would NOT be
// visible on req.params inside these handlers.
const router = express.Router({ mergeParams: true });

router.post("/", requireAuth, commentController.createComment); // must be logged in to comment
router.get("/", commentController.listComments); // public — anyone can read comments

module.exports = router;
