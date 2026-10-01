import { getJourneyImageCredit } from '@/config/imageCredits.config';

export default function ImageAttribution({ imagePath }: { imagePath: string }) {
  const credit = getJourneyImageCredit(imagePath);
  if (!credit) return null;

  return (
    <figure className="px-1 pb-3 pt-2 text-xs leading-5 text-slate-600">
      <figcaption>
        <span className="font-semibold text-slate-700">Photo credit:</span>{' '}
        <a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-apex-700 hover:underline">
          &ldquo;{credit.title}&rdquo;
        </a>{' '}
        by {credit.author} via Wikimedia Commons.{' '}
        <a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-apex-700 hover:underline">
          {credit.licenseName}
        </a>
        {credit.modified && credit.modificationDescription ? <span className="block">{credit.modificationDescription}</span> : null}
      </figcaption>
    </figure>
  );
}