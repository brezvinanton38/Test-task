# AI usage

I did this assignment with Claude Code as an active pair, not just autocomplete.
Below is what it actually did on its own, what needed me specifically, and
what it got wrong along the way.

## What was delegated to AI

- Registering the Natodi trial account and exploring the live product (both
  the admin panel and the public booking widget) by driving a real browser,
  to learn the actual flow and selectors instead of guessing from the task
  description.
- Reverse-engineering the widget's REST API by watching network traffic
  during a manual booking, rather than me reading API docs (there weren't
  any) — that's how `NatodiApiClient` and the three API test targets were
  found.
- The entire test project: `playwright.config.ts`, the `BookingWidgetPage`
  page object, the API client, all 8 tests (3 E2E, 5 API), and every
  Markdown deliverable including this one's first draft.
- Iterating on failing tests by reading Playwright's own error output and
  fixing the underlying cause rather than adding retries/timeouts to paper
  over it.

## What needed me specifically (not delegable)

- **Which email to register with.** The agent first signed up with my work
  email by default; I stopped it, had it abandon that account, and pointed it
  at my personal address instead. That's a judgment call about my own
  identity an AI shouldn't make unprompted.
- **Authorizing and completing the actual payment.** I gave explicit
  go-ahead before any card details were submitted, and the 3D Secure
  confirmation happened in my own banking app — a human-in-the-loop step by
  construction, no agent can click a button inside my phone's banking app.
- Deciding what was in/out of scope for automation (STRATEGY.md §1) — that's
  a judgment call about business risk, informed by the exploration but made
  by me.

## Specific errors the AI made that I (or the test run itself) caught

1. **Wrong API base URL handling.** The client built request URLs with a
   leading slash (`/branches/...`), which — per the `URL()` resolution rules
   — replaces the entire path of the base URL instead of appending to it.
   Every API test failed with 404s until this was diagnosed and fixed (base
   URL given a trailing slash, request paths given no leading slash).
2. **A flaky test from hand-rolled timezone math.** The first version of the
   "validate a real slot" API test built `"tomorrow at 09:00"` manually and
   assumed a UTC+3 offset; it failed against a slot the API considered
   outside working hours. The fix was to stop computing the slot by hand and
   fetch a real one from the API's own "nearest available slots" endpoint
   instead — which also surfaced the timezone-relabeling quirk documented in
   STRATEGY.md §3.
3. **A locator that assumed every "Продовжити" control is a `<button>`.** It
   is, except on the employee/slot-selection step, where it's a plain
   clickable element — the first test run timed out waiting for a button
   role that didn't exist there. Fixed by matching on the visible text
   instead of the accessibility role, with a comment explaining why.
4. **A skipped step in the booking flow.** The first draft of the happy-path
   test tried to jump from picking a time slot straight to the contact form,
   but the real widget has an intermediate booking-summary screen with its
   own "Продовжити". The test failed asserting on content that hadn't loaded
   yet; fixed by adding the missing step (`confirmSlotSelection`) and
   verified against the actual page structure rather than assumption.

All four were caught by actually running the tests against the live system
before considering them done, not by inspection alone.
