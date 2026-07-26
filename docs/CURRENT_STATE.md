# Current State

This snapshot records verified implementation gaps, not a feature mandate.

## Working Today

- Cookie-based register/verify/login/refresh/logout/password-reset flow.
- Calendar CRUD followed by opening one selected calendar.
- Calendars persist a validated `#RRGGBB` color through the API; existing
  clients receive the `#2563EB` default.
- Day, week, month, and year views; timed event creation and event CRUD.
- Existing events initially open in read-only details with an Edit action.
- Per-calendar colored categories, event budget amount, sidebar spending
  summaries, and locally editable monthly limit values.
- Backend APIs also support persisted monthly budget limits, calendar
  timezone/currency settings, and recurring-event definitions.
- Backend tenant isolation, strict validation, CSRF, parameterized SQL, Vitest
  unit tests, and PostgreSQL integration tests.

## Product/Implementation Gaps

- The frontend calendar picker leads to a completely separate single-calendar
  app. It does not overlay multiple calendars or toggle them in the sidebar.
- The existing `categories` concept combines a label with the dominant event
  color. The target model requires calendar color to be dominant and financial
  category to be secondary. Migrating this needs an explicit data/API/UI plan;
  do not merely rename labels.
- The event `budget` is a required database value defaulting to `0`, while the
  product wants financial information conceptually optional. The UI treats
  blank input as zero and does not distinguish “no expense” from a real
  zero-cost entry.
- MainApp seeds budget limits in React state. `BudgetSettings` updates only that
  state; the frontend does not call the backend budget-limit endpoints.
- The frontend has no service/UI for calendar settings or recurring definitions.
- Spending totals use event `budget`; expected versus actual cost, payment
  status, and planned/paid/cancelled states do not exist.
- No frontend automated tests or browser E2E tests exist.
- Destructive event/category/calendar actions should be audited for consistent
  confirmation and error feedback.

## Documentation Conflict

`docs/feature-ideas.md` describes an older UVA student-dashboard pivot. It is
historical brainstorming, not current priority. Follow `AGENTS.md` and
`docs/PRODUCT.md` unless a future task explicitly revives an idea.

## Immediate Safe Direction

Calendar color foundation is Phase 1. Next, implement the shared multi-calendar
workspace and sidebar toggles without yet changing budget semantics. Then
separate event calendar color from optional financial metadata. Build one
shared Budget page only after deciding whether financial categories become
user-level records. See `docs/PRODUCT.md` for the durable phase sequence.
