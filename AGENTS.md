# Calendar Budget Agent Guide

## Product Overview

This is **Spendary**, a React/Vite calendar and budgeting application. Its core
idea is:

> A calendar that helps users understand how their schedule affects their money.

Calendar events and money must form one workflow, not two adjacent products.
The intended flow is sign in → open the calendar → choose day/week/month/year →
create an event → optionally add financial information → view details → edit or
delete → see spending totals update.

See `docs/PRODUCT.md` for the product model and priorities and
`docs/CURRENT_STATE.md` for verified gaps between that model and the current UI.

## Product Model and UI Rules

- A **calendar** is an area of life (Personal, School, Work, shared). Users may
  have several, normally overlaid on one grid and individually toggled in the
  sidebar. A focused single-calendar view is a filter, not the default model.
- A **budget category** is a financial classification (Food, Transportation,
  Entertainment, Bills, Shopping, Other, or no expense). It is not a calendar.
- An event belongs to one calendar and may optionally have a budget category.
- Calendar color is the event's dominant color. Category is secondary metadata:
  icon, small label, details text, or subtle badge. Do not add a competing
  category color.
- Financial data must remain optional. Ordinary events must not require a cost
  or category. The model may later distinguish expected/actual cost, payment
  status, planned/paid/cancelled state, and recurring financial events.
- Opening an existing event starts in read-only details. Edit requires an
  explicit Edit action; delete belongs in the details flow with confirmation.
- Keep the app restrained and productivity-oriented: consistent spacing/type,
  connected header/grid, useful interaction/loading/empty/error states, no
  overlap or overflow, and responsive desktop/small-laptop behavior. Animation
  must not compromise usability. See `docs/UI_RULES.md`.

## Priorities and Non-Goals

Unless a task overrides them:

1. Preserve and stabilize existing calendar behavior.
2. Clarify and implement the multiple-calendar model.
3. Improve event create/view/edit/delete.
4. Make financial fields optional and understandable.
5. Connect event costs to persisted budget totals.
6. Improve Today/weekly planning.
7. Improve sign-in/onboarding.
8. Add deeper analytics later.

Do not expand into a broad student dashboard before the calendar-budget
workflow is coherent. Chatbots, social feeds, complex project management,
degree/tuition tracking, SIS integrations, and large AI recommenders are out of
scope unless explicitly requested. `docs/feature-ideas.md` is historical
brainstorming and does not override this order.

## Verified Architecture

Frontend (root npm package, JavaScript, React 19, Vite 6, Tailwind CSS):

- Entry: `src/main.jsx` → `src/App.jsx`.
- Auth UI/state: `src/App.jsx`, `src/loginPage/`, `src/services/userService.js`.
- Calendar selection: `src/CalendarList.jsx`; app shell/state:
  `src/MainApp.jsx`.
- Shell: `src/components/Header.jsx` and `src/components/Sidebar.jsx`.
- View dispatcher: `src/components/Calendar.jsx`; views:
  `src/components/ViewModes/{DayView,WeekView,MonthView,YearView}.jsx`.
  Shared timed-event rendering/layout lives in `EventBlock.jsx` and
  `timeGrid.js`.
- Event create/details/edit UI: `src/components/EventModal.jsx`.
- Budget UI: `src/components/Budget_stuff/`; category UI:
  `src/components/Sidebar_stuff/CategoryManager.jsx`.
- Shared Axios client: `src/services/apiClient.js`; feature wrappers:
  `src/services/{calendar,category,event,user}Service.js`.
- Development bypass/mock switches: `src/devConfig.js`.

Backend (`calendar-backend`, separate npm package, Express 5, PostgreSQL):

- Startup/composition: `src/index.js`, `src/app.js`; routes:
  `src/routes.js`; strict Zod boundary validation: `src/validation.js`.
- Vertical slices use `src/controllers/` (HTTP translation), `src/services/`
  (domain rules), and `src/repositories/` (parameterized, user-scoped SQL).
- DB/config/security: `src/db.js`, `src/config.js`, `src/security.js`;
  authentication/CSRF: `src/middleware/authMiddleware.js`.
- Durable verification/reset mail: `src/worker.js`,
  `src/services/outboxWorker.js`, and the `mail_outbox` table.
- Schema/migrations: `calendar-backend/migrations/`. The consolidated baseline
  is currently the only migration; never edit an applied migration—add one.
- Tests: Vitest unit and Supertest/PostgreSQL integration suites in
  `calendar-backend/test/`. There is no frontend test suite or type-check
  script. CI is `.github/workflows/ci.yml`.

The access/refresh session uses HttpOnly cookies; a readable signed CSRF cookie
must match `X-CSRF-Token`. Axios performs one refresh/replay on 401. Backend
repositories enforce calendar ownership for private resources. Preserve this
flow and the current API contracts. More detail is in
`docs/ARCHITECTURE.md` and `calendar-backend/README.md`.

## Development Rules

Before changing code:

1. Inspect the repository and working tree; do not overwrite user changes.
2. Identify the actual files/layers and briefly explain current behavior.
3. Define the smallest coherent change; phase broad roadmap work.
4. Avoid unrelated refactors and do not remove features without approval.
5. Preserve authentication, CSRF, API contracts, state flow, backend behavior,
   and database ownership rules unless the task explicitly changes them.

While changing code:

- Do not rewrite architecture for a UI task or add a UI framework for a scoped
  styling change. Reuse existing patterns/utilities before adding duplicates.
- Keep validation at API boundaries, controllers thin, domain rules in
  services, and SQL/database access in repositories.
- Use parameterized SQL and scope every private operation to the authenticated
  user. Never weaken authentication/authorization or move ownership checks to
  the frontend.
- Never edit old migrations; add a new migration for schema changes.
- Do not introduce mock data into production flows. Preserve the intentional
  `VITE_SKIP_AUTH`, `VITE_SKIP_CALENDAR_PICKER`, and `VITE_USE_MOCK_API`
  development behavior unless explicitly changing it.

After changing code, run proportionate validation and report files changed,
why, exact commands/results, and anything that could not run.

## Commands

Requires Node 20+ and npm. Docker is required for PostgreSQL integration tests.

```bash
npm run lint
npm run build
npm --prefix calendar-backend run lint
npm --prefix calendar-backend run test:unit
npm --prefix calendar-backend run test:integration
```

Useful root commands: `npm run dev`, `npm run dev:backend`,
`npm run dev:worker`, `npm run db:up`, `npm run db:down`, and
`npm run test:backend`. There is no dedicated frontend test or type-check
command.

## Implementation Task Template

Use `docs/tasks/TEMPLATE.md`. Every task should state the goal, verified
existing behavior, user-facing behavior, likely files, technical requirements,
non-goals, edge cases, acceptance criteria, and validation commands.
