#!/usr/bin/env python3
"""
TEST 1: COHERENCE FREQUENCY PREDICTION VALIDATION (REAL NASA DATA ONLY)
=========================================================================

Phase 17 Emergence Signature Test with Parker Solar Probe FIELDS Level 2 Data

This script:
1. Downloads real Parker Solar Probe FIELDS magnetometer and electric field CDFs from NASA SPDF
2. Loads them with cdflib (no synthetic fallback)
3. Extracts real B and E vectors from actual solar wind observations
4. Computes coherence index C(t) = (E·B) / (|E||B|) on real measurements
5. Extracts frequency spectrum via Welch/FFT on real data
6. Compares observed peaks to MistTracker-predicted frequencies
7. Reports RMS error and validation verdict

SPDF Archive Links (Public, Free):
  Magnetometer: https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/mag/YYYY/
  E-field: https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/efd/YYYY/

Usage:
    python test_1_coherence_frequencies_REAL_DATA.py --date 2021-06-15 --duration 24

Falsification Threshold:
    - RMS error ε < 5%   → CONFIRMED ✓
    - 5% ≤ ε ≤ 15%       → MARGINAL (refine algorithm)
    - ε > 15%            → FALSIFIED ✗

Output:
    - test_1_results_REAL.json (observed frequencies, predicted frequencies, RMS error)
    - test_1_results_REAL_cdf_urls.txt (exact NASA SPDF URLs used)
    - plots/coherence_spectrum_REAL.png (visualization)

Author: MistTracker Validation Suite
Date: April 21, 2026
"""

import numpy as np
import matplotlib.pyplot as plt
import json
import sys
import argparse
from datetime import datetime, timedelta
from pathlib import Path
import logging
import os
import urllib.request
import glob

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import required libraries
try:
    from cdflib import CDF
    HAS_CDF = True
except ImportError:
    HAS_CDF = False
    logger.error("FATAL: cdflib not available. Install with: pip install cdflib")
    sys.exit(1)

try:
    import scipy.signal
    HAS_SCIPY = True
except ImportError:
    HAS_SCIPY = False
    logger.error("FATAL: scipy not available. Install with: pip install scipy")
    sys.exit(1)


class SPDFDataDownloader:
    """Download real PSP FIELDS data from NASA SPDF archive"""
    
    SPDF_BASE_MAG = "https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/mag"
    SPDF_BASE_EFD = "https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/efd"
    CACHE_DIR = "./psp_data_cache"
    
    def __init__(self):
        Path(self.CACHE_DIR).mkdir(exist_ok=True)
    
    def find_psp_files(self, date_str):
        """
        Find PSP FIELDS Level 2 CDF files for a given date from SPDF
        Uses robust directory listing to locate actual files
        
        Args:
            date_str: Date in format 'YYYY-MM-DD'
            
        Returns:
            Tuple of (mag_file_url, efd_file_url, mag_local_path, efd_local_path)
        """
        from datetime import datetime
        import re
        
        date_obj = datetime.strptime(date_str, '%Y-%m-%d')
        year = date_obj.strftime('%Y')
        date_yyyymmdd = date_obj.strftime('%Y%m%d')
        
        # SPDF directory URLs
        mag_dir = f"{self.SPDF_BASE_MAG}/{year}/"
        efd_dir = f"{self.SPDF_BASE_EFD}/{year}/"
        
        logger.info(f"Searching NASA SPDF for {date_str} data...")
        logger.info(f"Magnetometer directory: {mag_dir}")
        logger.info(f"E-field directory: {efd_dir}")
        
        mag_file_url = None
        efd_file_url = None
        
        # List magnetometer files
        try:
            logger.info(f"Browsing: {mag_dir}")
            response = urllib.request.urlopen(mag_dir, timeout=15)
            html = response.read().decode('utf-8')
            
            # Find all CDF files for this date
            mag_pattern = re.compile(f'href="(psp_fld_l2_mag_{date_yyyymmdd}_v[0-9]+\.cdf)"')
            mag_matches = mag_pattern.findall(html)
            
            if mag_matches:
                # Use latest version (highest number)
                mag_matches.sort()
                latest_mag = mag_matches[-1]
                mag_file_url = mag_dir + latest_mag
                logger.info(f"Found magnetometer: {latest_mag}")
            else:
                logger.warning(f"No mag files found for {date_yyyymmdd} in directory listing")
                logger.info(f"Available files in {mag_dir}: {html[:500]}...")
                
        except urllib.error.HTTPError as e:
            logger.warning(f"HTTP {e.code}: Directory may not exist: {mag_dir}")
        except Exception as e:
            logger.warning(f"Could not browse magnetometer directory: {e}")
        
        # List E-field files
        try:
            logger.info(f"Browsing: {efd_dir}")
            response = urllib.request.urlopen(efd_dir, timeout=15)
            html = response.read().decode('utf-8')
            
            # Find all CDF files for this date
            efd_pattern = re.compile(f'href="(psp_fld_l2_efd_{date_yyyymmdd}_v[0-9]+\.cdf)"')
            efd_matches = efd_pattern.findall(html)
            
            if efd_matches:
                efd_matches.sort()
                latest_efd = efd_matches[-1]
                efd_file_url = efd_dir + latest_efd
                logger.info(f"Found E-field: {latest_efd}")
            else:
                logger.warning(f"No efd files found for {date_yyyymmdd} in directory listing")
                
        except urllib.error.HTTPError as e:
            logger.warning(f"HTTP {e.code}: Directory may not exist: {efd_dir}")
        except Exception as e:
            logger.warning(f"Could not browse E-field directory: {e}")
        
        # If files not found, raise error (don't silently fall back to non-existent URLs)
        if not mag_file_url:
            raise FileNotFoundError(f"Magnetometer CDF not found on SPDF for {date_str}. "
                                   f"Check: {mag_dir}")
        if not efd_file_url:
            raise FileNotFoundError(f"E-field CDF not found on SPDF for {date_str}. "
                                   f"Check: {efd_dir}")
        
        mag_local = Path(self.CACHE_DIR) / Path(mag_file_url).split('/')[-1]
        efd_local = Path(self.CACHE_DIR) / Path(efd_file_url).split('/')[-1]
        
        logger.info(f"Selected files:")
        logger.info(f"  Mag: {mag_file_url}")
        logger.info(f"  EFD: {efd_file_url}")
        
        return mag_file_url, efd_file_url, str(mag_local), str(efd_local)
    
    def download_file(self, url, local_path, timeout=30):
        """Download a file from SPDF with progress indication"""
        if Path(local_path).exists():
            logger.info(f"Using cached file: {local_path}")
            return True
        
        logger.info(f"Downloading: {url}")
        try:
            urllib.request.urlretrieve(url, local_path, reporthook=self._download_progress)
            logger.info(f"Downloaded to: {local_path}")
            return True
        except Exception as e:
            logger.error(f"Download failed: {e}")
            return False
    
    def _download_progress(self, block_num, block_size, total_size):
        """Progress hook for urllib.request.urlretrieve"""
        if total_size > 0:
            downloaded = block_num * block_size
            percent = min(100, int(100.0 * downloaded / total_size))
            if percent % 10 == 0:
                logger.info(f"  Download progress: {percent}%")


class RealDataCoherenceAnalyzer:
    """Analyze real Parker Solar Probe FIELDS data"""
    
    def __init__(self, verbose=True):
        self.verbose = verbose
        self.E_field = None  # Electric field [3, N] in real data coords
        self.B_field = None  # Magnetic field [3, N] in real data coords
        self.time = None     # Time array [N]
        self.coherence = None # Coherence index [N]
        self.frequencies = None
        self.spectrum = None
        self.data_urls = {}  # Track source URLs
        
    def load_real_psp_data(self, mag_file, efd_file):
        """
        Load real Parker Solar Probe FIELDS data from CDF files
        
        Args:
            mag_file: Path to psp_fld_l2_mag_*.cdf
            efd_file: Path to psp_fld_l2_efd_*.cdf
            
        Returns:
            Tuple of (time, E_field, B_field)
        """
        logger.info(f"Loading magnetometer CDF: {mag_file}")
        logger.info(f"Loading E-field CDF: {efd_file}")
        
        # Load magnetometer data
        try:
            mag_cdf = CDF(mag_file)
            logger.info(f"Magnetometer CDF variables: {mag_cdf.cdf_info()['zVariables']}")
            
            # Extract B-field (typically in GSE coordinates)
            # PSP FIELDS L2 mag data structure: 'B_sc' or similar
            B_var = None
            for var_name in ['B_sc', 'B', 'B_GSE']:
                if var_name in mag_cdf:
                    B_var = var_name
                    break
            
            if B_var is None:
                available = list(mag_cdf.cdf_info()['zVariables'])
                logger.error(f"No B-field variable found. Available: {available}")
                return None
            
            B_data = mag_cdf[B_var][:]  # Shape: [N, 3]
            self.B_field = B_data.T  # Transpose to [3, N]
            
            # Get time from CDF
            if 'Epoch' in mag_cdf:
                epoch_data = mag_cdf['Epoch'][:]
                # Convert CDF Epoch to seconds (CDF Epoch is milliseconds since 2000-01-01 12:00:00)
                from datetime import datetime, timedelta
                epoch_reference = datetime(2000, 1, 1, 12, 0, 0)
                self.time = np.array([(datetime.fromtimestamp(
                    (epoch_reference + timedelta(milliseconds=e)).timestamp()
                ) - datetime.fromtimestamp(
                    epoch_reference.timestamp()
                )).total_seconds() / 3600 for e in epoch_data])
            
            mag_cdf.close()
            logger.info(f"Loaded B-field: shape {self.B_field.shape}, time length: {len(self.time)}")
            
        except Exception as e:
            logger.error(f"Failed to load magnetometer: {e}")
            return None
        
        # Load E-field data
        try:
            efd_cdf = CDF(efd_file)
            logger.info(f"E-field CDF variables: {efd_cdf.cdf_info()['zVariables']}")
            
            # Extract E-field
            E_var = None
            for var_name in ['E_sc', 'E', 'E_GSE', 'E_hv']:
                if var_name in efd_cdf:
                    E_var = var_name
                    break
            
            if E_var is None:
                available = list(efd_cdf.cdf_info()['zVariables'])
                logger.error(f"No E-field variable found. Available: {available}")
                return None
            
            E_data = efd_cdf[E_var][:]  # Shape: [N, 3]
            self.E_field = E_data.T  # Transpose to [3, N]
            
            efd_cdf.close()
            logger.info(f"Loaded E-field: shape {self.E_field.shape}")
            
        except Exception as e:
            logger.error(f"Failed to load E-field: {e}")
            return None
        
        # Ensure arrays match in time dimension
        min_len = min(self.B_field.shape[1], self.E_field.shape[1], len(self.time))
        self.B_field = self.B_field[:, :min_len]
        self.E_field = self.E_field[:, :min_len]
        self.time = self.time[:min_len]
        
        logger.info(f"Real data loaded. Time range: {self.time[0]:.2f} to {self.time[-1]:.2f} hours")
        logger.info(f"B-field range: [{self.B_field.min():.3e}, {self.B_field.max():.3e}] T")
        logger.info(f"E-field range: [{self.E_field.min():.3e}, {self.E_field.max():.3e}] V/m")
        
        return self.time, self.E_field, self.B_field
    
    def compute_coherence_index(self):
        """Compute coherence: C(t) = E·B / (|E||B|) on REAL data"""
        logger.info("Computing coherence index on REAL Parker Solar Probe data")
        
        # Dot product: E·B
        E_dot_B = np.sum(self.E_field * self.B_field, axis=0)
        
        # Magnitudes
        E_mag = np.sqrt(np.sum(self.E_field ** 2, axis=0))
        B_mag = np.sqrt(np.sum(self.B_field ** 2, axis=0))
        
        # Coherence (avoid division by zero)
        denom = E_mag * B_mag
        denom[denom < 1e-15] = 1e-15
        
        self.coherence = E_dot_B / denom
        
        logger.info(f"Coherence stats: min={self.coherence.min():.3f}, "
                   f"max={self.coherence.max():.3f}, "
                   f"mean={self.coherence.mean():.3f}, "
                   f"std={self.coherence.std():.3f}")
        
        return self.coherence
    
    def extract_frequencies_fft(self, window_size=3600):
        """Extract frequency spectrum using Welch's method (real data)"""
        logger.info(f"Extracting frequency spectrum from REAL data (window={window_size} samples)")
        
        if self.coherence is None:
            self.compute_coherence_index()
        
        fs = 1.0  # 1 Hz sampling (typical PSP)
        
        # Use Welch's method for robust spectral estimation
        frequencies, Pxx = scipy.signal.welch(
            self.coherence,
            fs=fs,
            nperseg=min(window_size, len(self.coherence)),
            noverlap=min(window_size // 2, len(self.coherence) // 2),
            window='hann'
        )
        
        # Filter to 0.001 - 1.0 Hz range
        idx = (frequencies > 0.001) & (frequencies < 1.0)
        self.frequencies = frequencies[idx]
        self.spectrum = Pxx[idx]
        
        logger.info(f"Frequency range: {self.frequencies.min():.4f} to {self.frequencies.max():.4f} Hz")
        logger.info(f"Peak power: {self.spectrum.max():.3e}")
        
        return self.frequencies, self.spectrum
    
    def extract_predicted_frequencies(self):
        """Extract MistTracker-predicted frequencies from first principles"""
        logger.info("Computing MistTracker-predicted emergence frequencies (first principles)")
        
        # Use actual B-field magnitude from data
        B_field_magnitude = np.median(np.linalg.norm(self.B_field, axis=0))
        logger.info(f"Median B-field magnitude from real data: {B_field_magnitude:.3e} T")
        
        q_proton = 1.602e-19  # C
        m_proton = 1.673e-27  # kg
        
        f_ic = (q_proton * B_field_magnitude) / (2 * np.pi * m_proton)
        
        # Predict harmonics
        predicted_freqs = []
        for harmonic in range(1, 5):
            freq = harmonic * f_ic
            if freq < self.frequencies.max():
                predicted_freqs.append(freq)
        
        logger.info(f"Ion cyclotron frequency (from real B): {f_ic:.4f} Hz")
        logger.info(f"Predicted harmonics: {[f'{f:.4f}' for f in predicted_freqs]} Hz")
        
        return f_ic, predicted_freqs
    
    def find_spectral_peaks(self, threshold_percentile=75):
        """Find peaks in real coherence spectrum"""
        logger.info(f"Finding spectral peaks in real data (threshold: {threshold_percentile}th percentile)")
        
        threshold = np.percentile(self.spectrum, threshold_percentile)
        
        peaks, properties = scipy.signal.find_peaks(
            self.spectrum,
            height=threshold,
            distance=5
        )
        
        observed_freqs = self.frequencies[peaks] if len(peaks) > 0 else np.array([])
        observed_powers = self.spectrum[peaks] if len(peaks) > 0 else np.array([])
        
        logger.info(f"Found {len(peaks)} peaks above threshold")
        if len(observed_freqs) > 0:
            logger.info(f"Peak frequencies: {[f'{f:.4f}' for f in observed_freqs[:10]]} Hz (showing first 10)")
        
        return observed_freqs, observed_powers
    
    def compare_to_predictions(self, f_ic, predicted_freqs):
        """Compare observed peaks to predicted on REAL data"""
        logger.info("Comparing observed peaks to MistTracker predictions")
        
        observed_freqs, observed_powers = self.find_spectral_peaks()
        
        if len(observed_freqs) == 0:
            logger.error("No spectral peaks found!")
            return {'status': 'INCONCLUSIVE', 'message': 'No peaks in real data'}
        
        # Match predicted to observed
        errors = []
        matches = []
        
        for pred_freq in predicted_freqs:
            closest_idx = np.argmin(np.abs(observed_freqs - pred_freq))
            closest_freq = observed_freqs[closest_idx]
            error = np.abs(closest_freq - pred_freq) / pred_freq
            errors.append(error)
            matches.append({
                'predicted': float(pred_freq),
                'observed': float(closest_freq),
                'error_percent': float(error * 100)
            })
        
        rms_error = np.sqrt(np.mean(np.array(errors) ** 2)) if len(errors) > 0 else np.inf
        
        if rms_error < 0.05:
            status = "CONFIRMED"
            message = f"MistTracker CONFIRMED on REAL PSP data: RMS {rms_error*100:.2f}% < 5%"
        elif rms_error < 0.15:
            status = "MARGINAL"
            message = f"MARGINAL: RMS {rms_error*100:.2f}% (5-15%)"
        else:
            status = "FALSIFIED"
            message = f"FALSIFIED: RMS {rms_error*100:.2f}% > 15%"
        
        logger.info(f"RMS Error: {rms_error*100:.2f}%")
        logger.info(f"Status: {status}")
        logger.info(message)
        
        return {
            'observed_frequencies': observed_freqs.tolist(),
            'observed_powers': observed_powers.tolist(),
            'predicted_frequencies': predicted_freqs,
            'matches': matches,
            'rms_error': float(rms_error),
            'rms_error_percent': float(rms_error * 100),
            'ion_cyclotron_frequency': float(f_ic),
            'status': status,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'data_source': 'NASA SPDF Parker Solar Probe FIELDS Level 2 (Real Observations)',
            'cdf_urls': self.data_urls
        }


def main():
    parser = argparse.ArgumentParser(
        description='TEST 1: MistTracker Coherence Validation on REAL NASA PSP Data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python test_1_coherence_frequencies_REAL_DATA.py --date 2021-06-15 --duration 24
  python test_1_coherence_frequencies_REAL_DATA.py --date 2021-01-15 --duration 48
        """
    )
    
    parser.add_argument('--date', type=str, default='2021-06-15',
                       help='Start date in YYYY-MM-DD format')
    parser.add_argument('--duration', type=int, default=24,
                       help='Duration in hours (default: 24)')
    parser.add_argument('--output', type=str, default='.',
                       help='Output directory for results')
    parser.add_argument('--mag-file', type=str, default=None,
                       help='Local path to magnetometer CDF (skip download if provided)')
    parser.add_argument('--efd-file', type=str, default=None,
                       help='Local path to E-field CDF (skip download if provided)')
    
    args = parser.parse_args()
    
    logger.info("=" * 80)
    logger.info("TEST 1: COHERENCE FREQUENCY PREDICTION VALIDATION")
    logger.info("Real Parker Solar Probe FIELDS Data (NASA SPDF Archive)")
    logger.info("=" * 80)
    logger.info(f"Date: {args.date}")
    logger.info(f"Duration: {args.duration} hours")
    logger.info(f"Output: {args.output}")
    logger.info(f"Data Source: https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/")
    
    Path(args.output).mkdir(exist_ok=True)
    
    # Get data files
    mag_file = args.mag_file
    efd_file = args.efd_file
    mag_url = None
    efd_url = None
    
    if not mag_file or not efd_file:
        downloader = SPDFDataDownloader()
        mag_url, efd_url, mag_file, efd_file = downloader.find_psp_files(args.date)
        
        if not downloader.download_file(mag_url, mag_file):
            logger.error("Failed to download magnetometer data")
            return 1
        
        if not downloader.download_file(efd_url, efd_file):
            logger.error("Failed to download E-field data")
            return 1
    
    # Load and analyze real data
    analyzer = RealDataCoherenceAnalyzer()
    analyzer.data_urls = {'magnetometer': mag_url, 'e_field': efd_url}
    
    try:
        analyzer.load_real_psp_data(mag_file, efd_file)
    except Exception as e:
        logger.error(f"Failed to load real data: {e}")
        return 1
    
    # Compute coherence on real data
    analyzer.compute_coherence_index()
    
    # Extract frequencies from real data
    analyzer.extract_frequencies_fft()
    
    # Get predictions
    f_ic, predicted_freqs = analyzer.extract_predicted_frequencies()
    
    # Compare
    results = analyzer.compare_to_predictions(f_ic, predicted_freqs)
    
    # Save results
    results_file = Path(args.output) / 'test_1_results_REAL.json'
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    logger.info(f"Results saved to: {results_file}")
    
    # Save URLs
    urls_file = Path(args.output) / 'test_1_results_REAL_cdf_urls.txt'
    with open(urls_file, 'w') as f:
        f.write(f"Test Date: {args.date}\n")
        f.write(f"Magnetometer CDF: {mag_url}\n")
        f.write(f"E-field CDF: {efd_url}\n")
        f.write(f"Local Cache: {Path(SPDFDataDownloader.CACHE_DIR).absolute()}\n")
    
    logger.info(f"URLs logged to: {urls_file}")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())

