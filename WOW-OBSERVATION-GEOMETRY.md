# Wow! Signal Observation Geometry
## August 15, 1977 — 11:16 PM EDT

**Observer Location**: Ohio State University Radio Observatory  
**Latitude**: 40°01'35" N (40.0264°)  
**Longitude**: 83°02'05" W (-83.0347°)  
**Elevation**: 224 meters above sea level

---

## TARGET COORDINATES

### Chi Sagittarii Region (Wow! Signal Location)

**Equatorial Coordinates** (J2000.0 epoch):
- **Right Ascension (RA)**: 19h 23m 00s to 19h 27m 00s (±20 seconds uncertainty)
  - Center: **19h 25m 30s**
  - In decimal: **291.375°**

- **Declination (Dec)**: +26° 50' to +27° 40' (±45' uncertainty)
  - Center: **+27° 05'**
  - In decimal: **+27.083°**

**Chi Sagittarii Star System Reference**:
- Chi Sagittarii (χ Sgr): RA 19h 50m, Dec -21°
- Wow! region offset: ~27' west, ~48° north of Chi Sgr
- Not actually near Chi Sagittarii star (poor naming choice by astronomers)

---

## HORIZONTAL COORDINATES (from Columbus, Ohio)
### August 15, 1977, 11:16 PM EDT

**Time Details**:
- Local Time: 11:16:00 PM EDT
- Universal Time (UTC): 03:16:00 August 16, 1977
- Julian Date: 2443715.636
- Local Sidereal Time (LST): 01:04:00 (January 4 equivalent)

**Azimuth & Altitude Calculation**:

For an observer at 40°N latitude, observing RA 19h25m, Dec +27°05' at LST 01:04:

```
Hour Angle (HA) = LST - RA
                = 01:04:00 - 19:25:30
                = 05:38:30 (previously crossed meridian)
                = +84.625°

Altitude (Alt) = arcsin[sin(Dec) × sin(Lat) + cos(Dec) × cos(Lat) × cos(HA)]
               = arcsin[sin(27.083°) × sin(40.026°) + cos(27.083°) × cos(40.026°) × cos(84.625°)]
               = arcsin[0.4549 × 0.6428 + 0.8905 × 0.7660 × 0.0769]
               = arcsin[0.2922 + 0.0661]
               = arcsin[0.3583]
               = +20.98° above horizon
```

**Azimuth (Az) = arctan[sin(HA) / (cos(HA) × sin(Lat) - tan(Dec) × cos(Lat))]**

```
Az = arctan[sin(84.625°) / (cos(84.625°) × sin(40.026°) - tan(27.083°) × cos(40.026°))]
   = arctan[0.9957 / (0.0769 × 0.6428 - 0.5104 × 0.7660)]
   = arctan[0.9957 / (0.0494 - 0.3911)]
   = arctan[0.9957 / -0.3417]
   = arctan[-2.915]
   = -71.1° from North
   = 288.9° (East of North, measured clockwise)
   
**Azimuth: 289° W** (West-Northwest)
**Altitude: +21° above horizon** (moderate elevation)
```

---

## BIG EAR ANTENNA POINTING

### Fixed Antenna Geometry

The Ohio State **Big Ear** (1973-1998):
- **Type**: Fixed parabolic reflector, 110m E-W × 74m N-S
- **Declination Band**: +38° ± 0.5° fixed (antenna points to zenith at 38°N declination)
- **Azimuth Control**: Movable feed horn sweeps East-West (rotates in vertical plane)
- **Scan Method**: Sidereal drift (Earth's rotation moves celestial sphere across fixed beam)

### Why Wow! Was Detected (August 15)

At 40°N latitude observing declination +27°:
- Source declination is **11° below** zenith declination
- Source is **21° above horizon** (relatively high in sky)
- **Big Ear beam shape**: Narrower at higher elevations (antenna gain increases)
- Source at +27° is well within Big Ear's operational range

### Beam Characteristics

**Main Beam**:
- Width (E-W): ~30 arcminutes (at Dec +27°)
- Width (N-S): ~30 arcminutes (at Dec +27°)
- Gain: ~20 dB (compared to isotropic antenna)

**Sidelobes**:
- First sidelobe: ~20 dB below main beam
- Risk: Strong sources ±5° away could contaminate main beam observation

---

## OBSERVING WINDOW

### Visibility Timeline (August 15, 1977)

| Time (EDT) | Altitude | Azimuth | Notes |
|-----------|----------|---------|-------|
| **20:00** (8:00 PM) | +2° | 315° (NW) | Rising in northwest |
| **21:00** (9:00 PM) | +8° | 305° | Gaining elevation |
| **22:00** (10:00 PM) | +17° | 295° | Well visible |
| **23:16** (11:16 PM) | **+21°** | **289°** | **WOW! SIGNAL DETECTED** |
| **23:30** (11:30 PM) | +21° | 288° | Still visible |
| **00:00** (midnight) | +19° | 285° | Descending |
| **01:00** (1:00 AM) | +10° | 275° | Setting in west |
| **02:00** (2:00 AM) | +1° | 265° | Below observable horizon |

**Observable Duration**: ~6 hours (20:00-02:00 EDT)  
**Best Observing Time**: 21:00-01:00 EDT (peak elevation ~22° at 22:00)  
**Wow! Detection**: 11:16 PM, during prime observing hours

---

## VISUALIZATION: THE NIGHT SKY

### Star Chart (August 15, 1977, 23:16 EDT)

```
                    NORTH CELESTIAL POLE
                            ↑
                            |
      ZENITH (90°)          |         POLARIS (North Star)
                            *         Altitude: ~40°
                            |
                            |
                            |
     CASSIOPEIA    CEPHEUS  |  DRACO          HERCULES
         *             *    |    *                *
         |             |    |    |                |
    -----+-----+-------+----+----+-------+-----+-----
         |             |    |    |       |     |
      ANDROMEDA        CYGNUS  |  LYRA VEGA   BOÖTES
         *             *    |    *           *
                            |
                            |
        ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ ★ WOW! SIGNAL REGION ★ ★ ★ ★ ★
        Az: 289° | Alt: +21° | RA: 19h25m | Dec: +27°05'
        
                            |
         SAGITTARIUS    SCORPIUS
             *             *
                            |
          SOUTHERN HORIZON (Alt: 0°)
            SOUTHWEST
```

### Compass Bearings (from Ohio State)

```
         NORTH (0°)
            |
   NW 315° |  NE 45°
    \      |      /
     \     |     /
      \    |    /
 W 270° ---+--- E 90°
      /    |    \
     /     |     \
    /      |      \
   SW 225° | SE 135°
            |
         SOUTH (180°)

Wow! Signal: AZIMUTH 289° (W = 270° + 19° toward N)
             = 19° north of due west
             = WEST-NORTHWEST direction
```

---

## PRACTICAL OBSERVATION GEOMETRY

### What A Modern Validator Would Do

**August 15, 2026** (49 years later, same date):

Same geographic location, same region of sky:

**Pre-Observation Planning**:
```
Target: Chi Sagittarii region (Wow! zone)
Date: August 15, 2026 (49 years after original)
Start: 8:00 PM EDT (20:00)
Duration: 6 hours (until 2:00 AM)

Equipment: VLA (Very Large Array, New Mexico)
          GBT (Green Bank Telescope, West Virginia)
          Arecibo successor (international facility)

Simultaneous observation from 3 sites:
  - VLA: ~1000 km southwest
  - GBT: ~700 km east-southeast
  - International: Variable

If signal repeats at same location/frequency:
  - All three would detect it (proven real)
  - Cross-correlation would pinpoint source
  - Frequency resolution would characterize signal
```

---

## COMPARISON: 1977 vs. 2026

### Big Ear Observation

| Property | 1977 Measurement |
|----------|------------------|
| **Location** | Columbus, Ohio (40°N, 83°W) |
| **Target Azimuth** | 289° (W-NW) |
| **Target Altitude** | +21° (moderate elevation) |
| **Frequency** | 1420.4055 MHz (hydrogen line) |
| **Equipment** | Single fixed parabolic reflector |
| **Beam Width** | ~30 arcminutes |
| **Sensitivity** | 1 jansky (weak signals) |
| **Frequency Resolution** | ~10 kHz (estimated) |
| **Polarization** | None (not measured) |
| **Data Format** | Chart paper (permanent ink) |
| **Recalibration** | Impossible (no digital data) |

### Modern Replication (2026)

| Property | 2026 Measurement |
|----------|------------------|
| **Location** | Three simultaneous sites |
| **Target Azimuth** | Same direction (289° from OH) |
| **Target Altitude** | Same (~21° from OH) |
| **Frequency** | 1400-1450 MHz (search range) |
| **Equipment** | 27 synchronized VLA antennas + GBT + others |
| **Beam Width** | <1 arcsecond (1000× sharper) |
| **Sensitivity** | 0.1 microjansky (10,000× more sensitive) |
| **Frequency Resolution** | 0.1 Hz (100,000× sharper) |
| **Polarization** | Full linear + circular measurement |
| **Data Format** | Digital spectral datacubes (reprocessable) |
| **Recalibration** | Yes (repeat analysis with different parameters) |

---

## VALIDATOR OBSERVATION TRAINING

### Plotting Exercise 1: Celestial Coordinates

**Task**: Given equatorial coordinates (RA, Dec), calculate horizontal coordinates (Az, Alt) for specific date/time/location.

**Example**:
```
Given:
  Observer: Columbus, Ohio (40°N, 83°W)
  Target: RA 19h25m, Dec +27°05'
  Date/Time: Aug 15, 1977, 23:16 EDT
  
Calculate:
  Local Sidereal Time (LST) = ?
  Hour Angle (HA) = ?
  Altitude (Alt) = ?
  Azimuth (Az) = ?
  
Answer: Alt +21°, Az 289°
```

**Validators practice this calculation for every observation they design.**

### Plotting Exercise 2: Visibility Windows

**Task**: For target at Dec +27°05', determine:
- When does it rise above horizon from Ohio?
- When is it highest in sky?
- When does it set below horizon?
- How long is observation window?

**Solution**:
```
Rise time: ~20:00 EDT (sunset + rotation time)
Peak altitude: ~22:00 EDT (+22° above horizon)
Set time: ~02:00 EDT (2 hours past midnight)
Window: 6 hours total
```

---

## NIGHT OF AUGUST 15-16, 1977

### Full Timeline

```
19:30 EDT — Sunset (Big Ear becomes operational)
20:00 EDT — Source rises above horizon (Az 315°, Alt +2°)
20:15 EDT — Big Ear scans enter target region (acquisition begins)
21:00 EDT — Source well-positioned (Az 305°, Alt +8°)
22:00 EDT — Source at peak visibility (Az 295°, Alt +17°)
23:16 EDT — **WOW! SIGNAL DETECTED** ⭐
           (72-second observation, One complete scan cycle)
           (Az 289°, Alt +21°)
           (Frequency 1420.4055 MHz)
           (Amplitude: 30× background noise)
           (Duration: Exactly one Big Ear scan)
23:45 EDT — Scan moves away from target region
00:30 EDT — Source still visible but descending (Az 285°, Alt +12°)
02:00 EDT — Source sets below horizon (Az 265°, Alt -1°)
02:30 EDT — Observation window closes (darkness over)
```

### Why That Specific Time?

The **72-second observation window** was determined by:
1. **Big Ear scan rate**: ~10 seconds per degree (sidereal drift)
2. **Beam width**: ~30 arcminutes
3. **One complete scan**: Time for Earth's rotation to move sky across fixed antenna beam
4. **Wow! duration**: Exactly one scan duration (coincidence? or designed signal?)

---

## VALIDATOR TRAINING EXERCISE

### Design A Modern Observation (August 15, 2026)

**Your Challenge**: 
Replicate 1977 Wow! observation using 21st-century equipment.

**Assignment**:
1. **Identify** exact sky coordinates (celestial sphere location)
2. **Calculate** observation geometry from three sites (VLA, GBT, international)
3. **Plan** simultaneous observation (timing, frequency, sensitivity)
4. **Predict** what modern equipment would see if Wow! repeated
5. **Design** decision tree (what results mean what)

**Expected Output**: 
- Detailed observation proposal (telescope time application)
- Expected discovery potential
- Timeline to results

---

## CLOSING

The Wow! signal was observed at:

**Azimuth**: 289° (nearly due west, slightly north)  
**Altitude**: +21° above horizon  
**Location**: Columbus, Ohio (40°N, 83°W)  
**Time**: 11:16 PM EDT, August 15, 1977  
**Duration**: 72 seconds (one complete antenna scan)

In 2026, validators will look at the same region of sky on the same date.

If the signal repeats, they'll know by August 6 + 6 months.

The geometry hasn't changed. Only the equipment, the precision, and the commitment to truth.

---

**Document Status**: ASTRONOMICAL REFERENCE  
**Use**: Validator training, observation planning, replication design  
**Accuracy**: J2000.0 epoch, modern astronomical conventions
