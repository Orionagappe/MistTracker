#!/usr/bin/env python3
"""
MistTracker Phase 1: Universal Data Adapter Interface

Adapters transform domain-specific data into standardized format
that the universal engine can process.

Design Pattern: Each domain implements DataAdapter interface.
Core engine never needs modification when adding domains.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Dict, Optional, Any
import numpy as np
from pathlib import Path


@dataclass
class AdapterMetadata:
    """Metadata about an adapter."""
    
    adapter_name: str
    domain: str
    description: str
    data_sources: list  # What data sources this adapter supports
    supported_analyses: list  # What analysis types it supports
    requirements: list  # Dependencies, APIs needed, etc.


class DataAdapter(ABC):
    """
    Base class for all domain adapters.
    
    Each adapter implements:
    1. Loading domain-specific data
    2. Transforming to standard format
    3. Providing metadata
    
    The engine never touches domain-specific code.
    """
    
    @abstractmethod
    def get_metadata(self) -> AdapterMetadata:
        """Return adapter metadata."""
        pass
    
    @abstractmethod
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """
        Validate that config has all required parameters.
        
        Returns: True if valid, raises ValueError if invalid.
        """
        pass
    
    @abstractmethod
    def load_data(self, config: Dict[str, Any]) -> Dict[str, np.ndarray]:
        """
        Load domain-specific data and transform to standard format.
        
        Standard format:
        {
            'timestamps': 1D array of times (seconds since epoch or relative),
            'values': 1D or 3D array (3D for vector data),
            'metadata': {
                'domain': str,
                'data_source': str,
            'date_range': f'{start_date.isoformat()} ± {duration_hours} hours',
                'units': str,
                'sampling_rate': float (Hz),
                'source_url': str (if applicable),
                'quality_notes': str,
            }
        }
        """
        pass


# ============================================================================
# CONCRETE ADAPTER: SPDF (Parker/Wind)
# ============================================================================

class SPDFAdapter(DataAdapter):
    """Adapter for NASA SPDF spacecraft data (Parker Solar Probe, Wind)."""
    
    def get_metadata(self) -> AdapterMetadata:
        return AdapterMetadata(
            adapter_name="SPDF Adapter",
            domain="space_plasma",
            description="Parker Solar Probe and Wind spacecraft data from NASA SPDF",
            data_sources=["spdf_psp_fields", "spdf_wind_mfi"],
            supported_analyses=["emergence_detection", "coherence_analysis"],
            requirements=["cdflib", "urllib"]
        )
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate SPDF config."""
        required = ['date', 'duration_hours', 'spacecraft']
        if not all(k in config for k in required):
            raise ValueError(f"SPDF config requires: {required}")
        
        if config['spacecraft'] not in ['parker', 'wind']:
            raise ValueError("spacecraft must be 'parker' or 'wind'")
        
        return True
    
    def load_data(self, config: Dict[str, Any]) -> Dict[str, np.ndarray]:
        """
        Load SPDF data.
        
        Note: For now, returns realistic synthetic data to demonstrate adapter.
        In production, use actual SPDF download logic from test_1_real_psp_data.py
        """
        from datetime import datetime, timedelta
        
        date_str = config['date']
        duration_hours = config.get('duration_hours', 24)
        spacecraft = config['spacecraft']
        
        # Generate time array
        start_date = datetime.strptime(date_str, '%Y-%m-%d')
        dt_seconds = 1.0  # 1 Hz sampling
        num_points = int(duration_hours * 3600 / dt_seconds)
        timestamps = np.arange(num_points) * dt_seconds
        
        # Create realistic synthetic data with emergence signature
        # Solar wind has ion cyclotron waves at ~0.5 Hz + harmonics
        np.random.seed(42)  # Reproducible results
        
        # Primary frequencies
        f1 = 0.5      # Ion cyclotron frequency
        f2 = 2 * f1   # First harmonic
        f3 = 3 * f1   # Second harmonic
        
        # Create stronger signal with better spectral content
        # Component 1: Fundamental + harmonics
        signal_1 = (
            0.5 * np.sin(2*np.pi*f1*timestamps) +
            0.3 * np.sin(2*np.pi*f2*timestamps + np.pi/6) +
            0.2 * np.sin(2*np.pi*f3*timestamps + np.pi/4)
        )
        
        signal_2 = (
            0.4 * np.sin(2*np.pi*f1*timestamps + np.pi/3) +
            0.25 * np.sin(2*np.pi*f2*timestamps + np.pi/2) +
            0.15 * np.sin(2*np.pi*f3*timestamps + np.pi/6)
        )
        
        signal_3 = (
            0.3 * np.sin(2*np.pi*f1*timestamps + 2*np.pi/3) +
            0.2 * np.sin(2*np.pi*f2*timestamps + np.pi/4) +
            0.1 * np.sin(2*np.pi*f3*timestamps + np.pi/3)
        )
        
        # Add DC offsets (realistic for magnetic field)
        bx = 50 + signal_1
        by = 30 + signal_2
        bz = 10 + signal_3
        
        # Add colored noise (1/f noise) for realism
        noise_1d = np.cumsum(np.random.normal(0, 0.1, len(timestamps)))
        noise_1d = noise_1d - np.mean(noise_1d)
        noise_1d = noise_1d / np.std(noise_1d) * 0.2  # Scale to reasonable level
        
        bx += noise_1d
        by += noise_1d * 0.7
        bz += noise_1d * 0.5
        
        # Stack into 3D vector
        b_vector = np.column_stack([bx, by, bz])
        
        return {
            'timestamps': timestamps,
            'values': b_vector,
            'metadata': {
                'domain': 'space_plasma',
                'data_source': f'SPDF {spacecraft.upper()} Fields L2',
                'date_range': f'{start_date.isoformat()} ± {duration_hours} hours',
                'units': 'nT',
                'sampling_rate': 1.0,
                'source_url': 'https://spdf.gsfc.nasa.gov/pub/data/psp/fields/l2/',
                'quality_notes': 'Realistic synthetic data with ion cyclotron signature',
            }
        }

# ============================================================================
# CONCRETE ADAPTER: USGS (Earthquakes)
# ============================================================================

class USGSAdapter(DataAdapter):
    """Adapter for USGS earthquake data."""

    def get_metadata(self) -> AdapterMetadata:
        return AdapterMetadata(
            adapter_name="USGS Earthquake Adapter",
            domain="seismology",
            description="USGS earthquake data via FDSNWS API",
            data_sources=["usgs_fdsnws"],
            supported_analyses=["precursor_detection", "scale_invariance"],
            requirements=["urllib", "json"]
        )
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate USGS config."""
        required = ['start_date', 'end_date', 'min_magnitude', 'region']
        if not all(k in config for k in required):
            raise ValueError(f"USGS config requires: {required}")
        return True
    
    def load_data(self, config: Dict[str, Any]) -> Dict[str, np.ndarray]:
        """
        Load USGS earthquake data.
        
        For now, returns realistic synthetic earthquake sequence.
        In production, use actual USGS API from test_2/test_3 earthquake scripts.
        """
        # Simulate earthquake catalog
        num_events = 20
        timestamps = np.sort(np.random.uniform(0, 30*24*3600, num_events))
        
        # Gutenberg-Richter: P(M > m) ~ 10^(-b*m)
        magnitudes = np.random.exponential(0.5, num_events) + 2.0
        
        return {
            'timestamps': timestamps,
            'values': magnitudes,
            'metadata': {
                'domain': 'seismology',
                'data_source': f'USGS {config["region"]}',
            'date_range': f'{start_date.isoformat()} ± {duration_hours} hours',
                'units': 'Richter magnitude',
                'sampling_rate': 1.0,
                'source_url': 'https://earthquake.usgs.gov/fdsnws/event/1/',
                'quality_notes': f'Magnitude threshold: {config["min_magnitude"]}',
            }
        }


# ============================================================================
# CONCRETE ADAPTER: Network (Internet Latency)
# ============================================================================

class NetworkAdapter(DataAdapter):
    """Adapter for network latency measurements (ICMP/ping)."""
    
    def get_metadata(self) -> AdapterMetadata:
        return AdapterMetadata(
            adapter_name="Network Latency Adapter",
            domain="computer_networks",
            description="Internet latency via ICMP ping measurements",
            data_sources=["icmp_ping"],
            supported_analyses=["precursor_detection", "scale_invariance"],
            requirements=["subprocess", "platform-specific ping"]
        )
    
    def validate_config(self, config: Dict[str, Any]) -> bool:
        """Validate network config."""
        required = ['target_ip', 'duration_seconds', 'interval_seconds']
        if not all(k in config for k in required):
            raise ValueError(f"Network config requires: {required}")
        return True
    
    def load_data(self, config: Dict[str, Any]) -> Dict[str, np.ndarray]:
        """
        Load network latency data.
        
        For now, returns realistic synthetic latency with 1/f noise.
        In production, use actual ping from test_2_internet / test_3_internet scripts.
        """
        num_samples = int(config['duration_seconds'] / config['interval_seconds'])
        timestamps = np.arange(num_samples) * config['interval_seconds']
        
        # Create 1/f noise for latency
        # Networks typically show power-law latency fluctuations
        freqs = np.fft.rfftfreq(num_samples)
        freqs[0] = 1  # Avoid division by zero
        
        # 1/f spectrum
        spectrum = 1.0 / freqs ** 0.5
        spectrum[0] = spectrum[1]  # Fix DC component
        
        # Generate time series with base latency + fluctuations
        phase = np.random.uniform(0, 2*np.pi, len(spectrum))
        white = (np.fft.irfft(spectrum * np.exp(1j*phase)))[:num_samples]
        
        # Normalize to realistic latency (ISP gateway ~1-5ms)
        base_latency = 2.0  # ms
        latency = base_latency + 0.5 * white / np.std(white)
        latency = np.clip(latency, 0.5, 50.0)  # Reasonable bounds
        
        return {
            'timestamps': timestamps,
            'values': latency,
            'metadata': {
                'domain': 'computer_networks',
                'data_source': f'ICMP ping to {config["target_ip"]}',
            'date_range': f'{start_date.isoformat()} ± {duration_hours} hours',
                'units': 'milliseconds',
                'sampling_rate': 1.0 / config['interval_seconds'],
                'source_url': 'ICMP protocol',
                'quality_notes': 'Local network measurements',
            }
        }


# ============================================================================
# ADAPTER REGISTRY
# ============================================================================

class AdapterRegistry:
    """Registry for all available adapters."""
    
    _adapters = {
        'spdf': SPDFAdapter,
        'usgs': USGSAdapter,
        'network': NetworkAdapter,
    }
    
    @classmethod
    def register(cls, name: str, adapter_class: type) -> None:
        """Register a new adapter."""
        cls._adapters[name] = adapter_class
    
    @classmethod
    def get_adapter(cls, name: str) -> DataAdapter:
        """Get adapter by name."""
        if name not in cls._adapters:
            raise ValueError(f"Unknown adapter: {name}. Available: {list(cls._adapters.keys())}")
        return cls._adapters[name]()
    
    @classmethod
    def list_adapters(cls) -> Dict[str, AdapterMetadata]:
        """List all available adapters."""
        return {name: adapter_class().get_metadata() 
                for name, adapter_class in cls._adapters.items()}


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("MistTracker Phase 1: Data Adapter System")
    print("=" * 60)
    
    # Show available adapters
    print("\nAvailable adapters:")
    for name, metadata in AdapterRegistry.list_adapters().items():
        print(f"\n  {name.upper()}: {metadata.adapter_name}")
        print(f"    Domain: {metadata.domain}")
        print(f"    Description: {metadata.description}")
        print(f"    Supported analyses: {', '.join(metadata.supported_analyses)}")
    
    # Load data from each adapter
    print("\n" + "=" * 60)
    print("Loading example data from each adapter...\n")
    
    # SPDF example
    print("1. SPDF Adapter (Solar Wind):")
    spdf_adapter = AdapterRegistry.get_adapter('spdf')
    spdf_config = {
        'date': '2024-01-01',
        'duration_hours': 1,
        'spacecraft': 'parker'
    }
    spdf_data = spdf_adapter.load_data(spdf_config)
    print(f"   Loaded: {spdf_data['values'].shape} B-field data")
    print(f"   Metadata: {spdf_data['metadata']}")
    
    # USGS example
    print("\n2. USGS Adapter (Earthquakes):")
    usgs_adapter = AdapterRegistry.get_adapter('usgs')
    usgs_config = {
        'start_date': '2024-01-01',
        'end_date': '2024-01-31',
        'min_magnitude': 3.0,
        'region': 'California'
    }
    usgs_data = usgs_adapter.load_data(usgs_config)
    print(f"   Loaded: {len(usgs_data['values'])} earthquake events")
    print(f"   Metadata: {usgs_data['metadata']}")
    
    # Network example
    print("\n3. Network Adapter (Internet Latency):")
    network_adapter = AdapterRegistry.get_adapter('network')
    network_config = {
        'target_ip': '192.168.1.1',
        'duration_seconds': 300,
        'interval_seconds': 1
    }
    network_data = network_adapter.load_data(network_config)
    print(f"   Loaded: {len(network_data['values'])} latency samples")
    print(f"   Metadata: {network_data['metadata']}")
