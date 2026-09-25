# Test execution report

**Run date:** 2026-09-25 (UTC)
**Target:** `https://book.natodi.com/qa-test-barbershop-5116b6dd` (E2E) /
`https://api.natodi.com/api/v1` (API) — live Natodi trial company
**Command:** `npm test`
**Result:** 9/9 passed, 0 flaky, ~5s total (in addition to browser startup)

```
Running 9 tests using 5 workers

  ✓  [api] GET /branches/{slug}/slug › resolves an active company by its public slug     (382ms)
  ✓  [api] GET /branches/{slug}/slug › returns 404 for a slug that does not exist         (166ms)
  ✓  [api] GET /services/ › response matches the expected schema                         (688ms)
  ✓  [api] GET /services/ › lists widget-visible services with correct price/duration     (493ms)
  ✓  [api] POST /appointments/validate › accepts a slot within working hours              (534ms)
  ✓  [api] POST /appointments/validate › rejects a slot in the past                       (492ms)
  ✓  [e2e] happy path › select service → select time slot → confirm → sees confirmation  (4.4s)
  ✓  [e2e] negative › invalid phone number keeps "Записатись" disabled                    (3.4s)
  ✓  [e2e] negative › a booked slot is no longer offered to the next client               (3.5s)

  9 passed (4.9s)
```

Re-run three times in a row (`npm test` executed back-to-back) with identical
results every time — no flakiness observed across parallel workers, which
matters here since three of the nine tests book real appointments against
shared employee availability (see STRATEGY.md for how collisions between
tests are avoided). Also verified once with no `.env` file present at all, to
confirm the "two commands, zero config" claim in the README.

## How to reproduce

```bash
npm install
npx playwright install chromium   # first run on a machine only
npm test
npm run report                    # opens the HTML report (screenshots/video/trace on failure)
```

## Coverage notes

- All 3 required E2E scenarios present: 1 happy path + 2 negative cases.
- 6 API tests across 3 endpoints, explicitly covering all three requested
  kinds: a successful request, a negative case, and a response-schema
  assertion (`services.api.spec.ts`, via `zod`).
- No tests were skipped or marked flaky/quarantined.
