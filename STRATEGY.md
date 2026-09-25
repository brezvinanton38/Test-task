# Strategy

## 1. What did you choose to automate, and what did you deliberately leave out?

Automated: the one flow that actually makes the business money — a client
booking a service end-to-end — plus the two failure modes most likely to
either lose a real booking or let a broken slot through (invalid contact
info, double-booking a slot). Everything data/business-rule-shaped that
doesn't need a browser (does the widget list the right services at the right
price, does the API reject a slot outside working hours) was tested directly
against the REST API instead: it's an order of magnitude faster and doesn't
flake on rendering timing.

Deliberately **not** automated in this pass:
- The payment/checkout step. It's third-party (a bank's own 3D Secure page),
  costs real money per run, and a broken checkout is something you want a
  human to see immediately, not buried in a CI log.
- The multi-screen onboarding questionnaire (business type, team size,
  etc.). It's marketing/segmentation content with no functional branching
  that affects booking — low regression risk for the effort of maintaining it.
- Visual/pixel-level checks. A functional suite asserting on role/text is the
  wrong tool for that; it belongs in a dedicated visual-regression pass.

## 2. How do you keep tests that depend on "today" and "the next open slot" from becoming flaky?

Three rules, applied consistently:

1. **Never compute a slot by hand — ask the system for one.** An early
   version of the API test built "tomorrow at 09:00" with manual UTC math and
   it failed intermittently, because the backend doesn't actually convert
   between timezones the way you'd expect (see STRATEGY §3, bug #2) — it just
   relabels the same clock digits with a different offset. The fix was to
   stop guessing and call the same "nearest available slots" endpoint the
   widget itself calls, then use *that* value verbatim. The test now
   expresses "a slot the system currently considers valid must validate", not
   "9am UTC+something must validate" — which is what should actually be
   under test.
2. **Pick slots dynamically so parallel tests can't collide.** The happy
   path always takes the *first* available slot; the "slot disappears after
   booking" test always takes the *last* one from the same nearest-slots
   list. Both are correct regardless of what other tests already booked
   today, so running the suite five times in a row never runs out of slots
   or fights itself for the same one.
3. **Arrange state through the API, assert through the UI (or vice versa).**
   The double-booking test books via a direct API call and only then loads
   the widget to confirm the slot is gone — a full UI round trip to set up
   state would be slower and would add an extra place for that specific test
   to flake for reasons unrelated to what it's actually checking.

## 3. What did you find while exploring, and how would you report it?

- **Phone input silently drops a digit.** On the "Ваш телефон" field
  (registration and the widget's contact form), typing a 9-digit number
  without a leading `0` gets misparsed — the mask consumes the first typed
  digit as the missing country-code digit, so `671112233` becomes
  `+38 (671) 112-233` (note: `+38`, not `+380`) and fails validation with no
  explanation of *why*. It's fixable by the user once they notice, but
  nothing tells them to add the leading zero. I'd file this as a low-severity
  UX bug with repro steps and both mangled/expected values, since it doesn't
  block usage but will generate confused support tickets.
- **The `start_at` timezone the API accepts isn't converted, it's relabeled.**
  Sending `"2026-09-26T09:00:00.000Z"` (UTC) for a slot the widget displays
  as "09:00" comes back from `POST /appointments/` as
  `"start_at": "2026-09-26T09:00:00+03:00"` — same clock digits, different
  offset annotation, which are two different instants in real time. Harmless
  as long as every client only ever reads the digits and ignores the offset
  (which is apparently what the widget itself does), but it's a landmine for
  any future integrator who parses that field as an actual instant. I'd
  report this to the backend team with the two payloads side by side, since
  it's the kind of thing that's invisible until someone's calendar sync is
  off by three hours.
- **The employee-selection step's "Продовжити" control isn't a real
  `<button>`**, unlike the equivalent control on every other step of the same
  flow (summary, contact form). Functionally invisible to a mouse user, but
  it's inconsistent for keyboard/screen-reader users and it's exactly the
  kind of inconsistency that breaks role-based automation — which is how it
  was found. Low severity, filed as an accessibility/consistency nit.
