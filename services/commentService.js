const Comment = require("../models/Comment");
const Post = require("../models/Post");
const AppError = require("../utils/AppError");
const { getPagination, paginatedResponse } = require("../utils/pagination");

async function createComment(postId, authorId, content) {
  if (!content || !content.trim()) {
    throw new AppError("Comment content is required", 400);
  }

  const post = await Post.findById(postId);
  if (!post) throw new AppError("Post not found", 404);
  if (post.state !== "published") {
    throw new AppError("You can only comment on published posts", 400);
  }

  const comment = await Comment.create({
    post: postId,
    author: authorId,
    content,
  });

  // Atomic increment — see the note in the writeup on why this can't be a
  // read-then-save on the post document.
  await Post.findByIdAndUpdate(postId, { $inc: { comment_count: 1 } });

  return comment.populate("author", "first_name last_name username");
}

async function listComments(postId, query) {
  const post = await Post.findById(postId);
  if (!post) throw new AppError("Post not found", 404);

  const { page, limit, skip } = getPagination(query);

  const [comments, totalCount] = await Promise.all([
    Comment.find({ post: postId })
      .populate("author", "first_name last_name username")
      .sort({ createdAt: 1 }) // oldest first — reads like an actual conversation thread
      .skip(skip)
      .limit(limit),
    Comment.countDocuments({ post: postId }),
  ]);

  return paginatedResponse(comments, { page, limit }, totalCount);
}

module.exports = { createComment, listComments };