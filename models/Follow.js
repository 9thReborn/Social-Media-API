const mongoose = require("mongoose");

const followSchema = new mongoose.Schema(
  {
    follower: {
      // the user who is doing the following
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      // the user being followed
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true },
);

// Belt-and-suspenders against duplicate follows: the service layer checks
// first and returns a clean 409, but this unique compound index also stops
// a duplicate at the database level (e.g. two near-simultaneous requests
// racing past the service-layer check).
followSchema.index({ follower: 1, following: 1 }, { unique: true });

followSchema.set("toJSON", {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Follow", followSchema);
