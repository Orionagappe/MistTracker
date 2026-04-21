#!/usr/bin/env python3
"""
MistTracker Phase 1: Configuration Management

Load domain-specific parameters from YAML config files.
No code modification needed to switch domains or parameters.

Config-driven = antenna can be tuned without touching Python.
"""

import yaml
import json
from dataclasses import dataclass, field
from typing import Dict, Any, Optional
from pathlib import Path


@dataclass
class AnalysisConfig:
    """Configuration for a single analysis run."""
    
    # Adapter specification
    adapter: str  # 'spdf', 'usgs', 'network', etc.
    adapter_config: Dict[str, Any]
    
    # Analysis specification
    analysis_type: str  # 'emergence_detection', 'scale_invariance', etc.
    analysis_parameters: Dict[str, Any]
    
    # Engine parameters
    engine_parameters: Dict[str, Any] = field(default_factory=dict)
    
    # Output specification
    output_dir: str = "./phase-17-output"
    output_format: str = "json"
    
    # Metadata
    description: str = ""
    verbose: bool = False
    
    @classmethod
    def from_yaml(cls, config_path: Path) -> 'AnalysisConfig':
        """Load configuration from YAML file."""
        with open(config_path, 'r') as f:
            config_dict = yaml.safe_load(f)
        
        return cls(
            adapter=config_dict['adapter']['name'],
            adapter_config=config_dict['adapter']['config'],
            analysis_type=config_dict['analysis']['type'],
            analysis_parameters=config_dict['analysis']['parameters'],
            engine_parameters=config_dict.get('engine', {}),
            output_dir=config_dict.get('output_dir', './phase-17-output'),
            output_format=config_dict.get('output_format', 'json'),
            description=config_dict.get('description', ''),
            verbose=config_dict.get('verbose', False),
        )
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'AnalysisConfig':
        """Load configuration from dictionary."""
        return cls(
            adapter=config_dict['adapter']['name'],
            adapter_config=config_dict['adapter']['config'],
            analysis_type=config_dict['analysis']['type'],
            analysis_parameters=config_dict['analysis']['parameters'],
            engine_parameters=config_dict.get('engine', {}),
            output_dir=config_dict.get('output_dir', './phase-17-output'),
            output_format=config_dict.get('output_format', 'json'),
            description=config_dict.get('description', ''),
            verbose=config_dict.get('verbose', False),
        )
    
    def validate(self) -> bool:
        """Validate configuration completeness."""
        required_adapter = ['name', 'config']
        required_analysis = ['type', 'parameters']
        
        assert self.adapter, "Adapter name required"
        assert self.analysis_type, "Analysis type required"
        assert self.adapter_config, "Adapter config required"
        assert self.analysis_parameters, "Analysis parameters required"
        
        return True


# ============================================================================
# CONFIG TEMPLATES
# ============================================================================

CONFIG_TEMPLATES = {
    'solar_wind': """
# MistTracker Configuration: Solar Wind Emergence Detection
# Parker Solar Probe / Wind SPDF Data

description: "Solar wind ion cyclotron wave detection (Test 1 replication)"

adapter:
  name: spdf
  config:
    date: "2024-01-01"
    duration_hours: 1
    spacecraft: "parker"  # or "wind"

analysis:
  type: emergence_detection
  parameters:
    fundamental_freq: 0.5  # Hz (ion cyclotron frequency)
    num_harmonics: 4
    search_width: 0.1  # Fraction of expected frequency
    harmonics_threshold: 5.0  # Max allowed frequency error %
    min_coherence: 0.7
    output_metrics: ["rms_error", "coherence", "power"]

engine:
  nperseg: 512  # Welch window size
  noverlap: 256  # Overlap between windows
  freq_range: [0.01, 5.0]  # Min/max frequency (Hz)

output_dir: "./phase-17-output"
output_format: "json"
verbose: true
""",
    
    'earthquake': """
# MistTracker Configuration: Earthquake Scale-Invariance
# USGS Earthquake Data

description: "Gutenberg-Richter b-value analysis across regions"

adapter:
  name: usgs
  config:
    start_date: "2023-01-01"
    end_date: "2023-12-31"
    min_magnitude: 3.0
    region: "California"

analysis:
  type: scale_invariance
  parameters:
    num_regions: 4
    regions: ["California", "Japan", "Chile", "New Zealand"]
    expected_b_value: 1.0  # Gutenberg-Richter universal value
    tolerance_percent: 30  # Acceptable clustering variation
    min_magnitude_threshold: 2.5
    output_metrics: ["b_values", "clustering", "regional_variation"]

engine:
  method: "maximum_likelihood"
  bin_width: 0.2  # Magnitude bin width for b-value calculation

output_dir: "./phase-17-output"
output_format: "json"
verbose: true
""",
    
    'internet': """
# MistTracker Configuration: Internet Network Latency
# ISP-Local Emergence Detection via ICMP Ping

description: "Network latency cascade precursor detection"

adapter:
  name: network
  config:
    target_ip: "192.168.1.1"  # ISP gateway
    duration_seconds: 1800  # 30 minutes
    interval_seconds: 2  # Ping interval

analysis:
  type: precursor_detection
  parameters:
    jitter_threshold_sigma: 2.0  # Jitter spike threshold
    latency_jump_percent: 20  # Latency event threshold (%)
    latency_duration_sec: 30  # Minimum event duration
    precursor_window_sec: 300  # 5-minute precursor window before event
    correlation_threshold: 2.0  # ρ threshold for precursor confirmation
    output_metrics: ["jitter_spikes", "latency_events", "correlation_ratio"]

engine:
  window_size: 30  # Samples for variance calculation
  smoothing: "exponential"
  smoothing_alpha: 0.3

output_dir: "./phase-17-output"
output_format: "json"
verbose: true
""",
}


# ============================================================================
# CONFIG GENERATION
# ============================================================================

def create_config_file(template_name: str, output_path: Path) -> Path:
    """Create a config file from template."""
    if template_name not in CONFIG_TEMPLATES:
        raise ValueError(f"Unknown template: {template_name}")
    
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        f.write(CONFIG_TEMPLATES[template_name])
    
    return output_path


def list_available_templates() -> list:
    """List all available config templates."""
    return list(CONFIG_TEMPLATES.keys())


# ============================================================================
# EXAMPLE USAGE
# ============================================================================

if __name__ == "__main__":
    print("MistTracker Phase 1: Configuration Management")
    print("=" * 60)
    
    # Show available templates
    print("\nAvailable configuration templates:")
    for template in list_available_templates():
        print(f"  - {template}")
    
    # Create example config files
    print("\nCreating example configuration files...")
    
    output_dir = Path("./configs")
    output_dir.mkdir(exist_ok=True)
    
    for template_name in list_available_templates():
        config_path = output_dir / f"config-{template_name}.yaml"
        create_config_file(template_name, config_path)
        print(f"  ✓ Created {config_path}")
    
    # Parse and validate a config
    print("\n" + "=" * 60)
    print("Parsing and validating solar wind config...")
    
    solar_wind_config = AnalysisConfig.from_dict(yaml.safe_load(CONFIG_TEMPLATES['solar_wind']))
    solar_wind_config.validate()
    
    print(f"\nAdapter: {solar_wind_config.adapter}")
    print(f"Analysis type: {solar_wind_config.analysis_type}")
    print(f"Fundamental frequency: {solar_wind_config.analysis_parameters.get('fundamental_freq')} Hz")
    print(f"Number of harmonics: {solar_wind_config.analysis_parameters.get('num_harmonics')}")
    print(f"Output directory: {solar_wind_config.output_dir}")
    
    print("\n✓ Configuration valid and ready for analysis")
