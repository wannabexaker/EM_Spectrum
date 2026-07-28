import type { FrequencyFeature } from '@/types/spectrum'
import { sourcesForStandard } from './standardSources'

/**
 * Curated technology write-ups, folded into the feature set.
 *
 * These 33 descriptions lived in an orphaned `data/technologies.json` that nothing
 * imported, so several hundred words of explanatory prose — and the governing standard
 * for each technology — never reached the UI. Rather than index that file separately
 * (which would have produced near-duplicate search hits next to the existing entries),
 * the content is merged here: 17 descriptions enrich features that already existed, and
 * the 16 technologies with no counterpart become features of their own.
 *
 * Everything below is `category: 'technology'`, so `getFeatureLane` places each one by
 * frequency into the lane whose band contains it.
 */

/** Enrichment for features that already covered the technology. `detail` is only
 *  overridden where the curated write-up is materially richer than what was there —
 *  for WiFi 2.4/5 GHz the existing text is longer, so only the standard is added. */
export const TECHNOLOGY_PROFILES: Record<string, { standard: string; detail?: string }> = {
  'gps-l1': {
    standard: 'IS-GPS-200',
    // Merged: the curated write-up covers GPS alone, but this entry is the shared 1575.42
    // MHz centre, so the Galileo and SBAS signals it also carries are kept from the
    // original text rather than dropped.
    detail: 'GPS L1 C/A signal at 1575.42 MHz uses CDMA spread-spectrum with a 1.023 Mcps PRN code. The -130 dBm received signal power (20 dB below noise floor) requires 2–16 ms coherent integration. Modernized L1C adds a pilot channel for improved acquisition. The same centre frequency carries Galileo E1 (CBOC) and SBAS (WAAS/EGNOS/MSAS), under a protected aeronautical radionavigation allocation.',
  },
  'gps-l2': {
    standard: 'IS-GPS-200',
    detail: 'GPS L2 enables dual-frequency ionospheric correction, dramatically improving positioning accuracy from ~3 m to ~0.3 m. L2C (civilian) was added on Block IIR-M satellites. Used for surveying, geodesy, and precision agriculture.',
  },
  'fm-broadcast-overview': {
    standard: 'ITU-R BS.450',
    detail: 'FM radio uses frequency modulation with 200 kHz channel spacing (US) or 100 kHz (Europe). Stereophonic audio uses a 38 kHz pilot-tone subcarrier system (Zenith-GE). RDS (Radio Data System) transmits station metadata on a 57 kHz subcarrier.',
  },
  'am-mw-overview': {
    standard: 'ITU-R BS.561',
    detail: 'AM (amplitude modulation) broadcast uses 10 kHz channel spacing in North America. Ground-wave range ~200 km by day; skywave can provide 1000+ km coverage at night. HD Radio (IBOC) adds digital audio on same AM channel.',
  },
  'noaa-weather-radio': {
    standard: 'NOAA NWR All Hazards',
    detail: 'NOAA Weather Radio broadcasts continuous weather forecasts and emergency alerts on 7 frequencies between 162.400 and 162.550 MHz. Uses SAME (Specific Area Message Encoding) for targeted county-level alerts. Covers >95% of US population.',
  },
  'aviation-vor-ils': {
    standard: 'ICAO Annex 10',
    // Merged: ILS is a separate system sharing the band, and the entry is named for both.
    detail: 'VOR (VHF Omnidirectional Range) provides bearing information to aircraft using two 30 Hz AM signals: one omnidirectional, one rotating. Phase difference gives magnetic bearing with ±1.4° accuracy. About 3000 VOR stations remain worldwide, being phased out by GPS. The same 108–118 MHz band carries the ILS localizer on odd-tenth channels, with VOR on the even tenths, paired with the ILS glideslope at 329–335 MHz.',
  },
  'marine-radar-xband': {
    standard: 'IMO Resolution MSC.192(79)',
    // Merged: the entry is named for airport radar too, which the marine-only write-up drops.
    detail: 'X-band marine radar (9.3–9.5 GHz) provides fine resolution for navigation, collision avoidance, and harbor approach. 3 cm wavelength allows compact antennas. Typically uses pulse or FMCW waveform; range 24–72 nmi. Higher rain attenuation than S-band but better target resolution. The same band carries airport surface-movement radar and weather radar, at 25–50 kW peak power.',
  },
  'cb-band-overview': {
    standard: 'FCC Part 95 Subpart D',
    detail: 'Citizens Band radio operates 40 channels from 26.965–27.405 MHz. Maximum 4W AM or 12W SSB power (FCC). Channel 9 is reserved for emergencies. Truckers worldwide use channel 19 on US highways. No license required in most countries.',
  },
  'auto-radar-76-77': {
    standard: 'ETSI EN 302 264',
    detail: 'Automotive short-range (SRR) and long-range (LRR) radar sensors at 76–81 GHz use FMCW waveforms with 4 GHz bandwidth (3.75 cm range resolution). Enable adaptive cruise control, automatic emergency braking (AEB), blind-spot detection, and autonomous parking. Doppler radar measures relative velocity.',
  },
  'dab-band3': {
    standard: 'ETSI EN 300 401',
    // 174–230, not the 174–240 the write-up carried: that is the entry's own range, the
    // ITU Band III definition, and what the original text said.
    detail: 'DAB+ (Digital Audio Broadcasting) uses OFDM multiplexing in Band III (174–230 MHz) and L-Band (1452–1492 MHz). Each multiplex carries 6–18 stations with better audio quality than AM and near-FM quality at lower bit rates. Mandatory in new cars in Norway, Germany, and UK.',
  },
  'nr5g-mmwave-39': {
    standard: '3GPP Release 15',
    detail: '5G mmWave (n257/n258/n260: 26.5–43.5 GHz) delivers peak throughputs >10 Gbps with 400 MHz channels. Limited to ~100 m line-of-sight due to severe rain and building attenuation. Best suited for stadium, venue, and indoor hotspot deployments.',
  },
  'nr5g-n78-cband': {
    standard: '3GPP Release 15',
    detail: '5G NR n78 band (3.3–3.8 GHz) is the primary 5G mid-band worldwide. Offers up to 100 MHz channel bandwidth, Massive MIMO (64T64R), and sub-1 ms latency. Balance of coverage and capacity; key for mid-tier 5G deployment.',
  },
  // Standard only: this pin marks the lower edge of the US 902–928 MHz band, so its
  // original text — which names everything sharing that edge — describes the marker
  // better than a write-up about the 860–960 MHz RFID system as a whole.
  'uhf-rfid-902': { standard: 'EPCglobal Gen2 / ISO 18000-6C' },
  'bluetooth-classic-overview': {
    standard: 'Bluetooth 5.0 (BR/EDR/BLE)',
    detail: 'Bluetooth uses 79 channels at 1 MHz spacing (or 40 channels for BLE) in the 2.4 GHz ISM band, with adaptive frequency hopping (FHSS) to avoid WiFi interference. BT 5.0 achieves 2 Mbps data rate and 200m range in open space.',
  },
  'wifi-6e-overview': {
    standard: 'IEEE 802.11ax (Wi-Fi 6E)',
    detail: 'The 6 GHz band (5.925–7.125 GHz) opened in 2020 provides 1200 MHz of clean spectrum with no legacy interference. Supports 160 MHz channels and 4K QAM for multi-gigabit throughput.',
  },
  // Existing detail is already longer and more specific than the curated write-up here,
  // so only the standard is contributed.
  'wifi-24-ch-6': { standard: 'IEEE 802.11n' },
  'wifi-5-ch-100': { standard: 'IEEE 802.11ac (Wi-Fi 5)' },
}

const TECH_COLORS = {
  radio: '#70e1ff',
  microwave: '#00ff88',
  infrared: '#ff8c42',
  visible: '#ff4d6d',
  ultraviolet: '#c77dff',
  xray: '#4cc9f0',
  gamma: '#ff006e',
} as const

/** Technologies the feature set did not cover at all. The optical and ionizing entries
 *  matter most: professional mode drew no technology markers above the microwave lanes,
 *  so the infrared, visible, UV, X-ray and gamma tracks had nothing on them. */
const RAW_TECHNOLOGY_FEATURES: FrequencyFeature[] = [
  {
    id: 'tech-loran-c',
    label: 'LORAN-C (100 kHz)',
    shortLabel: 'LORAN-C',
    frequency_center: 100e3,
    frequency_bandwidth: 20e3,
    category: 'technology',
    family: 'Navigation',
    detail: 'LORAN-C (Long Range Navigation) used pulsed transmissions at 100 kHz for marine and aviation navigation, providing 200–500 m accuracy over ranges up to 1800 km. The US decommissioned LORAN-C in 2010; eLoran is being considered as GPS backup.',
    color: TECH_COLORS.radio,
    minZoom: 10,
    standard: 'US Coast Guard LORAN-C',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-mri-rf',
    label: 'MRI RF (64–300 MHz)',
    shortLabel: 'MRI RF',
    frequency_center: 128e6,
    frequency_bandwidth: 236e6,
    category: 'technology',
    family: 'Medical Imaging',
    detail: 'MRI uses RF pulses at the Larmor frequency to tip proton spins. 1.5 T MRI: 63.87 MHz; 3 T: 127.74 MHz; 7 T: 297.2 MHz. SAR limits (4 W/kg whole body) prevent tissue heating. RF coils are tuned resonant structures. Strong static magnetic field (1.5–7 T) not shown here.',
    color: TECH_COLORS.radio,
    minZoom: 8,
    standard: 'IEC 60601-2-33',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-maritime-ais',
    label: 'Maritime AIS (161.975 / 162.025 MHz)',
    shortLabel: 'AIS',
    frequency_center: 162e6,
    frequency_bandwidth: 50e3,
    category: 'technology',
    family: 'Maritime',
    detail: 'AIS (Automatic Identification System) uses TDMA self-organizing access on 2 VHF channels (161.975 and 162.025 MHz). Broadcasts vessel identity, position, speed, and course every 2–10 seconds. Mandatory on vessels >300 GT. Satellite AIS extends detection to global coverage.',
    color: TECH_COLORS.radio,
    minZoom: 12,
    standard: 'ITU-R M.1371-5',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-dvbt',
    label: 'DVB-T Digital TV (470–690 MHz)',
    shortLabel: 'DVB-T',
    frequency_center: 580e6,
    frequency_bandwidth: 220e6,
    category: 'technology',
    family: 'Broadcast',
    detail: 'DVB-T (Digital Video Broadcasting — Terrestrial) uses OFDM with 2K/4K/8K FFT modes and MPEG-2/H.264 video coding. 8 MHz channel bandwidth. DVB-T2 adds LDPC coding for 40% capacity increase. Carries multiple HD channels per RF channel.',
    color: TECH_COLORS.radio,
    minZoom: 8,
    standard: 'ETSI EN 300 744',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-lte-band1',
    label: 'LTE Band 1 (2100 MHz)',
    shortLabel: 'LTE B1',
    frequency_center: 2.1e9,
    frequency_bandwidth: 60e6,
    category: 'technology',
    family: 'Cellular',
    detail: 'LTE Band 1 (FDD) uses 1920–1980 MHz uplink and 2110–2170 MHz downlink, offering 60 MHz paired spectrum. Provides up to 150 Mbps downlink with 4×4 MIMO and 64-QAM. Widely deployed in Europe, Asia, and North America.',
    color: TECH_COLORS.radio,
    minZoom: 10,
    standard: '3GPP TS 36.101',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-microwave-oven',
    label: 'Microwave Oven (2.45 GHz ISM)',
    shortLabel: 'MW oven',
    frequency_center: 2.45e9,
    frequency_bandwidth: 85e6,
    category: 'technology',
    family: 'Domestic ISM',
    detail: 'Microwave ovens use 700–1200 W at 2.45 GHz, exciting water molecule rotational modes to heat food. The magnetron generates CW microwave power. The 2.45 GHz ISM band is shared with WiFi (ch 6) and Bluetooth, causing interference within ~10m range.',
    color: TECH_COLORS.radio,
    minZoom: 9,
    standard: 'IEC 60335-2-25',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-radar-sband',
    label: 'Weather Radar S-band (2.7–3 GHz)',
    shortLabel: 'WX radar S',
    frequency_center: 2.85e9,
    frequency_bandwidth: 300e6,
    category: 'technology',
    family: 'Radar',
    detail: 'S-band Doppler weather radar (NEXRAD WSR-88D, 2.7–2.9 GHz) measures precipitation rate and wind velocity. Range ~460 km (surveillance), 230 km (precipitation). Less attenuation in heavy rain than C-band; preferred for severe-storm monitoring.',
    color: TECH_COLORS.radio,
    minZoom: 9,
    standard: 'WMO No. 8 Guide',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-starlink-ku',
    label: 'Starlink Ku-Band (10.7–12.7 GHz)',
    shortLabel: 'Starlink Ku',
    frequency_center: 11.7e9,
    frequency_bandwidth: 2e9,
    category: 'technology',
    family: 'Satellite',
    detail: 'Starlink user terminals communicate with LEO satellites at ~550 km altitude via Ku-band downlink (10.7–12.7 GHz) and Ka-band uplink (14.0–14.5 GHz). Phased-array flat-panel antennas electronically steer beams. Round-trip latency ~20 ms, speeds 100–400 Mbps.',
    color: TECH_COLORS.microwave,
    minZoom: 8,
    standard: 'FCC Part 25 / ITU-R S.465',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-fiber-optic',
    label: 'Fiber Optic Telecom (1550 nm)',
    shortLabel: 'Fiber 1550',
    frequency_center: 193.4e12,
    frequency_bandwidth: 4.4e12,
    category: 'technology',
    family: 'Optical Communications',
    detail: 'The 1550 nm C-band (1530–1565 nm) is the primary telecom band, with EDFA (Erbium-doped fiber amplifier) gain at 30 nm bandwidth. DWDM (Dense Wavelength Division Multiplexing) packs 80+ channels at 50 GHz spacing. Single-mode fiber loss: 0.18 dB/km at 1550 nm. Transoceanic cables carry 400G per wavelength.',
    color: TECH_COLORS.infrared,
    minZoom: 8,
    standard: 'ITU-T G.652, G.654',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-ir-remote',
    label: 'Infrared Remote Control (940 nm)',
    shortLabel: 'IR remote',
    frequency_center: 319e12,
    frequency_bandwidth: 10e12,
    category: 'technology',
    family: 'Consumer IR',
    detail: 'IR remote controls use pulse-width modulation at 940 nm from an IR LED. Carrier frequencies of 36–40 kHz amplitude-modulate the data. Communication protocols: NEC, RC-5, RC-6, Sony SIRC. Range ~5–10 m, limited by ambient IR interference.',
    color: TECH_COLORS.infrared,
    minZoom: 8,
    standard: 'IEC 62581',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-night-vision',
    label: 'Night Vision (NIR 700–900 nm)',
    shortLabel: 'Night vision',
    frequency_center: 375e12,
    frequency_bandwidth: 60e12,
    category: 'technology',
    family: 'Imaging',
    detail: 'Image intensifier tubes (Gen II/III) amplify ambient NIR (700–900 nm) via photocathode, MCP, and phosphor screen. Gen III (GaAs photocathode, 800–900 nm) achieves 1800+ μA/lm. Active NIR illuminators extend range in total darkness. Cooled cameras use InGaAs (1–1.7 μm) SWIR.',
    color: TECH_COLORS.infrared,
    minZoom: 7,
    standard: 'MIL-PRF-21979 (US military)',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-laser-pointer',
    label: 'Red Laser Pointer (650 nm)',
    shortLabel: 'Laser 650',
    frequency_center: 461e12,
    frequency_bandwidth: 100e9,
    category: 'technology',
    family: 'Lasers',
    detail: 'Common red laser pointers (635–670 nm, typically 650 nm) use InGaAlP laser diodes. Class 2 (<1 mW) is eye-safe (blink reflex); Class 3R (1–5 mW) marginally hazardous; Class 3B (5–500 mW) can cause immediate eye injury. Aiming at aircraft is a federal crime in most countries.',
    color: TECH_COLORS.visible,
    minZoom: 9,
    standard: 'IEC 60825-1',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-uv-sterilizer',
    label: 'UV Sterilizer (254 nm germicidal)',
    shortLabel: 'UV-C 254',
    frequency_center: 1180e12,
    frequency_bandwidth: 10e12,
    category: 'technology',
    family: 'Sterilization',
    detail: 'Low-pressure mercury UV-C lamps emit 254 nm (close to the 265 nm DNA absorption peak). Log-reduction of pathogens depends on UV dose (mJ/cm²): 10 mJ/cm² for bacteria, 30–40 mJ/cm² for viruses. Far-UVC 222 nm (KrCl excimer) shown to be safer for occupied spaces.',
    color: TECH_COLORS.ultraviolet,
    minZoom: 8,
    standard: 'ASHRAE Guideline 33-2019',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-dental-xray',
    label: 'Dental X-ray (60–90 kVp)',
    shortLabel: 'Dental X-ray',
    frequency_center: 1.8e19,
    frequency_bandwidth: 1.4e19,
    category: 'technology',
    family: 'Medical Imaging',
    detail: 'Dental bitewing radiographs use 60–90 kVp X-ray tubes with 7–10 mA current. Effective dose per periapical film: ~1–8 μSv; panoramic OPG: ~14–25 μSv. Digital sensors (CCD/CMOS) or phosphor plates replaced film, reducing dose by 50–80%.',
    color: TECH_COLORS.xray,
    minZoom: 6,
    standard: 'ADA Council on Scientific Affairs',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-xray-ct',
    label: 'CT Scanner X-ray (80–140 kVp)',
    shortLabel: 'CT scan',
    frequency_center: 3e19,
    frequency_bandwidth: 1.5e19,
    category: 'technology',
    family: 'Medical Imaging',
    detail: 'CT (computed tomography) uses a rotating X-ray tube and detector array. Typical tube voltage 80–140 kVp (peak kilovoltage) with ~200 mA current. Effective dose 2–20 mSv per scan depending on body region. Iterative reconstruction algorithms reduce dose by 50–80%.',
    color: TECH_COLORS.xray,
    minZoom: 6,
    standard: 'IEC 60601-1',
    confidence: 'Scientifically Verified',
  },
  {
    id: 'tech-pet-scan',
    label: 'PET Scanner (511 keV gamma)',
    shortLabel: 'PET 511keV',
    frequency_center: 1.234e20,
    frequency_bandwidth: 2e18,
    category: 'technology',
    family: 'Medical Imaging',
    detail: 'PET (Positron Emission Tomography) detects back-to-back 511 keV annihilation gamma-ray pairs from positron-emitting tracers (18F-FDG, 68Ga, 15O). Coincidence detection achieves 4–6 mm spatial resolution. Combined PET/CT and PET/MRI provide anatomical and metabolic imaging.',
    color: TECH_COLORS.gamma,
    minZoom: 7,
    standard: 'NEMA NU 2',
    confidence: 'Scientifically Verified',
  },
]

/**
 * Professional-only, deliberately. Educational mode draws its curated story pins *and*
 * feature pins, so leaving these visible in both modes put a second pin on top of the
 * stories that already cover the same thing — PET, fiber optic, the microwave oven, UV
 * sterilisation, Ku satellite TV and UHF TV all have one. These are allocations with a
 * governing standard, which is what professional mode is for.
 */
export const TECHNOLOGY_FEATURES: FrequencyFeature[] = RAW_TECHNOLOGY_FEATURES.map(feature => ({
  ...feature,
  modeVisibility: 'professional',
}))

/** Technologies that occupy a band without being allocated one — a laser class or an
 *  imaging dose limit is set by a safety standard, not by the Radio Regulations. */
const NOT_SPECTRUM_ALLOCATIONS = new Set([
  'tech-laser-pointer',
  'tech-uv-sterilizer',
  'tech-dental-xray',
  'tech-xray-ct',
  'tech-pet-scan',
  'tech-night-vision',
  'tech-ir-remote',
  'tech-fiber-optic',
  'tech-microwave-oven',
  'tech-mri-rf',
])

/** Applies the curated write-up to a feature, if one exists for it, and gives every
 *  standard-bearing feature a citation resolved from that standard. */
export function withTechnologyProfile(feature: FrequencyFeature): FrequencyFeature {
  const profile = TECHNOLOGY_PROFILES[feature.id]
  const standard = profile?.standard ?? feature.standard
  if (!standard) return feature
  return {
    ...feature,
    standard,
    detail: profile?.detail ?? feature.detail,
    sources: feature.sources ?? sourcesForStandard(standard, !NOT_SPECTRUM_ALLOCATIONS.has(feature.id)),
  }
}
