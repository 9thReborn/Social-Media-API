const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Same pattern as Follow's unique index: the service layer checks for an
// existing like first and returns a clean 409, this is the database-level
// backstop against a duplicate slipping through (e.g. a race between two
// near-simultaneous requests from the same user).
likeSchema.index({ post: 1, user: 1 }, { unique: true });

likeSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Like", likeSchema);
