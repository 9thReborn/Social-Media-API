const request = require("supertest");
const app = require("../app");
const { connect, clearDatabase, closeDatabase } = require("./setup/db");
const { signup } = require("./helpers");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('POST /api/users/:id/follow', () => {
    test("rejects an unauthenticated request with 401", async () => {
      const { user } = await signup(app);
      const res = await request(app).post(`/api/users/${user._id}/follow`);
      expect(res.status).toBe(401);
    });

    test("lets a user follow another user", async () => {
      const { token: t1 } = await signup(app);
      const { user: u2 } = await signup(app);

      const res = await request(app)
        .post(`/api/users/${u2._id}/follow`)
        .set("Authorization", `Bearer ${t1}`);
      expect(res.status).toBe(201);
    });

    test("blocks following yourself with 400", async () => {
      const { token, user } = await signup(app);
      const res = await request(app)
        .post(`/api/users/${user._id}/follow`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    test("blocks a duplicate follow with 409", async () => {
      const { token: t1 } = await signup(app);
      const { user: u2 } = await signup(app);

      await request(app)
        .post(`/api/users/${u2._id}/follow`)
        .set("Authorization", `Bearer ${t1}`);
      const res = await request(app)
        .post(`/api/users/${u2._id}/follow`)
        .set("Authorization", `Bearer ${t1}`);

      expect(res.status).toBe(409);
    });

    test("following a nonexistent user returns 404", async () => {
      const { token } = await signup(app);
      const res = await request(app)
        .post(`/api/users/${"a".repeat(24)}/follow`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(404);
    });

    describe("DELETE /api/users/:id/follow", () => {
      test("unfollows a user that was being followed", async () => {
        const { token: t1 } = await signup(app);
        const { user: u2 } = await signup(app);
        await request(app)
          .post(`/api/users/${u2._id}/follow`)
          .set("Authorization", `Bearer ${t1}`);

        const res = await request(app)
          .delete(`/api/users/${u2._id}/follow`)
          .set("Authorization", `Bearer ${t1}`);
        expect(res.status).toBe(204);
      });

      test("returns 404 when not currently following that user", async () => {
        const { token: t1 } = await signup(app);
        const { user: u2 } = await signup(app);

        const res = await request(app)
          .delete(`/api/users/${u2._id}/follow`)
          .set("Authorization", `Bearer ${t1}`);
        expect(res.status).toBe(404);
      });
    });

});

describe("GET /api/users/:id/following and /followers", () => {
  test("reflect the current follow relationships correctly", async () => {
    const { token: t1, user: u1 } = await signup(app);
    const { user: u2 } = await signup(app);
    const { user: u3 } = await signup(app);

    // u1 follows both u2 and u3
    await request(app)
      .post(`/api/users/${u2._id}/follow`)
      .set("Authorization", `Bearer ${t1}`);
    await request(app)
      .post(`/api/users/${u3._id}/follow`)
      .set("Authorization", `Bearer ${t1}`);

    const followingRes = await request(app).get(
      `/api/users/${u1._id}/following`,
    );
    expect(followingRes.body.data).toHaveLength(2);

    const followersRes = await request(app).get(
      `/api/users/${u2._id}/followers`,
    );
    expect(followersRes.body.data).toHaveLength(1);
    expect(followersRes.body.data[0].username).toBe(u1.username);
  });
});