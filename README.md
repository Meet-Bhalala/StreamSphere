# StreamSphere — Backend API

Professional, evaluator-focused README for a Node.js / Express / MongoDB REST API following MVC patterns.

---

## Project Overview

StreamSphere is a backend REST API built to support a media-sharing application. It demonstrates common backend responsibilities: user authentication, media uploads, relational data modeling with MongoDB, pagination, search, sorting, and consistent error/response handling. The code is organized using MVC (models, controllers, routes) and includes middleware for async handling and authentication.

## Features

- JWT authentication (login, protected routes)
- Video upload and storage integration with Cloudinary
- MongoDB schema relationships (users, videos, comments, likes, playlists)
- Pagination using `skip` and `limit`
- Search via regex queries
- Sorting via query parameters
- Centralized error handling with `ApiError` and `ApiResponse`
- `asyncHandler` middleware to simplify async controllers

## Tech Stack

- Node.js
- Express.js
- MongoDB with Mongoose
- Cloudinary (media hosting)
- Multer (multipart/form-data handling)

## Folder Structure

Top-level layout (key folders):

- `controllers/` — HTTP request handlers
- `models/` — Mongoose schemas and relationships
- `routes/` — Express route definitions
- `middlewares/` — `auth.middleware.js`, `multer.middleware.js`, `asyncHandler.js`
- `db/` — DB connection setup
- `utils/` — `ApiError.js`, `ApiResponse.js`, `cloudinary.js`, helpers
- `app.js`, `index.js` — app bootstrap and server start

## Installation

1. Clone the repository and install dependencies:

```bash
git clone <repo-url>
cd StreamSphere
npm install
```

2. Create a `.env` file (see Environment Variables below).

## Environment Variables

Create a `.env` file in the project root with the following minimum values:

```
PORT=3000
MONGO_URI=mongodb://localhost:27017/streamsphere
JWT_SECRET=your_jwt_secret
# Optional (for Cloudinary uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Keep secrets out of source control; use a secrets manager in production.

## Running the Server

Start in development (with nodemon if configured):

```bash
npm run dev
```

Start production:

```bash
npm start
```

Confirm the server is running by calling the health endpoint (example below).

## API Endpoints

Below is a concise mapping of common endpoints. Check `routes/` for exact paths and additional options.

- Auth
  - `POST /api/users/register` — register
  - `POST /api/users/login` — login (returns JWT)

- Users
  - `GET /api/users/:id` — get profile
  - `PUT /api/users/:id` — update profile

- Videos
  - `GET /api/videos` — list videos (supports `search`, `sort`, `page`, `limit`)
  - `POST /api/videos` — upload video (multipart, requires auth)
  - `GET /api/videos/:id` — get single video (includes relationships)
  - `DELETE /api/videos/:id` — delete video (auth/owner)

- Comments
  - `POST /api/videos/:id/comments` — add comment
  - `GET /api/videos/:id/comments` — list comments (pagination)

- Likes & Subscriptions
  - `POST /api/videos/:id/like` — like/unlike
  - `POST /api/subscriptions` — subscribe/unsubscribe flows

- Dashboard & Health
  - `GET /api/dashboard` — admin metrics
  - `GET /api/healthcheck` — readiness/health

## Query Options: Pagination, Search, Sorting

- Pagination: use `?page=2&limit=10` or directly `?skip=20&limit=10`. Controllers translate page → skip as needed.
- Search: `?search=keyword` performs regex search against title/description (case-insensitive).
- Sorting: `?sort=createdAt:desc` or `?sort=views:asc` (controllers parse key:direction pairs).

## Example API Requests

- Healthcheck

```bash
curl http://localhost:3000/api/healthcheck
```

- Register user

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane","email":"jane@example.com","password":"pass123"}'
```

- Login (returns JWT)

```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"pass123"}'
```

- List videos with search, pagination and sorting

```bash
curl "http://localhost:3000/api/videos?search=cooking&page=1&limit=10&sort=views:desc"
```

- Upload video (multipart) — example using `curl` and an auth token

```bash
curl -X POST http://localhost:3000/api/videos \
  -H "Authorization: Bearer <JWT>" \
  -F "title=My Video" \
  -F "file=@/path/to/video.mp4"
```

## Example API Response

GET `/api/videos?search=travel&page=1&limit=2&sort=createdAt:desc`

```json
{
  "success": true,
  "data": [
    {
      "_id": "605c5f3a8e1b2c0015f4b6a1",
      "title": "Travel to Iceland",
      "description": "Highlights from my trip",
      "views": 1234,
      "createdAt": "2024-12-01T10:00:00.000Z",
      "owner": {
        "_id": "605c5e2b8e1b2c0015f4b69f",
        "name": "Jane Doe"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 2,
    "total": 42
  }
}
```

Responses follow a consistent wrapper using `ApiResponse`: `{ success, data, message?, meta? }`. Errors use `ApiError` with structured messages and HTTP status codes.

## API Testing

- Recommended tools: Postman, Insomnia, or curl for manual testing.
- For automated tests: add Jest + Supertest to run unit and integration tests against a test MongoDB instance (or in-memory MongoDB).

Quick test script examples (future):

```bash
# run unit tests
npm test

# run integration tests (example using jest)
npm run test:integration
```

## Future Improvements

- Add automated tests (unit + integration) and CI pipeline (GitHub Actions).
- Implement refresh tokens and token revocation for stronger auth.
- Add rate limiting and request throttling.
- Add Swagger / OpenAPI documentation and Postman collection.
- Offload heavy tasks (transcoding) to background workers (e.g., Bull + Redis).

## Author

- Maintainer: Your Name (update `package.json`/profile)
- Contact / demo: open an issue or provide a link to your résumé/profile.

---

If you'd like, I can also generate a Postman collection or an OpenAPI spec next — which would you prefer?

