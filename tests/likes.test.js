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

describe('POST /api/posts/:id/like', () => {

    test('rejects an unauthenticated request with 401', async () => {
        const { token } = await signup(app);
        const post = await createPublishedPost(app, token);
 
        const res = await request(app).post(`/api/posts/${post._id}/like`);
        expect(res.status).toBe(401);
    });

    test("lets a logged-in user like a published post and increments like_count", async () => {
      const { token: authorToken } = await signup(app);
      const post = await createPublishedPost(app, authorToken);
      const { token: likerToken } = await signup(app);

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set("Authorization", `Bearer ${likerToken}`);

      expect(res.status).toBe(201);
      expect(res.body.data.like_count).toBe(1);
    });

    test("rejects liking a draft post with 400", async () => {
      const { token } = await signup(app);
      const post = await createPost(app, token); // still a draft

      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    test("rejects a duplicate like with 409, and does not double-increment", async () => {
      const { token } = await signup(app);
      const post = await createPublishedPost(app, token);

      await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set("Authorization", `Bearer ${token}`);
      const res = await request(app)
        .post(`/api/posts/${post._id}/like`)
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(409);

      const getRes = await request(app).get(`/api/posts/${post._id}`);
      expect(getRes.body.data.post.like_count).toBe(1);
    });
    
});


describe("DELETE /api/posts/:id/like", () => {

  test("unlikes a post and decrements like_count", async () => {
    const { token } = await signup(app);
    const post = await createPublishedPost(app, token);
    await request(app)
      .post(`/api/posts/${post._id}/like`)
      .set("Authorization", `Bearer ${token}`);

    const res = await request(app)
      .delete(`/api/posts/${post._id}/like`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.like_count).toBe(0);
  });

  test("returns 404 when the post was never liked, and does not go negative", async () => {
    const { token } = await signup(app);
    const post = await createPublishedPost(app, token);

    const res = await request(app)
      .delete(`/api/posts/${post._id}/like`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);

    const getRes = await request(app).get(`/api/posts/${post._id}`);
    expect(getRes.body.data.post.like_count).toBe(0);
  });
    
});