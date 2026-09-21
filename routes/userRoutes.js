const express = require("express");
const followController = require("../controllers/followController");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Following/followers lists are public (no auth) — this mirrors most real
// social platforms, where anyone can see who follows whom.
router.get("/:id/following", followController.listFollowing);
router.get("/:id/followers", followController.listFollowers);

router.post("/:id/follow", requireAuth, followController.followUser);
router.delete("/:id/follow", requireAuth, followController.unfollowUser);

module.exports = router;
