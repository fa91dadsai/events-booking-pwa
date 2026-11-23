// App-shell cache so the installed PWA opens without a connection (rule 21).
// Booking data is kept by the app's local store, not by this worker; the rules are in sw-policy.js.
importScripts('./sw-policy.js');
const { SHELL_FILES, cacheStrategy, isStorable } = self.EB_SW_POLICY;
// The build replaces the placeholders: a hash of every built file, and the list of built /assets/ files.
const BUILD_ID = '1bb802ad4b41';
const CACHE_PREFIX = 'events-booking-shell-';
const CACHE = `${CACHE_PREFIX}${BUILD_ID}`;
const BUILT_ASSETS = ["./assets/PlatformRoot-CR0MbYpr.js", "./assets/config-CNy9lUXc.js", "./assets/index-BM_RLr_q.css", "./assets/index-BStDjwT8.js", "./assets/vendor-dexie-aT6q9TpP.js", "./assets/vendor-supabase-B9nbruCH.js"];
// Without every one of these the app cannot start offline, so a failed fetch fails the install.
const REQUIRED = ['./', './index.html', './sw-policy.js', ...BUILT_ASSETS];
const OPTIONAL = SHELL_FILES.map((file) => `./${file}`);

async function precache(url, required) {
  try {
    const response = await fetch(url, { cache: 'reload' });
    if (!isStorable(response)) throw new Error(`not storable: ${url}`);
    await (await caches.open(CACHE)).put(url, response);
  } catch (error) {
    if (required) throw error;
  }
}

// No skipWaiting here: a new worker waits until the page asks (see src/lib/serviceWorker.ts), so an
// open tab never loses the old build's files while it is still lazy-loading them.
self.addEventListener('install', (event) => {
  event.waitUntil(Promise.all([
    ...REQUIRED.map((url) => precache(url, true)),
    ...OPTIONAL.map((url) => precache(url, false)),
  ]));
});
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  // Only this app's caches: other apps on the same origin keep theirs.
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)),
  )));
  self.clients.claim();
});

async function store(request, response) {
  if (isStorable(response)) await (await caches.open(CACHE)).put(request, response.clone());
  return response;
}
async function networkFirst(request) {
  try {
    return await store(request, await fetch(request));
  } catch {
    // Offline: the cached copy, or the app shell for a page that was never cached.
    return (await caches.match(request)) ?? (await caches.match('./index.html')) ?? Response.error();
  }
}
async function cacheFirst(request) {
  return (await caches.match(request)) ?? store(request, await fetch(request));
}

self.addEventListener('fetch', (event) => {
  const strategy = cacheStrategy(event.request, self.location.origin);
  if (strategy === 'bypass') return;
  event.respondWith(strategy === 'cache-first' ? cacheFirst(event.request) : networkFirst(event.request));
});
