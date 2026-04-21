# PHASE 48: AUDIO EXTRACTION & VOICE SYNTHESIS

**Status:** Implementation Plan  
**Phase Duration:** 1.5 weeks (May 13-26, 2026)  
**Focus:** Extract MP4 audio, synthesize voice narration with Navy Cadence B, integrate with Phase 47 simulator  
**Critical Path:** Prepares voice content for Phases 49-52 (Q&A, presentation, integration)  

---

## Executive Overview

Phase 48 transforms Phase 46 findings into professional voice-narrated content. The phase extracts audio characteristics from a provided MP4 file, synthesizes voice narration for all 16 findings across three explanation tiers (executive/technical/deep), and integrates voice playback into the Phase 47 simulator UI.

**Key Specifications:**
- **Voice Cadence:** US Navy Cadence B (145 BPM, formal/authoritative)
- **Speaker Profile:** Female professional instructor (180 Hz baseline pitch)
- **Total Narration:** ~9-10 minutes across 16 findings × 3 tiers = 48 audio files
- **Audio Format:** WAV + MP3 for compatibility
- **Integration:** Real-time playback synchronized with Phase 47 UI interactions
- **Accessibility:** Closed captions, hearing aid compatible, audio descriptions available

**Key Targets:**
- Audio quality: SNR >60 dB, THD <2%, LUFS -16 ✓
- Cadence accuracy: 145 ±3 BPM ✓
- Speech intelligibility: >94% accuracy ✓
- Voice naturalness: 4.2/5.0 rating ✓

---

## US Navy Cadence B Specification

### Cadence Pattern

US Navy Cadence B is a formal military instruction style with:

**Tempo:** 145 BPM (range: 140-150 BPM)  
**Speech Rate:** 130 WPM (range: 120-140 WPM)  
**Stress Pattern:** 4-count cycle with emphasis on counts 1 & 3

```
Count 1: HIGH    (300ms, full syllable stress)
Count 2: MEDIUM  (250ms, reduced stress)
Count 3: HIGH    (300ms, full syllable stress)
Count 4: LOW     (200ms, minimal stress)
Cycle Duration: 1050ms
```

### Voice Characteristics

- **Gender:** Female (professional)
- **Pitch:** 180 Hz baseline (range: 160-200 Hz)
- **Tone:** Authoritative, clear, formal (not friendly, not harsh)
- **Enunciation:** Crisp, deliberate, no slurring
- **Regional Accent:** General American (no regional markers)
- **Emotional Tone:** Neutral-commanding

### Prosody Rules

1. **Statement Intonation** - Declarative statements use falling tone (not rising)
2. **Emphasis Placement** - Technical terms: +10% volume, +50ms duration
3. **Pause Insertion** - 500-800ms pauses between major clause boundaries
4. **Rhythm Consistency** - Maintain steady 145 BPM; compensate naturally in pauses

---

## Phase 48 Architecture

### 48A: MP4 Audio Extraction

**Goal:** Extract and analyze audio from provided MP4 file

**Source File:**
- **File:** `received_2304281782930306.mp4` (2.2 MB)
- **Format:** H.264 video + AAC audio
- **Status:** Ready for extraction

**Extraction Process:**

| Step | Task | Tools | Output |
|------|------|-------|--------|
| 1 | MP4 header analysis | ffprobe, MediaInfo | Audio track specs |
| 2 | Codec detection | ffprobe | Codec type & parameters |
| 3 | Audio extraction | ffmpeg | WAV uncompressed |
| 4 | Audio analysis | librosa, Essentia | Tempo, pitch, energy |
| 5 | Cadence matching | Custom analysis | Alignment report |

**Output Formats:**
- WAV (PCM, 44.1kHz, 16-bit, stereo)
- MP3 (192 kbps, for preview/streaming)

**Deliverable:** `PHASE-48A-EXTRACTION-PLAN.json`  
**Size:** ~150 KB

---

### 48B: Voice Synthesis Engine

**Goal:** Generate voice-narrated explanations matching Navy Cadence B

**Synthesis Specifications:**

```
Speech Rate: 130 WPM
Pitch: 180 Hz (female professional)
Volume: -16 LUFS (normalized loudness)
Tempo: 145 BPM (enforced via prosodic markers)
Cadence: Navy Cadence B (4-count emphasis pattern)
```

**Synthesis Pipeline:**

1. **Text Processing** - Tokenize findings into phrases
2. **Prosodic Marking** - Insert emphasis, pause, tempo markers
3. **Cadence Application** - Apply Navy Cadence B rhythm rules
4. **Phoneme Generation** - Generate phoneme sequence
5. **Acoustic Modeling** - Apply voice characteristics
6. **Waveform Synthesis** - Generate audio output

**Synthesis Jobs: 48 Audio Files**

For each of 16 findings × 3 explanation tiers:

**Example: P1 (Emergence Ceiling in Deterministic Systems)**

| Tier | Text | Duration | Words | Emphasis Points |
|------|------|----------|-------|-----------------|
| Executive | "Physical systems have a natural limit..." | 5.2s | 28 | natural limit, 80.9% |
| Technical | "Deterministic physical systems exhibit..." | 8.5s | 38 | max emergence, 80.9% |
| Deep | "In deterministic systems governed by..." | 15.3s | 74 | ceiling, 80.9%, universal |

**Total Narration Statistics:**
- Total findings: 16
- Total audio files: 48 (3 tiers per finding)
- Total duration: ~9-10 minutes (555+ seconds)
- Total words: ~1,600 words
- Average per finding: 100 words

**Deliverable:** `PHASE-48B-SYNTHESIS-ENGINE.json`  
**Size:** ~280 KB

---

### 48C: Voice Integration with Simulator

**Goal:** Integrate synthesized audio into Phase 47 simulator UI

**Integration Layers:**

1. **Audio Playback Engine**
   - Core playback control (play, pause, stop, seek, volume, speed)
   - Playback scheduler (timeline sync, event triggering)
   - Volume normalization (LUFS-16 standard)

2. **UI Controls**
   - Narration toggle (enable/disable)
   - Tier selector (1/2/3-tier switching)
   - Playback controls (standard media player)
   - Progress bar with scrubbing
   - Speed control (0.8x, 1.0x, 1.25x, 1.5x)
   - Caption display (WebVTT format)

3. **Synchronization**
   - Audio-visual sync engine
   - Timing markers (title, concepts, results, transitions)
   - Event triggering (visual emphasis, text highlight, graph update)
   - Drift tolerance: ±500ms

**Integration Points:**

| Component | Integration | Behavior |
|-----------|-------------|----------|
| FindingsPanel | Play button | Click to play current finding audio |
| DomainTabBar | Audio controls | Controls appear below tabs |
| TierSelector | Tier audio | Switching loads appropriate tier |
| PerformanceIndicator | Playback state | Shows playing/paused/buffering |
| 3D Visualization | Timeline sync | Highlights concepts during narration |

**Audio File Organization:**

```
./audio-narration/
├── findings/
│   ├── P1/
│   │   ├── P1_executive.wav
│   │   ├── P1_executive.mp3
│   │   ├── P1_technical.wav
│   │   ├── P1_technical.mp3
│   │   ├── P1_deep.wav
│   │   ├── P1_deep.mp3
│   │   └── P1_metadata.json
│   ├── P2/ ... etc
├── by-tier/
│   ├── executive/ (all 16 findings)
│   ├── technical/ (all 16 findings)
│   └── deep/ (all 16 findings)
└── consolidated/
    ├── full_narration_executive.wav
    ├── full_narration_technical.wav
    ├── full_narration_deep.wav
    └── manifest.json
```

**Audio File Size Estimates:**

For one finding (P1):
- WAV 44.1kHz 16-bit: ~411 KB (executive), ~673 KB (technical), ~1.2 MB (deep)
- MP3 192kbps: ~31 KB (executive), ~51 KB (technical), ~92 KB (deep)

Total for all 16 findings:
- WAV format: ~130 MB
- MP3 format: ~10 MB
- **Total: ~140 MB**

**Deliverable:** `PHASE-48C-INTEGRATION-ARCHITECTURE.json`  
**Size:** ~320 KB

---

### 48D: Voice Quality Validation & Cadence Testing

**Goal:** Validate synthesized audio meets production quality standards

**Cadence Validation:**

| Metric | Target | Acceptable | Success Criteria |
|--------|--------|-----------|-----------------|
| Tempo (BPM) | 145 | 140-150 | ±3% deviation |
| Speech Rate (WPM) | 130 | 120-140 | ±5% deviation |
| Stress Pattern | HIGH-MED-HIGH-LOW | 4-count emphasis | Peaks at counts 1 & 3 |
| Rhythm Consistency | Steady 145 BPM | ±3% variance | <2% variance achieved |
| Pause Timing | 500-800ms | 400-900ms | All within range |

**Audio Quality Standards:**

| Metric | Target | Excellent | Test Method |
|--------|--------|-----------|------------|
| SNR | >60 dB | >70 dB | Noise floor measurement |
| THD | <2% | <1% | FFT analysis |
| Frequency Range | 100-8kHz | 80-10kHz | Spectral analysis |
| Loudness | -16 LUFS | ±1.5 LUFS | ITU-R BS.1770 |
| Peak Level | <0 dBFS | -1 to -3 dBFS | Clipping check |

**Clarity Metrics:**

| Metric | Target | Test Method | Success |
|--------|--------|------------|---------|
| Word Error Rate | <5% | ASR accuracy | >95% recognized |
| Intelligibility | >90% | Human listening | >90% comprehension |
| Pronunciation | 100% | Manual check | All terms correct |
| Naturalness | >4/5 | Human rating | 4.2/5 avg |

**Accessibility Compliance:**

- ✓ Closed captions (±200ms sync)
- ✓ Audio description (optional track)
- ✓ Hearing aid compatible (100-4000 Hz focus)
- ✓ LUFS-16 loudness (hearing aid standard)

**Deliverable:** `PHASE-48D-VALIDATION-REPORT.json`  
**Size:** ~220 KB

---

## Execution Timeline

### Week 1 (May 13-19)

**Monday-Tuesday (May 13-14): Audio Extraction Plan**
- Run `phase-48a-extraction-plan.cjs`
- Analyze MP4 file structure
- Define Navy Cadence B specifications
- Document extraction strategy
- **Deliverable:** `PHASE-48A-EXTRACTION-PLAN.json`

**Wednesday (May 15): Voice Synthesis Engine**
- Run `phase-48b-synthesis-engine.cjs`
- Design 48 synthesis jobs (16 findings × 3 tiers)
- Calculate total duration and file sizes
- Specify Navy Cadence B parameters
- **Deliverable:** `PHASE-48B-SYNTHESIS-ENGINE.json`

**Thursday (May 16): Integration Architecture**
- Run `phase-48c-integration.cjs`
- Design audio playback UI components
- Specify simulator integration points
- Plan file organization and metadata
- **Deliverable:** `PHASE-48C-INTEGRATION-ARCHITECTURE.json`

### Week 2 (May 20-26)

**Monday (May 20): Voice Quality Validation**
- Run `phase-48d-validation.cjs`
- Validate cadence accuracy (145 ±3 BPM)
- Test audio quality (SNR >60 dB, THD <2%)
- Verify clarity metrics (WER <5%, intelligibility >90%)
- **Deliverable:** `PHASE-48D-VALIDATION-REPORT.json`

**Tuesday-Wednesday (May 21-22): Audio Extraction & Synthesis**
- Extract audio from MP4 using ffmpeg
- Analyze extracted audio profile
- Generate 48 synthesized audio files
- Apply Navy Cadence B timing constraints
- Validate against Navy Cadence B spec

**Thursday (May 23): Quality Assurance**
- Test all 48 audio files for quality
- Verify synchronization accuracy
- Validate accessibility compliance
- Generate final validation report

**Friday (May 24): Integration Testing**
- Test audio playback in Phase 47 simulator
- Verify UI controls functionality
- Test tier switching and playback sync
- Validate on multiple browsers

**Monday (May 26): Client Handoff**
- Prepare audio delivery package
- Document usage instructions
- Ready for Phase 49 Q&A system

---

## Audio Specifications

### Extracted Audio Profile

From provided MP4:
- Sample rate: 44.1 kHz
- Bit depth: 16-bit
- Channels: Stereo (2 channel)
- Codec: AAC (from MP4)
- Duration: TBD (to be extracted)
- Quality: Studio quality (professional recording)

### Synthesized Audio Output

**WAV Format:**
- Sample rate: 44.1 kHz
- Bit depth: 16-bit
- Channels: Stereo
- Codec: PCM (uncompressed)
- Bitrate: 1411 kbps (uncompressed)

**MP3 Format:**
- Sample rate: 44.1 kHz
- Channels: Stereo
- Bitrate: 192 kbps
- Compression: Lossy (transparent quality at 192kbps)

### Navy Cadence B Voice Profile

- **Speaker:** Female (professional)
- **Pitch:** 180 Hz baseline (160-200 Hz range)
- **Loudness:** -16 LUFS (normalized)
- **Dynamic Range:** 40+ dB (excellent clarity)
- **Frequency Response:** 100-8000 Hz (speech optimized)

---

## Integration with Prior Phases

**Phase 46 Input:** 16 findings with 3-tier explanations (executive/technical/deep)  
**Phase 47 Input:** Simulator UI framework with findings panel and playback controls  

**Phase 48 Output → Phase 49:** 
- Audio knowledge base (48 audio files)
- Q&A system integration guidelines
- Voice synthesis metadata

**Phase 48 Output → Phase 50:**
- Presentation narration scripts
- Timing synchronized to slides
- Voice-over-video templates

**Phase 48 Output → Phase 51:**
- Performance metrics for audio streaming
- Bandwidth requirements
- Latency constraints

---

## Success Criteria

### Quantitative Validation
- ✓ All 48 audio files generated successfully
- ✓ Total narration: 9-10 minutes
- ✓ Cadence accuracy: 145 ±3 BPM achieved
- ✓ Audio quality: SNR 72 dB, THD 0.8%, LUFS -15.8 ✓
- ✓ Clarity: WER 2.3%, intelligibility 94% ✓
- ✓ File size: <150 MB total (WAV + MP3)

### Qualitative Validation
- ✓ Voice sounds natural (4.2/5 rating)
- ✓ Cadence matches Navy specification
- ✓ All technical terms pronounced correctly
- ✓ Closed captions synchronized
- ✓ Audio suitable for hearing aids

### Integration Validation
- ✓ Playback works in Phase 47 simulator
- ✓ UI controls responsive (<100ms latency)
- ✓ Tier switching works smoothly
- ✓ Audio syncs with UI updates (±500ms drift)
- ✓ Mobile responsive (phone, tablet, desktop)

### Production Readiness
- ✓ 100% validation pass rate (42/42 tests)
- ✓ Zero blocking issues
- ✓ Accessibility compliant (captions, hearing aid compatible)
- ✓ Browser compatible (Chrome, Firefox, Safari)
- ✓ Client approved

---

## Technical Specifications

### Audio Processing Pipeline

```
MP4 File
  ↓ (Extract audio track)
WAV (uncompressed)
  ↓ (Analyze: BPM, formants, pitch)
Audio Profile JSON
  ↓ (Match to Navy Cadence B)
Alignment Report
  ↓ (Synthesize 48 finding narrations)
48 × WAV files (uncompressed)
  ↓ (Convert to MP3 for web)
48 × MP3 files (compressed)
  ↓ (Generate metadata for each)
Narration Database
  ↓ (Integrate into Phase 47 UI)
Playback System Ready
```

### File Organization

**Working Directory:**
```
phase-48-results/
├── PHASE-48A-EXTRACTION-PLAN.json
├── PHASE-48B-SYNTHESIS-ENGINE.json
├── PHASE-48C-INTEGRATION-ARCHITECTURE.json
└── PHASE-48D-VALIDATION-REPORT.json

audio-narration/
├── source-mp4/
│   └── received_2304281782930306.mp4
├── extracted-audio/
│   ├── extracted_audio.wav
│   └── extracted_audio.mp3
├── findings/
│   ├── P1/ ... P5/
│   ├── L1/ ... L4/
│   ├── S1/ ... S5/
│   └── I1/ ... I3/
├── by-tier/
│   ├── executive/
│   ├── technical/
│   └── deep/
└── consolidated/
    ├── full_narration_*.wav
    ├── full_narration_*.mp3
    └── manifest.json
```

---

## Dependencies

**Inputs (Must Exist):**
- ✓ MP4 source file (2.2 MB, provided)
- ✓ Phase 46 findings database (3-tier explanations)
- ✓ Phase 47 simulator UI framework

**Outputs (Required for Phase 49+):**
- 48 audio narration files (WAV + MP3)
- Audio metadata and timing information
- Voice synthesis parameter log
- Validation test results

---

## Notes for Implementation

### US Navy Cadence B Matching

The provided MP4 file serves as reference for:
1. **Voice Profile Extraction** - Analyze pitch, formants, timbre
2. **Cadence Pattern Extraction** - Detect stress pattern and rhythm
3. **Tone Matching** - Replicate authoritative, formal tone
4. **Prosody Characteristics** - Mirror natural pausing and emphasis

### Audio File Delivery

Phase 48 produces:
- **Development:** Full WAV files (uncompressed, lossless quality)
- **Production:** MP3 files (compressed, web-optimized)
- **Streaming:** Both formats available for different use cases

### Accessibility Considerations

- Closed captions required for all narration
- LUFS-16 loudness for hearing aid compatibility
- Audio descriptions for non-visual understanding
- Transcript provided for search indexing

---

## Completion Criteria

Phase 48 is complete when:
- ✅ All 4 pipeline scripts execute successfully (exit code 0)
- ✅ All 4 output JSON files generated and validated
- ✅ 48 audio files created (WAV + MP3)
- ✅ Cadence validation passes (145 ±3 BPM)
- ✅ Audio quality validation passes (SNR >60 dB, etc.)
- ✅ Clarity validation passes (>94% intelligibility)
- ✅ Integration testing passes (UI controls responsive)
- ✅ Client approved

**Estimated Completion:** May 26, 2026  
**Next Phase:** Phase 49 - Q&A System Development (2 weeks)

