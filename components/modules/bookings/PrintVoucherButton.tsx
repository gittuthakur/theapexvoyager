'use client';

/** `window.print()` opens the browser's native print dialog, which offers "Save as PDF"
 *  on every major browser/OS — no PDF-generation library needed. `print:hidden` (see
 *  globals.css's print rules and this button's own class) removes the button itself,
 *  the nav and the footer from the printed/saved output, leaving only the voucher. */
export function PrintVoucherButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-apex-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-apex-600"
    >
      Print / Save as PDF
    </button>
  );
}
