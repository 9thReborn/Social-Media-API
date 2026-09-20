const User = require("../models/User");
const AppError = require("../utils/AppError");
const { signToken } = require("../utils/jwt");


async function signup({ first_name, last_name, username, email, password }) {
    if (!first_name || !last_name || !username || !email || !password) {
      throw new AppError(
        "first_name, last_name, username, email and password are all required",
        400,
      );
    }
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
        const field = existingUser.email === email ? "email" : "username";
        throw new AppError(`That ${field} is already in use`, 409);
    }

    const user = await User.create({
      first_name,
      last_name,
      username,
      email,
      password,
    });
    const token = signToken(user._id);

    return { user, token };
}

async function signin({ email, password }) {
    if (!email || !password) {
      throw new AppError("Email and password are required", 400);
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError("Invalid email or password", 401);
    }

    const token = signToken(user._id);
    return { user, token };

}

module.exports = { signup, signin };