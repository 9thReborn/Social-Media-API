const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // lets us .populate('author') to pull in the user doc — req #25
      required: true,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      set: (tags) => tags.map((t) => t.trim().toLowerCase()), // normalize so "JS" and "js" are the same tag
    },
    state: {
      type: String,
      enum: ["draft", "published"],
      default: "draft", // req #8 — every new post starts as a draft
    },
    like_count: {
      type: Number,
      default: 0,
      min: 0,
    },
    comment_count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }, // createdAt satisfies req #21's "timestamp"
);

// Supports req #23 (search by title/tags) and #24 (sort/filter) efficiently —
// without these, MongoDB would have to scan every document on each request.
postSchema.index({ title: "text", tags: "text" });
postSchema.index({ state: 1, createdAt: -1 });
postSchema.index({ state: 1, like_count: -1 });
postSchema.index({ state: 1, comment_count: -1 });

module.exports = mongoose.model("Post", postSchema);
