// Theme before first paint (keep in step with src/lib/theme.ts): the saved choice (auto-night: dark 18:00-06:00), else the device colour scheme.
// A blocking same-origin script, so a strict script-src 'self' still allows it.
(function () {
  var saved = null;
  try {
    saved = localStorage.getItem('eb.theme');
  } catch (e) {
    /* Blocked storage: fall through to the device preference. */
  }
  if (saved === 'light') saved = 'clean';
  var theme = saved;
  if (theme === 'auto-night') {
    var hour = new Date().getHours();
    theme = hour >= 18 || hour < 6 ? 'dark' : 'clean';
  }
  if (theme !== 'clean' && theme !== 'soft' && theme !== 'dark') {
    var dark = false;
    try {
      dark = matchMedia('(prefers-color-scheme: dark)').matches;
    } catch (e) {
      /* No matchMedia: light. */
    }
    theme = dark ? 'dark' : 'clean';
  }
  document.documentElement.setAttribute('data-theme', theme);
})();
