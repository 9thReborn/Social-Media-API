const request = require("supertest");
const app = require("../app");
const { connect, clearDatabase, closeDatabase } = require("./setup/db");
const { signup, createPost, createPublishedPost } = require("./helpers");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});


describe('POST /api/posts/:postId/comments', () => {

    test("rejects an unauthenticated request with 401", async () => {
      const { token } = await signup(app);
      const post = await createPublishedPost(app, token);

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .send({ content: "Nice post!" });
      expect(res.status).toBe(401);
    });

    test("lets a logged-in user comment on a published post", async () => {
      const { token: authorToken } = await signup(app);
      const post = await createPublishedPost(app, authorToken);
      const { token: commenterToken } = await signup(app);

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set("Authorization", `Bearer ${commenterToken}`)
        .send({ content: "Nice post!" });

      expect(res.status).toBe(201);
      expect(res.body.data.comment.content).toBe("Nice post!");
    });

    test("rejects a comment on a draft post with 400", async () => {
      const { token } = await signup(app);
      const post = await createPost(app, token); // still a draft

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Should not work" });

      expect(res.status).toBe(400);
    });

    test("rejects empty content with 400", async () => {
      const { token } = await signup(app);
      const post = await createPublishedPost(app, token);

      const res = await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "" });
      expect(res.status).toBe(400);
    });

    test("atomically increments the post's comment_count", async () => {
      const { token } = await signup(app);
      const post = await createPublishedPost(app, token);

      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "One" });
      await request(app)
        .post(`/api/posts/${post._id}/comments`)
        .set("Authorization", `Bearer ${token}`)
        .send({ content: "Two" });

      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.body.data.post.comment_count).toBe(2);
    });

});

describe("GET /api/posts/:postId/comments", () => {
  test("is public (no auth required) and returns comments oldest-first", async () => {
    const { token } = await signup(app);
    const post = await createPublishedPost(app, token);

    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "First" });
    await request(app)
      .post(`/api/posts/${post._id}/comments`)
      .set("Authorization", `Bearer ${token}`)
      .send({ content: "Second" });

    const res = await request(app).get(`/api/posts/${post._id}/comments`);
    expect(res.status).toBe(200);
    expect(res.body.data.map((c) => c.content)).toEqual(["First", "Second"]);
  });
});