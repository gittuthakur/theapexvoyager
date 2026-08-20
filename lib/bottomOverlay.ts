type Listener = () => void;

const listeners = new Set<Listener>();
let activeCount = 0;

function notify() {
  listeners.forEach((listener) => listener());
}

// Lets a page-specific fixed bottom bar (CompareTray, the Plan My Journey mobile
// nav) claim that stretch of the viewport while it's actually visible, so the
// global BackToTopButton knows to stay out of the way instead of stacking on
// top of it. Call the returned function when the bar stops being visible.
export function registerBottomOverlay() {
  activeCount += 1;
  notify();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    activeCount -= 1;
    notify();
  };
}

export function subscribeBottomOverlay(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function hasBottomOverlay() {
  return activeCount > 0;
}
