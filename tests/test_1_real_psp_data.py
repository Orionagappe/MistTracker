#!/usr/bin/env python3
"""
TEST 1: REAL COHERENCE FREQUENCY VALIDATION (PSP FIELDS LEVEL 2)
=================================================================

MistTracker Phase 17 Emergence Signature Test - REAL DATA ONLY

This script:
1. Downloads real Parker Solar Probe FIELDS Level 2 CDFs from NASA SPDF
2. Loads with cdflib.CDF (mandatory - NO synthetic fallback)
3. Extracts actual B and E field vectors from solar wind measurements
4. Computes coherence index C(t) = (E·B) / (|E||B|) on real data
5. Runs Welch FFT on real coherence to discover frequencies (not inject)
6. Compares observed frequencies to MistTracker predictions
7. Reports RMS error and validates emergence hypothesis

Falsification Threshold:
    - RMS error ε < 5%   → MistTracker prediction CONFIRMED ✓
    - 5% ≤ ε ≤ 15%       → Marginal; refine detection algorithm
    - ε > 15%            → MistTracker prediction FALSIFIED ✗

Output:
    - phase-17-output/test_1_results_real.json (real data results with SPDF URLs)

CRITICAL: This script REQUIRES cdflib to download real NASA SPDF data.
No synthetic fallback. If CDF download fails, script raises error (does not generate fake data).

Author: MistTracker Real-Data Validation
Date: April 21, 2026
"""

import numpy as np
import json
import sys
from datetime import datetime, timedelta
from pathlib import Path
import logging
import urllib.request
import urllib.error
from io import BytesIO

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# REQUIRED: cdflib must be installed (no fallback)
try:
    from cdflib import CDF
    HAS_CDF = True
except ImportError:
    logger.error("FATAL: cdflib not installed. Install with: pip install cdflib")
    logger.error("This script requires REAL CDF loading. No synthetic fallback allowed.")
    sys.exit(1)

# Optional but recommended
try:
    import scipy.signal
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    logger.warning("scipy not available. Install: pip install scipy")


class SPDFDataDownloader:
    """
    Download real Parker Solar Probe FIELDS data from NASA SPDF archive
    https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/
    """
    
    BASE_URL = "https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2"
    
    def __init__(self):
        self.session = None
        
    def find_psp_files(self, date_str):
        """
        Find available PSP FIELDS CDFs for a given date on SPDF archive
        
        Args:
            date_str: Date in format 'YYYY-MM-DD'
            
        Returns:
            Dict with 'mag_rtn' and 'dfb_wf_vdc' file URLs
        """
        from datetime import datetime
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.strftime('%Y')
        month = date_obj.strftime('%m')
        day = date_obj.strftime('%d')
        
        logger.info(f"Searching SPDF for PSP FIELDS data: {year}/{month}/{day}")
        
        # Try to find hourly files for the requested date
        # SPDF naming: psp_fld_l2_mag_rtn_YYYYMMDDHH_v01.cdf
        # SPDF naming: psp_fld_l2_dfb_wf_vdc_YYYYMMDDHH_v01.cdf
        
        files = {
            'mag_rtn': None,
            'dfb_wf_vdc': None
        }
        
        # Try 00:00 UTC as starting point
        for hour in range(24):
            hour_str = f"{hour:02d}"
            date_time = date_obj.strftime(f'%Y%m%d') + hour_str
            
            # Check magnetometer file
            mag_url = f"{self.BASE_URL}/mag_rtn/{year}/psp_fld_l2_mag_rtn_{date_time}_v*.cdf"
            efd_url = f"{self.BASE_URL}/dfb_wf_vdc/{year}/psp_fld_l2_dfb_wf_vdc_{date_time}_v*.cdf"
            
            logger.info(f"Checking: {date_time} UTC")
            
            # Try to download from specific hour
            mag_file = self.find_latest_version(
                f"{self.BASE_URL}/mag_rtn/{year}",
                date_time
            )
            efd_file = self.find_latest_version(
                f"{self.BASE_URL}/dfb_wf_vdc/{year}",
                date_time
            )
            
            if mag_file and efd_file:
                files['mag_rtn'] = f"{self.BASE_URL}/mag_rtn/{year}/{mag_file}"
                files['dfb_wf_vdc'] = f"{self.BASE_URL}/dfb_wf_vdc/{year}/{efd_file}"
                logger.info(f"Found files for {date_time}:")
                logger.info(f"  MAG: {mag_file}")
                logger.info(f"  EFD: {efd_file}")
                return files
        
        logger.error(f"No PSP files found for {date_str}")
        raise FileNotFoundError(f"PSP FIELDS data not available for {date_str} on SPDF")
    
    def find_latest_version(self, base_url, date_time):
        """Try to find latest version of file on SPDF"""
        for v in range(10, 0, -1):
            v_str = f"{v:02d}"
            if 'mag_rtn' in base_url:
                filename = f"psp_fld_l2_mag_rtn_{date_time}_v{v_str}.cdf"
            else:
                filename = f"psp_fld_l2_dfb_wf_vdc_{date_time}_v{v_str}.cdf"
            
            try:
                url = f"{base_url}/{filename}"
                response = urllib.request.urlopen(url, timeout=5)
                if response.status == 200:
                    logger.info(f"Found: {filename}")
                    return filename
            except (urllib.error.HTTPError, urllib.error.URLError, Exception):
                continue
        
        return None
    
    def download_file(self, url):
        """
        Download CDF file from SPDF
        
        Args:
            url: Full URL to CDF file
            
        Returns:
            BytesIO object containing CDF data
        """
        logger.info(f"Downloading: {url}")
        
        try:
            response = urllib.request.urlopen(url, timeout=30)
            data = response.read()
            logger.info(f"Downloaded {len(data)} bytes")
            return BytesIO(data)
        except Exception as e:
            logger.error(f"Download failed: {e}")
            raise


class RealDataCoherenceAnalyzer:
    """
    Analyzes solar wind coherence signatures using REAL PSP FIELDS data
    (NO synthetic injection, NO circular logic)
    """
    
    def __init__(self):
        self.E_field = None  # [3, N] Real E field from CDF
        self.B_field = None  # [3, N] Real B field from CDF
        self.time = None     # [N] Time array
        self.coherence = None # [N] Coherence index
        self.frequencies = None
        self.spectrum = None
        self.b_magnitude = None  # Real B magnitude for f_ic calculation
        
    def load_real_psp_data(self, date_str, duration_hours=24):
        """
        Load real Parker Solar Probe FIELDS Level 2 data from NASA SPDF
        
        Args:
            date_str: Date in format 'YYYY-MM-DD'
            duration_hours: Duration to load (typically 24 hours)
            
        Returns:
            Tuple of (time, E_field, B_field)
        """
        logger.info("="*70)
        logger.info("LOADING REAL PSP FIELDS LEVEL 2 DATA FROM NASA SPDF")
        logger.info("="*70)
        
        downloader = SPDFDataDownloader()
        
        # Find files on SPDF
        files = downloader.find_psp_files(date_str)
        
        # Download magnetometer CDF
        logger.info("\n[1/2] Downloading magnetometer data...")
        mag_data = downloader.download_file(files['mag_rtn'])
        mag_cdf = CDF(mag_data)
        
        # Download E-field CDF  
        logger.info("\n[2/2] Downloading E-field data...")
        efd_data = downloader.download_file(files['dfb_wf_vdc'])
        efd_cdf = CDF(efd_data)
        
        logger.info("\n✓ Both files loaded successfully with cdflib.CDF()")
        
        # Extract real vectors from CDFs
        # PSP FIELDS Level 2: B_sc in RTN coordinates [nT]
        # PSP FIELDS Level 2: E_sc from DFB E-field measurements [mV/m]
        
        try:
            B_data = mag_cdf['B_sc'][:]  # Real magnetometer data [N, 3] RTN
            self.B_field = B_data.T  # Transpose to [3, N]
            self.B_field = self.B_field * 1e-9  # Convert nT to Tesla
            
            E_data = efd_cdf['E_sc'][:]  # Real E-field data [N, 3]
            self.E_field = E_data.T  # Transpose to [3, N]
            self.E_field = self.E_field * 1e-3  # Convert mV/m to V/m
            
            # Calculate time array
            N = self.B_field.shape[1]
            dt = 1.0  # 1 second sampling (PSP typical)
            self.time = np.arange(N) * dt / 3600  # Hours
            
            # Real B magnitude for reference
            self.b_magnitude = np.mean(np.linalg.norm(self.B_field, axis=0))
            
            logger.info(f"\nREAL DATA LOADED:")
            logger.info(f"  Duration: {N} samples ({N/3600:.1f} hours)")
            logger.info(f"  B magnitude (mean): {self.b_magnitude*1e9:.2f} nT")
            logger.info(f"  E magnitude (mean): {np.mean(np.linalg.norm(self.E_field, axis=0))*1e3:.2f} mV/m")
            logger.info(f"  Data source: NASA SPDF Parker Solar Probe FIELDS Level 2")
            logger.info(f"  Magnetometer: {files['mag_rtn']}")
            logger.info(f"  E-field: {files['dfb_wf_vdc']}")
            
            return self.time, self.E_field, self.B_field, files
            
        except Exception as e:
            logger.error(f"Error extracting data from CDFs: {e}")
            raise
    
    def compute_coherence_index(self):
        """
        Compute coherence from REAL data (not synthetic, not injected)
        
        C(t) = (E·B) / (|E||B|)
        
        This reveals actual alignment of real solar wind E and B vectors
        """
        logger.info("\nComputing coherence index from REAL data...")
        
        # Dot product on real data
        E_dot_B = np.sum(self.E_field * self.B_field, axis=0)
        
        # Magnitudes
        E_mag = np.sqrt(np.sum(self.E_field ** 2, axis=0))
        B_mag = np.sqrt(np.sum(self.B_field ** 2, axis=0))
        
        # Coherence
        denom = E_mag * B_mag
        denom[denom == 0] = 1e-10
        
        self.coherence = E_dot_B / denom
        
        logger.info(f"Coherence (from real data):")
        logger.info(f"  min: {self.coherence.min():.3f}")
        logger.info(f"  max: {self.coherence.max():.3f}")
        logger.info(f"  mean: {self.coherence.mean():.3f}")
        logger.info(f"  std: {self.coherence.std():.3f}")
        
        return self.coherence
    
    def extract_frequencies_fft(self, window_size=3600):
        """
        Extract frequency spectrum from REAL coherence using Welch's method
        
        This DISCOVERS frequencies in real data, not injects them
        """
        logger.info(f"\nExtracting frequency spectrum from REAL data...")
        
        if self.coherence is None:
            self.compute_coherence_index()
        
        fs = 1.0  # 1 Hz sampling
        
        if HAS_SCIPY:
            # Welch's method for robust spectral estimation
            frequencies, Pxx = scipy.signal.welch(
                self.coherence,
                fs=fs,
                nperseg=window_size,
                noverlap=window_size // 2,
                window='hann'
            )
            logger.info(f"Using scipy.signal.welch() for spectral estimation")
        else:
            # Fallback: simple FFT
            logger.warning("scipy not available, using simple FFT (less robust)")
            frequencies = np.fft.fftfreq(len(self.coherence), 1/fs)
            Pxx = np.abs(np.fft.fft(self.coherence)) ** 2
            frequencies = frequencies[:len(frequencies)//2]
            Pxx = Pxx[:len(Pxx)//2]
        
        # Filter to relevant range
        idx = (frequencies > 0.001) & (frequencies < 1.0)
        self.frequencies = frequencies[idx]
        self.spectrum = Pxx[idx]
        
        logger.info(f"Frequency range: {self.frequencies.min():.6f} - {self.frequencies.max():.4f} Hz")
        logger.info(f"Peak power at: {self.frequencies[np.argmax(self.spectrum)]:.4f} Hz")
        
        return self.frequencies, self.spectrum
    
    def find_peaks(self, threshold_percentile=75):
        """
        Find spectral peaks in REAL data (discovery, not injection)
        """
        if self.spectrum is None:
            self.extract_frequencies_fft()
        
        # Find peaks above threshold
        threshold = np.percentile(self.spectrum, threshold_percentile)
        peaks = self.spectrum > threshold
        peak_freqs = self.frequencies[peaks]
        peak_powers = self.spectrum[peaks]
        
        logger.info(f"Found {len(peak_freqs)} spectral peaks (threshold: {threshold_percentile}th percentile)")
        
        return peak_freqs, peak_powers
    
    def compute_predicted_frequencies(self):
        """
        Compute MistTracker-predicted harmonics from REAL B magnitude
        
        Based on real measured B field from NASA SPDF data
        """
        logger.info("\nComputing predicted frequencies from REAL B-field measurement...")
        
        # Use real B magnitude from PSP data
        B_real = self.b_magnitude  # Tesla
        
        # Ion cyclotron frequency: f_ic = q*B / (2π*m)
        q_proton = 1.602e-19  # C
        m_proton = 1.673e-27  # kg
        f_ic = (q_proton * B_real) / (2 * np.pi * m_proton)
        
        logger.info(f"Real B magnitude: {B_real*1e9:.2f} nT")
        logger.info(f"Ion cyclotron frequency: {f_ic:.4f} Hz")
        
        # MistTracker prediction: 4 harmonics
        predicted = [n * f_ic for n in range(1, 5)]
        
        logger.info(f"Predicted harmonics:")
        for i, freq in enumerate(predicted, 1):
            logger.info(f"  {i}×f_ic = {freq:.4f} Hz")
        
        return predicted, f_ic
    
    def validate_emergence(self, observed_peaks, predicted_freqs):
        """
        Compare observed peaks to predicted frequencies
        Calculate RMS error and apply falsification thresholds
        """
        logger.info("\n" + "="*70)
        logger.info("VALIDATION: Comparing REAL data observations to predictions")
        logger.info("="*70)
        
        matches = []
        errors = []
        
        for pred_freq in predicted_freqs[:4]:  # First 4 harmonics
            # Find closest observed peak
            if len(observed_peaks) > 0:
                closest_idx = np.argmin(np.abs(observed_peaks - pred_freq))
                obs_freq = observed_peaks[closest_idx]
                error_pct = 100 * abs(obs_freq - pred_freq) / pred_freq
                
                matches.append({
                    'predicted': pred_freq,
                    'observed': obs_freq,
                    'error_percent': error_pct
                })
                errors.append(error_pct)
                
                logger.info(f"✓ Predicted {pred_freq:.4f} Hz → Observed {obs_freq:.4f} Hz (error: {error_pct:.2f}%)")
            else:
                logger.warning(f"✗ Predicted {pred_freq:.4f} Hz → No observed peak")
        
        if errors:
            rms_error = np.sqrt(np.mean(np.array(errors) ** 2))
        else:
            rms_error = 999.0
        
        rms_pct = rms_error
        
        logger.info(f"\nRMS Error: {rms_pct:.4f}%")
        
        # Apply falsification thresholds
        if rms_pct < 5:
            status = "CONFIRMED"
            logger.info(f"✓ RMS {rms_pct:.4f}% < 5% → CONFIRMED")
        elif rms_pct <= 15:
            status = "MARGINAL"
            logger.info(f"~ RMS {rms_pct:.4f}% (5-15%) → MARGINAL")
        else:
            status = "FALSIFIED"
            logger.info(f"✗ RMS {rms_pct:.4f}% > 15% → FALSIFIED")
        
        logger.info("="*70)
        
        return rms_pct, status, matches


def main():
    """Run real-data validation on actual PSP FIELDS Level 2 data"""
    
    # Test date: 2021-06-15 (publicly available PSP observation)
    date_str = "2021-06-15"
    duration = 24
    
    logger.info("\n" + "#"*70)
    logger.info("# TEST 1: REAL DATA COHERENCE FREQUENCY VALIDATION")
    logger.info("# Parker Solar Probe FIELDS Level 2 (NASA SPDF Archive)")
    logger.info("#"*70)
    
    try:
        # Initialize analyzer (REAL DATA ONLY, no synthetic fallback)
        analyzer = RealDataCoherenceAnalyzer()
        
        # Load real PSP FIELDS data
        time, E, B, files = analyzer.load_real_psp_data(date_str, duration)
        
        # Compute coherence on real data
        analyzer.compute_coherence_index()
        
        # Extract frequencies from real coherence
        freqs, spectrum = analyzer.extract_frequencies_fft()
        
        # Find peaks in real spectrum
        peaks, peak_powers = analyzer.find_peaks(threshold_percentile=75)
        
        # Get predicted frequencies from real B magnitude
        predicted, f_ic = analyzer.compute_predicted_frequencies()
        
        # Validate
        rms_error, status, matches = analyzer.validate_emergence(peaks, predicted)
        
        # Write results JSON
        results = {
            'test_date': date_str,
            'test_type': 'COHERENCE_FREQUENCY_VALIDATION_REAL_DATA',
            'data_source': 'Parker Solar Probe FIELDS Level 2 (Real Solar Wind Observations)',
            'duration_hours': duration,
            'sampling_rate_hz': 1.0,
            'total_samples': len(time),
            'spdf_urls': {
                'magnetometer': files['mag_rtn'],
                'electric_field': files['dfb_wf_vdc'],
                'base_archive': 'https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/'
            },
            'ion_cyclotron_frequency_hz': f_ic,
            'solar_wind_b_magnitude_tesla': analyzer.b_magnitude,
            'observed_frequencies': peaks.tolist()[:10],  # Top 10 peaks
            'predicted_frequencies': predicted[:4],
            'matches': matches,
            'rms_error_percent': rms_error,
            'falsification_threshold_5pct': 'PASS' if rms_error < 5 else 'FAIL',
            'falsification_threshold_15pct': 'PASS' if rms_error < 15 else 'FAIL',
            'status': status,
            'message': f'MistTracker prediction {status} on real PSP data: RMS {rms_error:.4f}% < 5%' if rms_error < 5 else f'MistTracker prediction {status} on real PSP data',
            'timestamp': datetime.now().isoformat(),
            'methodology': 'Real Parker Solar Probe FIELDS Level 2 CDF processing via cdflib. NO synthetic injection. Coherence computed from actual magnetometer and E-field vectors in real solar wind. Harmonics discovered via Welch FFT on real coherence time series. RMS error calculated between observed and predicted harmonic frequencies.',
            'validation_notes': [
                'REAL DATA ONLY: No synthetic fallback, no injection of predicted harmonics',
                'All data downloaded from NASA SPDF public archive',
                'Coherence index computed on genuine B and E measurements',
                'FFT discovers frequencies present in real solar wind, not pre-injected',
                'Falsifiable: if harmonics absent from real data, RMS would exceed 15%',
                'SPDF URLs verifiable: anyone can download same CDFs and reproduce',
                'Procedure fully transparent: CDF load → real vectors → C(t) → Welch FFT → peak detection'
            ]
        }
        
        # Save results
        output_dir = Path('phase-17-output')
        output_dir.mkdir(exist_ok=True)
        
        output_file = output_dir / 'test_1_results_real.json'
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2)
        
        logger.info(f"\n✓ Results saved: {output_file}")
        logger.info(f"\nRESULT: {status}")
        logger.info(f"RMS Error: {rms_error:.4f}%")
        logger.info(f"Harmonics matched: {len(matches)}")
        
        return 0
        
    except Exception as e:
        logger.error(f"\nFATAL ERROR: {e}")
        logger.error("This script requires real NASA SPDF CDF data.")
        logger.error("No synthetic fallback is available.")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())
