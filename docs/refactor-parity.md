# Refactor parity checklist

Use this checklist before and after behavior-preserving refactor passes.

## Automated checks

- `npm run lint`
- `npm run build`
- `npm run test:backend` when Docker is running

## Frontend flows

- Auth screens still load login, signup, forgot password, reset, resend verification, and legacy email enrollment views.
- Calendar list still loads, creates calendars, opens a selected calendar, and deletes calendars.
- Header navigation still changes dates for day, week, month, and year views.
- Day, week, month, and year views still render the same selected date and visible events.
- Clicking a day/week time slot still creates a pending event with title `New Event`, a one-hour time range, no category, and budget `0`.
- Dragging in week view still creates a pending event spanning the dragged hours.
- Opening, saving, updating, and deleting an event still uses the same modal fields and API calls.
- Category visibility, create, edit, delete, and clear-all actions still update the sidebar and visible events.
- Budget sidebar totals and warnings still reflect the same events, categories, date, and view mode.

## Backend flows

- CSRF protection still rejects missing or forged tokens.
- Registration, verification, login, refresh, logout, password reset, and legacy email enrollment keep their routes and response shapes.
- Calendar, category, and event routes keep their authentication, validation, status codes, and tenant isolation behavior.
- Category/calendar constraints for event writes are still enforced.

## Split-out migrations

- Dependency upgrades, framework migrations, API renames, auth policy changes, database schema changes, and removal of legacy enrollment must be separate migration tasks.
