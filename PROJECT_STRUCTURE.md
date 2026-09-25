# Project structure rationale

```
src/
  config.ts                # Defaulted, non-secret target config (widget/API URLs, company slug)
  pages/
    BookingWidgetPage.ts   # Page Object for the client-facing booking widget
  api/
    NatodiApiClient.ts     # Typed wrapper + zod schemas over the public REST API used by the widget
  fixtures/
    test-data.ts           # Shared constants and data generators (service names, random client)
  utils/
    resolveNextSlot.ts     # Shared "ask the API for a real bookable slot" logic (see STRATEGY.md §2)
tests/
  e2e/
    happy-path.spec.ts
    negative.spec.ts
  api/
    branch.api.spec.ts
    services.api.spec.ts
    appointments.api.spec.ts
playwright.config.ts        # Two projects: e2e-chromium (browser) and api (no browser)
```

## Why a Page Object for the widget, not inline locators

The widget has no `data-testid` attributes, so every locator is built on role
and visible text. Centralizing that in `BookingWidgetPage` means a copy change
("Продовжити" → something else) or a markup change (the confirm control not
always being a real `<button>`, which it in fact isn't on every step — see
STRATEGY.md) only needs a fix in one place instead of in every spec file.

## Why a typed API client instead of calling `request.get(...)` inline

`NatodiApiClient` gives every endpoint a name and a typed payload/response
shape. Test files then read as intent ("resolve the branch, then validate an
appointment") instead of URL strings and query params, and a change to a
request shape (e.g. a new required field on `/appointments/`) only needs
updating in one place.

## Why two Playwright *projects* instead of one

E2E tests need a real browser and `WIDGET_BASE_URL`; API tests need neither —
they only need `APIRequestContext` and `API_BASE_URL`. Splitting them into
`e2e-chromium` and `api` projects means the API suite runs in a fraction of a
second without spinning up Chromium, and `npm run test:api` / `test:e2e` can
be run independently (e.g. in CI, API tests as a fast smoke check before the
slower browser suite).

## Where shared logic lives, and why nothing is duplicated between specs

Every class has exactly one job: `BookingWidgetPage` only knows how to drive
the widget, `NatodiApiClient` only knows how to call the API, `resolveNextSlot`
only knows how to turn "give me a bookable slot for service X" into the two
API calls that answer that — nothing reaches into another module's
internals. Two concrete examples of this paying off:

- `BookingWidgetPage.pickServiceAndFirstSlot()` is the exact sequence both
  `happy-path.spec.ts` and the phone-validation case in `negative.spec.ts`
  need before they diverge (one inspects the summary screen, the other jumps
  straight to the contact form). It exists once, on the page object, instead
  of being copy-pasted into both spec files.
- `resolveNextSlot()` is used by both `appointments.api.spec.ts` (to validate
  a real slot) and `negative.spec.ts` (to book one out from under the next
  client). Both need "a service and a slot the API currently considers
  bookable"; neither needed to know how that's computed.

## Why `src/config.ts` defaults the target instead of requiring `.env`

Task requirement: the suite must run with two commands (`npm install`, `npm
test`). None of the three values it needs (widget URL, API URL, company slug)
are secret, so they're defaulted in code and only overridden by `.env` when
present — nothing to copy or configure for the common case.

## Why one schema assertion uses zod instead of hand-written field checks

`services.api.spec.ts` has both a schema-shape test and a value-based test on
purpose: `serviceListResponseSchema.parse(body)` asserts the *shape* (right
keys, right types) independently of any specific service, which is what
`response-schema assertion` in the brief actually asks for — a hand-rolled
handful of `expect(typeof x).toBe(...)` calls would do the same job with more
code and less clarity.

## Why services/employees/slots are fetched at runtime instead of hardcoded

Company, service and employee ids are UUIDs generated when the test company
was set up; slots depend on "today". Hardcoding any of them would make the
suite either break the moment the test company is recreated, or silently stop
testing anything meaningful as slots age into the past. Every spec resolves
what it needs from the API itself (see `getBranchBySlug`, `listServices`,
`listEmployeesWithNearestSlots`) — the tests describe *behavior* against
whatever the live system currently reports, not a frozen snapshot of it.
