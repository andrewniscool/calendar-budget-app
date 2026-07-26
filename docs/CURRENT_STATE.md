# Current State

This snapshot records verified implementation gaps, not a feature mandate.

## Working Today

- Cookie-based register/verify/login/refresh/logout/password-reset flow.
- Calendar CRUD with an overlaid multi-calendar workspace and sidebar toggles.
- Calendars persist a validated `#RRGGBB` color through the API; existing
  clients receive the `#2563EB` default.
- Day, week, month, and year views; timed event creation and event CRUD.
- Existing events initially open in read-only details with an Edit action.
- User-level shared financial categories, event budget amounts, sidebar
  spending summaries, and persisted global monthly limits.
- Backend APIs also support calendar timezone settings, user financial
  currency settings, and recurring-event definitions.
- Backend tenant isolation, strict validation, CSRF, parameterized SQL, Vitest
  unit tests, and PostgreSQL integration tests.

## Product/Implementation Gaps

- Category colors remain compatibility metadata for subtle dots and badges;
  calendar color is the dominant event color.
- The event `budget` is a required database value defaulting to `0`, while the
  product wants financial information conceptually optional. The UI treats
  blank input as zero and does not distinguish “no expense” from a real
  zero-cost entry.
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

The shared category and limit foundation is in place. Next, clarify optional
event financial semantics and build the dedicated shared Budget page with an
explicit calendar filter. See `docs/PRODUCT.md` for the durable phase sequence.
