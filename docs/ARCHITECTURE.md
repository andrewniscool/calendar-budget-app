# Verified Architecture

## Frontend

The root npm package is a JavaScript React 19 SPA built by Vite 6, styled with
Tailwind utility classes plus CSS in `src/index.css` and
`src/components/styles/`.

`src/main.jsx` mounts `src/App.jsx`. `App` restores the cookie session or shows
login/signup/account-action screens, then renders `src/CalendarList.jsx`.
CalendarList currently selects one calendar and mounts `src/MainApp.jsx`.
MainApp owns selected date/view, fetched events, modal state, shared user
categories, persisted monthly budget limits, and the user financial currency.

`src/components/Calendar.jsx` selects the day, week, month, or year component.
`DayView.jsx` and `WeekView.jsx` use `timeGrid.js`; `EventBlock.jsx` is shared
timed-event presentation. `EventModal.jsx` handles new events plus read-only
details and editing. `Header.jsx` and `Sidebar.jsx` form the shell. Budget and
category UI live under `Budget_stuff/` and `Sidebar_stuff/`.

`src/services/apiClient.js` is the shared credentialed Axios instance. It
obtains/sends CSRF tokens and coalesces one refresh request before replaying a
401. Feature services wrap calendar, category, event, and auth endpoints.
`src/devConfig.js` turns auth/calendar bypasses into mock API mode.

## Backend and Data

`calendar-backend` is a separate Express 5 package. `src/index.js` loads config
and DB; `src/app.js` composes middleware and vertical slices; `src/routes.js`
declares endpoints; `src/validation.js` uses strict Zod schemas.

Each resource uses controllers → services → repositories. Controllers translate
HTTP, services enforce domain rules/quotas, and repositories own parameterized
SQL and user ownership filters. Preserve these boundaries. Auth uses
short-lived access JWT cookies, rotating hashed refresh tokens, verified-user
and `auth_version` checks, signed double-submit CSRF, exact-origin CORS, and
rate limits. Verification/reset email is persisted to `mail_outbox` and sent by
the separate worker.

The PostgreSQL schema is in `calendar-backend/migrations/`. Users own calendars;
calendars own timezone settings, events, and recurrence definitions. Users own
shared financial categories, monthly budget limits, and financial currency
settings. Events and recurring definitions carry an owner key so PostgreSQL
can enforce that their calendar and optional category have the same tenant.
Events currently require date/start/end and store a non-null
`budget` defaulting to zero; category is nullable. Recurrence definitions are
not materialized event rows.

## Validation and Tooling

Both packages use npm and require Node 20+. CI installs both lockfiles, lints
both packages, runs backend unit/integration tests against PostgreSQL 16,
builds the frontend, and audits production dependencies.

```bash
npm run lint
npm run build
npm --prefix calendar-backend run lint
npm --prefix calendar-backend run test:unit
npm --prefix calendar-backend run test:integration
```

Integration tests manage a Docker Compose PostgreSQL instance on port 5433.
There is no frontend automated test suite and no TypeScript/type-check command.
Use `docs/refactor-parity.md` for manual behavior-preservation checks.
