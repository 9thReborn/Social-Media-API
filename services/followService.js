const Follow = require("../models/Follow");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { getPagination, paginatedResponse } = require("../utils/pagination");

const PUBLIC_USER_FIELDS = "first_name last_name username bio";

async function assertUserExists(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

async function followUser(followerId, targetUserId) {
  if (followerId.toString() === targetUserId.toString()) {
    throw new AppError("You cannot follow yourself", 400);
  }

  await assertUserExists(targetUserId);

  const existing = await Follow.findOne({
    follower: followerId,
    following: targetUserId,
  });
  if (existing) {
    throw new AppError("You are already following this user", 409);
  }

  const follow = await Follow.create({
    follower: followerId,
    following: targetUserId,
  });
  return follow;
}

async function unfollowUser(followerId, targetUserId) {
  const follow = await Follow.findOneAndDelete({
    follower: followerId,
    following: targetUserId,
  });
  if (!follow) {
    throw new AppError("You are not following this user", 404);
  }
}


// Users that :userId follows.
async function listFollowing(userId, query) {
  await assertUserExists(userId);
 
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20 });
 
  const [follows, totalCount] = await Promise.all([
    Follow.find({ follower: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('following', PUBLIC_USER_FIELDS),
    Follow.countDocuments({ follower: userId }),
  ]);
 
  const users = follows.map((f) => f.following);
  return paginatedResponse(users, { page, limit }, totalCount);
}

// Users that follow :userId.
async function listFollowers(userId, query) {
  await assertUserExists(userId);
 
  const { page, limit, skip } = getPagination(query, { defaultLimit: 20 });
 
  const [follows, totalCount] = await Promise.all([
    Follow.find({ following: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('follower', PUBLIC_USER_FIELDS),
    Follow.countDocuments({ following: userId }),
  ]);
 
  const users = follows.map((f) => f.follower);
  return paginatedResponse(users, { page, limit }, totalCount);
}
 
module.exports = { followUser, unfollowUser, listFollowing, listFollowers };