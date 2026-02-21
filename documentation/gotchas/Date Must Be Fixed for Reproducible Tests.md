---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Adding New Template Tests]]"
  - "[[Clipper Template Test Harness]]"
  - "[[patterns/Date Mocking via Playwright Route Interception]]"
---

Templates using `{{date}}` produce different output each day. Without a fixed date, tests fail the next day.

For Playwright E2E tests, the Date object is mocked via route interception — see [[patterns/Date Mocking via Playwright Route Interception]]. The mock date is `2026-02-20` (defined as `MOCK_DATE` in `fixtures.ts`).

Expected markdown files use the real date (`2026-02-20`) matching the mock. No placeholders needed.
