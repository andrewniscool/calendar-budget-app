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

Generate `JWT_SECRET` locally:

```bash
openssl rand -base64 48
```

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
