const express = require("express");
const postController = require("../controllers/postController");
const likeController = require("../controllers/likeController");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  createPostRules,
  updatePostRules,
} = require("../validators/postValidators");
const { mongoIdParam } = require("../validators/paramValidators");

const router = express.Router();

// Public routes first.
router.get("/", postController.listPosts);

// Registered BEFORE /:id — otherwise Express would match "mine" as the
// value of :id and this route would never be reached.
router.get("/mine", requireAuth, postController.listMyPosts);

// NOTE: when the owner's-own-posts endpoint (e.g. GET /mine) is added, it
// MUST be registered above this line — otherwise Express will match "mine"
// as the value of :id here and it will never reach the /mine handler.
router.get(
  "/:id",
  mongoIdParam("id"),
  validate,
  optionalAuth,
  postController.getPost,
);

// Every route below requires a logged-in user — creating, editing,
// publishing, and deleting are all owner-only actions (req #7, #9, #10, #11).
router.post(
  "/",
  requireAuth,
  createPostRules,
  validate,
  postController.createPost,
);
router.patch(
  "/:id",
  requireAuth,
  mongoIdParam("id"),
  updatePostRules,
  validate,
  postController.updatePost,
);
router.patch(
  "/:id/publish",
  requireAuth,
  mongoIdParam("id"),
  validate,
  postController.publishPost,
);
router.delete(
  "/:id",
  requireAuth,
  mongoIdParam("id"),
  validate,
  postController.deletePost,
);

router.post(
  "/:id/like",
  requireAuth,
  mongoIdParam("id"),
  validate,
  likeController.likePost,
);
router.delete(
  "/:id/like",
  requireAuth,
  mongoIdParam("id"),
  validate,
  likeController.unlikePost,
);

module.exports = router;
