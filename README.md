# Calendar Budget App

This repo contains:

- A Vite React frontend
- An Express backend in `calendar-backend`
- A Postgres database defined in `docker-compose.yml`

## Prereqs

- Node 18+
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
- New accounts must verify their email before login. Existing username-only
  accounts can use the "Existing username-only account" flow to add and verify
  an email without losing calendar data.
- Unsafe API requests require the signed CSRF cookie and matching
  `X-CSRF-Token` header; the shared frontend API client handles this
  automatically.
