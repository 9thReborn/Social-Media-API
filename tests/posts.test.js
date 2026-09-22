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


describe("POST /api/posts (create)", () => {
  test("rejects an unauthenticated request with 401", async () => {
    const res = await request(app)
      .post("/api/posts")
      .send({ title: "x", content: "y" });
    expect(res.status).toBe(401);
  });

  test("creates a post as a draft by default", async () => {
    const { token } = await signup(app);
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My Post", content: "Body" });

    expect(res.status).toBe(201);
    expect(res.body.data.post.state).toBe("draft");
  });

  test("rejects missing title/content with 400", async () => {
    const { token } = await signup(app);
    const res = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "" });
    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/posts/:id (update)', () => {

    test("lets the owner update their own post", async () => {
      const { token } = await signup(app);
      const post = await createPost(app, token);

      const res = await request(app)
        .patch(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ title: "Updated title" });

      expect(res.status).toBe(200);
      expect(res.body.data.post.title).toBe("Updated title");
    });

    test("blocks a non-owner with 403", async () => {
      const { token: ownerToken } = await signup(app);
      const { token: otherToken } = await signup(app);
      const post = await createPost(app, ownerToken);

      const res = await request(app)
        .patch(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ title: "Hijacked" });

      expect(res.status).toBe(403);
    });

     test("ignores an attempt to smuggle `state` or `like_count` through the update body", async () => {
       // updatePost only ever whitelists title/content/tags — this proves a
       // request can't use this endpoint to fake-publish a post or inflate
       // its like count.
       const { token } = await signup(app);
       const post = await createPost(app, token);

       const res = await request(app)
         .patch(`/api/posts/${post._id}`)
         .set("Authorization", `Bearer ${token}`)
         .send({ state: "published", like_count: 999 });

       expect(res.status).toBe(200);
       expect(res.body.data.post.state).toBe("draft");
       expect(res.body.data.post.like_count).toBe(0);
     });

});

describe("PATCH /api/posts/:id/publish", () => {
  test("lets the owner publish their own post", async () => {
    const { token } = await signup(app);
    const post = await createPost(app, token);

    const res = await request(app)
      .patch(`/api/posts/${post._id}/publish`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.post.state).toBe("published");
  });

  test("blocks a non-owner with 403", async () => {
    const { token: ownerToken } = await signup(app);
    const { token: otherToken } = await signup(app);
    const post = await createPost(app, ownerToken);

    const res = await request(app)
      .patch(`/api/posts/${post._id}/publish`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });
});

describe("DELETE /api/posts/:id", () => {
  test("lets the owner delete their own post", async () => {
    const { token } = await signup(app);
    const post = await createPost(app, token);

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(204);
  });

  test("blocks a non-owner with 403", async () => {
    const { token: ownerToken } = await signup(app);
    const { token: otherToken } = await signup(app);
    const post = await createPost(app, ownerToken);

    const res = await request(app)
      .delete(`/api/posts/${post._id}`)
      .set("Authorization", `Bearer ${otherToken}`);
    expect(res.status).toBe(403);
  });
});

describe('GET /api/posts (public list)', () => {
    test("only returns published posts, never drafts", async () => {
      const { token } = await signup(app);
      await createPost(app, token); // stays a draft
      await createPublishedPost(app, token, { title: "Visible Post" });

      const res = await request(app).get("/api/posts");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Visible Post");
    });

    test("paginates with a default limit of 20", async () => {
      const { token } = await signup(app);
      await createPublishedPost(app, token);

      const res = await request(app).get("/api/posts");
      expect(res.body.pagination.limit).toBe(20);
    });


    test("search matches by title", async () => {
      const { token } = await signup(app);
      await createPublishedPost(app, token, {
        title: "Unique Searchable Title",
      });
      await createPublishedPost(app, token, {
        title: "Something else entirely",
      });

      const res = await request(app).get("/api/posts?search=Searchable");
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Unique Searchable Title");
    });


    test("sort=like_count orders posts by like_count descending by default", async () => {
      const { token: t1 } = await signup(app);
      const lowLike = await createPublishedPost(app, t1, { title: "Low" });
      const highLike = await createPublishedPost(app, t1, { title: "High" });

      const { token: t2 } = await signup(app);
      await request(app)
        .post(`/api/posts/${highLike._id}/like`)
        .set("Authorization", `Bearer ${t2}`);

      const res = await request(app).get("/api/posts?sort=like_count");
      expect(res.body.data[0].title).toBe("High");
    });

});

describe('GET /api/posts/:id (single post)', () => {
    test("anonymous visitors can view a published post", async () => {
      const { token } = await signup(app);
      const post = await createPublishedPost(app, token);

      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.status).toBe(200);
    });

    test("anonymous visitors get 404 (not 403) on a draft", async () => {
      const { token } = await signup(app);
      const post = await createPost(app, token);

      const res = await request(app).get(`/api/posts/${post._id}`);
      expect(res.status).toBe(404);
    });

    test("the owner CAN view their own draft", async () => {
      const { token } = await signup(app);
      const post = await createPost(app, token);

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    test("a different logged-in user still gets 404 on someone else's draft", async () => {
      const { token: ownerToken } = await signup(app);
      const { token: otherToken } = await signup(app);
      const post = await createPost(app, ownerToken);

      const res = await request(app)
        .get(`/api/posts/${post._id}`)
        .set("Authorization", `Bearer ${otherToken}`);
      expect(res.status).toBe(404);
    });

});

describe('GET /api/posts/mine', () => {

    test("returns both drafts and published posts belonging to the caller", async () => {
      const { token } = await signup(app);
      await createPost(app, token);
      await createPublishedPost(app, token);

      const res = await request(app)
        .get("/api/posts/mine")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });

    test("excludes other users' posts", async () => {
      const { token: ownerToken } = await signup(app);
      const { token: otherToken } = await signup(app);
      await createPost(app, ownerToken);

      const res = await request(app)
        .get("/api/posts/mine")
        .set("Authorization", `Bearer ${otherToken}`);
      expect(res.body.data).toHaveLength(0);
    });

    test("?state=draft filters down to only drafts", async () => {
      const { token } = await signup(app);
      await createPost(app, token);
      await createPublishedPost(app, token);

      const res = await request(app)
        .get("/api/posts/mine?state=draft")
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].state).toBe("draft");
    });


    test("an invalid ?state value is rejected with 400", async () => {
      const { token } = await signup(app);
      const res = await request(app)
        .get("/api/posts/mine?state=bogus")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

});