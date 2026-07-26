# Goal

Make budget categories and monthly limits user-level financial resources shared
across every owned calendar while preserving tenant isolation.

# Existing Behavior

Categories and limits were owned by calendars. Events and recurring definitions
used composite category/calendar foreign keys, and the frontend fetched and
managed a separate category list for each focused calendar.

# User-Facing Behavior

One category can classify events in Personal, Work, or School. Calendar color
remains dominant, category color is subtle metadata, category toggles no longer
hide events, and monthly limits persist globally in the user's financial
currency.

# Files Likely Involved

- `calendar-backend/migrations/1785034000000_share_financial_categories.js`
- `calendar-backend/src/`
- `src/MainApp.jsx` and the category/budget/event UI

# Technical Requirements

- Merge existing categories by trimmed, case-insensitive user/name.
- Preserve authenticated repository filters and add database owner constraints.
- Sum legacy per-calendar limits by user/month/category.
- Keep event financial fields optional at the API level and preserve zero as the
  current compatibility default.
- Use a coordinated deployment and run the read-only migration preflight first.

# Non-Goals

- Expected versus actual cost, payment state, occurrence materialization,
  calendar sharing roles, and a full standalone Budget page.

# Edge Cases

- Duplicate names/casing/colors, cross-tenant IDs, calendar/category deletion,
  conflicting legacy currencies, quota overflow, amount overflow, uncategorized
  events, and users with no calendars.

# Acceptance Criteria

- Shared category CRUD is user-scoped.
- Events and recurring definitions accept any category owned by their user.
- Global limits persist by category ID and survive calendar deletion.
- Category deletion clears event/recurrence references across calendars.
- Calendar colors remain the primary event colors.

# Validation Commands

```bash
npm run lint
npm run build
npm --prefix calendar-backend run lint
npm --prefix calendar-backend run test:unit
npm --prefix calendar-backend run test:integration
```
