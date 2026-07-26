# Calendar Budget App

Calendar Budget is a React single-page app for organizing calendars, timed
events, categories, recurring event definitions, and monthly budget limits.
Its API is an Express service backed by PostgreSQL; account verification and
password-reset email are sent by a separate durable worker.

## Architecture at a glance

```text
React + Vite (localhost:5173)
  -> Axios client (cookies + CSRF header + one refresh retry)
  -> Express API (localhost:3001)
  -> PostgreSQL (localhost:5432)
         ^
         | mail_outbox table
  mail worker -> SMTP, or JSON logs in development
```

The frontend lives in `src/` and is deliberately thin around API access:

- `src/services/apiClient.js` creates the shared Axios client. It sends
  cookies, obtains a CSRF token before unsafe requests, and refreshes an
  expired access session once before replaying a request.
- `src/services/` contains feature-level API wrappers used by components.
- `src/components/` and `src/loginPage/` render the UI and hold UI state.
- `calendar-backend/` is a standalone Node package containing the API,
  database migrations, tests, and email worker.

Read the [backend README](calendar-backend/README.md) for the HTTP contract,
authentication flow, data model, and backend source map.

## Prereqs

- Node 20+
- npm
- Docker Desktop or Docker Engine with `docker compose`

## First-time setup

1. Install frontend dependencies:

```bash
npm install
```

2. Install backend dependencies:

```bash
cd calendar-backend
npm install
cd ..
```

3. Create the backend env file:

```bash
cp calendar-backend/.env.example calendar-backend/.env
```

Set `POSTGRES_PASSWORD` to a local development password, then use that same
password in `DATABASE_URL`. Use letters, numbers, and underscores for the
simplest local setup. Passwords containing URL-special characters must be
URL-encoded inside `DATABASE_URL`.

```dotenv
POSTGRES_PASSWORD=calendar_local_password
DATABASE_URL=postgres://calendar_user:calendar_local_password@localhost:5432/calendar_db
```

Generate independent JWT and CSRF secrets locally:

```bash
openssl rand -base64 48
openssl rand -base64 48
```

Assign the results to `JWT_SECRET` and `CSRF_SECRET`. The default
`MAIL_MODE=log` writes verification and password-reset messages to the backend
console for local development. For SMTP delivery, set:

```dotenv
MAIL_MODE=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
MAIL_FROM=Calendar Budget <no-reply@example.com>
```

Production requires HTTPS and `COOKIE_SECURE=true`.

4. Start Postgres from the repo:

```bash
npm run db:up
```

This creates:

- database: `calendar_db`
- user: `calendar_user`
- password: the `POSTGRES_PASSWORD` value in `calendar-backend/.env`

The command waits for Postgres and applies versioned migrations from
`calendar-backend/migrations`.

## Running the app

Start the backend:

```bash
npm run dev:backend
```

Start the durable email worker in another terminal:

```bash
npm --prefix calendar-backend run dev:worker
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open `http://localhost:5173`.

The frontend defaults to `http://localhost:3001` for the API. Copy the root
`.env.example` to `.env` and set `VITE_API_URL` when using another backend
origin.

### Frontend-only UI mode

To work on the calendar UI without starting the backend, create a local `.env`
in the repo root:

```dotenv
VITE_SKIP_AUTH=true
VITE_SKIP_CALENDAR_PICKER=true
```

Then run `npm run dev`. Set either flag back to `false` or remove it to turn
that page back on. These flags also use in-memory mock calendar data, so any
events or categories you add reset when the page reloads.

Backend health endpoints:

- `http://localhost:3001/health/live`
- `http://localhost:3001/health/ready`

## How a normal request works

After login, the API stores the access and refresh tokens in `HttpOnly`
cookies. Before a state-changing request, the frontend obtains a signed,
readable `cb_csrf` cookie from `GET /auth/csrf` and mirrors that value in the
`X-CSRF-Token` header. The server checks both the header/cookie match and the
signature. The browser never reads an access or refresh token.

The API returns JSON. A failed request uses this common shape:

```json
{
  "error": "Human-readable explanation",
  "message": "Human-readable explanation",
  "code": "STABLE_ERROR_CODE",
  "requestId": "uuid"
}
```

`requestId` is useful when matching a browser error to backend JSON logs.

## Database commands

Start the database:

```bash
npm run db:up
```

Stop containers:

```bash
npm run db:down
```

Reset the database completely:

```bash
npm run db:reset
```

`db:reset` removes the Docker volume, recreates the database, and reapplies all migrations.

Run backend integration tests against an isolated Docker database:

```bash
npm run test:backend
```

The test database uses port `5433` and is removed automatically after the test
run.

## Notes

- The backend connects to `localhost:5432`, which matches the Compose port mapping.
- If you move to another device, the DB setup now lives in the repo. You only need Docker plus the normal `npm install` steps.
- Authentication uses HttpOnly access and refresh cookies. Browser code does
  not store tokens in local storage.
- New accounts must verify their email before login. Verification and password
  reset emails are delivered through the backend's durable database outbox.
- Unsafe API requests require the signed CSRF cookie and matching
  `X-CSRF-Token` header; the shared frontend API client handles this
  automatically.
