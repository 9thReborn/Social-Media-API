const likeService = require("../services/likeService");

async function likePost(req, res) {
  const post = await likeService.likePost(req.params.id, req.user.id);
  res
    .status(201)
    .json({ status: "success", data: { like_count: post.like_count } });
}

async function unlikePost(req, res) {
  const post = await likeService.unlikePost(req.params.id, req.user.id);
  res
    .status(200)
    .json({ status: "success", data: { like_count: post.like_count } });
}

module.exports = { likePost, unlikePost };
