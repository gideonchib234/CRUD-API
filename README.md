# CRUD-API

A small Node.js + Express CRUD API that stores generated user profile data in MongoDB.

## Features

- Create profiles by name using external name APIs (Genderize, Agify, Nationalize).
- List, retrieve, and delete profiles.
- Uses Mongoose for MongoDB access.

## Repo layout

- `server.js` — app entry
- `src/Database/db.js` — MongoDB connection helper
- `src/routes/` — Express routes
- `src/controller/` — request handlers
- `src/models/` — Mongoose schema
- `src/services/` — data access helpers
- `src/data/profiles.json` — sample/local data

## Prerequisites

- Node.js (16+ recommended)
- npm
- A MongoDB connection (Atlas or other)

## Environment

Create a `.env` file in the project root with at least:

```
PORT=5000
MONGO_URI=<your mongodb connection string>
```

NOTE: If you use MongoDB Atlas, ensure your IP is allowed in the cluster network settings and the user/credentials are correct.

## Install

```bash
npm install
```

## Run

- Development (requires `nodemon`):

```bash
npm run dev
```

- Production:

```bash
npm start
```

The server listens on `http://localhost:${PORT}` (or the port set in `.env`).

## API Endpoints

- POST /api/profiles
	- Body: `{ "name": "alice" }`
	- Creates a new profile (idempotent — returns existing if already present).
- GET /api/profiles
	- Query params: `gender`, `country_id`, `age_group` (optional filters)
	- Returns list of profiles.
- GET /api/profiles/:id
	- Returns a single profile by `id`.
- DELETE /api/profiles/:id
	- Deletes the profile (returns 204 on success).

## Database connection notes

- The project reads `MONGO_URI` from `.env`.
- If the connection fails, check credentials, network access, and Atlas IP whitelist.
- Consider adding retry/backoff in `src/Database/db.js` if you face intermittent network issues.

## Troubleshooting

- "Database not connected" responses mean the app could not reach MongoDB. Confirm `MONGO_URI` and network access.
- Check server logs for connection errors.

## Tests

No automated tests are included. You can exercise the API using `curl`, Postman, or HTTP clients.

## License

MIT