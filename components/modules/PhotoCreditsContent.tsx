import { Camera } from 'lucide-react';

interface PhotoCredit {
  destination: string;
  title: string;
  creator: string;
  license: string;
  licenseUrl: string;
  sourceUrl: string;
}

const credits: PhotoCredit[] = [
  {
    destination: 'Gulmarg',
    title: 'Gulmarg,Kashmir 02',
    creator: 'Harvinder Chandigarh',
    license: 'CC BY 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gulmarg,Kashmir_02.jpg'
  },
  {
    destination: 'Munsiyari',
    title: 'Munsiyari',
    creator: 'Ebenezer Rao',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Munsiyari.jpg'
  },
  {
    destination: 'Rishikesh',
    title: 'Rishikesh view across bridge',
    creator: 'meg and rahul',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rishikesh_view_across_bridge.jpg'
  },
  {
    destination: 'Haridwar',
    title: 'Sunrise view of the main bathing ghat at Har-ki-pauri, Haridwar',
    creator: 'Wolfgang Maehr',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Sunrise_view_of_the_main_bathing_ghat_at_Har-ki-pauri,_Haridwar.jpg'
  },
  {
    destination: 'Bir Billing',
    title: 'Pilot under paragliding takeoff at Bir-Billing',
    creator: 'Okorok',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pilot_under_paragliding_takeoff_at_Bir-Billing_(02).JPG'
  },
  {
    destination: 'Sangla Valley',
    title: 'Sangla Valley',
    creator: 'Pushkar Prashar',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sangla_Valley.jpg'
  },
  {
    destination: 'Chitkul',
    title: 'Chitkul, Himachal Pradesh',
    creator: 'Footloosedev',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chitkul,_Himachal_Pradesh.jpg'
  },
  {
    destination: 'Chamba',
    title: 'Chamba city and river Ravi, Himachal Pradesh India',
    creator: 'Ms Sarah Welch',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chamba_city_and_river_Ravi,_Himachal_Pradesh_India.jpg'
  },
  {
    destination: 'Dalhousie',
    title: 'Dalhousie l Hill Station in Himachal Pradesh',
    creator: 'Piyush Tripathi',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Dalhousie_l_Hill_Station_in_Himachal_Pradesh.jpg'
  },
  {
    destination: 'Khajjiar',
    title: 'A view of Khajjiar, Chamba, Himachal Pradesh',
    creator: 'Harvinder Chandigarh',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_view_of_Khajjiar_,Chamba,Himachal_Pradesh.jpg'
  }
];

export default function PhotoCreditsContent() {
  return (
    <main className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl space-y-10">
        <section className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2.5 rounded-full border border-apex-200 bg-apex-50 px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wider text-apex-600">
            <Camera size={16} /> Photo Credits
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">Photo Credits</h1>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base">
            Destination photography on this site comes from our own archive or from Wikimedia Commons under a
            Creative Commons license. Where a license requires attribution, the photographer and license are credited
            below.
          </p>
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 sm:px-6">Destination</th>
                <th className="px-4 py-3 sm:px-6">Photograph</th>
                <th className="px-4 py-3 sm:px-6">License</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {credits.map((credit) => (
                <tr key={credit.destination}>
                  <td className="px-4 py-4 align-top font-semibold text-slate-900 sm:px-6">{credit.destination}</td>
                  <td className="px-4 py-4 align-top text-slate-600 sm:px-6">
                    <a
                      href={credit.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="cursor-hover text-apex-600 hover:underline"
                    >
                      &ldquo;{credit.title}&rdquo;
                    </a>{' '}
                    by {credit.creator}
                  </td>
                  <td className="px-4 py-4 align-top text-slate-600 sm:px-6">
                    <a
                      href={credit.licenseUrl}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="cursor-hover text-apex-600 hover:underline"
                    >
                      {credit.license}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
