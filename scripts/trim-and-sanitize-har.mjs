/**
 * Trim AND sanitize every test HAR, in one pass, over every *.har the suite uses.
 *
 *   npm run trim-and-sanitize-hars                 # trim + sanitize in place
 *   npm run trim-and-sanitize-hars -- --dry-run    # report what would change, write nothing
 *   npm run trim-and-sanitize-hars -- mal imdb     # only HARs whose path contains "mal"/"imdb"
 *
 * Two independent jobs, one command (run this before committing a re-recorded HAR):
 *
 *   1. TRIM (size)     — blank the response bodies the clipper never reads
 *                        (image/video/audio/font/CSS). Pure size win.
 *
 *   2. SANITIZE (secrets) — redact credential material the DevTools recording
 *                        captured into bodies/headers: Amazon/IMDB auth cookies
 *                        (`sess-at-main`, `at-main`, `ubid-main`), any `*-token`
 *                        cookie (e.g. `session-token`, `aws-waf-token`), plus generic
 *                        secret SHAPES (AWS access-key ids, JWTs, `Bearer`/
 *                        `Authorization`, presigned-URL `X-Amz-*` params).
 *
 * Why sanitize when the secrets are already in git history (and the repo is public):
 *   history can't be rewritten here, but this stops EVERY FUTURE commit from
 *   re-publishing a freshly-recorded live token. It is a pre-commit hygiene gate,
 *   not a history scrub. (The leaked tokens themselves must be rotated out-of-band;
 *   no script can un-publish them.)
 *
 * STABLE + IDEMPOTENT by construction (re-running converges to a fixed point — the
 * 2nd and later runs leave every file byte-for-byte identical):
 *   - Each rule replaces a secret with a fixed marker (`REDACTED`, `AWS_KEY_REDACTED`,
 *     `JWT_REDACTED`). Re-running matches `key=REDACTED` and rewrites it to the
 *     identical `key=REDACTED`; the markers are shaped so they can never re-match
 *     their own rule, so output never grows or drifts.
 *   - We redact only `key=<value>` where a value is actually PRESENT. JS that merely
 *     NAMES a cookie (`"session-id"`, `S="X-Amz-Security-Token"`) carries no value and
 *     is left untouched, so page content and the clipped result are unchanged.
 *   - Low-sensitivity correlation ids that are NOT account credentials are left
 *     intact ON PURPOSE: `session-id` (a session correlation id — useless for
 *     hijacking without the auth tokens above, and entangled with the replay URLs
 *     routeFromHAR matches on), plus non-secret cookies in the same blob
 *     (`lc-main=en_US`, `csm-hit=...`, `session-id-time=<epoch>`). None are in the
 *     rule set, so they survive in every form (cookie, JSON, JS, URL) consistently.
 *
 * GENERIC, not per-site:
 *   The sanitize rules match credential SHAPES, so the same set applies to any HAR.
 *   To widen coverage, paste more patterns into SANITIZE.* below from a maintained
 *   secret-scanner ruleset (e.g. gitleaks `config/gitleaks.toml`, trufflehog,
 *   secretlint). Keep new rules SHAPE-anchored and give them a non-re-matching
 *   marker so the idempotency guarantee above still holds.
 *
 * --- TRIM rationale (unchanged) ---
 *   The clipper extracts DOM text, {{image}} URLs (plain strings from meta/schema,
 *   not the image BYTES), and page metadata. It never consumes image, video, audio,
 *   or font bytes, and the suite proves it never depends on the clipped page's CSS
 *   either. Those categories are therefore safe to blank for ANY HAR. We deliberately
 *   KEEP JavaScript everywhere: IMDB's user rating is hydrated from authenticated
 *   GraphQL by its JS, so JS is load-bearing there; keeping it for every site keeps
 *   the rule generic. We match on MIME type, not `_resourceType`, because IMDB serves
 *   its ~0.4 MB `video/mp2t` segment as `_resourceType: "xhr"` — the same bucket as
 *   the small `application/json` GraphQL that produces the rating; the response MIME
 *   type cleanly separates them. `setupClipperPage` already ABORTS image/media/font
 *   at replay, so blanking those on disk changes no behavior — it only shrinks files.
 *
 * Reversible via `git restore src/test/resources` if a future HAR ever needs a body
 * (or, for a secret, a recording that never captured it) back.
 */
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.join(__dirname, '..', 'src', 'test', 'resources');

// ---------------------------------------------------------------------------
// TRIM: generic, MIME-based drop list — bytes the clipper never reads, any site.
// ---------------------------------------------------------------------------
const DROP_MIME_PREFIXES = ['image/', 'video/', 'audio/', 'font/'];
const DROP_MIME_EXACT = new Set([
  'text/css',
  // Fonts are commonly served with an application/* type rather than font/*:
  'application/font-woff',
  'application/font-woff2',
  'application/vnd.ms-fontobject',
  'application/x-font-ttf',
  'application/x-font-otf',
  'application/x-font-woff',
]);

function shouldDrop(mimeType) {
  const mime = String(mimeType || '').split(';')[0].trim().toLowerCase();
  if (!mime) return false;
  if (DROP_MIME_EXACT.has(mime)) return true;
  return DROP_MIME_PREFIXES.some((p) => mime.startsWith(p));
}

// ---------------------------------------------------------------------------
// SANITIZE: credential SHAPES. Each rule's marker is chosen so it can never
// re-match the rule that produced it -> running twice is a no-op (idempotent).
// ---------------------------------------------------------------------------

// HAR header names whose entire value is credential material: dropped outright.
// (The current HARs keep these only inside BODIES, but a re-recorded HAR may put
//  them here, so we cover the structured location too.)
const SENSITIVE_HEADER_NAMES = new Set([
  'cookie', 'set-cookie', 'authorization', 'proxy-authorization',
  'x-amz-security-token', 'x-csrf-token', 'x-xsrf-token', 'x-api-key',
]);

// Rules applied to BODY text (response.content.text, request.postData.text) and to
// surviving header values. Order is irrelevant: the rules target disjoint shapes.
const BODY_RULES = [
  {
    // Amazon/IMDB auth cookies + ANY `*-token` cookie (session-token, aws-waf-token,
    // x-amz-security-token, ...). Only `key=value` with a real value matches — a bare
    // name reference in JS (e.g. `S="X-Amz-Security-Token"`) has no `=value` and is
    // skipped, so page code/behavior is untouched. The lookbehind anchors the key to
    // a cookie boundary so we never match the tail of a longer identifier (e.g.
    // `at-main` inside `sess-at-main`). `session-id` is intentionally absent — see the
    // header note. Value runs to the next delimiter: ; , " whitespace or backslash.
    name: 'auth-cookie',
    regex: /(?<![A-Za-z0-9_-])(sess-at-[a-z0-9]+|at-[a-z0-9]+|ubid-[a-z0-9]+|x-main|[a-z0-9-]*[a-z0-9]-token)=([^;,"\s\\]+)/gi,
    replace: (_m, key) => `${key}=REDACTED`,
  },
  {
    // AWS access-key ids. Marker has no 16-char alnum tail, so it can't re-match.
    name: 'aws-access-key-id',
    regex: /\b(?:AKIA|ASIA|AIDA|AROA|AGPA|ANPA|ANVA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
    replace: () => 'AWS_KEY_REDACTED',
  },
  {
    // JSON Web Tokens (three base64url segments). Marker has no `eyJ.` shape.
    name: 'jwt',
    regex: /\beyJ[A-Za-z0-9_-]{6,}\.eyJ[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}\b/g,
    replace: () => 'JWT_REDACTED',
  },
  {
    // `Bearer <token>` / `Authorization: Bearer ...`. Marker is < 12 chars, so the
    // `{12,}` quantifier can't re-match it.
    name: 'bearer-token',
    regex: /([Bb]earer )[A-Za-z0-9._~+/=-]{12,}/g,
    replace: (_m, prefix) => `${prefix}REDACTED`,
  },
];

// Rules applied to URLs (request.url, response.redirectURL). The body cookie rule is
// NOT used here: a URL value is `&`-terminated, not `;`-terminated, so we use a
// query-string-aware rule instead to avoid swallowing the rest of the query.
const URL_RULES = [
  {
    name: 'query-credential',
    regex: /([?&](?:x-amz-security-token|x-amz-credential|x-amz-signature|access_token|auth_token|api_key|apikey|signature|token|sig)=)[^&#"\s\\]+/gi,
    replace: (_m, prefix) => `${prefix}REDACTED`,
  },
  BODY_RULES[1], // AWS access-key id
  BODY_RULES[2], // JWT
];

/** Apply a rule set to a string. Counts only matches that actually CHANGE (so a
 *  re-run over already-`REDACTED` text reports 0 and rewrites nothing). */
function redact(text, rules, stats) {
  if (typeof text !== 'string' || text.length === 0) return text;
  let out = text;
  for (const rule of rules) {
    out = out.replace(rule.regex, (...args) => {
      const replacement = rule.replace(...args);
      if (replacement !== args[0]) stats.redactions++;
      return replacement;
    });
  }
  return out;
}

function findHars(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findHars(p));
    else if (entry.name.toLowerCase().endsWith('.har')) out.push(p);
  }
  return out;
}

function stripHeaders(headers, names) {
  if (!Array.isArray(headers)) return headers;
  const lower = new Set(names.map((n) => n.toLowerCase()));
  return headers.filter((h) => !lower.has(String(h.name).toLowerCase()));
}

/** Blank one entry's body if its MIME is in the drop list. Returns bytes freed. */
function trimEntry(entry) {
  const content = entry.response?.content;
  if (!content || !shouldDrop(content.mimeType)) return 0;

  let freed = 0;
  if (typeof content.text === 'string' && content.text.length > 0) {
    // HAR `text` is the raw stored body (base64 for binary). Bytes saved on disk
    // are the string length; close enough for a human-readable report.
    freed = content.text.length;
    content.text = '';
  }
  content.size = 0;
  delete content.encoding;
  if ('compression' in content) content.compression = 0;
  if (entry.response) {
    entry.response.bodySize = 0;
    // Drop headers that describe the now-empty body so the browser doesn't try to
    // decode a non-existent gzip/length payload on replay.
    entry.response.headers = stripHeaders(entry.response.headers, ['content-encoding', 'content-length']);
  }
  return freed;
}

/** Redact credential material from one entry's headers, cookies, URLs and bodies. */
function sanitizeEntry(entry, stats) {
  for (const msg of [entry.request, entry.response]) {
    if (!msg) continue;
    // Drop credential-bearing headers outright; redact secret shapes in the rest.
    if (Array.isArray(msg.headers)) {
      const before = msg.headers.length;
      msg.headers = msg.headers.filter((h) => !SENSITIVE_HEADER_NAMES.has(String(h.name).toLowerCase()));
      stats.redactions += before - msg.headers.length;
      for (const h of msg.headers) {
        if (typeof h.value === 'string') h.value = redact(h.value, BODY_RULES, stats);
      }
    }
    // A recorded cookie value is, by definition, session state: blank every one.
    if (Array.isArray(msg.cookies)) {
      for (const c of msg.cookies) {
        if (typeof c.value === 'string' && c.value.length > 0 && c.value !== 'REDACTED') {
          c.value = 'REDACTED';
          stats.redactions++;
        }
      }
    }
  }

  if (entry.request) {
    if (typeof entry.request.url === 'string') {
      entry.request.url = redact(entry.request.url, URL_RULES, stats);
    }
    const pd = entry.request.postData;
    if (pd && typeof pd.text === 'string') {
      const red = redact(pd.text, BODY_RULES, stats);
      if (red !== pd.text) {
        pd.text = red;
        entry.request.headers = stripHeaders(entry.request.headers, ['content-length']);
      }
    }
  }

  if (entry.response) {
    if (typeof entry.response.redirectURL === 'string') {
      entry.response.redirectURL = redact(entry.response.redirectURL, URL_RULES, stats);
    }
    const content = entry.response.content;
    if (content && typeof content.text === 'string' && content.text.length > 0) {
      const red = redact(content.text, BODY_RULES, stats);
      if (red !== content.text) {
        content.text = red;
        // Keep the HAR self-consistent and let the browser recompute length on replay.
        content.size = Buffer.byteLength(red, 'utf8');
        entry.response.headers = stripHeaders(entry.response.headers, ['content-length']);
      }
    }
  }
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const filters = args.filter((a) => !a.startsWith('--'));

let hars = findHars(RESOURCES_DIR);
if (filters.length > 0) {
  hars = hars.filter((h) => filters.some((f) => h.toLowerCase().includes(f.toLowerCase())));
}

const mb = (bytes) => (bytes / 1048576).toFixed(2);
let totalBefore = 0;
let totalAfter = 0;
let totalSecrets = 0;

let filePadding = 80

console.log(`${dryRun ? '[dry-run] ' : ''}Trimming + sanitizing ${hars.length} HAR file(s) under ${path.relative(process.cwd(), RESOURCES_DIR)}\n`);
console.log(`${'file'.padEnd(filePadding)} ${'before'.padStart(8)} ${'after'.padStart(8)} ${'freed'.padStart(8)} ${'secrets'.padStart(8)}`);

for (const har of hars) {
  const before = fs.statSync(har).size;
  const original = fs.readFileSync(har, 'utf8');
  const json = JSON.parse(original);
  const entries = json.log?.entries ?? [];

  let freed = 0;
  const stats = { redactions: 0 };
  for (const entry of entries) {
    freed += trimEntry(entry);
    sanitizeEntry(entry, stats);
  }

  const serialized = JSON.stringify(json);
  const changed = freed > 0 || stats.redactions > 0 || serialized !== original;
  if (!dryRun && changed) fs.writeFileSync(har, serialized);

  const after = dryRun ? before - freed : fs.statSync(har).size;
  totalBefore += before;
  totalAfter += after;
  totalSecrets += stats.redactions;
  const rel = path.relative(RESOURCES_DIR, har);
  console.log(`${rel.padEnd(filePadding)} ${mb(before).padStart(8)} ${mb(after).padStart(8)} ${mb(freed).padStart(8)} ${String(stats.redactions).padStart(8)}`);
}

console.log(`\n${'TOTAL'.padEnd(filePadding)} ${mb(totalBefore).padStart(8)} ${mb(totalAfter).padStart(8)} ${mb(totalBefore - totalAfter).padStart(8)} ${String(totalSecrets).padStart(8)}  (MB / secrets)`);
if (dryRun) console.log('\n[dry-run] no files written.');
