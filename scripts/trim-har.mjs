/**
 * Trim every test HAR by blanking the response bodies the clipper never reads.
 *
 * Run it like the test suite runs over every spec — one command, all HARs:
 *   npm run trim-hars            # trim every *.har under src/test/resources, in place
 *   npm run trim-hars -- --dry-run   # report what would be trimmed, write nothing
 *   npm run trim-hars -- mal imdb    # only HARs whose path contains "mal" or "imdb"
 *
 * What it drops, and why it is GENERIC (one rule for every site, no per-site
 * special-casing):
 *   The clipper extracts DOM text, {{image}} URLs (plain strings from meta/schema,
 *   not the image BYTES), and page metadata. It never consumes image, video,
 *   audio, or font bytes, and the suite proves it never depends on the clipped
 *   page's CSS either. Those categories are therefore safe to blank for ANY HAR.
 *
 *   We deliberately KEEP JavaScript for every HAR. IMDB's user rating is hydrated
 *   from authenticated GraphQL by its JS, so JS is load-bearing there; dropping JS
 *   only for MAL/bandcamp would make the rule site-specific. Keeping it everywhere
 *   keeps this script generic and stable — the win is smaller for MAL than a
 *   JS-strip would give, by design.
 *
 * Why match on MIME type, not the HAR's `_resourceType`:
 *   IMDB serves its ~0.4 MB `video/mp2t` segment as `_resourceType: "xhr"` — the
 *   SAME bucket as the small `application/json` GraphQL responses that produce the
 *   rating. Trimming by resource-type would either keep the video or kill the
 *   rating. The response MIME type cleanly separates them.
 *
 * Relationship to the runtime route in fixtures.ts:
 *   `setupClipperPage` already ABORTS image/media/font at replay, so blanking
 *   those on disk changes no behavior — it only shrinks the files (faster HAR
 *   parse, smaller repo). CSS currently replays from the HAR; blanking it makes
 *   that replay an empty stylesheet, which the suite confirms is equivalent.
 *
 * Idempotent + format-agnostic: reads pretty or compact HARs, writes compact;
 * re-running blanks nothing already blank, so it converges. Reversible via
 * `git restore src/test/resources` if a future HAR ever needs a body back.
 */
import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const RESOURCES_DIR = path.join(__dirname, '..', 'src', 'test', 'resources');

// Generic, MIME-based drop list: bytes the clipper never reads, for any site.
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

console.log(`${dryRun ? '[dry-run] ' : ''}Trimming ${hars.length} HAR file(s) under ${path.relative(process.cwd(), RESOURCES_DIR)}\n`);
console.log(`${'file'.padEnd(40)} ${'before'.padStart(8)} ${'after'.padStart(8)} ${'freed'.padStart(8)}`);

for (const har of hars) {
  const before = fs.statSync(har).size;
  const json = JSON.parse(fs.readFileSync(har, 'utf8'));
  const entries = json.log?.entries ?? [];

  let freed = 0;
  for (const entry of entries) freed += trimEntry(entry);

  const serialized = JSON.stringify(json);
  if (!dryRun && freed > 0) fs.writeFileSync(har, serialized);

  const after = dryRun ? before - freed : fs.statSync(har).size;
  totalBefore += before;
  totalAfter += after;
  const rel = path.relative(RESOURCES_DIR, har);
  console.log(`${rel.padEnd(40)} ${mb(before).padStart(8)} ${mb(after).padStart(8)} ${mb(freed).padStart(8)}`);
}

console.log(`\n${'TOTAL'.padEnd(40)} ${mb(totalBefore).padStart(8)} ${mb(totalAfter).padStart(8)} ${mb(totalBefore - totalAfter).padStart(8)}  (MB)`);
if (dryRun) console.log('\n[dry-run] no files written.');
