const Post = require("../models/Post");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPagination, paginatedResponse } = require("../utils/pagination");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

const SORT_FIELD_MAP = {
  timestamp: "createdAt",
  like_count: "like_count",
  comment_count: "comment_count",
};

// Public listing: published posts only, paginated, searchable, sortable.
async function listPublishedPosts(query) {
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20 });

  const filter = { state: "published" };

  if (query.search) {
    const safe = escapeRegex(query.search.trim());
    const regex = new RegExp(safe, "i");

    // Post fields (title/tags) live on Post; "author" search means matching
    // against the User collection first, then filtering posts by those ids —
    // Mongoose can't filter on a populated/joined field directly.
    const matchingAuthors = await User.find({
      $or: [{ username: regex }, { first_name: regex }, { last_name: regex }],
    }).select("_id");

    filter.$or = [
      { title: regex },
      { tags: regex },
      { author: { $in: matchingAuthors.map((u) => u._id) } },
    ];
  }

  let sortField = SORT_FIELD_MAP[query.sort] || "createdAt";
  const sortOrder = query.order === "asc" ? 1 : -1;

  const [posts, totalCount] = await Promise.all([
    Post.find(filter)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit)
      .populate("author", "first_name last_name username"),
    Post.countDocuments(filter),
  ]);

  return paginatedResponse(posts, { page, limit }, totalCount);

}

// Single post: published posts are visible to anyone; a draft is visible
// only to its own author. Returns null (not an error) when hidden, so the
// controller can turn that into a 404 — never a 403, which would confirm a
// draft exists at that id.
async function getSinglePost(postId, requestingUserId) {
  const post = await Post.findById(postId).populate('author', 'first_name last_name username');
 
  if (!post) return null;
 
  const isOwner = requestingUserId && post.author._id.toString() === requestingUserId.toString();
 
  if (post.state !== 'published' && !isOwner) {
    return null;
  }
 
  return post;
}

module.exports = {
  createPost,
  updatePost,
  publishPost,
  deletePost,
  getOwnedPost,
  listPublishedPosts,
  getSinglePost,
};