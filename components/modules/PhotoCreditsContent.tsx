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
  },
  {
    destination: 'Srinagar',
    title: 'Srinagar pano',
    creator: 'KennyOMG',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Srinagar_pano.jpg'
  },
  {
    destination: 'Pahalgam',
    title: 'Pahalgam Valley',
    creator: 'KennyOMG',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Pahalgam_Valley.jpg'
  },
  {
    destination: 'Sonamarg',
    title: 'Sonmarg',
    creator: 'Revoshots',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sonmarg.JPG'
  },
  {
    destination: 'Dehradun',
    title: 'Forest Research Institute campus, Dehradun, India',
    creator: 'Torarne',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Forest_Research_Institute_campus,_Dehradun,_India.jpg'
  },
  {
    destination: 'Mussoorie',
    title: 'Mall Road, Mussoorie',
    creator: 'ArmouredCyborg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mall_Road,_Mussoorie.jpg'
  },
  {
    destination: 'Joshimath',
    title: 'Panoramic view of Joshimath town on mountain slope',
    creator: 'Rohanshah657',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Panoramic_view_of_Joshimath_town_on_mountain_slope.jpg'
  },
  {
    destination: 'Auli',
    title: 'Auli, India',
    creator: 'Amit Shaw',
    license: 'CC0 1.0',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Auli,_India.jpg'
  },
  {
    destination: 'Chopta',
    title: 'Mejastic Meadows',
    creator: 'Shubhsrt7',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mejastic_Meadows.jpg'
  },
  {
    destination: 'Lansdowne',
    title: 'Lansdowne in monsoon',
    creator: 'Navdeep Gusain',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lansdowne_in_monsoon.jpg'
  },
  {
    destination: 'Nainital',
    title: 'View of Nainital lake from Snow View Point',
    creator: 'Slyronit',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:View_of_Nainital_lake_from_Snow_View_Point.jpg'
  },
  {
    destination: 'Mukteshwar',
    title: 'Mukteshwar Sunset 01',
    creator: 'ArmouredCyborg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Mukteshwar_Sunset_01.jpg'
  },
  {
    destination: 'Almora',
    title: 'Almora Sunset Skyline',
    creator: 'ArmouredCyborg',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Almora_Sunset_Skyline.jpg'
  },
  {
    destination: 'Kausani',
    title: 'View from Hotel Uttarakhand at dawn, Kausani',
    creator: 'David M.',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:View_from_Hotel_Uttarakhand_at_dawn,_Kausani,_11-2009_-_panoramio.jpg'
  },
  {
    destination: 'Ranikhet',
    title: 'Apple orchards in Chaubatia, Ranikhet, Uttarakhand',
    creator: 'Harshit SR',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Apple_orchards_in_Chaubatia,_Ranikhet,_Uttarakhand.jpg'
  },
  {
    destination: 'Badrinath',
    title: 'Badrinath Temple',
    creator: 'Harshit SR',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Badrinath_Temple.jpg'
  },
  {
    destination: 'Gangotri',
    title: 'Gangotri temple',
    creator: 'Atarax42',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gangotri_temple.jpg'
  },
  {
    destination: 'Kedarnath',
    title: 'KEDARNATH',
    creator: 'Sarika Shirbhate',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:%E2%80%9CKEDARNATH%E2%80%9D.jpg'
  },
  {
    destination: 'Yamunotri',
    title: 'Yamunotri temple and ashram',
    creator: 'Atarax42',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Yamunotri_temple_and_ashram.jpg'
  },
  {
    destination: 'Hemkund Sahib',
    title: 'Hemkund Sahib and Lokpal Lake',
    creator: 'Harshit SR',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Hemkund_Sahib_and_Lokpal_Lake.jpg'
  },
  {
    destination: 'Kasauli',
    title: 'CHRIST CHURCH, KASAULI',
    creator: 'Suman Wadhwa',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:CHRIST_CHURCH,_KASAULI.JPG'
  },
  {
    destination: 'McLeod Ganj',
    title: 'Namgyal Monastery, India, Himachal Pradesh, Mc Leod Ganj',
    creator: '"(in search for a new country of residence)" (Flickr)',
    license: 'CC BY-SA 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Namgyal_Monastery_India_Himachal_Pradesh_Mc_Leod_Ganj.jpg'
  },
  {
    destination: 'Jammu',
    title: 'View of Bahu Fort from approach road',
    creator: 'Nvvchar',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:View_of_Bahu_Fort_from_approach_road.jpg'
  },
  {
    destination: 'Katra',
    title: 'Katra railway station',
    creator: 'Lillottama',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Katra_railway_station.jpg'
  },
  {
    destination: 'Ramnagar (Corbett)',
    title: 'Kosi River, Jim Corbett National Park, Ramnagar, Uttarakhand',
    creator: 'Anamdas',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl:
      'https://commons.wikimedia.org/wiki/File:Kosi_River,_Jim_Corbett_National_Park,_Ramnagar,_Uttarakhand.jpeg'
  },
  {
    destination: 'Kufri',
    title: 'Gateway - Kufri Fun World - Kufri',
    creator: 'Biswarup Ganguly',
    license: 'CC BY 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Gateway_-_Kufri_Fun_World_-_Kufri_2014-05-08_1634.JPG'
  },
  {
    destination: 'Narkanda',
    title: 'HATU TEMPLE',
    creator: 'Chirag85',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:HATU_TEMPLE.jpg'
  },
  {
    destination: 'Sarahan',
    title: 'Sarahan-Bhimakali-06-gje',
    creator: 'Gerd Eichmann',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Sarahan-Bhimakali-06-gje.jpg'
  },
  {
    destination: 'Naggar',
    title: 'Naggar Castle Kullu WLM22-4062',
    creator: 'Schwiki',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Naggar_Castle_Kullu_WLM22-4062.jpg'
  },
  {
    destination: 'Palampur',
    title: 'Palampur tea plantation, Himachal Pradesh, India',
    creator: 'UnpetitproleX',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Palampur_tea_plantation,_Himachal_Pradesh,_India.jpg'
  },
  {
    destination: 'Kangra',
    title: 'Kangra Fort08',
    creator: 'Ashish3724',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kangra_Fort08.JPG'
  },
  {
    destination: 'Jawalamukhi',
    title: 'Jwalamukhi temple, kangra, himachal pradesh.',
    creator: 'Nswn03',
    license: 'CC BY-SA 3.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Jwalamukhi_temple,kangra,_himachal_pradesh..JPG'
  },
  {
    destination: 'Bharmour',
    title: 'Chaurasi temple complex courtyard',
    creator: 'Varun Shiv Kapur',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Chaurasi_temple_complex_courtyard_(6133049309).jpg'
  },
  {
    destination: 'Tabo',
    title: 'Adobe monuments in the Tabo Buddhist monastery and temples complex, Himachal Pradesh',
    creator: 'Nivedita Ravishankar',
    license: 'CC BY 2.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/2.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Adobe_monuments_in_the_Tabo_Buddhist_monastery_and_temples_complex,_Himachal_Pradesh.jpg'
  },
  {
    destination: 'Dhankar',
    title: 'View of Dhankar Gompa and Fort',
    creator: 'Akhila Srikanta Rao',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:View_of_Dhankar_Gompa_and_Fort.jpg'
  },
  {
    destination: 'Kibber',
    title: 'Kibber-14-gje',
    creator: 'Gerd Eichmann',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Kibber-14-gje.jpg'
  },
  {
    destination: 'Keylong',
    title: 'East Keylong Lahaul Himachal Oct22 A7C 04661',
    creator: 'Timothy A. Gonsalves',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:East_Keylong_Lahaul_Himachal_Oct22_A7C_04661.jpg'
  },
  {
    destination: 'Mandi',
    title: 'Panchvaktra Temple, Mandi (FRONT VIEW) 01',
    creator: 'Aranya Kar',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Panchvaktra_Temple,_Mandi_(FRONT_VIEW)_01.jpg'
  },
  {
    destination: 'Rewalsar',
    title: 'Rewalsar lake 01',
    creator: 'Gannu03',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Rewalsar_lake_01.jpg'
  },
  {
    destination: 'Renuka Ji',
    title: 'Renuka ji temple, Himachal Pradesh',
    creator: 'Harvinder Chandigarh',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Renuka_ji_temple,_Himachal_Pradesh.JPG'
  },
  {
    destination: 'Paonta Sahib',
    title: 'Ponta Sahib',
    creator: 'Satdeep Gill',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
    sourceUrl: 'https://commons.wikimedia.org/wiki/File:Ponta_Sahib.JPG'
  }
];

export default function PhotoCreditsContent() {
  return (
    <main id="main-content" className="min-h-screen bg-white px-4 pb-20 pt-24 text-slate-900 sm:px-6 lg:px-8">
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
