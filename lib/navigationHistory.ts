// Module-level (not sessionStorage/state) on purpose — this persists across client-side
// route changes for the life of the tab's JS bundle, the same way the App Router's root
// layout itself persists, and resets naturally on an actual hard reload/new tab, which is
// exactly the "did the user navigate anywhere in this app instance yet" signal BackButton
// needs. `window.history.length` looked like the obvious choice but isn't reliable across
// browsers/embeddings — it can already read > 1 on a genuinely fresh direct page load.
let internalNavigationCount = 0;

export function markInternalNavigation() {
  internalNavigationCount += 1;
}

export function hasInternalNavigationHistory() {
  return internalNavigationCount > 0;
}
