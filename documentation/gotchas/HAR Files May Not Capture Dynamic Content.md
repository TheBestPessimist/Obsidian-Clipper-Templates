---
created: 2026-02-20
related:
  - "[[gotchas]]"
  - "[[guide/Playwright Tests With HAR Files]]"
  - "[[gotchas/HAR URL Pattern Must Include All Domains]]"
---

HAR files capture network responses at recording time. If you stop recording too early, some API responses may not be captured and will show as loading states.

**Signs of incomplete recording:**
- Elements show loading spinners or skeleton states in captured HTML
- `aria-label="Loading..."` attributes
- Missing data that should be present for logged-in users

**Note:** If your HAR file contains the data but it's still not appearing during replay, the problem is likely a URL pattern filter that's too narrow. See [[gotchas/HAR URL Pattern Must Include All Domains]].

**If data is genuinely not in the HAR:**
- Re-record after waiting for page to fully load (all spinners gone)
- Watch the DevTools Network tab — wait until activity stops
- Manually edit the HAR file to add missing responses (advanced)
