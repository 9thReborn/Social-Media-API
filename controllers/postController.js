const postService = require("../services/postService");
const AppError = require("../utils/AppError");

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

// GET /api/posts — public, published-only, paginated/searchable/sortable.
async function listPosts(req, res) {
  const result = await postService.listPublishedPosts(req.query);
  res.status(200).json({ status: 'success', ...result });
}

// GET /api/posts/mine — requireAuth. Every post (draft + published) the
// logged-in user owns, optionally narrowed with ?state=draft|published.
async function listMyPosts(req, res) {
  const result = await postService.listOwnPosts(req.user.id, req.query);
  res.status(200).json({ status: 'success', ...result });
}

// GET /api/posts/:id — optionalAuth. Published posts are visible to anyone;
// a draft is visible only to its own author (via req.user, if present).
async function getPost(req, res) {
  const requestingUserId = req.user ? req.user.id : null;
  const post = await postService.getSinglePost(req.params.id, requestingUserId);
 
  if (!post) {
    throw new AppError('Post not found', 404);
  }
 
  res.status(200).json({ status: 'success', data: { post } });
}

module.exports = {
  createPost,
  updatePost,
  publishPost,
  deletePost,
  listPosts,
  listMyPosts,
  getPost,
};
