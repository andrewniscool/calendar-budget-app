# Feature Ideas & Roadmap

Running log of features discussed for the UVA student dashboard pivot (calendar + budget + classes). Ranked by priority based on effort vs. differentiation.

## Already built
- Calendar (day/week/month/year views)
- Budget dashboard, categories, settings, summary
- Auth (email verification, secure cookies)

## Tier 1 — Core differentiators, build next
1. **Canvas API integration** — pull assignment due dates and calendar events into the app calendar. Official, documented Instructure REST API. UVA fully migrated to Canvas (canvas.virginia.edu) as of Fall 2023, so this is stable to build on. Auth via personal access token (student-generated) or OAuth.
2. **UVA SIS class schedule integration** — pull a student's actual enrolled classes/meeting times. This is the wedge feature — nothing else gives a UVA student their real schedule inside a personal dashboard. Caveat: the SIS endpoint (sisuva.admin.virginia.edu) is *not* an officially documented/supported API — it's reverse-engineered, used by Lou's List, UVA Course Explorer, and (formerly) Plannable. No SLA, can change without notice. Build an abstraction/caching layer around it so a breakage only requires patching one place; don't make it a hard dependency for signup.

## Tier 2 — High value, moderate effort (builds on Tier 1)
3. **Auto-block study time** around class schedule + assignment load (combines Canvas + SIS data instead of manual logging).
4. **Roommate/shared expense splitting** (Splitwise-style) — high relevance for dorm/apartment life.
5. **Dining dollars / meal plan balance** as its own budget category — irregular disbursement pattern generic budget apps don't handle.

## Tier 3 — Worth doing, lower priority
6. **Location check-in** (library/gym) — opt-in, explicit check-in/log model, *not* passive background tracking. iOS Safari/PWA blocks background geolocation entirely (Apple requires native for that), so this has to be "tap to check in" rather than ambient tracking anyway. Privacy notes: store derived data (building + duration), not raw GPS trails; never request "always" location permission; give a real delete-history button; treat consent as its own explicit opt-in (Virginia's VCDPA classifies precise geolocation as sensitive data requiring opt-in, not opt-out).
7. **Tuition / financial aid disbursement date overlay** on the calendar.
8. **Study/gym hour logging** — only worth building if tied to the check-in feature above; a standalone manual log gets abandoned fast.

## Explored and deprioritized
9. **Bank/Venmo sync via Plaid** — technically solid (Plaid handles the secure link, Venmo itself even goes through Plaid, Zelle transactions show up automatically as normal line items in the linked bank feed). Rejected for now: Plaid pricing is usage-based per connected account and gets expensive at real scale, which conflicts with keeping the app free. Sticking with manual budget entry.
10. **Passive/ambient location tracking** — not feasible on the current web stack; would require a native app. Superseded by the check-in model in Tier 3.

## Open questions
- Is this a portfolio/personal project for you + UVA friends, or something meant to grow? Changes how much to invest in multi-tenant scaling vs. polish.
- Check trademark/branding rules before using "UVA" in the app name or marketing.
