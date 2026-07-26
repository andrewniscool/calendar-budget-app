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
| GET/PUT | `/calendars/:id/settings` | Read/update calendar timezone |
| GET/PUT | `/financial-settings` | Read/update user financial currency |
| GET/POST | `/categories` | List/create shared financial categories |
| PUT/DELETE | `/categories/:id` | Update/delete an owned category |
| GET/POST | `/events` | List/create events |
| PUT/DELETE | `/events/:id` | Update/delete an owned event |
| GET/PUT | `/budget-limits` | Read or atomically update monthly limits |
| GET/POST | `/recurring-events` | List/create recurring definitions |
| PUT/DELETE | `/recurring-events/:id` | Update/delete a recurring definition |

Successful response bodies remain compatible with the frontend. Stable special errors include `DATE_RANGE_REQUIRED` for an unbounded calendar above 1,000 events and `LIMIT_REACHED` for resource quotas.

### Calling convention

All request and response bodies are JSON. All private endpoints require the
`cb_access` HttpOnly cookie. Every unsafe request (`POST`, `PUT`, `PATCH`, or
`DELETE`) also requires the signed `cb_csrf` cookie and an identical
`X-CSRF-Token` header. Start a browser session with `GET /auth/csrf`; a
successful login and refresh also issue a new CSRF token. The frontend's
`src/services/apiClient.js` performs this automatically.

Validation is strict: unknown body/query fields are rejected. IDs are positive
integers; dates use `YYYY-MM-DD`; times use `HH:mm` (seconds are also accepted);
money is a non-negative number with at most two decimal places. Errors use:

```json
{
  "error": "Human-readable explanation",
  "message": "Human-readable explanation",
  "code": "BAD_REQUEST",
  "requestId": "server-generated UUID"
}
```

The common status codes are `400` (validation/business input), `401`
(missing/invalid session), `403` (CSRF or origin), `404` (resource not owned or
absent), `409` (conflict or quota), `413` (body exceeds 100 KB), `429` (rate
limit), and `500`. `GET /health/live` and `GET /health/ready` are public.

### Resource contracts

| Resource | Required input | Result and important behavior |
| --- | --- | --- |
| Auth | Register: `username`, `email`, `password`; login: `email`, `password`; verification/reset: `token` (and reset `password`) | Register, resend, and forgot-password return `202` to avoid account enumeration. Login/refresh return `{ user }` and set cookies. A user must verify email before logging in. |
| Calendars | Create `{ name, color? }` | `color` is `#RRGGBB` and defaults to `#2563EB`. `GET /calendars` returns rows with `calendar_id`, `name`, `color`, and `created_at`. Create/delete return the affected row. Maximum 50 calendars per user. |
| Calendar settings | `{ timezone }` | `GET` returns `{ calendar_id, timezone }`; timezone defaults to `America/New_York` and must be IANA. |
| Financial settings | `{ currency }` | `GET`/`PUT` return `{ currency }`; currency defaults to `USD` and must be a three-letter ISO code. |
| Categories | `{ name, color }` | Categories are shared across the user's calendars. `color` remains secondary `#RRGGBB` metadata. List/create/update return `{ category_id, name, color }`. Maximum 500 per user. |
| Events | `{ calendarId, title, date, timeStart, timeEnd, categoryId?, budget? }` | List takes `calendarId` plus optional `startDate`/`endDate` (both required together for a bounded range, maximum 366 days). Returned event rows use database-style keys such as `time_start`, `category_name`, and `category_color`. Updating an event changes its fields but does not move it to a different calendar. |
| Budget limits | Query/body `{ period: "YYYY-MM" }`; write also has `overall?` and `categories: [{ categoryId, amount }]` | Limits are global to the user. `GET`/`PUT` return `{ period, overall, categories }`. A write is transactional and upserts only supplied limits; omitting a limit does not delete an existing one. |
| Recurring events | `{ calendarId, categoryId?, title, startDate, endDate?, timeStart, timeEnd, budget?, frequency, interval? }` | `frequency` is `daily`, `weekly`, or `monthly`; `interval` defaults to 1. These are recurrence definitions, not materialized rows in `events`. Maximum 500 definitions per calendar. |

Deleting a calendar cascades to its settings, events, and recurring
definitions, but shared categories and global limits survive. Deleting a
category sets its reference to `NULL` on events and recurring definitions
across the user's calendars and deletes that category's limit. A supplied
category must belong to the authenticated user.

### Authentication lifecycle

1. `POST /auth/register` hashes the password with bcrypt, creates an
   unverified user plus a one-time verification token, and inserts a mail job
   in the same database transaction.
2. The worker claims mail jobs using `FOR UPDATE SKIP LOCKED`, sends the mail,
   retries failures with exponential backoff (up to eight attempts), and clears
   token payloads after completion or terminal failure.
3. `POST /auth/verify-email` consumes the hashed one-time token. `POST
   /auth/login` then issues a 15-minute signed access JWT and a 30-day random
   refresh token by default. Only token hashes are stored in PostgreSQL.
4. `POST /auth/refresh` rotates the refresh token. Reuse of an already rotated
   token revokes its entire token family. A password reset increments
   `auth_version` and revokes every refresh token, which makes existing access
   JWTs fail on their next database-backed authentication check.

Cookie names are `cb_access` (HttpOnly, path `/`), `cb_refresh` (HttpOnly,
path `/auth`), and `cb_csrf` (readable). They use `SameSite=Lax`; set
`COOKIE_SECURE=true` over HTTPS.

## Data model

`users` own calendars, shared categories, global budget limits, and financial
settings. A calendar owns events, optional timezone settings, and recurring
events. Composite owner foreign keys preserve tenant consistency. `refresh_tokens`
track session families. `account_tokens` hold hashed email-verification and
password-reset tokens, while `mail_outbox` makes email delivery reliable across
API crashes. The baseline migration also supplies foreign keys, checks,
indexes, uniqueness constraints, and cascade rules; it is the schema source of
truth.

## Working in the code

To add a feature, follow the existing vertical slice: define the strict schema
in `validation.js`, add its route in `routes.js`, keep HTTP translation in a
controller, place domain rules/errors in a service, and put all SQL plus
ownership checks in a repository. `app.js` is the composition root that wires
those layers together. Use `withTransaction` from `db.js` for multi-query
changes; repositories use parameterized queries and scope private resources to
the authenticated user.

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
