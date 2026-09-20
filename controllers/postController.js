const postService = require("../services/postService");

async function createPost(req, res) {
  const post = await postService.createPost(req.user._id, req.body);
  res.status(201).json({ success: true, data: post });
}

async function updatePost(req, res) {
  const post = await postService.updatePost(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.status(200).json({ success: true, data: post });
}

async function publishPost(req, res) {
  const post = await postService.publishPost(req.params.id, req.user._id);
  res.status(200).json({ success: true, data: post });
}

async function deletePost(req, res) {
  await postService.deletePost(req.params.id, req.user._id);
  res.status(204).send(); // 204 No Content — deletion succeeded, nothing to return
}

module.exports = { createPost, updatePost, publishPost, deletePost };
