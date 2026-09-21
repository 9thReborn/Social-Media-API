const Like = require("../models/Like");
const Post = require("../models/Post");
const AppError = require("../utils/AppError");

async function likePost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }
  if (post.state !== "published") {
    throw new AppError("You can only like published posts", 400);
  }

  const existing = await Like.findOne({ post: postId, user: userId });
  if (existing) {
    throw new AppError("You have already liked this post", 409);
  }

  await Like.create({ post: postId, user: userId });

  // Atomic increment — same reasoning as comment_count: avoids a
  // read-modify-write race if two likes land on the same post at once.
  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { like_count: 1 } },
    { returnDocument: "after" },
  );
  return updated;
}

async function unlikePost(postId, userId) {
  const post = await Post.findById(postId);
  if (!post) {
    throw new AppError("Post not found", 404);
  }

  const existing = await Like.findOneAndDelete({ post: postId, user: userId });
  if (!existing) {
    throw new AppError("You have not liked this post", 404);
  }

  const updated = await Post.findByIdAndUpdate(
    postId,
    { $inc: { like_count: -1 } },
    { returnDocument: "after" },
  );
  return updated;
}

module.exports = { likePost, unlikePost };