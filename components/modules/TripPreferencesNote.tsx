import { CalendarDays } from 'lucide-react';
import { describeTripPreferences, TRIP_PREFERENCES_DISCLAIMER, type TripPreferences } from '@/lib/tripPreferences';

export interface TripPreferencesNoteProps {
  /** Already-validated preferences (see readTripPreferences). */
  preferences: TripPreferences;
  className?: string;
}

/**
 * Shows the dates / party size a visitor entered in a search panel, labelled as saved
 * PREFERENCES — not as a filter and not as availability. Renders nothing when there are none,
 * so pages that never received any look exactly as before.
 */
export default function TripPreferencesNote({ preferences, className }: TripPreferencesNoteProps) {
  const lines = describeTripPreferences(preferences);
  if (lines.length === 0) return null;
  return (
    <section
      aria-label="Your trip preferences"
      className={['rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700', className].filter(Boolean).join(' ')}
    >
      <p className="flex items-center gap-2 font-semibold text-slate-900">
        <CalendarDays size={16} className="text-apex-500" aria-hidden="true" />
        Your trip preferences
      </p>
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
        {lines.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-1 text-xs text-slate-600">{TRIP_PREFERENCES_DISCLAIMER}</p>
    </section>
  );
}
