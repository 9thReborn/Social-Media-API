const Post = require("../models/Post");
const AppError = require("../utils/AppError");

async function getOwnedPost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError("Post not found", 404);

  // .toString() because `post.author` is an ObjectId and `userId` is a
  // string (it comes off req.user._id) — comparing them with === would
  // always be false even when they represent the same id.
  if (post.author.toString() !== userId.toString()) {
    throw new AppError("You do not own this post", 403);
  }
  return post;
}

async function createPost(authorId, { title, content, tags }) {
  if (!title || !content) {
    throw new AppError("title and content are required", 400);
  }
  return Post.create({ title, content, tags, author: authorId }); // state defaults to 'draft'
}

async function updatePost(postId, userId, { title, content, tags }) {
  const post = await getOwnedPost(postId, userId);

  // Deliberately whitelist only these three fields — `state`, `author`,
  // `like_count` etc. can NEVER be changed through this endpoint, even if
  // a client includes them in the request body.
  if (title !== undefined) post.title = title;
  if (content !== undefined) post.content = content;
  if (tags !== undefined) post.tags = tags;

  return post.save();
}

async function publishPost(postId, userId) {
  const post = await getOwnedPost(postId, userId);
  post.state = "published";
  return post.save();
}

async function deletePost(postId, userId) {
  const post = await getOwnedPost(postId, userId);
  await post.deleteOne();
}

module.exports = {
  createPost,
  updatePost,
  publishPost,
  deletePost,
  getOwnedPost,
};