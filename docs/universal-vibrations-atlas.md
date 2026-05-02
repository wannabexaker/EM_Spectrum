# Universal Vibrations Atlas

Author: Codex
Date: 2026-05-02
Status: Phase 1 implemented as a structured expansion module, not a replacement for the EM Spectrum map.

## Goal

Universal Vibrations Atlas is the cross-domain frequency library for the EM Spectrum app. It treats any measurable repeating phenomenon as a frequency while keeping scientific confidence explicit. The goal is to let a user search for objects such as `human`, `cat`, `tree`, `router`, `moon`, `fan`, or `bee` and discover connected oscillations, cycles, pulses, resonances, rhythms, or carrier waves.

The module must not duplicate the existing EM/RF point database. Existing professional RF items stay in `data/frequencyFeatures.ts`; Atlas adds non-EM, biological, planetary, civil, safety, music, and claim-labeled phenomena.

## Taxonomy

Top-level atlas categories:

- Physics
- Human Body
- Animals
- Nature
- Plants
- Earth / Planetary
- Astronomy
- Technology
- Transport
- Civilization
- Music
- Danger / Safety
- Myths / Claims

Mode split:

- Educational view shows broad, recognizable items that help learning: heartbeat, breathing, cat purr, tides, Moon cycle, music notes, major natural rhythms.
- Professional view shows dense engineering/scientific items: machine RPM, CPU/RAM clocks, seismic ranges, turbine/rotor rates, black-hole merger bands, safety resonance entries.
- Search indexes all items regardless of current mode or hidden layers. Selecting a hidden item reveals the required layer/filter and zooms to it.

Future folder-list menu:

- The future navigator should mirror `listPath` from each Atlas item.
- Example: `Universal Vibrations Atlas / Animals / Insects / Bee wingbeat`.
- This keeps the future folder UI independent from the renderer and avoids refactoring search again.

## Data Model

Atlas entries are stored as `FrequencyFeature` records with additional metadata:

- `atlasCategory`: one of the taxonomy categories above.
- `confidence`: one of the required evidence labels.
- `aliases`: search synonyms such as `router`, `cat`, `moon`, `heartbeat`, `healing`.
- `sources`: source label, URL, and optional note.
- `periodSeconds`: exact or approximate period when the phenomenon is cycle-first instead of frequency-first.
- `modeVisibility`: `educational`, `professional`, or `both`.
- `listPath`: future folder/list path.

Rendering rule:

- Non-EM biological/mechanical/cultural items render on the Sound / mechanical lane.
- Technology items that already belong to EM continue to use the existing RF database unless the Atlas entry is a non-carrier mechanical/computing rhythm.
- Dense Atlas POIs are hidden by zoom and detail density; search remains global.

## Confidence Scoring

Every item must be classified exactly as one of:

- Scientifically Verified: standardized, directly measured, or defined by an authority.
- Strong Evidence: repeatedly measured in scientific literature, but range varies by context/species/system.
- Estimated / Approximate: real phenomenon, approximate range, context-sensitive.
- Theoretical: predicted or model-dependent, not directly practical in the app yet.
- Anecdotal: reported without strong controlled evidence.
- Folklore / Cultural Claim: culturally documented but not a scientific mechanism.
- Pseudoscience / Unsupported: claimed as factual by communities/marketing but not supported by reliable evidence.
- Unknown / Needs Validation: placeholder for data requiring later review.

Display rule:

- Myths and wellness claims must never be presented as facts.
- Unsupported items must say that no reliable source is linked for the claimed effect.
- Scientific items should include at least one source URL when possible.

## Source Strategy

Preferred sources by category:

- Standards and definitions: NIST, BIPM, ITU, IEEE, FCC, ISO.
- Space and planetary cycles: NASA, NOAA, ESA.
- Earth systems and hazards: USGS, NOAA, peer-reviewed journals.
- Human physiology: clinical references and peer-reviewed medical/neuroscience literature.
- Animals and biology: peer-reviewed acoustics/biology papers or institutional references.
- Myths/claims: do not cite promotional pages as evidence. Record them as cultural/unsupported claims unless a reliable review exists.

Phase 1 source anchors currently used include NIST cesium clock material, NOAA tide/solar-cycle pages, NASA Moon facts, USGS earthquake frequency material, Cleveland Clinic/Merck vital-sign ranges, and peer-reviewed/clinical summaries for EEG and cat purr ranges.

## UI Architecture

Phase 1:

- Atlas items are merged into the existing POI/search pipeline.
- Search result grouping uses Atlas category labels first.
- POI popup shows confidence, category, frequency range, period, detail, and source links.
- Detail-layer filters still apply:
  - Natural/Physics controls physics, human, animals, nature, plants, earth/planetary, astronomy, music.
  - Technologies controls technology, transport, civilization.
  - Hazards controls danger/safety.
  - Points of Interest controls myths/claims and generic Atlas POIs.

Phase 2:

- Add a pinned Atlas browser panel with collapsible folders powered by `listPath`.
- Add item detail pages or a right-side inspector for long source notes.
- Add "similar phenomena nearby" based on log-frequency distance.

Phase 3:

- Add audio preview for audible/mechanical items where safe and meaningful.
- Add scientific-source import workflow and validation dashboard.
- Add per-item review status, contributor notes, and duplicate detector.

## Duplicate Discipline

Before adding Atlas items:

- Check existing `frequencyFeatures` IDs and labels.
- Do not add second copies of existing RF/professional records such as WiFi, Bluetooth, GPS, FM, NFC, RFID, Schumann, mains 50/60 Hz, or hydrogen line.
- If an Atlas category needs to reference an existing RF record, use aliases/search text or future cross-links instead of duplicate entries.

## Phase 1 Implementation Notes

- New data module: `data/universalVibrationsAtlas.ts`.
- Existing search indexes both `frequencyFeatures` and Atlas-derived feature metadata because Atlas items are merged into `frequencyFeatures`.
- Log mapper expanded below 1 Hz so cosmic/planetary cycles can be searched and visualized.
- Renderer filters POIs by `modeVisibility` so Educational and Professional do not collapse into the same clutter profile.
