const request = require("supertest");
const app = require("../app");
const { connect, clearDatabase, closeDatabase } = require("./setup/db");
const { uniqueUser, signup } = require("./helpers");

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe("POST /api/auth/signup", () => {
  test("creates a user and returns a token", async () => {
    const userData = uniqueUser();
    const res = await request(app).post("/api/auth/signup").send(userData);

    expect(res.status).toBe(201);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe(userData.username);
    expect(res.body.data.user.password).toBeUndefined(); // never leak the hash
  });

  test("rejects invalid input (bad email, short password) with 400", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        first_name: "A",
        last_name: "B",
        username: "ab",
        email: "not-an-email",
        password: "123",
      });

    expect(res.status).toBe(400);
  });

  test("rejects a duplicate email/username with 409", async () => {
    const userData = uniqueUser();
    await request(app).post("/api/auth/signup").send(userData);

    const res = await request(app).post("/api/auth/signup").send(userData);
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/signin', () => {
   
    test("signs in with correct credentials and returns a token", async () => {
      const { userData } = await signup(app);

      const res = await request(app)
        .post("/api/auth/signin")
        .send({ email: userData.email, password: userData.password });

      expect(res.status).toBe(200);
      expect(res.body.data.token).toBeDefined();
    });

    test("rejects a wrong password with 401", async () => {
      const { userData } = await signup(app);

      const res = await request(app)
        .post("/api/auth/signin")
        .send({ email: userData.email, password: "wrongpassword" });

      expect(res.status).toBe(401);
    });

    test("rejects a nonexistent email with the SAME 401 message as a wrong password", async () => {
      // Security requirement we built in deliberately: identical error for
      // both cases, so a caller can't use signin to fish for valid emails.
      const wrongPasswordRes = await (async () => {
        const { userData } = await signup(app);
        return request(app)
          .post("/api/auth/signin")
          .send({ email: userData.email, password: "wrongpassword" });
      })();

      const nonexistentRes = await request(app)
        .post("/api/auth/signin")
        .send({ email: "nobody-here@example.com", password: "whatever123" });

      expect(nonexistentRes.status).toBe(401);
      expect(nonexistentRes.body.message).toBe(wrongPasswordRes.body.message);
    });

    test("rejects malformed input (missing password) with 400", async () => {
      const res = await request(app)
        .post("/api/auth/signin")
        .send({ email: "someone@example.com" });
      expect(res.status).toBe(400);
    });
    
});
