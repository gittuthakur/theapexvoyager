# Destination photography — sources & licensing

Register of externally-sourced destination photography actually in use under
`public/images/`. Only images that are live in `config/destinations.config.ts`
are listed here — reject/deferred candidates are not recorded.

All 10 images below were sourced from Wikimedia Commons (verified reuse rights,
explicit per-file license metadata). Each was downloaded from Commons, resized
for web delivery, and re-encoded (stripping EXIF/ICC/XMP) — no content changes
(no added/removed objects, no weather/season changes, no AI transforms).

Date checked for all entries: 2026-09-09.

## Gulmarg

- Local file: `public/images/destination-gulmarg.jpg`
- Source: Wikimedia Commons — `File:Gulmarg,Kashmir 02.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Gulmarg,Kashmir_02.jpg
- Creator: Harvinder Chandigarh
- License: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0)
- Attribution required: Yes
- Attribution text: "Gulmarg, Kashmir" by Harvinder Chandigarh, CC BY 4.0, via Wikimedia Commons

## Munsiyari

- Local file: `public/images/destination-munsiyari.jpg`
- Source: Wikimedia Commons — `File:Munsiyari.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Munsiyari.jpg
- Creator: Ebenezer Rao
- License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)
- Attribution required: Yes
- Attribution text: "Munsiyari" by Ebenezer Rao, CC BY-SA 4.0, via Wikimedia Commons

## Rishikesh

- Local file: `public/images/destination-rishikesh.jpg`
- Source: Wikimedia Commons — `File:Rishikesh view across bridge.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Rishikesh_view_across_bridge.jpg
- Creator: meg and rahul
- License: CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
- Attribution required: Yes
- Attribution text: "Rishikesh view across bridge" by meg and rahul, CC BY 2.0, via Wikimedia Commons

## Haridwar

- Local file: `public/images/destination-haridwar.jpg`
- Source: Wikimedia Commons — `File:Sunrise view of the main bathing ghat at Har-ki-pauri, Haridwar.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Sunrise_view_of_the_main_bathing_ghat_at_Har-ki-pauri,_Haridwar.jpg
- Creator: Wolfgang Maehr (Oslo, Norway)
- License: CC BY 2.0 (https://creativecommons.org/licenses/by/2.0)
- Attribution required: Yes
- Attribution text: "Sunrise view of the main bathing ghat at Har-ki-pauri, Haridwar" by Wolfgang Maehr, CC BY 2.0, via Wikimedia Commons

## Bir Billing

- Local file: `public/images/destination-bir-billing.jpg`
- Source: Wikimedia Commons — `File:Pilot under paragliding takeoff at Bir-Billing (02).JPG`
- Source page: https://commons.wikimedia.org/wiki/File:Pilot_under_paragliding_takeoff_at_Bir-Billing_(02).JPG
- Creator: Okorok
- License: CC BY-SA 3.0 (https://creativecommons.org/licenses/by-sa/3.0)
- Attribution required: Yes
- Attribution text: "Pilot under paragliding takeoff at Bir-Billing" by Okorok, CC BY-SA 3.0, via Wikimedia Commons

## Sangla Valley

- Local file: `public/images/destination-sangla-valley.jpg`
- Source: Wikimedia Commons — `File:Sangla Valley.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Sangla_Valley.jpg
- Creator: Pushkar Prashar
- License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)
- Attribution required: Yes
- Attribution text: "Sangla Valley" by Pushkar Prashar, CC BY-SA 4.0, via Wikimedia Commons

## Chitkul

- Local file: `public/images/destination-chitkul.jpg`
- Source: Wikimedia Commons — `File:Chitkul, Himachal Pradesh.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Chitkul,_Himachal_Pradesh.jpg
- Creator: Footloosedev
- License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)
- Attribution required: Yes
- Attribution text: "Chitkul, Himachal Pradesh" by Footloosedev, CC BY-SA 4.0, via Wikimedia Commons

## Chamba

- Local file: `public/images/destination-chamba.jpg`
- Source: Wikimedia Commons — `File:Chamba city and river Ravi, Himachal Pradesh India.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Chamba_city_and_river_Ravi,_Himachal_Pradesh_India.jpg
- Creator: Ms Sarah Welch
- License: CC0 1.0 (public domain dedication — http://creativecommons.org/publicdomain/zero/1.0/deed.en)
- Attribution required: No (credited voluntarily below)
- Attribution text: "Chamba city and river Ravi, Himachal Pradesh India" by Ms Sarah Welch, CC0, via Wikimedia Commons

## Dalhousie

- Local file: `public/images/destination-dalhousie.jpg`
- Source: Wikimedia Commons — `File:Dalhousie l Hill Station in Himachal Pradesh.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:Dalhousie_l_Hill_Station_in_Himachal_Pradesh.jpg
- Creator: Piyush Tripathi
- License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)
- Attribution required: Yes
- Attribution text: "Dalhousie l Hill Station in Himachal Pradesh" by Piyush Tripathi, CC BY-SA 4.0, via Wikimedia Commons

## Khajjiar

- Local file: `public/images/destination-khajjiar.jpg`
- Source: Wikimedia Commons — `File:A view of Khajjiar ,Chamba,Himachal Pradesh.jpg`
- Source page: https://commons.wikimedia.org/wiki/File:A_view_of_Khajjiar_,Chamba,Himachal_Pradesh.jpg
- Creator: Harvinder Chandigarh
- License: CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0)
- Attribution required: Yes
- Attribution text: "A view of Khajjiar, Chamba, Himachal Pradesh" by Harvinder Chandigarh, CC BY-SA 4.0, via Wikimedia Commons

## On-site attribution

All nine attribution-required entries above are credited on `/photo-credits`,
linked from the site footer ("Photo credits"). No other image-specific caption
system exists on the Destination model (`image: string` is the only field —
see `types/destination.ts`), so a centralized credits page is the smallest
change that satisfies each license's attribution requirement without adding
per-card captions or redesigning any destination component.
