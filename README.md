# Social Media API
 
**ALT School Second Semester Examination Project**
**Name:** Silas Adinoyi
**Student ID:** ALT/ID
**Track:** Backend Engineering
 
A RESTful social media API built with Node.js, Express, and MongoDB. Supports user authentication, posts with draft/publish states, comments, a follow system, and likes — with JWT-based auth, layered architecture, input validation, and a full automated test suite.
 
**Live deployment:** https://social-media-api-y1dh.onrender.com
 
> Note: the API is hosted on Render's free tier, which spins down after 15 minutes of inactivity. The first request after a period of idle time may take up to a minute to respond while the service wakes up.
 
---
 
## Tech stack
 
| Layer | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express 5 |
| Database | MongoDB (via Mongoose) |
| Authentication | JSON Web Tokens (`jsonwebtoken`) |
| Password hashing | `bcryptjs` |
| Input validation | `express-validator` |
| Security | `helmet`, `cors`, `express-rate-limit` |
| Testing | Jest, Supertest, `mongodb-memory-server` |
| Deployment | Render |
 
## Architecture
 
The project follows a layered architecture rather than classic MVC, since a JSON API has no View layer:
 
```
Router → Controller → Service → Model
```
 
- **Routes** define endpoints and wire up middleware (auth, validation, rate limiting).
- **Controllers** are thin — they extract request data and shape the HTTP response, with no business logic.
- **Services** hold all business logic (ownership checks, field whitelisting, atomic counters, etc.) and are the only layer that talks to Mongoose models.
- **Models** define schemas, validation, and hooks (e.g. password hashing on save).
```
├── app.js           # Express app: middleware, routes, error handling (no DB connection)
├── server.js        # Entry point: connects to MongoDB, starts the app listening
├── config/
│   └── db.js         # MongoDB connection
├── models/          # Mongoose schemas: User, Post, Comment, Follow, Like
├── services/        # Business logic
├── controllers/     # Request/response handling
├── routes/          # Endpoint definitions + middleware wiring
├── middleware/      # auth, errorHandler, rateLimiter, validate
├── validators/      # express-validator rule sets
├── utils/           # AppError, jwt helpers, pagination helpers
└── tests/           # Jest + Supertest test suite
```
 
## Setup
 
1. Clone the repository and install dependencies:
```
   npm install
```
 
2. Copy `.env.example` to `.env` and fill in real values:
```
   cp .env.example .env
```
 
3. Start the server:
```
   npm start
```
   Or, for auto-restart on file changes during development:
```
   npm run dev
```
 
### Environment variables
 
| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas (or local) connection string |
| `JWT_SECRET` | Secret used to sign/verify JWTs — must be a long, random string in production |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `1h`) |
| `PORT` | Port the server listens on (defaults to `3000`; Render sets this automatically in production) |
| `NODE_ENV` | `development`, `production`, or `test` |
| `CORS_ORIGIN` | Optional comma-separated allowlist of origins permitted to call the API from a browser. Leave unset to allow any origin. |
 
## Running tests
 
```
npm test
```
 
The suite uses `mongodb-memory-server` to spin up a real, temporary MongoDB instance for each test file — no live database connection or Atlas credentials required. The first run downloads a MongoDB binary (cached afterward, so subsequent runs are fast).
 
49 tests cover every endpoint: authentication, post CRUD and visibility rules (including draft/owner access), comments, the follow system, and likes — including edge cases like duplicate-prevention, ownership enforcement, and field whitelisting.
 
## Authentication
 
Protected endpoints require a JWT in the `Authorization` header:
```
Authorization: Bearer <token>
```
Tokens are obtained from `POST /api/auth/signup` or `POST /api/auth/signin` and expire after the duration set by `JWT_EXPIRES_IN` (default 1 hour).
 
## API Reference
 
All responses follow the shape `{ "status": "success", "data": { ... } }` on success, or `{ "status": "error", "message": "..." }` on failure. List endpoints additionally return a `pagination` object: `{ page, limit, totalCount, totalPages, hasNextPage }`.
 
### Auth
 
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create an account. Body: `first_name`, `last_name`, `username`, `email`, `password` (min 8 chars). Returns the created user and a token. |
| POST | `/api/auth/signin` | — | Log in with `email` and `password`. Returns a token. |
 
### Posts
 
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/posts` | — | List published posts. Query params: `page`, `limit` (default 20), `search` (matches title, tags, or author name/username), `sort` (`like_count`\|`comment_count`\|`timestamp`), `order` (`asc`\|`desc`). |
| GET | `/api/posts/mine` | Required | List the logged-in user's own posts (drafts and published). Query params: `page`, `limit`, `state` (`draft`\|`published`). |
| GET | `/api/posts/:id` | Optional | Get a single post with author info. Published posts are visible to anyone; a draft is visible only to its own author. |
| POST | `/api/posts` | Required | Create a post (always starts as a draft). Body: `title`, `content`, `tags` (optional array). |
| PATCH | `/api/posts/:id` | Required (owner) | Update `title`, `content`, and/or `tags`. |
| PATCH | `/api/posts/:id/publish` | Required (owner) | Transition a post from draft to published. |
| DELETE | `/api/posts/:id` | Required (owner) | Delete a post. |
| POST | `/api/posts/:id/like` | Required | Like a published post. Fails with 409 if already liked. |
| DELETE | `/api/posts/:id/like` | Required | Unlike a post. |
 
A post has the fields: `title`, `content`, `author`, `tags`, `state` (`draft`\|`published`), `like_count`, `comment_count`, `createdAt`, `updatedAt`.
 
### Comments
 
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/posts/:postId/comments` | Required | Comment on a post. Only allowed on published posts. |
| GET | `/api/posts/:postId/comments` | — | List a post's comments, oldest first. Query params: `page`, `limit`. |
 
### Follows
 
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/users/:id/follow` | Required | Follow a user. Fails with 400 on self-follow, 409 on duplicate follow. |
| DELETE | `/api/users/:id/follow` | Required | Unfollow a user. |
| GET | `/api/users/:id/following` | — | List the users a given user follows. |
| GET | `/api/users/:id/followers` | — | List a given user's followers. |
 
## Security
 
- Passwords hashed with `bcryptjs` before storage; never returned in API responses.
- JWT-based stateless authentication with a configurable expiry.
- `helmet` sets standard security-related HTTP headers.
- `cors` restricts which origins may call the API from a browser (configurable via `CORS_ORIGIN`).
- Rate limiting: 300 requests/15 min per IP globally, 10 requests/15 min per IP on auth endpoints specifically, to slow brute-force attempts.
- All input validated with `express-validator`; malformed MongoDB ids are rejected with a clean 400 rather than surfacing as a raw database error.
- Ownership checks on every post mutation; a non-owner can never see, edit, publish, or delete another user's draft.
- Request bodies capped at 10kb to guard against oversized payloads.
 