// Cache policy for sw.js, kept free of service-worker globals so tests can load it.
// It is a classic script (not an ES module) because importScripts() cannot load modules in every browser.
(function register(root) {
  const SHELL_FILES = ['manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png', 'maskable-512.png', 'apple-touch-icon.png', 'theme-init.js'];
  // Server calls must always reach the network: cached booking or payment data would be stale and unsafe.
  const NEVER_CACHED_PATHS = ['/v1/', '/functions/'];

  function lastSegment(pathname) {
    return pathname.slice(pathname.lastIndexOf('/') + 1);
  }

  /**
   * How the worker answers a request: 'network-first' (shell and pages), 'cache-first' (hashed
   * /assets/ files, whose names change with their content) or 'bypass' (not handled by the worker).
   * `request` needs url, method and mode; `origin` is the worker's own origin.
   */
  function cacheStrategy(request, origin) {
    if (request.method !== 'GET') return 'bypass';
    const url = new URL(request.url);
    if (url.origin !== origin) return 'bypass';
    if (NEVER_CACHED_PATHS.some((part) => url.pathname.includes(part))) return 'bypass';
    const name = lastSegment(url.pathname);
    if (request.mode === 'navigate' || name === '' || name === 'index.html') return 'network-first';
    if (url.pathname.includes('/assets/')) return 'cache-first';
    if (SHELL_FILES.includes(name)) return 'network-first';
    return 'bypass';
  }

  /** Only ok, same-origin (type 'basic') responses are stored; opaque, cors or error responses are not. */
  function isStorable(response) {
    return response.status === 200 && response.type === 'basic';
  }

  root.EB_SW_POLICY = { SHELL_FILES, cacheStrategy, isStorable };
})(self);
