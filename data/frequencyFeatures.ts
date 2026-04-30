import type { FrequencyFeature } from '@/types/spectrum'

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
    detail: `Channel ${channel} = ${(centerMHz / 1000).toFixed(3)} GHz, nominal 22 MHz occupied bandwidth`,
    color: channel === 1 || channel === 6 || channel === 11 ? '#00f5d4' : '#7c3cff',
    minZoom: 18,
  } satisfies FrequencyFeature
})

export const frequencyFeatures: FrequencyFeature[] = [
  {
    id: 'wifi-24-ism',
    label: '2.4 GHz ISM band',
    shortLabel: '2.4 ISM',
    frequency_center: 2.4415e9,
    frequency_bandwidth: 83.5e6,
    category: 'technology',
    family: 'WiFi / Bluetooth / ISM',
    detail: '2.400-2.4835 GHz shared ISM range used by WiFi, Bluetooth, Zigbee and microwave leakage',
    color: '#00d4ff',
    minZoom: 8,
  },
  {
    id: 'bluetooth-ble-adv-37',
    label: 'BLE Advertising Channel 37',
    shortLabel: 'BLE 37',
    frequency_center: 2402e6,
    frequency_bandwidth: 2e6,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE advertising channel 37 at 2.402 GHz',
    color: '#4cc9f0',
    minZoom: 24,
  },
  {
    id: 'bluetooth-ble-adv-38',
    label: 'BLE Advertising Channel 38',
    shortLabel: 'BLE 38',
    frequency_center: 2426e6,
    frequency_bandwidth: 2e6,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE advertising channel 38 at 2.426 GHz',
    color: '#4cc9f0',
    minZoom: 24,
  },
  {
    id: 'bluetooth-ble-adv-39',
    label: 'BLE Advertising Channel 39',
    shortLabel: 'BLE 39',
    frequency_center: 2480e6,
    frequency_bandwidth: 2e6,
    category: 'technology',
    family: 'Bluetooth LE',
    detail: 'Bluetooth LE advertising channel 39 at 2.480 GHz',
    color: '#4cc9f0',
    minZoom: 24,
  },
  ...wifi24Channels,
]
