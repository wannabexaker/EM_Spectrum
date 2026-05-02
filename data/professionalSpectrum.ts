import type { SpectrumCategory } from '@/types/spectrum'

export interface ProfessionalBand {
  id: string
  label: string
  rangeLabel: string
  frequencyMin: number
  frequencyMax: number
  category: SpectrumCategory
  color: string
  uses: string
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
