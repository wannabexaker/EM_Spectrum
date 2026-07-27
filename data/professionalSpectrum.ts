import type { ScientificConfidence, SpectrumCategory } from '@/types/spectrum'

/** Verifiable reference for a professional allocation (ITU-R, FCC, ETSI, 3GPP…). */
export interface ProfessionalSource {
  label: string
  url?: string
  note?: string
}

export interface ProfessionalBand {
  id: string
  label: string
  rangeLabel: string
  frequencyMin: number
  frequencyMax: number
  category: SpectrumCategory
  color: string
  uses: string
  /** Governing document, e.g. "ITU-R V.431" — surfaced as a tag in the detail panel. */
  standard?: string
  confidence?: ScientificConfidence
  sources?: ProfessionalSource[]
}

export interface ProfessionalTechnology {
  id: string
  label: string
  frequency: number
  bandwidth?: number
  category: SpectrumCategory
  color: string
  minZoom: number
  detail: string
  /** Governing standard, e.g. "IEEE 802.11ax" / "3GPP TS 38.104". */
  standard?: string
  confidence?: ScientificConfidence
  sources?: ProfessionalSource[]
}

export const PROFESSIONAL_SUB_BANDS: ProfessionalBand[] = [
  { id: 'elf', label: 'ELF', rangeLabel: '3-30 Hz', frequencyMin: 3, frequencyMax: 30, category: 'radio', color: '#00d4ff', uses: 'submarine comms, geophysics' },
  { id: 'slf', label: 'SLF', rangeLabel: '30-300 Hz', frequencyMin: 30, frequencyMax: 300, category: 'radio', color: '#00d4ff', uses: 'power systems, deep comms' },
  { id: 'ulf', label: 'ULF', rangeLabel: '300 Hz-3 kHz', frequencyMin: 300, frequencyMax: 3e3, category: 'radio', color: '#00d4ff', uses: 'mines, magnetosphere' },
  { id: 'vlf', label: 'VLF', rangeLabel: '3-30 kHz', frequencyMin: 3e3, frequencyMax: 3e4, category: 'radio', color: '#00d4ff', uses: 'submarine comms, time signals' },
  { id: 'lf', label: 'LF', rangeLabel: '30-300 kHz', frequencyMin: 3e4, frequencyMax: 3e5, category: 'radio', color: '#00d4ff', uses: 'longwave, beacons, navigation' },
  { id: 'mf', label: 'MF', rangeLabel: '300 kHz-3 MHz', frequencyMin: 3e5, frequencyMax: 3e6, category: 'radio', color: '#00d4ff', uses: 'AM broadcast, maritime' },
  { id: 'hf', label: 'HF', rangeLabel: '3-30 MHz', frequencyMin: 3e6, frequencyMax: 3e7, category: 'radio', color: '#00d4ff', uses: 'shortwave, ham, CB' },
  { id: 'vhf', label: 'VHF', rangeLabel: '30-300 MHz', frequencyMin: 3e7, frequencyMax: 3e8, category: 'radio', color: '#00d4ff', uses: 'FM, aviation, marine' },
  { id: 'uhf', label: 'UHF', rangeLabel: '300 MHz-3 GHz', frequencyMin: 3e8, frequencyMax: 3e9, category: 'radio', color: '#00d4ff', uses: 'cellular, GPS, WiFi 2.4' },
  { id: 'shf', label: 'SHF', rangeLabel: '3-30 GHz', frequencyMin: 3e9, frequencyMax: 3e10, category: 'microwave', color: '#00ff88', uses: 'radar, satellite, WiFi 5/6' },
  { id: 'ehf', label: 'EHF', rangeLabel: '30-300 GHz', frequencyMin: 3e10, frequencyMax: 3e11, category: 'microwave', color: '#00ff88', uses: 'mmWave, radar, WiGig' },
  { id: 'pro-infrared', label: 'IR', rangeLabel: '300 GHz-430 THz', frequencyMin: 3e11, frequencyMax: 4.3e14, category: 'infrared', color: '#ff6b35', uses: 'thermal imaging, fiber optics' },
  { id: 'pro-visible', label: 'VIS', rangeLabel: '430-770 THz', frequencyMin: 4.3e14, frequencyMax: 7.7e14, category: 'visible', color: '#ffffff', uses: 'human vision, optics' },
  { id: 'pro-uv', label: 'UV', rangeLabel: '770 THz-30 PHz', frequencyMin: 7.7e14, frequencyMax: 3e16, category: 'ultraviolet', color: '#c77dff', uses: 'sterilization, fluorescence' },
  { id: 'pro-xray', label: 'X-Ray', rangeLabel: '30 PHz-30 EHz', frequencyMin: 3e16, frequencyMax: 3e19, category: 'xray', color: '#4cc9f0', uses: 'imaging, crystallography' },
  { id: 'pro-gamma', label: 'Gamma', rangeLabel: '>30 EHz', frequencyMin: 3e19, frequencyMax: 1e26, category: 'gamma', color: '#ff006e', uses: 'nuclear, cosmic, medical' },
]

export const PROFESSIONAL_TECH_OVERLAYS: ProfessionalTechnology[] = [
  { id: 'rfid-125', label: '125 kHz RFID', frequency: 125e3, bandwidth: 8e3, category: 'radio', color: '#70e1ff', minZoom: 9, detail: 'Low-frequency RFID access cards and animal tags' },
  { id: 'nfc-1356', label: '13.56 MHz NFC', frequency: 13.56e6, bandwidth: 1.8e6, category: 'radio', color: '#70e1ff', minZoom: 9, detail: 'NFC, ISO 14443 smart cards and HF RFID' },
  { id: 'cb-27', label: '27 MHz CB', frequency: 27e6, bandwidth: 270e3, category: 'radio', color: '#70e1ff', minZoom: 10, detail: 'Citizens Band radio around 27 MHz' },
  { id: 'rc-40', label: '40 MHz RC', frequency: 40e6, bandwidth: 80e3, category: 'radio', color: '#70e1ff', minZoom: 11, detail: 'Legacy radio-control systems' },
  { id: 'fm-88-108', label: 'FM 88-108', frequency: 98e6, bandwidth: 20e6, category: 'radio', color: '#00d4ff', minZoom: 8, detail: 'Broadcast FM radio band, 88-108 MHz' },
  { id: 'ism-433', label: '433.92 ISM', frequency: 433.92e6, bandwidth: 1.74e6, category: 'radio', color: '#00f5d4', minZoom: 10, detail: '433.92 MHz ISM devices, remotes and sensors' },
  { id: 'iot-868', label: '868 EU IoT', frequency: 868e6, bandwidth: 7e6, category: 'radio', color: '#00f5d4', minZoom: 10, detail: 'EU SRD/IoT band used by LoRa and sensors' },
  { id: 'ism-915', label: '915 US ISM', frequency: 915e6, bandwidth: 26e6, category: 'radio', color: '#00f5d4', minZoom: 10, detail: 'US ISM band used by LoRa, RFID and telemetry' },
  { id: 'pro-gps-l1', label: 'GPS L1', frequency: 1.57542e9, bandwidth: 24e6, category: 'radio', color: '#4cc9f0', minZoom: 11, detail: 'GPS L1 C/A centered at 1.57542 GHz' },
  { id: 'wifi-24', label: '2.4 WiFi/BT', frequency: 2.4415e9, bandwidth: 83.5e6, category: 'radio', color: '#00d4ff', minZoom: 8, detail: '2.4 GHz ISM: WiFi, Bluetooth, Zigbee' },
  { id: 'wifi-5', label: '5 GHz WiFi', frequency: 5.5e9, bandwidth: 700e6, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5 GHz WiFi U-NII bands' },
  { id: 'wifi-6e', label: '6 GHz WiFi 6E', frequency: 6.5e9, bandwidth: 1.2e9, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '6 GHz WiFi 6E / WiFi 7 spectrum' },
  { id: 'radar-24', label: '24 GHz Radar', frequency: 24.125e9, bandwidth: 250e6, category: 'microwave', color: '#00ff88', minZoom: 9, detail: '24 GHz short-range radar' },
  { id: '5g-28', label: '28 GHz 5G', frequency: 28e9, bandwidth: 850e6, category: 'microwave', color: '#00ff88', minZoom: 9, detail: '5G NR FR2 mmWave around 28 GHz' },
  { id: '5g-39', label: '39 GHz 5G', frequency: 39e9, bandwidth: 1e9, category: 'microwave', color: '#00ff88', minZoom: 9, detail: '5G NR FR2 mmWave around 39 GHz' },
  { id: 'wigig-60', label: '60 GHz WiGig', frequency: 60e9, bandwidth: 7e9, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '60 GHz WiGig / 802.11ad/ay' },
  { id: 'auto-77', label: '77 GHz Auto Radar', frequency: 77e9, bandwidth: 4e9, category: 'microwave', color: '#00ff88', minZoom: 8, detail: 'Automotive FMCW radar around 76-81 GHz' },
  // LTE / 4G Cellular Bands (3GPP / FCC)
  { id: 'lte-band1', label: 'LTE Band 1', frequency: 2110e6, bandwidth: 60e6, category: 'radio', color: '#ff6b9d', minZoom: 9, detail: 'LTE Band 1 (2110-2170 MHz) UTRA / EUTRA, FDD' },
  { id: 'lte-band3', label: 'LTE Band 3', frequency: 1805e6, bandwidth: 60e6, category: 'radio', color: '#ff6b9d', minZoom: 9, detail: 'LTE Band 3 (1805-1880 MHz), FDD main EU/Asia' },
  { id: 'lte-band7', label: 'LTE Band 7', frequency: 2655e6, bandwidth: 60e6, category: 'radio', color: '#ff6b9d', minZoom: 9, detail: 'LTE Band 7 (2620-2690 MHz), FDD main EU' },
  { id: 'lte-band20', label: 'LTE Band 20', frequency: 791e6, bandwidth: 40e6, category: 'radio', color: '#ff6b9d', minZoom: 10, detail: 'LTE Band 20 (791-821 MHz), FDD EU (800 MHz)' },
  // 5G NR Bands (3GPP Release 15+)
  { id: '5g-nr-n78', label: '5G n78', frequency: 3.5e9, bandwidth: 400e6, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5G NR Band n78 (3.4-3.8 GHz), main global mid-band' },
  { id: '5g-nr-n77', label: '5G n77', frequency: 3.7e9, bandwidth: 800e6, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5G NR Band n77 (3.7-3.8 GHz), China main deployment' },
  { id: '5g-nr-n79', label: '5G n79', frequency: 4.5e9, bandwidth: 1e9, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5G NR Band n79 (4.4-5.0 GHz), unlicensed/shared spectrum' },
  { id: '5g-nr-n260', label: '5G n260', frequency: 39e9, bandwidth: 1.6e9, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5G NR Band n260 (37-40 GHz), mmWave FR2' },
  { id: '5g-nr-n261', label: '5G n261', frequency: 28e9, bandwidth: 800e6, category: 'microwave', color: '#00ff88', minZoom: 8, detail: '5G NR Band n261 (27.5-28.35 GHz), mmWave FR2' },
  // Satellite Uplink/Downlink (ITU allocations)
  { id: 'sat-fixed-l', label: 'Satellite L-Band', frequency: 1215e6, bandwidth: 100e6, category: 'radio', color: '#4cc9f0', minZoom: 10, detail: 'Satellite fixed/mobile L-band (1215-1300 MHz)' },
  { id: 'sat-c-down', label: 'C-Band Down', frequency: 3750e6, bandwidth: 500e6, category: 'microwave', color: '#4cc9f0', minZoom: 9, detail: 'C-band satellite downlink (3.7-4.2 GHz) ITU allocation' },
  { id: 'sat-c-up', label: 'C-Band Up', frequency: 6000e6, bandwidth: 500e6, category: 'microwave', color: '#4cc9f0', minZoom: 9, detail: 'C-band satellite uplink (5.925-6.425 GHz) ITU allocation' },
  { id: 'sat-ku-down', label: 'Ku-Band Down', frequency: 11500e6, bandwidth: 500e6, category: 'microwave', color: '#4cc9f0', minZoom: 9, detail: 'Ku-band satellite downlink (10.7-12.75 GHz)' },
  { id: 'sat-ku-up', label: 'Ku-Band Up', frequency: 14500e6, bandwidth: 500e6, category: 'microwave', color: '#4cc9f0', minZoom: 9, detail: 'Ku-band satellite uplink (14.0-14.5 GHz)' },
  // Amateur Radio (ITU Region 1 / FCC Part 97)
  { id: 'ham-160m', label: '160m Amateur', frequency: 1.9e6, bandwidth: 200e3, category: 'radio', color: '#b4a7d6', minZoom: 12, detail: 'Amateur radio 160m band (1.8-2.0 MHz) CW/SSB' },
  { id: 'ham-80m', label: '80m Amateur', frequency: 3.8e6, bandwidth: 200e3, category: 'radio', color: '#b4a7d6', minZoom: 11, detail: 'Amateur radio 80m band (3.5-4.0 MHz)' },
  { id: 'ham-40m', label: '40m Amateur', frequency: 7.1e6, bandwidth: 200e3, category: 'radio', color: '#b4a7d6', minZoom: 10, detail: 'Amateur radio 40m band (7.0-7.3 MHz)' },
  { id: 'ham-20m', label: '20m Amateur', frequency: 14.2e6, bandwidth: 200e3, category: 'radio', color: '#b4a7d6', minZoom: 10, detail: 'Amateur radio 20m band (14.0-14.35 MHz)' },
  { id: 'ham-10m', label: '10m Amateur', frequency: 28.5e6, bandwidth: 500e3, category: 'radio', color: '#b4a7d6', minZoom: 10, detail: 'Amateur radio 10m band (28-29.7 MHz)' },
  { id: 'ham-2m', label: '2m Amateur', frequency: 146.5e6, bandwidth: 600e3, category: 'radio', color: '#b4a7d6', minZoom: 10, detail: 'Amateur radio 2m band (144-148 MHz) FM/SSB' },
  { id: 'ham-70cm', label: '70cm Amateur', frequency: 432e6, bandwidth: 1e6, category: 'radio', color: '#b4a7d6', minZoom: 10, detail: 'Amateur radio 70cm band (430-440 MHz) FCC Part 97' },
  // ISM (Industrial, Scientific, Medical) / Unlicensed Bands
  { id: 'ism-2450', label: 'ISM 2450 MHz', frequency: 2450e6, bandwidth: 50e6, category: 'radio', color: '#00f5d4', minZoom: 9, detail: 'ISM band 2400-2500 MHz: WiFi, Bluetooth, microwave ovens' },
  { id: 'ism-5800', label: 'ISM 5800 MHz', frequency: 5800e6, bandwidth: 200e6, category: 'microwave', color: '#00f5d4', minZoom: 9, detail: 'ISM band 5725-5875 MHz (5.8 GHz WiFi 6)' },
  { id: 'ism-24', label: 'ISM 24 GHz', frequency: 24.125e9, bandwidth: 250e6, category: 'microwave', color: '#00f5d4', minZoom: 10, detail: '24 GHz ISM band (24.0-24.25 GHz) short-range radar' },
  { id: 'ism-60', label: 'ISM 60 GHz', frequency: 60e9, bandwidth: 7e9, category: 'microwave', color: '#00f5d4', minZoom: 9, detail: '60 GHz ISM band (57-66 GHz) WiGig, 802.11ad' },
  // Additional WiFi / WLAN (802.11 bands)
  { id: 'wifi-6ghz-low', label: 'WiFi 6E 6.0 GHz', frequency: 6.0e9, bandwidth: 500e6, category: 'microwave', color: '#00ff88', minZoom: 9, detail: '6 GHz UNII-5 (5850-6425 MHz) WiFi 6E low band' },
  { id: 'wifi-6ghz-mid', label: 'WiFi 6E 6.2 GHz', frequency: 6.2e9, bandwidth: 400e6, category: 'microwave', color: '#00ff88', minZoom: 9, detail: '6 GHz UNII-6 (6425-7125 MHz) WiFi 6E mid band' },
  // L-Band Allocations (GPS, Galileo, aviation navigation)
  { id: 'gps-l2', label: 'GPS L2', frequency: 1.22760e9, bandwidth: 24e6, category: 'radio', color: '#4cc9f0', minZoom: 11, detail: 'GPS L2 navigation signal (1227.60 MHz)' },
  { id: 'gps-l5', label: 'GPS L5', frequency: 1.17645e9, bandwidth: 24e6, category: 'radio', color: '#4cc9f0', minZoom: 11, detail: 'GPS L5 civil navigation signal (1176.45 MHz)' },
  { id: 'galileo-e1', label: 'Galileo E1', frequency: 1.575420e9, bandwidth: 24e6, category: 'radio', color: '#4cc9f0', minZoom: 11, detail: 'Galileo E1 band (1575.42 MHz) interoperable with GPS L1' },
  { id: 'galileo-e5a', label: 'Galileo E5a', frequency: 1.176450e9, bandwidth: 24e6, category: 'radio', color: '#4cc9f0', minZoom: 11, detail: 'Galileo E5a band (1176.45 MHz)' },
  // Maritime / Aeronautical
  { id: 'hf-maritime', label: 'HF Maritime', frequency: 4e6, bandwidth: 3.5e6, category: 'radio', color: '#70e1ff', minZoom: 10, detail: 'HF maritime distress / navigation (4.0-4.63 MHz)' },
  { id: 'vhf-maritime', label: 'VHF Maritime', frequency: 156.8e6, bandwidth: 38e6, category: 'radio', color: '#00d4ff', minZoom: 10, detail: 'VHF marine radiotelephone (156-162 MHz) ITU allocation' },
  { id: 'aviation-vhf', label: 'Aviation VHF', frequency: 121.5e6, bandwidth: 30e6, category: 'radio', color: '#00d4ff', minZoom: 10, detail: 'Aviation VHF (118-137 MHz) ICAO air traffic control' },
  // Broadcast TV / Radio
  { id: 'vhf-tv-i', label: 'VHF-TV I', frequency: 55e6, bandwidth: 40e6, category: 'radio', color: '#70e1ff', minZoom: 10, detail: 'VHF Television Band I (47-68 MHz) channels 2-6' },
  { id: 'uhf-tv', label: 'UHF-TV', frequency: 600e6, bandwidth: 100e6, category: 'radio', color: '#70e1ff', minZoom: 9, detail: 'UHF Television (470-860 MHz) ITU VHF/UHF allocation' },
  { id: 'am-broadcast', label: 'AM 540-1700 kHz', frequency: 1e6, bandwidth: 1.16e6, category: 'radio', color: '#70e1ff', minZoom: 10, detail: 'AM broadcast band (535-1705 kHz, 10 kHz spacing)' },
  // Radar allocations (weather, air traffic, maritime)
  { id: 'weather-radar-s', label: 'Weather Radar (S)', frequency: 3.2e9, bandwidth: 600e6, category: 'microwave', color: '#ff6b9d', minZoom: 9, detail: 'Weather radar S-band (2.7-3.65 GHz) WSR-88D' },
  { id: 'weather-radar-c', label: 'Weather Radar (C)', frequency: 5.5e9, bandwidth: 1e9, category: 'microwave', color: '#ff6b9d', minZoom: 9, detail: 'Weather radar C-band (5.35-5.65 GHz) ITU allocation' },
  { id: 'airport-radar', label: 'Airport Radar', frequency: 9.375e9, bandwidth: 75e6, category: 'microwave', color: '#ff6b9d', minZoom: 10, detail: 'Airport surface detection radar X-band (9.2-9.5 GHz)' },
]

export function findProfessionalBand(frequency: number): ProfessionalBand | null {
  return PROFESSIONAL_SUB_BANDS.find(
    band => frequency >= band.frequencyMin && frequency <= band.frequencyMax
  ) ?? null
}

export function findNearestTechnology(frequency: number): ProfessionalTechnology | null {
  let best: { item: ProfessionalTechnology; distance: number } | null = null
  const logF = Math.log10(Math.max(frequency, 1))

  for (const item of PROFESSIONAL_TECH_OVERLAYS) {
    const distance = Math.abs(Math.log10(Math.max(item.frequency, 1)) - logF)
    if (!best || distance < best.distance) {
      best = { item, distance }
    }
  }

  return best && best.distance < 0.08 ? best.item : null
}
