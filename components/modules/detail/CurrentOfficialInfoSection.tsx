import type { DestinationRegistrationInfo } from '@/types/destination';
import OfficialLinkCallout from '@/components/modules/detail/OfficialLinkCallout';

export interface CurrentOfficialInfoSectionProps {
  registrationInfo?: DestinationRegistrationInfo;
  officialAdvisoryUrl?: string;
}

/**
 * Renders only when a destination actually carries `registrationInfo` and/or
 * `officialAdvisoryUrl` — for the current catalogue that's none of the 33 records, so this
 * section is invisible everywhere today. It exists to hold whatever volatile, official,
 * frequently-changing information a future destination needs to hand off (registration
 * requirements, road/weather advisories) without ever caching that information as permanent
 * marketing copy on this site.
 */
export default function CurrentOfficialInfoSection({ registrationInfo, officialAdvisoryUrl }: CurrentOfficialInfoSectionProps) {
  if (!registrationInfo && !officialAdvisoryUrl) return null;

  return (
    <section id="current-official-information" className="py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.28em] text-apex-500">Before you travel</p>
      <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Current Official Information</h2>
      <p className="mt-2 text-sm text-slate-500">
        Registration, road and weather conditions can change from what&apos;s shown here — confirm directly with the official
        sources below before you travel.
      </p>
      <div className="mt-6 space-y-4">
        {registrationInfo ? (
          <OfficialLinkCallout
            label={registrationInfo.required ? 'Official registration (required)' : 'Official registration'}
            url={registrationInfo.url}
            description={registrationInfo.note}
          />
        ) : null}
        {officialAdvisoryUrl ? (
          <OfficialLinkCallout
            label="Official travel advisory"
            url={officialAdvisoryUrl}
            description="Route, weather and access status from the relevant official authority."
          />
        ) : null}
      </div>
    </section>
  );
}
