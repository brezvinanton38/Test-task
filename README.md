# Natodi booking — automated tests

Playwright + TypeScript test suite for the Natodi booking widget of a live test
company ("QA Test Barbershop"), covering the client booking flow end-to-end
and the underlying public REST API.

## What's covered

- **E2E (`tests/e2e`)** — drives the real widget at `https://book.natodi.com/<slug>`:
  - `happy-path.spec.ts` — select service → select time slot → confirm → sees confirmation.
  - `negative.spec.ts` — invalid phone number blocks submission; a slot that
    was just booked is no longer offered to the next client.
- **API (`tests/api`)** — hits `https://api.natodi.com/api/v1` directly:
  - `branch.api.spec.ts` — resolving a company by its public slug: success case (200) and negative case (404).
  - `services.api.spec.ts` — response-schema assertion, plus service list matches configured price/duration.
  - `appointments.api.spec.ts` — slot validation accepts a real slot and rejects a past date.

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for why the code is organized this way,
[STRATEGY.md](./STRATEGY.md) for the reasoning behind scope and test-reliability decisions,
and [TEST_REPORT.md](./TEST_REPORT.md) for the last recorded run.

## Prerequisites

- Node.js 18+
- Google Chrome or Chromium available to Playwright (`npx playwright install chromium`
  if you've never run Playwright on this machine before)

## Run it (two commands)

```bash
npm install
npm test
```

That's it — `src/config.ts` defaults to the live test company
(`https://book.natodi.com/qa-test-barbershop-5116b6dd` and its public API), so
no `.env` file is required. To point the suite at a different company, copy
`.env.example` to `.env` and adjust the three values there; anything set in
`.env` overrides the defaults.

Other useful commands:

```bash
npm run test:e2e      # only the browser-driven booking flow
npm run test:api      # only the API checks
npm run test:headed   # e2e tests with a visible browser, useful while debugging
npm run report        # open the last HTML report
```

Tests are fully parallel and safe to re-run repeatedly: every test resolves
company/service/employee ids and available time slots live from the API at
run time instead of hardcoding them, so nothing needs to be reset between runs
(see STRATEGY.md for why).

## Notes on the test data

The tested company is a disposable Natodi trial account created solely for
this assignment (services: "Чоловіча стрижка" 700 грн/1h, "Стрижка бороди"
300 грн/30min; staff: two barbers; working hours 09:00–18:00 every day for
the current month). The trial subscription was cancelled via
Profile → Підписки → Скасувати підписку right after this submission was
finalized — access remains until 2026-10-02, after which the account will be
restricted with no further charges.
