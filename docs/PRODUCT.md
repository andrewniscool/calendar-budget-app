# Product Direction

## Purpose

Spendary is a calendar that helps users understand how their schedule affects
their money. Scheduling and financial context should be one workflow.

The primary journey is: sign in, open the shared calendar, navigate the current
day/week/month/year, create an event, optionally add financial information,
open read-only details, edit or delete, and see related spending totals update.

## Domain Model

Calendars organize areas of life such as Personal, School, Work, and shared
calendars. A user may own or access several. The normal experience overlays
enabled calendars on one grid; sidebar toggles control visibility. A focused
calendar view may filter the grid.

Budget categories classify optional event spending: Food, Transportation,
Entertainment, Bills, Shopping, Other, or no expense. Calendars and categories
are separate concepts. Every event belongs to a calendar; it may have no
financial classification or amount.

Calendar color is the event's primary visual identity. Category and cost are
secondary metadata. For example, a green Personal event titled Dinner may show
`Food · $25` subtly without Food introducing another dominant color.

The financial model may grow to expected cost, actual cost, payment status,
planned/paid/cancelled states, and recurring financial events. All remain
optional so ordinary scheduling stays lightweight.

## Priority Order

1. Stabilize the calendar.
2. Clarify multiple calendars and the shared-grid model.
3. Refine event create/details/edit/delete.
4. Clarify optional financial fields.
5. Persist and connect costs and budget totals.
6. Improve Today/week planning.
7. Improve authentication/onboarding.
8. Add analytics after the core workflow works.

Do not build a broad student dashboard or unrelated chat, social, project
management, degree, tuition, SIS, or AI systems without an explicit task.

## Decisions Still Needed

- Whether calendars can be shared now, and what roles/permissions sharing uses.
- The calendar creation UI palette. The API now stores a customizable
  six-digit hex color and uses `#2563EB` as its compatibility default.
- Whether the current `budget` field means expected cost, actual cost, or a
  transitional generic amount.
- Currency/timezone presentation rules and when existing backend calendar
  settings become visible in the UI.
- How totals treat cancelled, unpaid, and recurring events once those states
  exist.

## Agreed Delivery Phases

1. **Calendar color foundation:** persist and validate calendar colors while
   preserving the existing single-calendar UI.
2. **Shared multi-calendar interface:** enter one calendar workspace, overlay
   enabled calendars on the grid, and manage visibility/creation in the
   sidebar.
3. **Event form and visual separation:** require a calendar, keep financial
   category/cost optional, use calendar color as primary, and show financial
   metadata secondarily.
4. **Shared Budget page:** default to All Calendars with a simple single-calendar
   filter, one month selector, and global overall/category limits. Do not add
   per-calendar budget limits or comparison dashboards initially.

Before Phase 4, decide whether budget categories become user-level shared
records or remain per-calendar records merged for reporting. Favor a coherent
shared category model over merging categories by display name.
