/**
 * Resolves a governing standard into citations.
 *
 * Professional cards used to cite one generic document — "ITU Radio Regulations" — for
 * every allocation, which tells you the treaty exists but not which part of it applies.
 * This maps each standard onto its own landing page, so a 5G card points at 3GPP TS
 * 38.104 and an AIS card at ITU-R M.1371, with the Radio Regulations kept as the
 * secondary citation for the allocation itself.
 */

export interface StandardSource {
  label: string
  url?: string
  note?: string
}

export const ITU_RADIO_REGULATIONS: StandardSource = {
  label: 'ITU Radio Regulations',
  url: 'https://www.itu.int/pub/R-REG-RR',
  note: 'Treaty-level frequency allocations by region and service',
}

/**
 * Free, stable landing pages, each verified to resolve. Standards whose publisher
 * paywalls or blocks automated access — IEC, ICAO, IEEE, IMO, NEMA, MIL-PRF — are
 * deliberately cited by name with no URL: a link that 403s or rots is worse than none.
 */
const STANDARD_URLS: Record<string, string> = {
  'ITU-R V.431-8': 'https://www.itu.int/rec/R-REC-V.431/en',
  'ITU-R BS.450': 'https://www.itu.int/rec/R-REC-BS.450/en',
  'ITU-R BS.561': 'https://www.itu.int/rec/R-REC-BS.561/en',
  'ITU-R M.1371-5': 'https://www.itu.int/rec/R-REC-M.1371/en',
  'ITU-R M.1849': 'https://www.itu.int/rec/R-REC-M.1849/en',
  'WMO No. 8 Guide': 'https://www.itu.int/rec/R-REC-M.1849/en',
  'FCC Part 25 / ITU-R S.465': 'https://www.itu.int/rec/R-REC-S.465/en',
  '3GPP TS 38.104': 'https://www.3gpp.org/dynareport/38104.htm',
  '3GPP TS 38.104 (FR2)': 'https://www.3gpp.org/dynareport/38104.htm',
  '3GPP Release 15': 'https://www.3gpp.org/dynareport/38104.htm',
  '3GPP TS 36.101': 'https://www.3gpp.org/dynareport/36101.htm',
  'ITU RR No. 5.150': 'https://www.itu.int/en/ITU-R/terrestrial/fmd/Pages/ism.aspx',
  'ITU RR Article 5': 'https://www.itu.int/pub/R-REG-RR',
  'ITU RR Article 25': 'https://www.itu.int/pub/R-REG-RR',
  'ITU RR Appendix 17': 'https://www.itu.int/pub/R-REG-RR',
  'ITU RR Appendix 18': 'https://www.itu.int/pub/R-REG-RR',
  'ETSI EN 300 220': 'https://www.etsi.org/standards',
  'ETSI EN 300 401': 'https://www.etsi.org/standards',
  'ETSI EN 300 744': 'https://www.etsi.org/standards',
  'ETSI EN 301 091': 'https://www.etsi.org/standards',
  'ETSI EN 302 264': 'https://www.etsi.org/standards',
  'Galileo OS SIS ICD': 'https://www.gsc-europa.eu/electronic-library/programme-reference-documents',
}

/** Standards that are themselves part of the Radio Regulations — citing the RR again
 *  underneath them would just repeat the same document. */
const IS_RADIO_REGULATION = /^ITU RR\b/

/**
 * @param standard Governing document, e.g. "3GPP TS 38.104".
 * @param allocated Whether the entry is a spectrum allocation, in which case the Radio
 *   Regulations are worth citing alongside the standard. False for things that occupy a
 *   band without being allocated one (a laser class, an imaging dose limit).
 */
export function sourcesForStandard(standard: string | undefined, allocated = true): StandardSource[] {
  if (!standard) return allocated ? [ITU_RADIO_REGULATIONS] : []

  const url = STANDARD_URLS[standard]
  const primary: StandardSource = url
    ? { label: standard, url }
    : { label: standard, note: 'Cited by name — the publisher offers no stable public link' }

  if (!allocated || IS_RADIO_REGULATION.test(standard)) return [primary]
  return [primary, ITU_RADIO_REGULATIONS]
}
