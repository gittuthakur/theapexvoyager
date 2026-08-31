'use client';

import { useEffect } from 'react';

let lockCount = 0;
let addedLockClass = false;

/**
 * Keeps page scrolling disabled until the final active floating panel closes.
 *
 * Locks both `<body>` and `<html>` — in standards mode `document.documentElement`
 * (not `<body>`) is the actual scrolling root, so a wheel/touch scroll still moved
 * the page underneath an "open" overlay when only `<body>` carried the lock class.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    if (lockCount === 0 && !document.body.classList.contains('overflow-hidden')) {
      document.body.classList.add('overflow-hidden');
      document.documentElement.classList.add('overflow-hidden');
      addedLockClass = true;
    }
    lockCount += 1;

    return () => {
      lockCount -= 1;
      if (lockCount === 0 && addedLockClass) {
        document.body.classList.remove('overflow-hidden');
        document.documentElement.classList.remove('overflow-hidden');
        addedLockClass = false;
      }
    };
  }, [locked]);
}
