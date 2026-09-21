const express = require("express");
const followController = require("../controllers/followController");
const { requireAuth } = require("../middleware/auth");
const validate = require("../middleware/validate");
const { mongoIdParam } = require("../validators/paramValidators");

const router = express.Router();

// Following/followers lists are public (no auth) — this mirrors most real
// social platforms, where anyone can see who follows whom.
router.get(
  "/:id/following",
  mongoIdParam("id"),
  validate,
  followController.listFollowing,
);
router.get(
  "/:id/followers",
  mongoIdParam("id"),
  validate,
  followController.listFollowers,
);

router.post(
  "/:id/follow",
  requireAuth,
  mongoIdParam("id"),
  validate,
  followController.followUser,
);
router.delete(
  "/:id/follow",
  requireAuth,
  mongoIdParam("id"),
  validate,
  followController.unfollowUser
);

module.exports = router;
