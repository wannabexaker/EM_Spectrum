import type { FrequencyFeature, FrequencyRegulatoryNote } from '@/types/spectrum'
import { universalVibrationFeatures } from './universalVibrationsAtlas'

const C = {
  natural:    '#b5e48c',
  power:      '#fff176',
  vlf:        '#48cae4',
  time:       '#90e0ef',
  rfid_lf:    '#f72585',
  uhf_rfid:   '#ff6d6d',
  nfc:        '#ff4dca',
  am:         '#fca311',
  fm:         '#ffd60a',
  amateur:    '#9d4edd',
  cb:         '#ff9f1c',
  aviation:   '#caf0f8',
  maritime:   '#4895ef',
  emergency:  '#ef233c',
  tetra:      '#e63946',
  pmr:        '#fb5607',
  ism_433:    '#48cae4',
  lora:       '#7c3cff',
  wmbus:      '#a855f7',
  ism_915:    '#06b6d4',
  ism:        '#00b4d8',
  tv:         '#f77f00',
  dab:        '#f4a261',
  gsm:        '#52b788',
  umts:       '#40916c',
  lte:        '#2d9d4c',
  nr5g:       '#74c69d',
  gps:        '#3ddc84',
  glonass:    '#06d6a0',
  galileo:    '#69f0ae',
  beidou:     '#00e5a0',
  dect:       '#74b3ce',
  wifi_24:    '#00d4ff',
  ble:        '#4cc9f0',
  zigbee:     '#14b8a6',
  wifi_5:     '#00b0ff',
  wifi_6e:    '#40c4ff',
  satellite:  '#56cfe1',
  radar:      '#ff6b35',
  mmwave:     '#e040fb',
  auto_radar: '#ff9800',
} as const

const REG_SRC = {
  fcc15247: {
    label: '47 CFR 15.247',
    url: 'https://www.ecfr.gov/current/title-47/section-15.247',
  },
  fcc15407: {
    label: '47 CFR 15.407',
    url: 'https://www.ecfr.gov/current/title-47/section-15.407',
  },
  fcc95567: {
    label: '47 CFR 95.567',
    url: 'https://www.ecfr.gov/current/title-47/section-95.567',
  },
  fcc951767: {
    label: '47 CFR 95.1767',
    url: 'https://www.ecfr.gov/current/title-47/section-95.1767',
  },
  fcc95963: {
    label: '47 CFR 95.963',
    url: 'https://www.ecfr.gov/current/title-47/section-95.963',
  },
  fcc95967: {
    label: '47 CFR 95.967',
    url: 'https://www.ecfr.gov/current/title-47/section-95.967',
  },
  cept7003: {
    label: 'ERC Recommendation 70-03',
    url: 'https://cept.org/documents/srdmg/37887/srdmg-17-112_latest-update-rec_-70-03',
  },
  ecc0408: {
    label: 'ECC Decision (04)08',
    url: 'https://docdb.cept.org/download/3448',
  },
  ecc1505: {
    label: 'ECC Decision (15)05',
    url: 'https://docdb.cept.org/download/1491',
  },
  ecc2001: {
    label: 'ECC Decision (20)01',
    url: 'https://docdb.cept.org/download/4567',
  },
  etsi300328: {
    label: 'ETSI EN 300 328',
    url: 'https://www.etsi.org/deliver/etsi_en/300300_300399/300328/02.02.02_60/en_300328v020202p.pdf',
  },
  wlanChannels: {
    label: 'WLAN channel reference',
    url: 'https://en.wikipedia.org/wiki/List_of_WLAN_channels',
  },
} as const

const R = {
  usPart15247: {
    region: 'US FCC Part 15',
    range: '902-928 / 2400-2483.5 / 5725-5850 MHz',
    limit: '1 W max conducted output for digital modulation; antenna/EIRP rules still apply.',
    conditions: 'Unlicensed Part 15 operation: certified devices must accept interference and may not cause harmful interference.',
    source: REG_SRC.fcc15247,
  },
  euWifi24: {
    region: 'EU/ETSI',
    range: '2400-2483.5 MHz',
    limit: '20 dBm (100 mW) e.i.r.p.; PSD max 10 dBm/MHz for non-FHSS.',
    conditions: 'RED harmonised standard for wideband data systems such as WiFi, Bluetooth and Zigbee.',
    source: REG_SRC.etsi300328,
  },
  usWifi24Edge: {
    region: 'US FCC edge channels',
    range: 'Channels 12-13 / 2483.5 MHz edge',
    limit: 'Only compliant if the occupied signal remains inside 2400-2483.5 MHz.',
    conditions: 'Channel 14 is not allowed for normal WiFi in the US; many devices disable channels 12-13 by region.',
    source: REG_SRC.fcc15247,
  },
  euWifi5Lower: {
    region: 'EU/CEPT',
    range: '5150-5350 MHz',
    limit: '200 mW mean e.i.r.p.; indoor use. DFS/TPC required above 5250 MHz.',
    conditions: 'National implementations can add restrictions.',
    source: REG_SRC.ecc0408,
  },
  euWifi5Upper: {
    region: 'EU/CEPT',
    range: '5470-5725 MHz',
    limit: '1 W mean e.i.r.p.; indoor/outdoor allowed with DFS and TPC.',
    conditions: 'Protects radar and satellite services; moving vehicles/aircraft are restricted in DFS bands.',
    source: REG_SRC.ecc0408,
  },
  usWifi5: {
    region: 'US FCC U-NII',
    range: '5.15-5.895 GHz',
    limit: 'Power limits vary by U-NII block; 5.725-5.850 GHz allows up to 1 W conducted for APs.',
    conditions: 'DFS applies in 5.25-5.35 and 5.47-5.725 GHz bands.',
    source: REG_SRC.fcc15407,
  },
  usWifi6e: {
    region: 'US FCC 6 GHz',
    range: '5925-7125 MHz',
    limit: 'LPI AP/subordinate 30 dBm EIRP; VLP 14 dBm; standard power 36 dBm in U-NII-5/7 with AFC.',
    conditions: 'Indoor AP restrictions, client control rules and AFC/geofencing classes apply.',
    source: REG_SRC.fcc15407,
  },
  euWifi6e: {
    region: 'EU/CEPT 6 GHz',
    range: '5945-6425 MHz',
    limit: 'LPI 23 dBm e.i.r.p. indoor only; VLP 14 dBm e.i.r.p. indoor/outdoor.',
    conditions: 'VLP use on drones is prohibited; LPI outdoor/road-vehicle use is not permitted.',
    source: REG_SRC.ecc2001,
  },
  euSrd433: {
    region: 'EU/CEPT SRD',
    range: '433.05-434.79 MHz',
    limit: '10 mW e.r.p. with <=10% duty cycle for common narrowband SRDs.',
    conditions: 'Wideband variants and national implementations can have different limits.',
    source: REG_SRC.cept7003,
  },
  euSrd868: {
    region: 'EU/CEPT SRD',
    range: '863-870 MHz',
    limit: 'Typical LoRa/SRD sub-bands use 25 mW e.r.p.; 868.0-868.6 MHz allows <=1% duty cycle.',
    conditions: '868.7-869.2 MHz is typically <=0.1%; 869.4-869.65 MHz allows 500 mW e.r.p. with <=10% duty cycle.',
    source: REG_SRC.cept7003,
  },
  euRfid865: {
    region: 'EU/CEPT RFID',
    range: '865-868 MHz',
    limit: '865-865.6 MHz: 100 mW e.r.p.; 865.6-867.6 MHz: 2 W e.r.p.; 867.6-868 MHz: 500 mW e.r.p.',
    conditions: 'RFID channel width and implementation status vary by country.',
    source: REG_SRC.cept7003,
  },
  usFrs: {
    region: 'US FRS',
    range: '462/467 MHz channels',
    limit: '2 W ERP on channels 1-7 and 15-22; 0.5 W ERP on channels 8-14.',
    conditions: 'Licence-free only with FRS-compliant radios.',
    source: REG_SRC.fcc95567,
  },
  usGmrs: {
    region: 'US GMRS',
    range: '462/467 MHz channels',
    limit: 'Up to 50 W transmitter output on mobile/repeater/base main channels; lower limits on interstitial channels.',
    conditions: 'GMRS licence required.',
    source: REG_SRC.fcc951767,
  },
  euPmr446: {
    region: 'EU/CEPT PMR446',
    range: '446.0-446.2 MHz',
    limit: '500 mW e.r.p. max.',
    conditions: 'Handheld/mobile use only; no base stations, repeaters or fixed infrastructure.',
    source: REG_SRC.ecc1505,
  },
  usCbChannels: {
    region: 'US CBRS',
    range: '26.965-27.405 MHz',
    limit: '40 channels; AM/FM carrier power max 4 W, SSB PEP max 12 W.',
    conditions: 'Licence-by-rule service; external RF power amplifiers are prohibited.',
    source: REG_SRC.fcc95967,
  },
  usCbPlan: {
    region: 'US CBRS channel plan',
    range: 'Channels 1-40',
    limit: 'Channel centers run from 26.965 MHz to 27.405 MHz.',
    conditions: 'CB transmitters must stay on the listed channel centers.',
    source: REG_SRC.fcc95963,
  },
} satisfies Record<string, FrequencyRegulatoryNote>

function mhzAliases(centerMHz: number, ...extra: string[]): string[] {
  return Array.from(new Set([
    `${centerMHz}`,
    `${centerMHz}mhz`,
    `${centerMHz} mhz`,
    `${(centerMHz / 1000).toFixed(3)}ghz`,
    `${(centerMHz / 1000).toFixed(3)} ghz`,
    ...extra,
  ]))
}

function wifi24Regulatory(channel: number): FrequencyRegulatoryNote[] {
  return channel >= 12
    ? [R.euWifi24, R.usPart15247, R.usWifi24Edge]
    : [R.euWifi24, R.usPart15247]
}

// ─── WiFi 2.4 GHz ch1–13 (existing) ──────────────────────────────────────────
const wifi24Channels = Array.from({ length: 13 }, (_, index) => {
  const channel = index + 1
  const centerMHz = 2412 + index * 5
  return {
    id: `wifi-24-ch-${channel}`,
    label: `WiFi 2.4 GHz Channel ${channel}`,
    shortLabel: `Ch ${channel}`,
    frequency_center: centerMHz * 1e6,
    frequency_bandwidth: 22e6,
    category: 'technology',
    family: 'WiFi 2.4 GHz',
    detail: `Channel ${channel} center is ${centerMHz} MHz (${(centerMHz / 1000).toFixed(3)} GHz). 2.4 GHz WLAN channels are spaced 5 MHz; legacy DSSS occupies about 22 MHz and OFDM is normally treated as a 20 MHz channel. Channels 1/6/11 are the common non-overlapping plan.`,
    color: channel === 1 || channel === 6 || channel === 11 ? '#00f5d4' : C.wifi_24,
    minZoom: 18,
    aliases: mhzAliases(centerMHz, `wifi channel ${channel}`, `wi-fi channel ${channel}`, `channel ${channel}`, `ch ${channel}`, `ch${channel}`, `2.4g ch${channel}`, `2.4ghz channel ${channel}`),
    regulatory: wifi24Regulatory(channel),
    sources: [REG_SRC.wlanChannels],
  } satisfies FrequencyFeature
})

// ─── Zigbee 2.4 GHz ch11–26 ───────────────────────────────────────────────────
const zigbeeChannels = Array.from({ length: 16 }, (_, i) => {
  const ch = 11 + i
  const centerMHz = 2405 + i * 5
  return {
    id: `zigbee-24-ch-${ch}`,
    label: `Zigbee Channel ${ch}`,
    shortLabel: `ZB-${ch}`,
    frequency_center: centerMHz * 1e6,
    frequency_bandwidth: 2e6,
    category: 'technology',
    family: 'Zigbee 2.4 GHz',
    detail: `Zigbee (IEEE 802.15.4) channel ${ch} at ${centerMHz} MHz, 2 MHz occupied BW, O-QPSK 250 kbps`,
    color: C.zigbee,
    minZoom: 22,
    aliases: mhzAliases(centerMHz, `zigbee channel ${ch}`, `channel ${ch}`, `ch ${ch}`, `ch${ch}`),
    regulatory: [R.euWifi24, R.usPart15247],
  } satisfies FrequencyFeature
})

// ─── WiFi 5 GHz individual channels ──────────────────────────────────────────
const wifi5Channels = [36,40,44,48,52,56,60,64,100,104,108,112,116,120,124,128,132,136,140,144,149,153,157,161,165].map(ch => {
  const isDFS = ch >= 52 && ch <= 144
  const centerMHz = 5000 + ch * 5
  return {
    id: `wifi-5-ch-${ch}`,
    label: `WiFi 5 GHz Channel ${ch}${isDFS ? ' (DFS)' : ''}`,
    shortLabel: `5G-ch${ch}`,
    frequency_center: centerMHz * 1e6,
    frequency_bandwidth: 20e6,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: `IEEE 802.11a/n/ac/ax channel ${ch} center is ${centerMHz} MHz (${(centerMHz / 1000).toFixed(3)} GHz). Nominal 20 MHz channel; adjacent channel bonding creates 40/80/160 MHz WLAN channels.${isDFS ? ' DFS/TPC required in most regulatory domains.' : ''}`,
    color: isDFS ? '#e8a838' : C.wifi_5,
    minZoom: 20,
    aliases: mhzAliases(centerMHz, `wifi channel ${ch}`, `wi-fi channel ${ch}`, `5g channel ${ch}`, `5ghz channel ${ch}`, `channel ${ch}`, `ch ${ch}`, `ch${ch}`),
    regulatory: [
      R.usWifi5,
      ...(ch >= 36 && ch <= 64 ? [R.euWifi5Lower] : []),
      ...(ch >= 100 && ch <= 144 ? [R.euWifi5Upper] : []),
      ...(ch >= 149 ? [R.usPart15247] : []),
    ],
    sources: [REG_SRC.wlanChannels],
  } satisfies FrequencyFeature
})

// ─── WiFi 6E channels (6 GHz) ─────────────────────────────────────────────────
// Channel formula: freq_MHz = 5940 + ch*5; EU ends at ch93 (6425 MHz), US at ch229 (7105 MHz)
const wifi6eChannelNums = [1,5,9,13,17,21,25,29,33,37,41,45,49,53,57,61,65,69,73,77,81,85,89,93,97,101,105,109,113,117,121,125,129,133,137,141,145,149,153,157,161,165,169,173,177,181,185,189,193,197,201,205,209,213,217,221,225,229]
const wifi6eChannels = wifi6eChannelNums.map(ch => {
  const centerMHz = 5940 + ch * 5
  const isEU = centerMHz <= 6425
  return {
    id: `wifi-6e-ch-${ch}`,
    label: `WiFi 6E Channel ${ch}`,
    shortLabel: `6E-ch${ch}`,
    frequency_center: centerMHz * 1e6,
    frequency_bandwidth: 20e6,
    category: 'technology',
    family: 'WiFi 6E (6 GHz)',
    detail: `IEEE 802.11ax/be 6 GHz channel ${ch} center is ${centerMHz} MHz (${(centerMHz / 1000).toFixed(3)} GHz). Channel formula: center MHz = 5940 + 5 x channel.${isEU ? ' This 20 MHz channel is inside the EU/CEPT 5945-6425 MHz lower-6 GHz allocation.' : ' This 20 MHz channel is above the current EU/CEPT lower-6 GHz allocation and depends on US/Canada/other regional rules.'}`,
    color: C.wifi_6e,
    minZoom: 25,
    aliases: mhzAliases(centerMHz, `wifi 6e channel ${ch}`, `wi-fi 6e channel ${ch}`, `6ghz channel ${ch}`, `6e channel ${ch}`, `channel ${ch}`, `ch ${ch}`, `ch${ch}`),
    regulatory: [R.usWifi6e, ...(isEU ? [R.euWifi6e] : [])],
    sources: [REG_SRC.wlanChannels],
  } satisfies FrequencyFeature
})

// ─── Main feature list ────────────────────────────────────────────────────────
const baseFrequencyFeatures: FrequencyFeature[] = [

  // ── NATURAL / PHYSICS ──────────────────────────────────────────────────────
  {
    id: 'schumann-1',
    label: 'Schumann Resonance 1st Harmonic',
    shortLabel: 'SR-1',
    frequency_center: 7.83,
    frequency_bandwidth: 0.5,
    category: 'radio',
    family: 'Schumann Resonances',
    detail: '7.83 Hz: fundamental Schumann resonance of the Earth-ionosphere cavity, excited by global lightning. EM standing wave in spherical cavity; wavelength equals Earth circumference.',
    color: C.natural,
    minZoom: 2,
    curatedRelations: [
      { targetId: 'schumann-2', type: 'harmonic', note: '2nd Schumann harmonic', weight: 1 },
      { targetId: 'schumann-3', type: 'harmonic', note: '3rd Schumann harmonic', weight: 0.95 },
      { targetId: 'mains-50hz', type: 'interference-risk', note: 'ELF environmental overlap', weight: 0.75 },
      { targetId: 'mains-60hz', type: 'interference-risk', note: 'ELF environmental overlap', weight: 0.75 },
    ],
  },
  {
    id: 'schumann-2',
    label: 'Schumann Resonance 2nd Harmonic',
    shortLabel: 'SR-2',
    frequency_center: 14.3,
    frequency_bandwidth: 0.8,
    category: 'radio',
    family: 'Schumann Resonances',
    detail: '14.3 Hz: second Schumann harmonic. Higher harmonics appear at ~20.8, 27.3, 33.8 Hz. These are not acoustic; they are ELF electromagnetic resonances.',
    color: C.natural,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'schumann-1', type: 'harmonic', note: 'Fundamental mode', weight: 1 },
      { targetId: 'schumann-3', type: 'harmonic', note: 'Next harmonic', weight: 0.9 },
    ],
  },
  {
    id: 'schumann-3',
    label: 'Schumann Resonance 3rd Harmonic',
    shortLabel: 'SR-3',
    frequency_center: 20.8,
    frequency_bandwidth: 1.0,
    category: 'radio',
    family: 'Schumann Resonances',
    detail: '20.8 Hz: third Schumann harmonic. Monitored globally as a geophysical index; correlates with thunderstorm activity.',
    color: C.natural,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'schumann-2', type: 'harmonic', note: 'Previous harmonic', weight: 0.9 },
      { targetId: 'schumann-1', type: 'harmonic', note: 'Fundamental mode', weight: 0.85 },
    ],
  },
  {
    id: 'mains-50hz',
    label: 'Mains Power 50 Hz (EU/AU/Asia)',
    shortLabel: '50 Hz',
    frequency_center: 50,
    frequency_bandwidth: 0.2,
    category: 'radio',
    family: 'Power Mains',
    detail: '50 Hz AC mains frequency used in Europe, Australia, most of Asia and Africa. Grid-coupled interference dominates below 1 kHz in urban EM environments.',
    color: C.power,
    minZoom: 3,
    curatedRelations: [
      { targetId: 'mains-60hz', type: 'same-system', note: 'Regional mains counterpart', weight: 1 },
      { targetId: 'schumann-1', type: 'interference-risk', note: 'Low-frequency field context', weight: 0.7 },
    ],
  },
  {
    id: 'mains-60hz',
    label: 'Mains Power 60 Hz (US/JP/CA)',
    shortLabel: '60 Hz',
    frequency_center: 60,
    frequency_bandwidth: 0.2,
    category: 'radio',
    family: 'Power Mains',
    detail: '60 Hz AC mains used in North America, Japan, and parts of South America. 60 Hz harmonics (120, 180, 300 Hz…) are common interference sources.',
    color: C.power,
    minZoom: 3,
    curatedRelations: [
      { targetId: 'mains-50hz', type: 'same-system', note: 'Regional mains counterpart', weight: 1 },
      { targetId: 'schumann-1', type: 'interference-risk', note: 'Low-frequency field context', weight: 0.7 },
    ],
  },
  {
    id: 'hydrogen-line',
    label: 'Hydrogen Line 21 cm',
    shortLabel: 'H-line',
    frequency_center: 1420405752,
    frequency_bandwidth: 20e3,
    category: 'radio',
    family: 'Radio Astronomy',
    detail: '1420.405752 MHz: hyperfine transition of neutral hydrogen (spin-flip). The most abundant emission line in the galaxy; protected radio astronomy allocation globally (1400–1427 MHz). Used to map galactic structure.',
    color: C.natural,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'gps-l2', type: 'adjacent-service', note: 'Same broad L-band ecosystem', weight: 0.6 },
      { targetId: 'gps-l1', type: 'adjacent-service', note: 'Nearby navigation service in upper L-band', weight: 0.5 },
    ],
  },

  // ── VLF SUBMARINE COMMUNICATIONS ──────────────────────────────────────────
  {
    id: 'vlf-naa-17',
    label: 'NAA Cutler ME — VLF 17.1 kHz',
    shortLabel: 'NAA 17k',
    frequency_center: 17100,
    frequency_bandwidth: 200,
    category: 'radio',
    family: 'VLF Submarine Comms',
    detail: '17.1 kHz: US Navy VLF transmitter at Cutler, Maine (NAA). 1.8 MW ERP. Penetrates seawater to ~10–20 m depth for submerged submarine comms. MSK modulation.',
    color: C.vlf,
    minZoom: 4,
  },
  {
    id: 'vlf-nwc-19',
    label: 'NWC Harold E Holt — VLF 19.8 kHz',
    shortLabel: 'NWC 19k',
    frequency_center: 19800,
    frequency_bandwidth: 200,
    category: 'radio',
    family: 'VLF Submarine Comms',
    detail: '19.8 kHz: Royal Australian Navy VLF transmitter at Harold E Holt, Exmouth WA. 1 MW. Provides one-way comms to submerged ANZUS submarines in the Indo-Pacific.',
    color: C.vlf,
    minZoom: 4,
  },
  {
    id: 'vlf-naa-24',
    label: 'NAA Primary — VLF 24.0 kHz',
    shortLabel: 'NAA 24k',
    frequency_center: 24000,
    frequency_bandwidth: 200,
    category: 'radio',
    family: 'VLF Submarine Comms',
    detail: '24.0 kHz: alternate NAA transmission slot. VLF ground-wave propagates globally with low attenuation. Used for TACAMO / E-6 Mercury airborne relay.',
    color: C.vlf,
    minZoom: 4,
  },

  // ── LF TIME SIGNALS ────────────────────────────────────────────────────────
  {
    id: 'wwvb-msf-60',
    label: 'WWVB (US) / MSF (UK) Time Signal 60 kHz',
    shortLabel: 'WWVB/MSF',
    frequency_center: 60000,
    frequency_bandwidth: 1000,
    category: 'radio',
    family: 'LF Time Signals',
    detail: '60 kHz: WWVB (Fort Collins CO, 70 kW) broadcasts US atomic time using phase-modulated carrier. MSF (Rugby, UK, 17 kW) uses the same frequency for UK/EU radio clocks.',
    color: C.time,
    minZoom: 4,
  },
  {
    id: 'dcf77-77k',
    label: 'DCF77 Time Signal 77.5 kHz',
    shortLabel: 'DCF77',
    frequency_center: 77500,
    frequency_bandwidth: 1000,
    category: 'radio',
    family: 'LF Time Signals',
    detail: '77.5 kHz: German PTB time signal from Mainflingen. 50 kW. Amplitude-keyed for time/date; pseudo-random phase modulation for carrier-phase clocks. Covers all of Europe.',
    color: C.time,
    minZoom: 4,
  },

  // ── LF RFID ────────────────────────────────────────────────────────────────
  {
    id: 'rfid-lf-125',
    label: 'LF RFID 125 kHz',
    shortLabel: 'RFID 125k',
    frequency_center: 125000,
    frequency_bandwidth: 14000,
    category: 'technology',
    family: 'LF RFID',
    detail: '125 kHz: legacy LF RFID (ISO 11784/11785, EM4100, HID Prox). Read range 2–15 cm. Used in proximity access cards, livestock tags, and old key fobs. No encryption.',
    color: C.rfid_lf,
    minZoom: 5,
  },
  {
    id: 'rfid-animal-134',
    label: 'Animal Microchip RFID 134.2 kHz',
    shortLabel: 'µchip',
    frequency_center: 134200,
    frequency_bandwidth: 4000,
    category: 'technology',
    family: 'LF RFID',
    detail: '134.2 kHz: ISO 11784/11785 FDX-B standard for injectable pet microchips. Passive transponder, 15-digit unique ID. Worldwide veterinary standard.',
    color: C.rfid_lf,
    minZoom: 6,
  },

  // ── MF ─────────────────────────────────────────────────────────────────────
  {
    id: 'navtex-518',
    label: 'NAVTEX Maritime Weather 518 kHz',
    shortLabel: 'NAVTEX',
    frequency_center: 518000,
    frequency_bandwidth: 500,
    category: 'radio',
    family: 'Maritime MF',
    detail: '518 kHz: international NAVTEX broadcast (SOLAS). Coastal stations transmit navigational warnings and weather forecasts in SITOR-B (RTTY). Range ~300 nm.',
    color: C.maritime,
    minZoom: 5,
  },
  {
    id: 'am-mw-overview',
    label: 'AM Medium Wave Broadcast',
    shortLabel: 'AM MW',
    frequency_center: 1100000,
    frequency_bandwidth: 1170000,
    category: 'radio',
    family: 'AM Broadcast',
    detail: 'Medium wave AM broadcast band 530–1700 kHz (ITU Region 2 allocation). 10 kHz channel spacing (Americas); 9 kHz (Europe/Asia). Amplitude modulation, 10 kW typical ERP.',
    color: C.am,
    minZoom: 3,
  },
  {
    id: 'maritime-mf-distress-2182',
    label: 'Maritime MF Distress 2182 kHz',
    shortLabel: 'MF Dist',
    frequency_center: 2182000,
    frequency_bandwidth: 3000,
    category: 'radio',
    family: 'Maritime MF',
    detail: '2182 kHz: international maritime distress and calling frequency (J3E / USB). Compulsory watch for vessels at sea until replaced by GMDSS. SOLAS Chapter IV.',
    color: C.emergency,
    minZoom: 5,
  },

  // ── HF TIME STANDARDS ──────────────────────────────────────────────────────
  {
    id: 'wwv-5mhz',
    label: 'WWV/WWVH Time Standard 5 MHz',
    shortLabel: 'WWV 5M',
    frequency_center: 5000000,
    frequency_bandwidth: 1000,
    category: 'radio',
    family: 'HF Time Standards',
    detail: '5 MHz: one of five WWV (Fort Collins CO) / WWVH (Kauai HI) simultaneous broadcasts providing UTC traceability. AM carrier ±1 ppm; 10 kW. Also at 2.5, 10, 15, 20 MHz.',
    color: C.time,
    minZoom: 4,
  },
  {
    id: 'wwv-10mhz',
    label: 'WWV/WWVH Time Standard 10 MHz',
    shortLabel: 'WWV 10M',
    frequency_center: 10000000,
    frequency_bandwidth: 1000,
    category: 'radio',
    family: 'HF Time Standards',
    detail: '10 MHz: most reliable WWV frequency for mid-latitude coverage during daytime. Continuous broadcast includes voice time announcements, BPM (China), and CHU (Canada) at similar frequencies.',
    color: C.time,
    minZoom: 4,
  },

  // ── NFC / HF RFID ──────────────────────────────────────────────────────────
  {
    id: 'nfc-hf-rfid-13mhz',
    label: 'NFC / HF RFID 13.56 MHz',
    shortLabel: 'NFC/RFID',
    frequency_center: 13560000,
    frequency_bandwidth: 14000,
    category: 'technology',
    family: 'HF RFID / NFC',
    detail: '13.56 MHz ISM: ISO 14443 (contactless payments, e-passports), ISO 15693 (library tags), NFC (ISO 18092). FeliCa (Sony), MIFARE (NXP), DESFire. Reader range 1–10 cm.',
    color: C.nfc,
    minZoom: 4,
  },

  // ── NFC sub-band POIs (appear when zoomed close to 13.56 MHz) ────────────
  {
    id: 'hf-rfid-13110',
    label: 'HF RFID 13.110 MHz',
    shortLabel: '13.11M',
    frequency_center: 13110000,
    frequency_bandwidth: 5000,
    category: 'technology',
    family: 'HF RFID / NFC',
    detail: '13.110 MHz: used by some proprietary HF RFID systems adjacent to the 13.56 MHz ISM allocation. Also overlaps the 22m international broadcast segment.',
    color: C.nfc,
    minZoom: 10,
  },
  {
    id: 'hf-rfid-14010',
    label: 'HF RFID 14.010 MHz',
    shortLabel: '14.01M',
    frequency_center: 14010000,
    frequency_bandwidth: 5000,
    category: 'technology',
    family: 'HF RFID / NFC',
    detail: '14.010 MHz: upper sidelobe region of some wideband HF RFID readers; also the start of the 20m amateur CW segment (14.000–14.070 MHz).',
    color: C.nfc,
    minZoom: 10,
  },

  // ── HF AMATEUR ────────────────────────────────────────────────────────────
  {
    id: 'amateur-20m',
    label: '20m Amateur Band (HF)',
    shortLabel: '20m Ham',
    frequency_center: 14175000,
    frequency_bandwidth: 350000,
    category: 'radio',
    family: 'Amateur Radio HF',
    detail: '14.0–14.35 MHz: the workhorse DX band. 14.175 MHz center. SSB phone above 14.150 MHz; CW/digital below. F2 propagation spans intercontinental distances during daytime.',
    color: C.amateur,
    minZoom: 5,
  },
  {
    id: 'amateur-15m',
    label: '15m Amateur Band (HF)',
    shortLabel: '15m Ham',
    frequency_center: 21225000,
    frequency_bandwidth: 450000,
    category: 'radio',
    family: 'Amateur Radio HF',
    detail: '21.0–21.45 MHz: 15m band, excellent for long-haul DX near solar maximum. Often superior to 20m for antipodal paths. Shares spectrum with satellite allocation.',
    color: C.amateur,
    minZoom: 5,
  },

  // ── CB RADIO ──────────────────────────────────────────────────────────────
  {
    id: 'cb-band-overview',
    label: 'CB Radio 40-Channel Band',
    shortLabel: 'CB Band',
    frequency_center: 27000000,
    frequency_bandwidth: 440000,
    category: 'radio',
    family: 'CB Radio',
    detail: '26.965–27.405 MHz: 40 CB channels (FCC Part 95). 4 W AM / 12 W SSB. Unlicensed (US). Channel 9 is emergency, Channel 19 is truckers\' nationwide highway channel.',
    color: C.cb,
    minZoom: 4,
  },
  {
    id: 'cb-ch19',
    label: 'CB Channel 19 (Trucker Convoy)',
    shortLabel: 'CB-19',
    frequency_center: 27185000,
    frequency_bandwidth: 8000,
    category: 'radio',
    family: 'CB Radio',
    detail: '27.185 MHz: CB Channel 19, de-facto US interstate truckers\' calling and convoy channel. AM/SSB. 27.065 MHz = Channel 9 (emergency). Standard 40-channel band per FCC §95.401.',
    color: C.cb,
    minZoom: 5,
  },

  // ── ISM HF/VHF ────────────────────────────────────────────────────────────
  {
    id: 'ism-27mhz',
    label: 'ISM 27 MHz Band (RC / Industrial)',
    shortLabel: 'ISM 27M',
    frequency_center: 27120000,
    frequency_bandwidth: 240000,
    category: 'radio',
    family: 'ISM Bands',
    detail: '26.957–27.283 MHz ISM band. Used by RC toys, some RFID readers, industrial heating. Shared with CB; high noise floor from consumer devices.',
    color: C.ism,
    minZoom: 5,
  },
  {
    id: 'ism-40mhz',
    label: 'ISM 40 MHz Band',
    shortLabel: 'ISM 40M',
    frequency_center: 40680000,
    frequency_bandwidth: 20000,
    category: 'radio',
    family: 'ISM Bands',
    detail: '40.66–40.70 MHz ITU ISM band. Used for legacy RC aircraft, cordless microphones, and medical telemetry in some regions.',
    color: C.ism,
    minZoom: 5,
  },
  {
    id: 'ism-49mhz',
    label: '49 MHz ISM (Baby Monitors / RC)',
    shortLabel: 'ISM 49M',
    frequency_center: 49000000,
    frequency_bandwidth: 500000,
    category: 'radio',
    family: 'ISM Bands',
    detail: '48.75–49.5 MHz: legacy unlicensed band for analog baby monitors, walkie-talkies, and RC toys (pre-2.4 GHz era). Still in use; AM/FM analog.',
    color: C.ism,
    minZoom: 5,
  },

  // ── VHF AMATEUR ───────────────────────────────────────────────────────────
  {
    id: 'amateur-6m',
    label: '6m Amateur Band (VHF)',
    shortLabel: '6m Ham',
    frequency_center: 52000000,
    frequency_bandwidth: 4000000,
    category: 'radio',
    family: 'Amateur Radio VHF',
    detail: '50–54 MHz: 6m band, the "magic band" for sporadic-E propagation. Beams intercontinental DX during Es season (May–Aug in NH). Also meteor scatter and EME.',
    color: C.amateur,
    minZoom: 4,
  },
  {
    id: 'rc-aircraft-72mhz',
    label: 'RC Aircraft 72 MHz (US FAA)',
    shortLabel: 'RC-72',
    frequency_center: 72000000,
    frequency_bandwidth: 2000000,
    category: 'radio',
    family: 'RC Aviation',
    detail: '72–74 MHz: US FAA Part 71 band for RC model aircraft (now largely superseded by 2.4 GHz FHSS systems). 50 channels, 40 mW. No longer manufactured but legacy receivers still in use.',
    color: C.aviation,
    minZoom: 6,
  },

  // ── FM BROADCAST ──────────────────────────────────────────────────────────
  {
    id: 'fm-broadcast-overview',
    label: 'FM Broadcast Band (87.5–108 MHz)',
    shortLabel: 'FM Band',
    frequency_center: 98250000,
    frequency_bandwidth: 20500000,
    category: 'radio',
    family: 'FM Broadcast',
    detail: '87.5–108 MHz: VHF FM stereo broadcast. 200 kHz channel spacing (US), 100 kHz (EU). 38 kHz DSB-SC stereo subchannel, 57 kHz RDS/RBDS data. 100 kW ERP max.',
    color: C.fm,
    minZoom: 3,
  },

  // ── AVIATION ──────────────────────────────────────────────────────────────
  {
    id: 'aviation-vor-ils',
    label: 'Aviation VOR/ILS Navigation',
    shortLabel: 'VOR/ILS',
    frequency_center: 113000000,
    frequency_bandwidth: 10000000,
    category: 'radio',
    family: 'Aviation Navigation',
    detail: '108–118 MHz: VHF Omni-Range (VOR) bearings and ILS Localizer downlink. Odd-tenth MHz = ILS LOC; even-tenth = VOR. Paired with ILS Glideslope at 329–335 MHz UHF.',
    color: C.aviation,
    minZoom: 4,
  },
  {
    id: 'aviation-emergency-121',
    label: 'Aviation Emergency 121.5 MHz',
    shortLabel: 'Guard 121',
    frequency_center: 121500000,
    frequency_bandwidth: 100000,
    category: 'radio',
    family: 'Aviation Emergency',
    detail: '121.5 MHz: international aeronautical emergency and ELT (Emergency Locator Transmitter) frequency. Monitored continuously by ATC. Distress AM voice.',
    color: C.emergency,
    minZoom: 5,
  },
  {
    id: 'aviation-atc-overview',
    label: 'Aviation ATC Voice (118–137.5 MHz)',
    shortLabel: 'ATC VHF',
    frequency_center: 127750000,
    frequency_bandwidth: 19500000,
    category: 'radio',
    family: 'Aviation ATC',
    detail: '118–137.5 MHz: airband VHF for ATC voice (AM, 8.33 kHz spacing in Europe). Includes ATIS, ground, tower, approach, departure, and enroute sectors.',
    color: C.aviation,
    minZoom: 4,
  },
  {
    id: 'noaa-satdownlink-136',
    label: 'NOAA/MetOp Weather Satellite 136–138 MHz',
    shortLabel: 'NOAA-APT',
    frequency_center: 136000000,
    frequency_bandwidth: 3000000,
    category: 'radio',
    family: 'Weather Satellite',
    detail: '136–138 MHz: NOAA POES APT downlink (137.500, 137.620 MHz) and Meteor-M LRPT (137.100, 137.9 MHz). 120 lines/min image, receivable with V-dipole and RTL-SDR.',
    color: C.satellite,
    minZoom: 5,
  },

  // ── VHF AMATEUR 2m ────────────────────────────────────────────────────────
  {
    id: 'amateur-2m',
    label: '2m Amateur Band (VHF)',
    shortLabel: '2m Ham',
    frequency_center: 146000000,
    frequency_bandwidth: 4000000,
    category: 'radio',
    family: 'Amateur Radio VHF',
    detail: '144–148 MHz: most active VHF amateur band. Local FM simplex/repeaters, APRS 144.39 MHz (US), meteor scatter SSB around 144.300 MHz. Worldwide allocation.',
    color: C.amateur,
    minZoom: 5,
  },

  // ── MARINE VHF ────────────────────────────────────────────────────────────
  {
    id: 'marine-vhf-ch70',
    label: 'Marine VHF Channel 70 (DSC)',
    shortLabel: 'VHF-70',
    frequency_center: 156525000,
    frequency_bandwidth: 16000,
    category: 'radio',
    family: 'Maritime VHF',
    detail: '156.525 MHz: dedicated GMDSS Digital Selective Calling channel. G2B FSK at 1200 bps. Transmits vessel MMSI, distress alerts, and position. SOLAS compulsory watch.',
    color: C.maritime,
    minZoom: 6,
  },
  {
    id: 'marine-vhf-ch16',
    label: 'Marine VHF Channel 16 (Distress)',
    shortLabel: 'CH16',
    frequency_center: 156800000,
    frequency_bandwidth: 16000,
    category: 'radio',
    family: 'Maritime VHF',
    detail: '156.800 MHz: international marine distress, safety and calling channel. FM voice. Compulsory watch for all vessels underway. Bridge-to-bridge also monitored.',
    color: C.emergency,
    minZoom: 5,
  },
  {
    id: 'noaa-weather-radio',
    label: 'NOAA Weather Radio (162.4–162.55 MHz)',
    shortLabel: 'NWR',
    frequency_center: 162475000,
    frequency_bandwidth: 150000,
    category: 'radio',
    family: 'Weather Radio',
    detail: 'NOAA Weather Radio All Hazards: 7 channels (162.400, 162.425, 162.450, 162.475, 162.500, 162.525, 162.550 MHz). Continuous FM voice; 1050 Hz SAME tone alerts.',
    color: C.maritime,
    minZoom: 5,
  },

  // ── DAB / DIGITAL RADIO ───────────────────────────────────────────────────
  {
    id: 'dab-band3',
    label: 'DAB Digital Radio Band III (174–230 MHz)',
    shortLabel: 'DAB III',
    frequency_center: 202000000,
    frequency_bandwidth: 56000000,
    category: 'radio',
    family: 'DAB Digital Radio',
    detail: '174–230 MHz: VHF Band III for DAB and DAB+ (ETSI EN 300 401). OFDM on 1.536 MHz multiplex blocks. UK has 26+ national and regional multiplexes. Germany, AU, NO nationwide.',
    color: C.dab,
    minZoom: 4,
  },

  // ── MILITARY / UHF ────────────────────────────────────────────────────────
  {
    id: 'military-uhf-guard-243',
    label: 'Military UHF Emergency 243 MHz',
    shortLabel: 'UHF Guard',
    frequency_center: 243000000,
    frequency_bandwidth: 100000,
    category: 'radio',
    family: 'Military Aviation',
    detail: '243 MHz: military UHF guard/emergency (double 121.5 MHz). ELTs, Combat SAR, intercept. Monitored by all military aircraft. AM voice.',
    color: C.emergency,
    minZoom: 5,
  },
  {
    id: 'military-uhf-overview',
    label: 'Military Aviation UHF (225–400 MHz)',
    shortLabel: 'Mil UHF',
    frequency_center: 312500000,
    frequency_bandwidth: 175000000,
    category: 'radio',
    family: 'Military Aviation',
    detail: '225–400 MHz: NATO/military UHF airband. AM voice, JTIDS/MIDS datalinks, IFF Mode 4/5. HAVE QUICK ECCM frequency hopping used for ATC.',
    color: C.aviation,
    minZoom: 4,
  },

  // ── UHF 300–470 MHz ───────────────────────────────────────────────────────
  {
    id: 'srd-303',
    label: 'Car Keys / Alarms 303.875 MHz (EU legacy)',
    shortLabel: '303M',
    frequency_center: 303875000,
    frequency_bandwidth: 250000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '303.875 MHz: legacy European SRD band for car key fobs, alarm sensors, and gate remotes. Predates the 433 MHz migration. Fixed OOK code, no rolling-code security.',
    color: C.ism,
    minZoom: 6,
  },
  {
    id: 'srd-318',
    label: 'SRD 318 MHz (NA/Asia)',
    shortLabel: '318M',
    frequency_center: 318000000,
    frequency_bandwidth: 300000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '318 MHz: SRD frequency used in North America and Asia for wireless remotes, motion sensors, and alarm transmitters. OOK, 1–100 kbps, typically < 10 mW.',
    color: C.ism,
    minZoom: 6,
  },
  {
    id: 'srd-330',
    label: 'SRD 330 MHz',
    shortLabel: '330M',
    frequency_center: 330000000,
    frequency_bandwidth: 300000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '330 MHz: regional SRD used for RF remotes and low-power sensor transmitters. Found in some North American garage openers and weather station transmitters.',
    color: C.ism,
    minZoom: 6,
  },
  {
    id: 'garage-na-310',
    label: 'Garage Door Remotes (NA) 310 MHz',
    shortLabel: 'Garage-NA',
    frequency_center: 310000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '310 MHz: older North American garage door and gate remotes (Chamberlain, LiftMaster legacy). AM/OOK, rolling-code (Security+). Replaced by 315 MHz and 390 MHz in newer units.',
    color: C.ism,
    minZoom: 5,
  },
  {
    id: 'fob-315',
    label: 'Car Key Fobs / Garage 315 MHz (US)',
    shortLabel: 'Fob 315',
    frequency_center: 315000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '315 MHz: dominant US/Canada/Japan short-range device band. Automotive PKES/RKE, garage openers, alarm sensors. OOK/FSK, rolling code (KeeLoq, AES-128). Max 1 mW EIRP.',
    color: C.ism,
    minZoom: 5,
  },
  {
    id: 'tetra-380',
    label: 'TETRA Public Safety (380–400 MHz)',
    shortLabel: 'TETRA',
    frequency_center: 390000000,
    frequency_bandwidth: 20000000,
    category: 'technology',
    family: 'TETRA PMR',
    detail: '380–400 MHz: TETRA (ETSI EN 300 392) for emergency services (police, fire, EMS) in Europe. 25 kHz channels, TDMA 4-slot, encrypted group voice and data. BOS network (Germany), Astrid (Belgium), Airwave (UK).',
    color: C.tetra,
    minZoom: 5,
  },
  {
    id: 'srd-418',
    label: 'UK SRD 418 MHz',
    shortLabel: 'SRD 418',
    frequency_center: 418000000,
    frequency_bandwidth: 4000000,
    category: 'radio',
    family: 'ISM / SRD',
    detail: '418 MHz: UK-specific short-range device band (OFCOM IR2030). Alarm sensors, telemetry, remote controls. 25 mW max. Coexists with amateur 70 cm at edge.',
    color: C.ism,
    minZoom: 6,
  },
  {
    id: 'amateur-70cm',
    label: '70 cm Amateur Band (UHF)',
    shortLabel: '70cm Ham',
    frequency_center: 435000000,
    frequency_bandwidth: 10000000,
    category: 'radio',
    family: 'Amateur Radio UHF',
    detail: '430–440 MHz: 70 cm amateur band. FM repeaters, ATV (analog TV), EME, satellite uplink (AO-7, AO-91). APRS 432.500 MHz digital. Shared secondary with radiolocation.',
    color: C.amateur,
    minZoom: 5,
  },

  // ── ISM 433 MHz ───────────────────────────────────────────────────────────
  {
    id: 'ism-433-overview',
    label: 'ISM 433.92 MHz Band (EU)',
    shortLabel: 'ISM 433',
    frequency_center: 433920000,
    frequency_bandwidth: 1740000,
    category: 'technology',
    family: 'ISM 433 MHz',
    detail: '433.05-434.79 MHz: EU SRD/ISM band (ITU Region 1). Key fobs, weather stations, LoRa EU433 and OOK sensors often use 433.92 MHz. CEPT common SRD limit is 10 mW e.r.p. with <=10% duty cycle for narrowband devices.',
    color: C.ism_433,
    minZoom: 5,
  },
  {
    id: 'ism-433-lower',
    label: 'ISM 433 Lower Edge (433.075 MHz)',
    shortLabel: '433-Lo',
    frequency_center: 433075000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'ISM 433 MHz',
    detail: '433.075 MHz: lower edge of EU 433 MHz SRD band. LoRa EU433 channel 0 (433.175 MHz) is 100 kHz above. High-Q crystal oscillators often land near this edge.',
    color: C.ism_433,
    minZoom: 8,
  },
  {
    id: 'ism-433-upper',
    label: 'ISM 433 Upper Edge (434.775 MHz)',
    shortLabel: '433-Hi',
    frequency_center: 434775000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'ISM 433 MHz',
    detail: '434.775 MHz: upper edge of EU 433 MHz SRD band. LoRa EU433 channel 2 (434.665 MHz) and channel 3 (434.865 MHz — guard) lie near here.',
    color: C.ism_433,
    minZoom: 8,
  },

  // ── PMR446 ────────────────────────────────────────────────────────────────
  {
    id: 'pmr446',
    label: 'PMR446 (EU Licence-Free)',
    shortLabel: 'PMR446',
    frequency_center: 446093750,
    frequency_bandwidth: 200000,
    category: 'radio',
    family: 'PMR446',
    detail: '446.0-446.2 MHz: licence-free PMR446 handheld band in CEPT/EU. Analogue channels use 12.5 kHz spacing; digital dPMR/DMR variants use 6.25/12.5 kHz plans. 500 mW e.r.p. max, handheld use only.',
    color: C.pmr,
    minZoom: 6,
  },

  // ── UK 458 MHz SRD ────────────────────────────────────────────────────────
  {
    id: 'srd-458',
    label: 'PMR / SRD 458 MHz (UK)',
    shortLabel: '458M',
    frequency_center: 458000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '457–460 MHz: UK Ofcom low-power class-licensed band for short-range business radios (PMR adjacent), telemetry, and alarm transmitters. 10 mW ERP max.',
    color: C.pmr,
    minZoom: 6,
  },

  // ── FRS/GMRS ──────────────────────────────────────────────────────────────
  {
    id: 'frs-gmrs',
    label: 'FRS/GMRS (US) 462–467 MHz',
    shortLabel: 'FRS/GMRS',
    frequency_center: 462587500,
    frequency_bandwidth: 5000000,
    category: 'radio',
    family: 'FRS / GMRS',
    detail: '462.5-467.7 MHz: US FRS and GMRS personal radio channels. FRS is licence-free with 2 W ERP on channels 1-7/15-22 and 0.5 W on channels 8-14. GMRS requires a licence and can use higher power on GMRS channels.',
    color: C.pmr,
    minZoom: 6,
  },

  // ── UHF TV ────────────────────────────────────────────────────────────────
  {
    id: 'uhf-tv-overview',
    label: 'UHF TV Broadcast (470–790 MHz)',
    shortLabel: 'UHF TV',
    frequency_center: 630000000,
    frequency_bandwidth: 320000000,
    category: 'radio',
    family: 'Television Broadcast',
    detail: '470–790 MHz: DVB-T/T2 (EU), ATSC/ATSC 3.0 (US), ISDB-T (JP/BR). 8 MHz channels (EU), 6 MHz (US). 700/800 MHz bands refarmed for LTE. White-space spectrum (TVWS) available between active muxes.',
    color: C.tv,
    minZoom: 3,
  },

  // ── LoRa BANDS ────────────────────────────────────────────────────────────
  {
    id: 'lora-cn490',
    label: 'LoRa CN490 (China 470–510 MHz)',
    shortLabel: 'LoRa CN',
    frequency_center: 490000000,
    frequency_bandwidth: 40000000,
    category: 'technology',
    family: 'LoRaWAN',
    detail: '470–510 MHz: LoRaWAN CN470 plan used in China. 96 uplink channels 470.3–489.3 MHz (200 kHz step), 48 downlink 500.3–509.7 MHz. Sub-GHz ISM replacement for China mainland.',
    color: C.lora,
    minZoom: 6,
  },
  {
    id: 'lte-700-eu',
    label: 'LTE Band 28 / 700 MHz EU',
    shortLabel: 'LTE-700',
    frequency_center: 742000000,
    frequency_bandwidth: 96000000,
    category: 'technology',
    family: 'LTE Cellular',
    detail: '694–790 MHz: EU digital dividend II, LTE Band 28 APT700. 45 MHz FDD pairs. Wide coverage, deep indoor penetration. AU, Asia-Pacific, Africa 4G/5G primary coverage band.',
    color: C.lte,
    minZoom: 5,
  },
  {
    id: 'lte-700-us',
    label: 'LTE 700 MHz US (Band 13/17)',
    shortLabel: 'LTE-700US',
    frequency_center: 752000000,
    frequency_bandwidth: 108000000,
    category: 'technology',
    family: 'LTE Cellular',
    detail: '698–806 MHz: US 700 MHz LTE bands 12/13/14/17. AT&T (B17), Verizon (B13), FirstNet (B14, 758–768 MHz). Former UHF TV channels 51–61. Primary rural and building-penetration LTE.',
    color: C.lte,
    minZoom: 5,
  },

  // ── UHF RFID (860–960 MHz) ────────────────────────────────────────────────
  {
    id: 'uhf-rfid-865',
    label: 'UHF RFID 865 MHz (EU)',
    shortLabel: 'RFID-EU',
    frequency_center: 865000000,
    frequency_bandwidth: 3000000,
    category: 'technology',
    family: 'UHF RFID',
    detail: '865-868 MHz: European UHF RFID band (ETSI EN 302 208). EPC Gen2 / ISO 18000-6C. High-power RFID is concentrated in 865.6-867.6 MHz at up to 2 W e.r.p.; edge slices have lower limits.',
    color: C.uhf_rfid,
    minZoom: 5,
  },
  {
    id: 'uhf-rfid-902',
    label: 'UHF RFID 902 MHz (US Start)',
    shortLabel: 'RFID↓US',
    frequency_center: 902000000,
    frequency_bandwidth: 500000,
    category: 'technology',
    family: 'UHF RFID',
    detail: '902 MHz: lower edge of the US 902–928 MHz ISM band; shared by UHF RFID (EPC Gen2), LoRa US915, 802.11ah HaLow, and Zigbee 900. 1 W EIRP max for RFID.',
    color: C.uhf_rfid,
    minZoom: 7,
  },
  {
    id: 'uhf-rfid-928',
    label: 'UHF RFID 928 MHz (US End)',
    shortLabel: 'RFID↑US',
    frequency_center: 928000000,
    frequency_bandwidth: 500000,
    category: 'technology',
    family: 'UHF RFID',
    detail: '928 MHz: upper edge of the US UHF RFID / ISM band. LoRa US915 downlink channels (923–928 MHz) share this region with some hopping RFID readers.',
    color: C.uhf_rfid,
    minZoom: 7,
  },

  // ── EU SRD868 / LoRa EU868 ────────────────────────────────────────────────
  {
    id: 'eu-srd868-overview',
    label: 'EU SRD868 / LoRa EU868 (863–870 MHz)',
    shortLabel: 'SRD868',
    frequency_center: 866000000,
    frequency_bandwidth: 7000000,
    category: 'technology',
    family: 'ISM 868 MHz',
    detail: '863–870 MHz: European SRD (Short-Range Device) sub-band. Hosts LoRaWAN EU868 plan, wMBus (gas/water/electricity meters), Sigfox, Z-Wave, DECT-ULE, and various 868 MHz sensors.',
    color: C.ism,
    minZoom: 6,
  },
  {
    id: 'lora-eu868-ch0',
    label: 'LoRa EU868 Channel 0 (868.1 MHz)',
    shortLabel: 'L-EU868-0',
    frequency_center: 868100000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '868.1 MHz: LoRaWAN EU868 default channel 0. Mandatory for all EU868 gateways and devices. SF7–SF12, BW125kHz. 1% duty cycle (g1 sub-band).',
    color: C.lora,
    minZoom: 18,
  },
  {
    id: 'lora-eu868-ch1',
    label: 'LoRa EU868 Channel 1 (868.3 MHz)',
    shortLabel: 'L-EU868-1',
    frequency_center: 868300000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '868.3 MHz: LoRaWAN EU868 channel 1 (also wMBus Mode S narrow-band). BW125kHz + BW250kHz (FSK 50kbps). Mandatory default channel.',
    color: C.lora,
    minZoom: 18,
  },
  {
    id: 'lora-eu868-ch2',
    label: 'LoRa EU868 Channel 2 (868.5 MHz)',
    shortLabel: 'L-EU868-2',
    frequency_center: 868500000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '868.5 MHz: LoRaWAN EU868 channel 2. Mandatory default channel. BW125kHz SF7–SF12. Third of the three OTAA join channels.',
    color: C.lora,
    minZoom: 18,
  },
  {
    id: 'lora-eu868-ch3',
    label: 'LoRa EU868 Channel 3 (867.1 MHz)',
    shortLabel: 'L-EU868-3',
    frequency_center: 867100000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '867.1 MHz: LoRaWAN EU868 optional channel 3. Added by NS after join. Extends capacity beyond 3 default channels. g1 sub-band, 1% duty cycle.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-eu868-ch4',
    label: 'LoRa EU868 Channel 4 (867.3 MHz)',
    shortLabel: 'L-EU868-4',
    frequency_center: 867300000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '867.3 MHz: LoRaWAN EU868 optional channel 4.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-eu868-ch5',
    label: 'LoRa EU868 Channel 5 (867.5 MHz)',
    shortLabel: 'L-EU868-5',
    frequency_center: 867500000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '867.5 MHz: LoRaWAN EU868 optional channel 5.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-eu868-ch6',
    label: 'LoRa EU868 Channel 6 (867.7 MHz)',
    shortLabel: 'L-EU868-6',
    frequency_center: 867700000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '867.7 MHz: LoRaWAN EU868 optional channel 6.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-eu868-ch7',
    label: 'LoRa EU868 Channel 7 (867.9 MHz)',
    shortLabel: 'L-EU868-7',
    frequency_center: 867900000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '867.9 MHz: LoRaWAN EU868 optional channel 7. Completes the 8-channel EU868 plan (ch0–ch7 uplink, ch8 downlink RX2).',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'wmbus-mode-t1',
    label: 'wMBus Mode T1 Uplink (868.95 MHz)',
    shortLabel: 'wMBus-T',
    frequency_center: 868950000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'Wireless M-Bus',
    detail: '868.95 MHz: Wireless M-Bus (EN 13757-4) Mode T1 uplink for electricity/gas/water meters. GFSK 100kbps. 1% duty cycle. Meter-to-concentrator only (unidirectional).',
    color: C.wmbus,
    minZoom: 20,
  },
  {
    id: 'lora-eu868-rx2',
    label: 'LoRa EU868 RX2 / Emergency ch8 (869.525 MHz)',
    shortLabel: 'L-EU868-8',
    frequency_center: 869525000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN EU868',
    detail: '869.525 MHz: LoRaWAN EU868 channel 8 (RX2 downlink window, also emergency uplink). Default RX2 SF12 BW125kHz. Sub-band g3, 10% duty cycle allowed.',
    color: C.lora,
    minZoom: 18,
  },

  // ── L-BAND: US ISM 915 / LoRa US915 ──────────────────────────────────────
  {
    id: 'ism-915-overview',
    label: 'US ISM 915 MHz (902–928 MHz)',
    shortLabel: 'ISM 915',
    frequency_center: 915000000,
    frequency_bandwidth: 26000000,
    category: 'technology',
    family: 'ISM 915 MHz',
    detail: '902-928 MHz: North American ISM band. Hosts LoRaWAN US915, Zigbee 900, Thread, 802.11ah (HaLow), FHSS cordless phones and UHF RFID. FCC Part 15.247 permits up to 1 W conducted output for compliant hopping/digital systems.',
    color: C.ism_915,
    minZoom: 5,
  },
  {
    id: 'lora-us915-ch0',
    label: 'LoRa US915 Uplink Ch0 (902.3 MHz)',
    shortLabel: 'US-UL0',
    frequency_center: 902300000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN US915',
    detail: '902.3 MHz: LoRaWAN US915 uplink channel 0. 64 uplink channels 902.3–914.9 MHz (200 kHz step), BW125kHz SF7–SF10. 8 wide channels at 500kHz BW.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-us915-ch63',
    label: 'LoRa US915 Uplink Ch63 (914.9 MHz)',
    shortLabel: 'US-UL63',
    frequency_center: 914900000,
    frequency_bandwidth: 125000,
    category: 'technology',
    family: 'LoRaWAN US915',
    detail: '914.9 MHz: LoRaWAN US915 last narrow uplink channel (ch63). Followed by 8 wide (500kHz BW) channels at 903.0–914.2 MHz for 8-channel gateway plans.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-us915-dl-start',
    label: 'LoRa US915 Downlink Start (923.3 MHz)',
    shortLabel: 'US-DL',
    frequency_center: 923300000,
    frequency_bandwidth: 500000,
    category: 'technology',
    family: 'LoRaWAN US915',
    detail: '923.3 MHz: first LoRaWAN US915 downlink channel. 8 downlink channels 923.3–927.5 MHz (600 kHz step), BW500kHz SF7–SF12. RX1 delay offset from uplink ch index.',
    color: C.lora,
    minZoom: 20,
  },
  {
    id: 'lora-as923',
    label: 'LoRa AS923 / JP920 (920.6–923.4 MHz)',
    shortLabel: 'AS923',
    frequency_center: 922000000,
    frequency_bandwidth: 3000000,
    category: 'technology',
    family: 'LoRaWAN AS923',
    detail: '920.6–923.4 MHz: LoRaWAN AS923 plan used in Japan (JP920), Thailand, Malaysia, Singapore. 2 mandatory channels 923.2/923.4 MHz + optional channels. 25 mW max EIRP.',
    color: C.lora,
    minZoom: 8,
  },

  // ── Asia IoT / RFID 920.9 MHz ─────────────────────────────────────────────
  {
    id: 'asia-iot-920',
    label: 'Asia IoT / RFID 920.9 MHz',
    shortLabel: '920.9M',
    frequency_center: 920900000,
    frequency_bandwidth: 500000,
    category: 'technology',
    family: 'ISM / SRD',
    detail: '920.9 MHz: center of the Asia-Pacific IoT band (Japan ARIB STD-T108, Korea IoT, AS923-1 LoRaWAN). Used by UHF RFID (ISO 18000-6C) and sub-GHz IoT sensors in JP/KR/TH/MY/SG.',
    color: C.ism_915,
    minZoom: 7,
  },

  // ── GSM 900 ───────────────────────────────────────────────────────────────
  {
    id: 'gsm-900-downlink',
    label: 'GSM-900 Downlink (925–960 MHz)',
    shortLabel: 'GSM-900',
    frequency_center: 942500000,
    frequency_bandwidth: 35000000,
    category: 'technology',
    family: 'GSM Cellular',
    detail: '925–960 MHz: GSM-900 BTS downlink (uplink 880–915 MHz). 200 kHz channels, TDMA 8-slot, GMSK. Extended GSM (EGSM) 880–960 MHz. 2G still widespread in developing markets.',
    color: C.gsm,
    minZoom: 5,
  },

  // ── AVIATION DME/TACAN ────────────────────────────────────────────────────
  {
    id: 'aviation-dme',
    label: 'Aviation DME/TACAN (960–1215 MHz)',
    shortLabel: 'DME',
    frequency_center: 1087500000,
    frequency_bandwidth: 255000000,
    category: 'radio',
    family: 'Aviation Navigation',
    detail: '960–1215 MHz: Distance Measuring Equipment (DME) pulse-pair ranging and TACAN military nav. Aircraft interrogates ground beacon; slant range ±0.1 NM. Paired with VOR/ILS by frequency plan.',
    color: C.aviation,
    minZoom: 4,
  },

  // ── GNSS ──────────────────────────────────────────────────────────────────
  {
    id: 'gps-l5',
    label: 'GPS L5 / Galileo E5a (1176.45 MHz)',
    shortLabel: 'GPS L5',
    frequency_center: 1176450000,
    frequency_bandwidth: 24000000,
    category: 'technology',
    family: 'GNSS',
    detail: '1176.45 MHz: GPS L5 (safety-of-life) and Galileo E5a. BPSK(10) modulation, 24 MHz BW. Higher power, protected allocation, dual-frequency civilian ionospheric correction. Aviation SBAS use.',
    color: C.gps,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'gps-l1', type: 'same-system', note: 'Primary civilian pair for navigation fixes', weight: 1 },
      { targetId: 'gps-l2', type: 'same-system', note: 'Dual-frequency ionosphere correction set', weight: 0.95 },
      { targetId: 'aviation-dme', type: 'shared-allocation', note: 'Aviation-critical navigation neighborhood', weight: 0.7 },
    ],
  },
  {
    id: 'gps-l2',
    label: 'GPS L2 (1227.6 MHz)',
    shortLabel: 'GPS L2',
    frequency_center: 1227600000,
    frequency_bandwidth: 24000000,
    category: 'technology',
    family: 'GNSS',
    detail: '1227.6 MHz: GPS L2. Originally military-only P(Y) code. L2C civilian signal added Block IIR-M. Dual-frequency L1+L2 eliminates ionospheric error to 1–5 cm level.',
    color: C.gps,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'gps-l1', type: 'same-system', note: 'Classic dual-frequency pairing', weight: 1 },
      { targetId: 'gps-l5', type: 'same-system', note: 'Modern civilian multi-frequency stack', weight: 0.9 },
      { targetId: 'hydrogen-line', type: 'adjacent-service', note: 'L-band scientific proximity', weight: 0.5 },
    ],
  },
  {
    id: 'beidou-b1i',
    label: 'BeiDou B1I (1561.098 MHz)',
    shortLabel: 'BDS B1I',
    frequency_center: 1561098000,
    frequency_bandwidth: 4092000,
    category: 'technology',
    family: 'GNSS',
    detail: '1561.098 MHz: BeiDou-2/3 B1I (legacy open service signal). BPSK(2), 4.092 MHz BW. Phased out by B1C at 1575.42 MHz in BDS-3 (L-band aligned with GPS L1).',
    color: C.beidou,
    minZoom: 6,
  },
  {
    id: 'gps-l1',
    label: 'GPS L1 / Galileo E1 / SBAS (1575.42 MHz)',
    shortLabel: 'GPS L1',
    frequency_center: 1575420000,
    frequency_bandwidth: 15345000,
    category: 'technology',
    family: 'GNSS',
    detail: '1575.42 MHz: primary civil GPS L1 C/A (BPSK), Galileo E1 (CBOC), SBAS (WAAS/EGNOS/MSAS). Protected aeronautical radionavigation allocation. Received by all consumer GNSS chips.',
    color: C.gps,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'gps-l2', type: 'same-system', note: 'High-accuracy dual-frequency baseline', weight: 1 },
      { targetId: 'gps-l5', type: 'same-system', note: 'Safety-of-life and robustness pairing', weight: 0.9 },
      { targetId: 'glonass-l1', type: 'same-system', note: 'Multi-constellation receiver context', weight: 0.8 },
    ],
  },
  {
    id: 'glonass-l1',
    label: 'GLONASS L1 (1598–1610 MHz)',
    shortLabel: 'GLONASS',
    frequency_center: 1602000000,
    frequency_bandwidth: 12000000,
    category: 'technology',
    family: 'GNSS',
    detail: '1598.0625–1609.3125 MHz: GLONASS L1 FDMA (each satellite on a different frequency, 562.5 kHz spacing). Open FDMA code 511 chips. CDMA L1OC being added on GLONASS-K2.',
    color: C.glonass,
    minZoom: 5,
  },

  // ── CELLULAR 1800/2100 ────────────────────────────────────────────────────
  {
    id: 'gsm-1800-lte-b3',
    label: 'GSM-1800 / LTE Band 3 (1710–1880 MHz)',
    shortLabel: 'DCS1800',
    frequency_center: 1710000000,
    frequency_bandwidth: 170000000,
    category: 'technology',
    family: 'LTE Cellular',
    detail: '1710–1880 MHz: GSM-1800 (DCS), UMTS Band 1 uplink, LTE Band 3. Most used LTE band globally; 75 MHz FDD per direction. Dominant urban 4G capacity layer in EU and Asia.',
    color: C.lte,
    minZoom: 4,
  },
  {
    id: 'dect-1880',
    label: 'DECT Cordless Phones (1880–1900 MHz)',
    shortLabel: 'DECT',
    frequency_center: 1890000000,
    frequency_bandwidth: 20000000,
    category: 'technology',
    family: 'DECT',
    detail: '1880–1900 MHz (EU): DECT (ETSI EN 300 175). 10 channels × 1.728 MHz, TDMA/TDD. 100–250 mW, 300 m range. Encrypted handset-to-base voice and data. New DECT-2020 NR for IoT.',
    color: C.dect,
    minZoom: 5,
  },
  {
    id: 'umts-2100-uplink',
    label: 'UMTS 2100 MHz Uplink (1920–1980 MHz)',
    shortLabel: 'UMTS UL',
    frequency_center: 1950000000,
    frequency_bandwidth: 60000000,
    category: 'technology',
    family: 'UMTS 3G',
    detail: '1920–1980 MHz: UMTS/WCDMA Band 1 uplink (UE→BTS). 5 MHz channels, CDMA spreading. 3G voice/HSPA data. Still active for voice fallback (CSFB) in LTE/5G networks.',
    color: C.umts,
    minZoom: 5,
  },
  {
    id: 'umts-2100-downlink',
    label: 'UMTS 2100 MHz Downlink (2110–2170 MHz)',
    shortLabel: 'UMTS DL',
    frequency_center: 2140000000,
    frequency_bandwidth: 60000000,
    category: 'technology',
    family: 'UMTS 3G',
    detail: '2110–2170 MHz: UMTS Band 1 downlink (BTS→UE). Paired with 1920–1980 MHz uplink (190 MHz duplex gap). Peak 42 Mbps HSPA+. Densely deployed in EU/Asia urban cores.',
    color: C.umts,
    minZoom: 5,
  },

  // ── S-BAND ────────────────────────────────────────────────────────────────
  {
    id: 'lte-band40-2300',
    label: 'LTE Band 40 (2300–2400 MHz TDD)',
    shortLabel: 'LTE B40',
    frequency_center: 2350000000,
    frequency_bandwidth: 100000000,
    category: 'technology',
    family: 'LTE Cellular',
    detail: '2300–2400 MHz: LTE Band 40 TDD. Widely deployed in India (Jio, Airtel), South Africa, Australia. 100 MHz unpaired; flexible TDD ratio for asymmetric traffic. Good urban capacity.',
    color: C.lte,
    minZoom: 5,
  },

  // ── WiFi 2.4 GHz (existing entries preserved below) ───────────────────────
  {
    id: 'wifi-24-ism',
    label: '2.4 GHz ISM band',
    shortLabel: '2.4 ISM',
    frequency_center: 2441500000,
    frequency_bandwidth: 83500000,
    category: 'technology',
    family: 'WiFi / Bluetooth / ISM',
    detail: '2.400–2.4835 GHz shared ISM range used by WiFi (802.11b/g/n/ax), Bluetooth, Zigbee (802.15.4), and microwave oven leakage (2.45 GHz ISM center).',
    color: C.wifi_24,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-24-mid', type: 'measurement-reference', note: 'Band center reference', weight: 1 },
      { targetId: 'bluetooth-classic-overview', type: 'shared-allocation', note: 'Coexisting 2.4 GHz systems', weight: 0.95 },
      { targetId: 'wifi-24-ch14', type: 'adjacent-service', note: 'Regional edge-case channel', weight: 0.7 },
    ],
  },
  {
    id: 'bluetooth-ble-adv-37',
    label: 'BLE Advertising Channel 37',
    shortLabel: 'BLE 37',
    frequency_center: 2402000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE primary advertising channel 37 at 2.402 GHz. Avoids WiFi ch1 (2.412 GHz). Used for connectable advertising, scanning, and initiating connections.',
    color: C.ble,
    minZoom: 24,
    curatedRelations: [
      { targetId: 'bluetooth-ble-adv-38', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'bluetooth-ble-adv-39', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'wifi-24-ism', type: 'shared-allocation', note: '2.4 GHz coexistence context', weight: 0.8 },
    ],
  },
  {
    id: 'bluetooth-ble-adv-38',
    label: 'BLE Advertising Channel 38',
    shortLabel: 'BLE 38',
    frequency_center: 2426000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE primary advertising channel 38 at 2.426 GHz. Sits in the gap between WiFi ch1 and ch6, minimising co-channel interference.',
    color: C.ble,
    minZoom: 24,
    curatedRelations: [
      { targetId: 'bluetooth-ble-adv-37', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'bluetooth-ble-adv-39', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'wifi-24-mid', type: 'measurement-reference', note: 'Near ISM center reference', weight: 0.8 },
    ],
  },
  {
    id: 'bluetooth-ble-adv-39',
    label: 'BLE Advertising Channel 39',
    shortLabel: 'BLE 39',
    frequency_center: 2480000000,
    frequency_bandwidth: 2000000,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE primary advertising channel 39 at 2.480 GHz. Located above the highest WiFi 2.4 GHz channel (13/14), avoiding WiFi overlap.',
    color: C.ble,
    minZoom: 24,
    curatedRelations: [
      { targetId: 'bluetooth-ble-adv-37', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'bluetooth-ble-adv-38', type: 'same-system', note: 'BLE advertising set', weight: 1 },
      { targetId: 'wifi-24-ch14', type: 'interference-risk', note: 'Close to channel 14 center', weight: 0.85 },
    ],
  },
  {
    id: 'wifi-24-ch14',
    label: 'WiFi 2.4 GHz Channel 14 (Japan)',
    shortLabel: 'Ch 14',
    frequency_center: 2484000000,
    frequency_bandwidth: 22000000,
    category: 'technology',
    family: 'WiFi 2.4 GHz',
    detail: '2484 MHz: WiFi Channel 14 at 2484 MHz, legal only in Japan and only for 802.11b (DSSS). Heavily overlaps BLE advertising channel 39 at 2480 MHz. Prohibited elsewhere.',
    color: C.wifi_24,
    minZoom: 18,
    curatedRelations: [
      { targetId: 'bluetooth-ble-adv-39', type: 'interference-risk', note: 'Near-overlap in upper 2.4 GHz edge', weight: 1 },
      { targetId: 'wifi-24-ism', type: 'same-system', note: 'Part of 2.4 GHz ISM ecosystem', weight: 0.8 },
    ],
  },
  {
    id: 'wifi-24-mid',
    label: 'WiFi 2.4 GHz Mid-Band Reference',
    shortLabel: '2.45 GHz',
    frequency_center: 2450000000,
    frequency_bandwidth: 5000000,
    category: 'technology',
    family: 'WiFi / Bluetooth / ISM',
    detail: '2.45 GHz: ISM center. Microwave ovens leak here (2.45 GHz ± 50 MHz). ISM allocations at 2.400–2.500 GHz in ITU Table of Frequency Allocations.',
    color: C.wifi_24,
    minZoom: 20,
    curatedRelations: [
      { targetId: 'wifi-24-ism', type: 'measurement-reference', note: 'Nominal center of the ISM slice', weight: 1 },
      { targetId: 'bluetooth-classic-overview', type: 'shared-allocation', note: 'Band occupancy anchor', weight: 0.85 },
    ],
  },
  {
    id: 'bluetooth-classic-overview',
    label: 'Bluetooth Classic (2402–2480 MHz)',
    shortLabel: 'BT Classic',
    frequency_center: 2442500000,
    frequency_bandwidth: 81500000,
    category: 'technology',
    family: 'Bluetooth Classic',
    detail: '2402–2480 MHz: Bluetooth Classic 79-channel FHSS (1 MHz channels). BR 1 Mbps GFSK, EDR 2/3 Mbps π/4-DQPSK & 8DPSK. BLE uses same band with 40 wider channels. Bluetooth 5.x.',
    color: C.ble,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-24-ism', type: 'shared-allocation', note: 'Same 2.4 GHz band', weight: 1 },
      { targetId: 'bluetooth-ble-adv-37', type: 'same-system', note: 'BLE coexistence', weight: 0.9 },
      { targetId: 'bluetooth-ble-adv-38', type: 'same-system', note: 'BLE coexistence', weight: 0.9 },
      { targetId: 'bluetooth-ble-adv-39', type: 'same-system', note: 'BLE coexistence', weight: 0.9 },
    ],
  },

  // ── LTE HIGH BANDS ────────────────────────────────────────────────────────
  {
    id: 'lte-band7-2600',
    label: 'LTE Band 7/38/41 (2500–2690 MHz)',
    shortLabel: 'LTE B7',
    frequency_center: 2595000000,
    frequency_bandwidth: 190000000,
    category: 'technology',
    family: 'LTE Cellular',
    detail: '2500–2690 MHz: LTE Band 7 FDD (2500–2570 uplink, 2620–2690 downlink) and Band 38/41 TDD. Peak 150 Mbps with 20 MHz. Urban capacity band; limited range due to propagation.',
    color: C.lte,
    minZoom: 5,
  },

  // ── 5G NR SUB-6 ───────────────────────────────────────────────────────────
  {
    id: 'nr5g-n78-cband',
    label: '5G NR n78 C-Band (3400–3800 MHz)',
    shortLabel: '5G n78',
    frequency_center: 3590000000,
    frequency_bandwidth: 400000000,
    category: 'technology',
    family: '5G NR Sub-6',
    detail: '3400–3800 MHz: 5G NR Band n78, the global 5G "C-band" workhorse. 100 MHz channels, 4×4 MIMO, sub-ms latency. 3.5 GHz mid-band reaches ~1 km per cell. EU, Asia, AU primary 5G.',
    color: C.nr5g,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'satellite-cband-downlink', type: 'shared-allocation', note: 'C-band repack/coordination region', weight: 0.9 },
    ],
  },
  {
    id: 'satellite-cband-downlink',
    label: 'C-Band Satellite Downlink (3700–4200 MHz)',
    shortLabel: 'C-Sat DL',
    frequency_center: 3950000000,
    frequency_bandwidth: 500000000,
    category: 'technology',
    family: 'Satellite',
    detail: '3700–4200 MHz: FSS C-band satellite downlink. 500 MHz of 36 MHz transponders. Intelsat, SES, Eutelsat. Protected in US (TVRO); partially cleared for 5G n77/n78. Low rain fade.',
    color: C.satellite,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'cband-satellite-uplink', type: 'same-system', note: 'Paired FSS uplink/downlink', weight: 1 },
      { targetId: 'nr5g-n78-cband', type: 'shared-allocation', note: 'C-band coexistence policy', weight: 0.9 },
    ],
  },

  // ── WiFi 5 GHz OVERVIEW BANDS ──────────────────────────────────────────────
  {
    id: 'wifi-5-full-overview',
    label: 'WiFi 5 GHz Full Band (5150–5895 MHz)',
    shortLabel: '5 GHz WiFi',
    frequency_center: 5522500000,
    frequency_bandwidth: 745000000,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: '5150–5895 MHz: IEEE 802.11a/n/ac/ax. Four UNII sub-bands (UNII-1 through UNII-3/UNII-3B). DFS/TPC required for UNII-2 to protect weather and terminal Doppler radars.',
    color: C.wifi_5,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'wifi-5-unii1', type: 'same-system', note: 'UNII-1 segment', weight: 1 },
      { targetId: 'wifi-5-unii2a', type: 'same-system', note: 'UNII-2A segment', weight: 1 },
      { targetId: 'wifi-5-unii2c', type: 'same-system', note: 'UNII-2C segment', weight: 1 },
      { targetId: 'wifi-5-unii3', type: 'same-system', note: 'UNII-3 segment', weight: 1 },
      { targetId: 'wifi-6e-overview', type: 'adjacent-service', note: '6 GHz extension path', weight: 0.8 },
    ],
  },
  {
    id: 'wifi-5-unii1',
    label: 'WiFi 5 GHz UNII-1 (5150–5250 MHz)',
    shortLabel: 'UNII-1',
    frequency_center: 5200000000,
    frequency_bandwidth: 100000000,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: '5150–5250 MHz: UNII-1, indoor only in some regions, 200 mW EIRP. Channels 36–48. No DFS required. Used for 802.11a/n/ac/ax; low interference typically.',
    color: C.wifi_5,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-5-full-overview', type: 'same-system', note: 'Parent 5 GHz profile', weight: 1 },
      { targetId: 'wifi-5-unii2a', type: 'adjacent-service', note: 'Next 5 GHz regulatory block', weight: 0.8 },
    ],
  },
  {
    id: 'wifi-5-unii2a',
    label: 'WiFi 5 GHz UNII-2A DFS (5250–5350 MHz)',
    shortLabel: 'UNII-2A',
    frequency_center: 5300000000,
    frequency_bandwidth: 100000000,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: '5250–5350 MHz: UNII-2A, DFS/TPC mandatory (radar detection 1 min, 30 min CAC). Channels 52–64. Less congested than UNII-1 due to DFS requirement.',
    color: C.wifi_5,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-5-full-overview', type: 'same-system', note: 'Parent 5 GHz profile', weight: 1 },
      { targetId: 'wifi-5-unii2c', type: 'adjacent-service', note: 'Extended DFS segment', weight: 0.85 },
      { targetId: 'marine-radar-xband', type: 'interference-risk', note: 'Radar-protection regime context (DFS logic)', weight: 0.5 },
    ],
  },
  {
    id: 'wifi-5-unii2c',
    label: 'WiFi 5 GHz UNII-2C DFS (5470–5725 MHz)',
    shortLabel: 'UNII-2C',
    frequency_center: 5590000000,
    frequency_bandwidth: 255000000,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: '5470–5725 MHz: UNII-2C extended DFS, 1 W EIRP. Channels 100–144. Collocated with weather radar (5600–5650 MHz) and TDWR airports. Long CAC (10 min on some channels).',
    color: C.wifi_5,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-5-full-overview', type: 'same-system', note: 'Parent 5 GHz profile', weight: 1 },
      { targetId: 'wifi-5-unii3', type: 'adjacent-service', note: 'Upper non-DFS segment', weight: 0.8 },
      { targetId: 'wifi-5-unii2a', type: 'adjacent-service', note: 'Lower DFS segment', weight: 0.85 },
    ],
  },
  {
    id: 'wifi-5-unii3',
    label: 'WiFi 5 GHz UNII-3 (5725–5850 MHz)',
    shortLabel: 'UNII-3',
    frequency_center: 5787500000,
    frequency_bandwidth: 125000000,
    category: 'technology',
    family: 'WiFi 5 GHz',
    detail: '5725–5850 MHz: UNII-3, no DFS, 4 W EIRP. Channels 149–165. Outdoor AP backhaul common. Overlaps 5.8 GHz ISM. Also used for 802.11p vehicle comms predecessor.',
    color: C.wifi_5,
    minZoom: 8,
    curatedRelations: [
      { targetId: 'wifi-5-full-overview', type: 'same-system', note: 'Parent 5 GHz profile', weight: 1 },
      { targetId: 'ism-5800', type: 'shared-allocation', note: 'Strong overlap with 5.8 GHz ISM', weight: 0.95 },
      { targetId: 'dsrc-cv2x', type: 'adjacent-service', note: 'Upper edge transportation services', weight: 0.7 },
    ],
  },

  // ── 5.8 GHz ISM ────────────────────────────────────────────────────────────
  {
    id: 'ism-5800',
    label: 'ISM 5.8 GHz Band',
    shortLabel: '5.8G ISM',
    frequency_center: 5800000000,
    frequency_bandwidth: 150000000,
    category: 'technology',
    family: 'ISM 5.8 GHz',
    detail: '5.725–5.875 GHz: ISM band overlapping UNII-3 WiFi (ch149–165), FPV drone video links, some cordless phones, microwave backhaul, and consumer wireless video transmitters.',
    color: C.ism,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'wifi-5-unii3', type: 'shared-allocation', note: 'Unlicensed coexistence hotspot', weight: 1 },
      { targetId: 'dsrc-cv2x', type: 'adjacent-service', note: 'Transport allocation right above', weight: 0.8 },
    ],
  },

  // ── C-V2X / DSRC ──────────────────────────────────────────────────────────
  {
    id: 'dsrc-cv2x',
    label: 'DSRC / C-V2X Vehicle Comms (5850–5925 MHz)',
    shortLabel: 'V2X',
    frequency_center: 5887500000,
    frequency_bandwidth: 75000000,
    category: 'technology',
    family: 'Vehicular Comms',
    detail: '5850–5925 MHz: DSRC (IEEE 802.11p / WAVE) and C-V2X (3GPP PC5 Rel-14) for vehicle-to-vehicle and infrastructure safety. 7 × 10 MHz channels (US). Partially reallocated to WiFi 6E in 2020 FCC ruling.',
    color: C.ism,
    minZoom: 6,
    curatedRelations: [
      { targetId: 'ism-5800', type: 'adjacent-service', note: 'Boundary with ISM/WiFi activity', weight: 0.9 },
      { targetId: 'wifi-6e-overview', type: 'shared-allocation', note: 'Regulatory repack context', weight: 0.85 },
    ],
  },

  // ── WiFi 6E overview ──────────────────────────────────────────────────────
  {
    id: 'wifi-6e-overview',
    label: 'WiFi 6E (5.925–7.125 GHz)',
    shortLabel: 'WiFi 6E',
    frequency_center: 6025000000,
    frequency_bandwidth: 1200000000,
    category: 'technology',
    family: 'WiFi 6E (6 GHz)',
    detail: '5.925–7.125 GHz: IEEE 802.11ax Wi-Fi 6E. Full 1.2 GHz allocation (US/Brazil/South Korea), 500 MHz in EU (5.925–6.425 GHz). 59 non-overlapping 20 MHz channels; 160 MHz channels possible. New devices only (no legacy).',
    color: C.wifi_6e,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'wifi-5-full-overview', type: 'same-system', note: 'WiFi evolution from 5 GHz to 6 GHz', weight: 1 },
      { targetId: 'dsrc-cv2x', type: 'shared-allocation', note: 'Reallocation boundary in some regions', weight: 0.85 },
      { targetId: 'cband-satellite-uplink', type: 'adjacent-service', note: 'Coexistence at lower 6 GHz edge', weight: 0.75 },
    ],
  },
  {
    id: 'cband-satellite-uplink',
    label: 'C-Band Satellite Uplink (5925–6425 MHz)',
    shortLabel: 'C-Sat UL',
    frequency_center: 6175000000,
    frequency_bandwidth: 500000000,
    category: 'technology',
    family: 'Satellite',
    detail: '5925–6425 MHz: FSS C-band earth-station uplink. 500 MHz bandwidth, paired with 3.7–4.2 GHz downlink. VSAT and large dish uplinks for broadcast and enterprise.',
    color: C.satellite,
    minZoom: 5,
    curatedRelations: [
      { targetId: 'satellite-cband-downlink', type: 'same-system', note: 'Paired FSS downlink companion', weight: 1 },
      { targetId: 'wifi-6e-overview', type: 'shared-allocation', note: 'Lower 6 GHz coexistence concerns', weight: 0.8 },
    ],
  },

  // ── X-BAND / Ku-BAND ──────────────────────────────────────────────────────
  {
    id: 'marine-radar-xband',
    label: 'Marine/Airport Radar X-Band (9.3–9.5 GHz)',
    shortLabel: 'X-Radar',
    frequency_center: 9400000000,
    frequency_bandwidth: 200000000,
    category: 'technology',
    family: 'Radar',
    detail: '9300–9500 MHz: X-band marine navigation radar (IMO/ITU-R M.1313), airport surface movement radar, and weather radar. 3 cm wavelength. 25–50 kW peak power typical.',
    color: C.radar,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'police-radar-xband', type: 'same-system', note: 'Same X-band ecosystem, different use-case', weight: 1 },
      { targetId: 'kband-ism-speed-radar', type: 'same-system', note: 'Common speed-radar progression', weight: 0.85 },
    ],
  },
  {
    id: 'police-radar-xband',
    label: 'Police Speed Radar X-Band (10.525 GHz)',
    shortLabel: 'X-Radar-Cop',
    frequency_center: 10525000000,
    frequency_bandwidth: 50000000,
    category: 'technology',
    family: 'Radar',
    detail: '10.525 GHz: classic X-band police Doppler speed radar (FCC Part 90). CW FMCW. Range ~450 m. Being replaced by K-band (24.125 GHz) and Ka-band (34.7 GHz). Detectable by dash-mount detectors.',
    color: C.radar,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'marine-radar-xband', type: 'same-system', note: 'X-band radar neighborhood', weight: 1 },
      { targetId: 'kband-ism-speed-radar', type: 'same-system', note: 'Migration path toward K-band systems', weight: 0.9 },
    ],
  },
  {
    id: 'ku-band-dbs-downlink',
    label: 'Ku-Band DBS Satellite Downlink (11.7–12.7 GHz)',
    shortLabel: 'DBS Ku',
    frequency_center: 12200000000,
    frequency_bandwidth: 1000000000,
    category: 'technology',
    family: 'Satellite',
    detail: '11.7–12.7 GHz: Ku-band direct broadcast satellite (DBS) downlink. DirecTV (US), Sky (EU), Foxtel. 36 MHz transponders, circular polarization, 45–90 cm dish. High rain-fade (>25 mm/hr).',
    color: C.satellite,
    minZoom: 4,
  },
  {
    id: 'ku-band-satellite-uplink',
    label: 'Ku-Band Satellite Uplink (14.0–14.5 GHz)',
    shortLabel: 'Ku-Sat UL',
    frequency_center: 14250000000,
    frequency_bandwidth: 500000000,
    category: 'technology',
    family: 'Satellite',
    detail: '14.0–14.5 GHz: Ku-band FSS uplink (VSAT). 500 MHz paired with 10.95–12.75 GHz downlink. Starlink Ku uplink is 14.0–14.5 GHz; Ka uplink 27.5–30 GHz.',
    color: C.satellite,
    minZoom: 4,
  },

  // ── K-BAND ────────────────────────────────────────────────────────────────
  {
    id: 'kband-ism-speed-radar',
    label: 'K-Band ISM / Speed Radar (24.0–24.25 GHz)',
    shortLabel: 'K-Radar',
    frequency_center: 24125000000,
    frequency_bandwidth: 250000000,
    category: 'technology',
    family: 'Radar',
    detail: '24.0–24.25 MHz ISM: K-band police speed radar (24.125 GHz) and industrial level sensors. 1.25 cm wavelength. Also used for short-range automotive radar (24 GHz FMCW, being phased out for 77 GHz).',
    color: C.radar,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'police-radar-xband', type: 'same-system', note: 'Legacy speed-radar band family', weight: 0.9 },
      { targetId: 'auto-radar-76-77', type: 'same-system', note: 'Automotive radar transition to 77 GHz', weight: 1 },
      { targetId: 'auto-radar-77-81', type: 'same-system', note: 'Modern SRR/LRR allocation', weight: 0.95 },
    ],
  },

  // ── 5G FR2 mmWAVE ─────────────────────────────────────────────────────────
  {
    id: 'nr5g-fr2-26ghz',
    label: '5G NR FR2 mmWave (26–28 GHz)',
    shortLabel: '5G FR2-26',
    frequency_center: 27000000000,
    frequency_bandwidth: 2000000000,
    category: 'technology',
    family: '5G NR mmWave',
    detail: '26–28 GHz: 5G NR FR2 mmWave (n258 at 26.5 GHz, n257 at 27.5 GHz). EU pioneer spectrum 24.25–27.5 GHz. 100–400 MHz channel BW, massive MIMO beam steering, <100 m cell range.',
    color: C.mmwave,
    minZoom: 4,
  },
  {
    id: 'nr5g-mmwave-28',
    label: '5G mmWave n257/n261 (27.5–28.35 GHz)',
    shortLabel: '5G-28GHz',
    frequency_center: 28000000000,
    frequency_bandwidth: 850000000,
    category: 'technology',
    family: '5G NR mmWave',
    detail: '27.5–28.35 GHz: 5G NR n257 (US AT&T, T-Mobile, Verizon mmWave). Licensed for dense-urban hotspots. 850 MHz available; 100 MHz min channel. Multi-Gbps peak in ideal conditions.',
    color: C.mmwave,
    minZoom: 4,
  },
  {
    id: 'nr5g-mmwave-39',
    label: '5G mmWave n260 (37–40 GHz)',
    shortLabel: '5G-39GHz',
    frequency_center: 39000000000,
    frequency_bandwidth: 3000000000,
    category: 'technology',
    family: '5G NR mmWave',
    detail: '37–40 GHz: 5G NR n260/n261. 3 GHz available. FCC auctioned in US (2019). Used alongside n257 in dense mmWave deployments. Very high attenuation; requires line-of-sight or near-LOS.',
    color: C.mmwave,
    minZoom: 4,
  },
  {
    id: 'wigig-60ghz',
    label: 'WiGig 802.11ad/ay (57–64 GHz)',
    shortLabel: 'WiGig',
    frequency_center: 60500000000,
    frequency_bandwidth: 7000000000,
    category: 'technology',
    family: 'WiGig mmWave',
    detail: '57–64 GHz: 802.11ad (WiGig, 6.76 Gbps) and 802.11ay (multi-Gbps with MU-MIMO, 100 m outdoor). Unlicensed globally. Strong O2 absorption (15 dB/km) limits range to ~10 m indoors.',
    color: C.mmwave,
    minZoom: 4,
  },
  {
    id: 'auto-radar-76-77',
    label: 'Automotive Long-Range Radar (76–77 GHz)',
    shortLabel: 'LRR 77GHz',
    frequency_center: 77000000000,
    frequency_bandwidth: 1000000000,
    category: 'technology',
    family: 'Automotive Radar',
    detail: '76–77 GHz: ACC (Adaptive Cruise Control) long-range automotive FMCW radar. 1 GHz BW → 15 cm range resolution; 200 m range. ETSI EN 301 091-1. All modern cars ≥2020.',
    color: C.auto_radar,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'auto-radar-77-81', type: 'same-system', note: 'Companion short-range allocation', weight: 1 },
      { targetId: 'kband-ism-speed-radar', type: 'same-system', note: 'Historical migration from 24 GHz', weight: 0.85 },
    ],
  },
  {
    id: 'auto-radar-77-81',
    label: 'Automotive Short-Range Radar (77–81 GHz)',
    shortLabel: 'SRR 79GHz',
    frequency_center: 79000000000,
    frequency_bandwidth: 4000000000,
    category: 'technology',
    family: 'Automotive Radar',
    detail: '77–81 GHz: short/mid-range automotive radar (blind-spot, cross-traffic, parking assist). 4 GHz BW → 3.75 cm range resolution. ETSI EN 302 858. Increasingly AiP (antenna-in-package) chipsets.',
    color: C.auto_radar,
    minZoom: 4,
    curatedRelations: [
      { targetId: 'auto-radar-76-77', type: 'same-system', note: 'Companion long-range allocation', weight: 1 },
      { targetId: 'kband-ism-speed-radar', type: 'same-system', note: 'Historical migration from 24 GHz', weight: 0.85 },
    ],
  },
  {
    id: 'wband-security',
    label: 'W-Band Security Scanner (94 GHz)',
    shortLabel: 'W-Band',
    frequency_center: 94000000000,
    frequency_bandwidth: 2000000000,
    category: 'technology',
    family: 'Millimeter Wave',
    detail: '94 GHz: W-band passive MMW imaging for airport security scanners. Penetrates clothing, reflects from skin and metal. Also used for atmospheric sensing, high-resolution cloud radar, and future 6G research bands.',
    color: C.mmwave,
    minZoom: 4,
  },

  // ── Spread channel arrays ──────────────────────────────────────────────────
  ...wifi24Channels,
  ...zigbeeChannels,
  ...wifi5Channels,
  ...wifi6eChannels,
  ...universalVibrationFeatures,
]

const MODULATION_BY_ID: Record<string, string[]> = {
  'am-mw-overview': ['AM', 'DSB-AM'],
  'fm-broadcast-overview': ['FM', 'WBFM'],
  'nfc-hf-rfid-13mhz': ['ASK', 'PSK', 'Load Modulation'],
  'wwvb-msf-60': ['AM', 'BPSK'],
  'dcf77-77k': ['ASK', 'BPSK'],
  'navtex-518': ['SITOR-B', 'FSK'],
  'maritime-mf-distress-2182': ['USB', 'J3E SSB'],
  'kband-ism-speed-radar': ['FMCW', 'CW Doppler'],
  'auto-radar-76-77': ['FMCW'],
  'auto-radar-77-81': ['FMCW'],
  'wigig-60ghz': ['OFDM', 'SC-FDE'],
}

const MODULATION_BY_FAMILY: Record<string, string[]> = {
  'WiFi 2.4 GHz': ['OFDM', 'DSSS', 'CCK'],
  'WiFi 5 GHz': ['OFDM'],
  'WiFi 6E (6 GHz)': ['OFDMA', 'OFDM'],
  'Zigbee 2.4 GHz': ['O-QPSK DSSS'],
  'Bluetooth Classic': ['GFSK', 'pi/4-DQPSK', '8DPSK'],
  'Bluetooth LE': ['GFSK'],
  LoRaWAN: ['CSS'],
  'LoRaWAN EU868': ['CSS'],
  'LoRaWAN US915': ['CSS'],
  'LoRaWAN AS923': ['CSS'],
  'GNSS': ['BPSK', 'BOC', 'QPSK'],
  'GSM Cellular': ['GMSK', '8-PSK'],
  'UMTS 3G': ['WCDMA QPSK'],
  'LTE Cellular': ['OFDMA', 'SC-FDMA'],
  '5G NR Sub-6': ['CP-OFDM', 'DFT-s-OFDM'],
  '5G NR mmWave': ['CP-OFDM', 'DFT-s-OFDM'],
  'VLF Submarine Comms': ['MSK', 'FSK'],
  'LF RFID': ['ASK', 'FSK', 'PSK'],
  'UHF RFID': ['ASK', 'PR-ASK', 'DSB-ASK', 'PSK'],
  'HF RFID / NFC': ['ASK', 'PSK', 'Load Modulation'],
  'HF Time Standards': ['AM', 'BPSK'],
  'DAB Digital Radio': ['COFDM'],
  'Television Broadcast': ['OFDM', '8VSB'],
  'TETRA PMR': ['pi/4-DQPSK'],
  'DECT': ['GFSK'],
  'Wireless M-Bus': ['2-FSK', '4-FSK'],
  'Maritime VHF': ['FM', 'GMSK AIS'],
  'Aviation ATC': ['AM'],
  'Aviation Navigation': ['AM', 'Pulse'],
  'Radar': ['Pulse', 'FMCW', 'CW Doppler'],
  Satellite: ['QPSK', '8PSK', '16APSK'],
  'WiGig mmWave': ['OFDM', 'SC-FDE'],
  'Vehicular Comms': ['OFDM', 'SC-FDMA'],
}

function withModulationMetadata(feature: FrequencyFeature): FrequencyFeature {
  const modulationTypes = MODULATION_BY_ID[feature.id] ?? MODULATION_BY_FAMILY[feature.family]
  if (!modulationTypes || modulationTypes.length === 0) return feature

  const hasModulationInDetail = /\bmodulation\b/i.test(feature.detail)
  const detail = hasModulationInDetail
    ? feature.detail
    : `${feature.detail} Common modulation: ${modulationTypes.join(', ')}.`

  const aliases = Array.from(new Set([
    ...(feature.aliases ?? []),
    ...modulationTypes.map(item => item.toLowerCase()),
  ]))

  return {
    ...feature,
    detail,
    aliases,
    modulationTypes,
  }
}

function regulatoryKey(note: FrequencyRegulatoryNote): string {
  return `${note.region}|${note.range ?? ''}|${note.limit}|${note.source?.label ?? ''}`
}

function mergeRegulatoryNotes(
  existing: FrequencyRegulatoryNote[] | undefined,
  additions: FrequencyRegulatoryNote[]
): FrequencyRegulatoryNote[] {
  const merged = [...(existing ?? [])]
  const seen = new Set(merged.map(regulatoryKey))

  for (const note of additions) {
    const key = regulatoryKey(note)
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(note)
  }

  return merged
}

function regulatoryNotesForFeature(feature: FrequencyFeature): FrequencyRegulatoryNote[] {
  const notes: FrequencyRegulatoryNote[] = []

  if (
    feature.family === 'WiFi 2.4 GHz' ||
    feature.family === 'Zigbee 2.4 GHz' ||
    feature.family === 'Bluetooth Classic' ||
    feature.family === 'Bluetooth LE' ||
    feature.family === 'WiFi / Bluetooth / ISM'
  ) {
    notes.push(R.euWifi24, R.usPart15247)
  }

  if (feature.id === 'wifi-24-ch14') {
    notes.push({
      region: 'Japan WLAN edge case',
      range: '2484 MHz channel 14',
      limit: 'Allowed only for 802.11b DSSS/CCK in Japan.',
      conditions: 'Not valid for normal OFDM WiFi operation in most countries.',
      source: REG_SRC.wlanChannels,
    })
  }

  if (feature.family === 'WiFi 5 GHz') {
    notes.push(R.usWifi5)
  }
  if (feature.id === 'wifi-5-full-overview') notes.push(R.euWifi5Lower, R.euWifi5Upper)
  if (feature.id === 'wifi-5-unii1' || feature.id === 'wifi-5-unii2a') notes.push(R.euWifi5Lower)
  if (feature.id === 'wifi-5-unii2c') notes.push(R.euWifi5Upper)
  if (feature.id === 'wifi-5-unii3' || feature.id === 'ism-5800') notes.push(R.usPart15247)

  if (feature.family === 'WiFi 6E (6 GHz)' || feature.id === 'wifi-6e-overview') {
    notes.push(R.usWifi6e)
    if (feature.frequency_center <= 6425e6 || feature.id === 'wifi-6e-overview') notes.push(R.euWifi6e)
  }

  if (feature.id.startsWith('ism-433')) notes.push(R.euSrd433)
  if (feature.id === 'eu-srd868-overview' || feature.id.startsWith('lora-eu868') || feature.id === 'wmbus-mode-t1') {
    notes.push(R.euSrd868)
  }
  if (feature.id === 'uhf-rfid-865') notes.push(R.euRfid865)
  if (
    feature.id === 'ism-915-overview' ||
    feature.id === 'uhf-rfid-902' ||
    feature.id === 'uhf-rfid-928' ||
    feature.family === 'LoRaWAN US915'
  ) {
    notes.push(R.usPart15247)
  }

  if (feature.id === 'pmr446') notes.push(R.euPmr446)
  if (feature.id === 'frs-gmrs') notes.push(R.usFrs, R.usGmrs)
  if (feature.id === 'cb-band-overview' || feature.id === 'cb-ch19') notes.push(R.usCbChannels, R.usCbPlan)

  return notes
}

function withRegulatoryMetadata(feature: FrequencyFeature): FrequencyFeature {
  const regulatory = mergeRegulatoryNotes(feature.regulatory, regulatoryNotesForFeature(feature))
  if (regulatory.length === 0) return feature

  return {
    ...feature,
    regulatory,
  }
}

function withFrequencySearchAliases(feature: FrequencyFeature): FrequencyFeature {
  if (feature.atlasCategory) return feature

  const centerMHz = feature.frequency_center / 1e6
  const centerGHz = feature.frequency_center / 1e9
  const aliases = new Set(feature.aliases ?? [])

  if (centerMHz >= 0.001 && centerMHz < 1_000_000) {
    aliases.add(`${Number(centerMHz.toFixed(6))}`)
    aliases.add(`${Number(centerMHz.toFixed(6))} mhz`)
  }
  if (centerGHz >= 0.001 && centerGHz < 1000) {
    aliases.add(`${Number(centerGHz.toFixed(6))} ghz`)
  }

  return {
    ...feature,
    aliases: Array.from(aliases),
  }
}

export const frequencyFeatures: FrequencyFeature[] = baseFrequencyFeatures
  .map(withModulationMetadata)
  .map(withRegulatoryMetadata)
  .map(withFrequencySearchAliases)
