# Calendar Budget API

The backend is an Express API backed by PostgreSQL. It intentionally uses a small layered architecture so HTTP concerns, business rules, and SQL stay separate.

## Request flow

```text
browser
  -> app.js (constructs the application and global middleware)
  -> middleware (request ID, security headers, CORS, JSON, rate limits, CSRF)
  -> routes.js (matches the HTTP method/path and runs route middleware)
  -> controller (translates HTTP input/output)
  -> service (business rules and domain errors)
  -> repository (tenant-scoped parameterized SQL)
  -> PostgreSQL
```

Example: `POST /events` first receives a server-generated request ID. Helmet and CORS apply response/origin protections, JSON parsing enforces the 100 KB limit, rate limiting and CSRF run, then the route authenticates the access cookie and validates the body. The controller passes `req.user.id` and the validated body to the event service. The repository inserts only when the calendar belongs to that user. Database constraint failures become safe domain errors, and the controller returns the existing event response shape.

## Source responsibilities

- `index.js`: API process lifecycle, database startup check, HTTP timeouts, and graceful shutdown.
- `worker.js`: mail-outbox and scheduled token-cleanup process lifecycle.
- `app.js`: dependency construction and global middleware ordering.
- `routes.js`: complete public HTTP surface and route-specific middleware.
- `config.js`: validated environment configuration and production invariants.
- `db.js`: PostgreSQL pool and reusable transaction helper.
- `logger.js`: structured JSON logs with no request bodies or credentials.
- `security.js`: cookie serialization, random/hash helpers, and signed CSRF tokens.
- `errors.js`: stable application errors and final Express error handling.
- `validation.js`: strict request schemas, coercion, and request limits.
- `middleware/requestContext.js`: server-generated request IDs and request completion logs.
- `middleware/authMiddleware.js`: access-cookie authentication and CSRF enforcement.
- `controllers/`: HTTP status/body translation only.
- `services/`: domain rules, quotas, and domain-specific error messages.
- `repositories/`: parameterized, user-scoped SQL and transactional persistence.
- `services/mailService.js`: converts outbox jobs into SMTP messages.
- `services/outboxWorker.js`: claims, retries, completes, and logs durable mail jobs.
- `maintenance.js`: deletion of expired or old consumed authentication tokens.
- `migrations/`: the complete versioned PostgreSQL schema.

Do not move ownership checks into the frontend. Repositories must continue scoping every private resource operation to the authenticated user.

## Middleware ordering

1. Request context creates an internal UUID before anything can fail.
2. Helmet adds security headers.
3. CORS rejects unapproved browser origins.
4. JSON parsing rejects malformed or oversized bodies.
5. The global limiter controls broad IP abuse.
6. CSRF validates every unsafe method (`POST`, `PUT`, `PATCH`, `DELETE`).
7. Route middleware applies sensitive/auth limits, authentication, and schema validation.
8. The not-found and error handlers run last.

Authentication reads the HttpOnly access cookie, verifies JWT algorithm/issuer/audience, and checks the user plus `auth_version` in PostgreSQL. That database read enables immediate revocation after a password reset. Refresh tokens are random, stored only as hashes, rotated on every use, and revoke their entire family when an old token is replayed.

CSRF uses a signed, readable cookie plus a matching `X-CSRF-Token` header. CORS is not a substitute for CSRF protection. Unsafe calls need both checks.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health/live` | Process liveness |
| GET | `/health/ready` | PostgreSQL readiness |
| GET | `/auth/csrf` | Issue a signed CSRF cookie/token |
| POST | `/auth/register` | Create an unverified account and enqueue verification mail |
| POST | `/auth/verify-email` | Consume a verification token |
| POST | `/auth/resend-verification` | Enqueue eligible verification mail |
| POST | `/auth/login` | Issue access, refresh, and CSRF cookies |
| POST | `/auth/refresh` | Rotate the refresh token family |
| POST | `/auth/logout` | Revoke the current refresh family |
| GET | `/auth/session` | Return the authenticated user |
| POST | `/auth/forgot-password` | Enqueue eligible reset mail |
| POST | `/auth/reset-password` | Consume a reset token and revoke all sessions |
| GET/POST | `/calendars` | List/create calendars |
| DELETE | `/calendars/:id` | Delete an owned calendar |
| GET/PUT | `/calendars/:id/settings` | Read/update timezone and currency |
| GET/POST | `/categories` | List/create calendar categories |
| PUT/DELETE | `/categories/:id` | Update/delete an owned category |
| DELETE | `/categories/all` | Delete all categories in an owned calendar |
| GET/POST | `/events` | List/create events |
| PUT/DELETE | `/events/:id` | Update/delete an owned event |
| GET/PUT | `/budget-limits` | Read or atomically update monthly limits |
| GET/POST | `/recurring-events` | List/create recurring definitions |
| PUT/DELETE | `/recurring-events/:id` | Update/delete a recurring definition |

Successful response bodies remain compatible with the frontend. Stable special errors include `DATE_RANGE_REQUIRED` for an unbounded calendar above 1,000 events and `LIMIT_REACHED` for resource quotas.

## Development

From the repository root, copy `calendar-backend/.env.example` to `calendar-backend/.env`, generate independent JWT/CSRF secrets, then run:

```bash
npm run db:up
npm run dev:backend
```

Run the worker in a second terminal so queued verification/reset messages are delivered:

```bash
npm --prefix calendar-backend run dev:worker
```

`MAIL_MODE=log` uses Nodemailer's JSON transport locally. The worker still exercises the same durable outbox lifecycle.

Because the development migrations were consolidated and no data must be preserved, use `npm run db:reset` once after this change.

## Tests

```bash
npm --prefix calendar-backend run lint
npm --prefix calendar-backend run test:unit
npm --prefix calendar-backend run test:integration
npm --prefix calendar-backend run test:twice
```

Unit tests do not require Docker. Integration tests start an isolated PostgreSQL 16 container on port 5433, apply the clean baseline, and destroy the database afterward.

## Production checklist

- Use HTTPS, `NODE_ENV=production`, `COOKIE_SECURE=true`, `MAIL_MODE=smtp`, long independent secrets, and an exact `TRUST_PROXY_HOPS` value.
- Run exactly one API and one worker initially. The in-memory rate limiter is not valid across multiple API instances; add Redis before horizontal scaling.
- Use managed PostgreSQL with encrypted connections, automated backups, retention, and a regularly tested restore procedure.
- Apply migrations as a release step before starting new processes; back up before destructive migrations.
- Rotate application, database, and SMTP secrets through the hosting platform rather than committing `.env` files.
- Alert on readiness failure, HTTP 5xx rate, worker failures, terminal outbox jobs, pool exhaustion, and database latency.
- Do not add general API caching. Add Redis only for multi-instance rate limiting/jobs or after measurements identify a specific safe cache target.
