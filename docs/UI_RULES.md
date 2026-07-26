# UI and Interaction Rules

- Present one shared calendar grid with enabled calendars overlaid. Treat a
  single-calendar screen as a filter, not the default architecture.
- Use calendar color as the event's dominant color. Show budget category and
  amount as restrained secondary metadata, never a competing color system.
- Keep cost and category optional in event creation.
- Open existing events in read-only details. Require Edit before exposing the
  form; make delete available from details and confirm destructive action.
- Preserve day, week, month, and year navigation and make Today/weekly planning
  especially efficient.
- Use a restrained productivity-tool visual language: consistent spacing and
  typography, clear hierarchy, and a visually connected header/calendar.
- Design selected, hover, focus, loading, empty, success, and error states.
  Ensure keyboard-visible focus and meaningful control labels.
- Prevent clipping, overlap, and overflowing text. Support desktops and smaller
  laptops; do not insert oversized marketing sections into the signed-in app.
- Motion may communicate state changes but must remain quick, interruptible,
  and subordinate to usability.
- Prefer scoped improvements using existing Tailwind/CSS/component patterns.
