const followService = require("../services/followService");

async function followUser(req, res) {
  await followService.followUser(req.user.id, req.params.id);
  res.status(201).json({ status: "success", message: "Now following user" });
}

async function unfollowUser(req, res) {
  await followService.unfollowUser(req.user.id, req.params.id);
  res.status(204).send();
}

async function listFollowing(req, res) {
  const result = await followService.listFollowing(req.params.id, req.query);
  res.status(200).json({ status: "success", ...result });
}

async function listFollowers(req, res) {
  const result = await followService.listFollowers(req.params.id, req.query);
  res.status(200).json({ status: "success", ...result });
}

module.exports = { followUser, unfollowUser, listFollowing, listFollowers };
