const request = require("supertest");

let counter = 0;

function uniqueUser(overrides = {}) {
  counter += 1;
  return {
    first_name: "Test",
    last_name: `User${counter}`,
    username: `testuser${counter}`,
    email: `testuser${counter}@example.com`,
    password: "supersecure123",
    ...overrides,
  };
}

async function signup(app, overrides = {}) {
  const userData = uniqueUser(overrides);
  const res = await request(app).post("/api/auth/signup").send(userData);
  return {
    res,
    userData,
    token: res.body?.data?.token,
    user: res.body?.data?.user,
  };
}

async function createPost(app, token, overrides = {}) {
  const res = await request(app)
    .post("/api/posts")
    .set("Authorization", `Bearer ${token}`)
    .send({ title: "Test Post", content: "Test content", ...overrides });
  return res.body?.data?.post;
}

async function createPublishedPost(app, token, overrides = {}) {
  const draft = await createPost(app, token, overrides);
  const res = await request(app)
    .patch(`/api/posts/${draft._id}/publish`)
    .set("Authorization", `Bearer ${token}`);
  return res.body?.data?.post;
}

module.exports = { uniqueUser, signup, createPost, createPublishedPost };