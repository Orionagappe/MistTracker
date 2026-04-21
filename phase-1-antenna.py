#!/usr/bin/env python3
"""
MistTracker Phase 1: Universal Antenna CLI

Command-line interface for the emergence detection antenna.

Usage:
    python phase-1-antenna.py --config config.yaml
    python phase-1-antenna.py --list-adapters
    python phase-1-antenna.py --create-config solar_wind
"""

import argparse
import sys
from pathlib import Path
import yaml

from phase_1_emergence_engine import MistTrackerEngine, AnalysisResult
from phase_1_data_adapter import AdapterRegistry
from phase_1_config_manager import AnalysisConfig, create_config_file, list_available_templates


class MistTrackerAntenna:
    """Main antenna controller."""
    
    def __init__(self, config: AnalysisConfig):
        self.config = config
        self.engine = MistTrackerEngine(verbose=config.verbose)
        self.adapter = AdapterRegistry.get_adapter(config.adapter)
    
    def run(self) -> AnalysisResult:
        """Execute the analysis pipeline."""
        
        print("=" * 70)
        print(f"MistTracker Phase 1: Emergence Detection Antenna")
        print(f"Domain: {self.config.adapter.upper()}")
        print(f"Analysis: {self.config.analysis_type}")
        print("=" * 70)
        
        # Step 1: Validate configuration
        print("\n[STEP 1] Validating configuration...")
        self.config.validate()
        self.adapter.validate_config(self.config.adapter_config)
        print("✓ Configuration valid")
        
        # Step 2: Load data
        print("\n[STEP 2] Loading data...")
        data = self.adapter.load_data(self.config.adapter_config)
        data = self.engine.ingest_data(data)
        print(f"✓ Data loaded: {data['values'].shape}")
        
        # Step 3: Preprocess
        print("\n[STEP 3] Preprocessing...")
        timestamps, values, fs = self.engine.preprocess(
            data['timestamps'],
            data['values']
        )
        print(f"✓ Preprocessed: fs={fs:.3f} Hz, {len(values)} points")
        
        # Step 4: Execute analysis based on type
        print(f"\n[STEP 4] Executing {self.config.analysis_type}...")
        
        if self.config.analysis_type == "emergence_detection":
            result = self._analyze_emergence_detection(
                timestamps, values, fs, data['metadata']
            )
        elif self.config.analysis_type == "scale_invariance":
            result = self._analyze_scale_invariance(
                timestamps, values, fs, data['metadata']
            )
        elif self.config.analysis_type == "precursor_detection":
            result = self._analyze_precursor_detection(
                timestamps, values, fs, data['metadata']
            )
        else:
            raise ValueError(f"Unknown analysis type: {self.config.analysis_type}")
        
        print(f"✓ Analysis complete")
        
        # Step 5: Save results
        print("\n[STEP 5] Saving results...")
        output_path = self._save_result(result)
        print(f"✓ Results saved to {output_path}")
        
        # Step 6: Summary
        print("\n" + "=" * 70)
        print(result)
        print("=" * 70)
        
        return result
    
    def _analyze_emergence_detection(self, timestamps, values, fs, metadata):
        """Emergence detection analysis (harmonic detection)."""
        
        params = self.config.analysis_parameters
        fundamental_freq = params['fundamental_freq']
        num_harmonics = params.get('num_harmonics', 3)
        
        # Frequency discovery
        nperseg = self.config.engine_parameters.get('nperseg', 512)
        noverlap = self.config.engine_parameters.get('noverlap', nperseg // 2)
        frequencies, power = self.engine.discover_frequencies(
            values, fs, nperseg=nperseg, noverlap=noverlap
        )
        
        # Harmonic detection
        harmonics = self.engine.detect_harmonics(
            frequencies, power, fundamental_freq, 
            num_harmonics=num_harmonics,
            search_width=params.get('search_width', 0.1)
        )
        
        # Compute RMS error on harmonics
        errors = [h['frequency_error_pct'] for h in harmonics]
        rms_error = (sum(e**2 for e in errors) / len(errors)) ** 0.5 if errors else 0
        
        # Power-law analysis
        freq_range = self.config.engine_parameters.get('freq_range')
        beta, r2, _ = self.engine.fit_power_law(frequencies, power)
        
        # Create result
        result = self.engine.create_result(
            domain=self.config.adapter,
            analysis_type=self.config.analysis_type,
            data_source=metadata['data_source'],
            data_points=len(values),
            date_range=metadata.get('date_range'),
            primary_metric=rms_error,
            metric_name="rms_frequency_error_percent",
            threshold=params.get('harmonics_threshold', 5.0),
            parameters=self.config.analysis_parameters,
            frequencies=frequencies,
            power=power,
            harmonics=harmonics,
            additional_metrics={
                "power_law_exponent": beta,
                "power_law_r_squared": r2,
                "num_harmonics_detected": len(harmonics),
            }
        )
        
        return result
    
    def _analyze_scale_invariance(self, timestamps, values, fs, metadata):
        """Scale-invariance analysis (power-law)."""
        
        params = self.config.analysis_parameters
        expected_value = params.get('expected_b_value', 1.0)
        tolerance_pct = params.get('tolerance_percent', 30.0)
        
        # Frequency discovery
        frequencies, power = self.engine.discover_frequencies(values, fs)
        
        # Power-law fit
        beta, r2, _ = self.engine.fit_power_law(frequencies, power)
        
        # Check clustering
        tolerance = expected_value * tolerance_pct / 100.0
        within_tolerance = abs(beta - expected_value) <= tolerance
        
        # Use distance from expected as primary metric (lower is better)
        primary_metric = abs(beta - expected_value)
        
        result = self.engine.create_result(
            domain=self.config.adapter,
            analysis_type=self.config.analysis_type,
            data_source=metadata['data_source'],
            data_points=len(values),
            date_range=metadata.get('date_range'),
            primary_metric=beta,
            metric_name="power_law_exponent",
            threshold=expected_value,  # For validation
            parameters=self.config.analysis_parameters,
            frequencies=frequencies,
            power=power,
            additional_metrics={
                "expected_exponent": expected_value,
                "tolerance_range": [expected_value - tolerance, expected_value + tolerance],
                "within_tolerance": within_tolerance,
                "r_squared": r2,
            }
        )
        
        return result
    
    def _analyze_precursor_detection(self, timestamps, values, fs, metadata):
        """Precursor detection analysis."""
        
        params = self.config.analysis_parameters
        
        # For network data: detect jitter spikes and latency events
        # Compute moving variance (jitter)
        window_size = self.config.engine_parameters.get('window_size', 30)
        jitter = np.convolve(
            (values - np.mean(values))**2,
            np.ones(window_size) / window_size,
            mode='same'
        )
        
        # Detect variance spikes
        jitter_threshold = np.mean(jitter) + params.get('jitter_threshold_sigma', 2.0) * np.std(jitter)
        jitter_spikes = jitter > jitter_threshold
        
        # Detect latency events
        latency_threshold = np.mean(values) * (1 + params.get('latency_jump_percent', 20) / 100.0)
        latency_events = values > latency_threshold
        
        # Compute correlation (simplified)
        precursor_correlation = np.mean(jitter_spikes & latency_events) / (np.mean(jitter_spikes) + 1e-10)
        
        result = self.engine.create_result(
            domain=self.config.adapter,
            analysis_type=self.config.analysis_type,
            data_source=metadata['data_source'],
            data_points=len(values),
            date_range=metadata.get('date_range'),
            primary_metric=precursor_correlation,
            metric_name="precursor_correlation_ratio",
            threshold=params.get('correlation_threshold', 2.0),
            parameters=self.config.analysis_parameters,
            power=jitter,  # Use jitter as power spectrum
            additional_metrics={
                "jitter_spike_count": int(np.sum(jitter_spikes)),
                "latency_event_count": int(np.sum(latency_events)),
                "mean_latency_ms": float(np.mean(values)),
                "latency_std_ms": float(np.std(values)),
            }
        )
        
        return result
    
    def _save_result(self, result: AnalysisResult) -> Path:
        """Save result to file."""
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate filename
        filename = f"result_{self.config.adapter}_{self.config.analysis_type}.json"
        output_path = output_dir / filename
        
        result.to_json(output_path)
        return output_path


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="MistTracker Phase 1: Emergence Detection Antenna",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Run solar wind analysis
  python phase-1-antenna.py --config config-solar_wind.yaml
  
  # List available adapters
  python phase-1-antenna.py --list-adapters
  
  # Create new config file
  python phase-1-antenna.py --create-config earthquake --output config-eq.yaml
        """
    )
    
    parser.add_argument('--config', type=Path, 
                       help='Configuration YAML file')
    parser.add_argument('--list-adapters', action='store_true',
                       help='List all available adapters')
    parser.add_argument('--list-templates', action='store_true',
                       help='List all available config templates')
    parser.add_argument('--create-config', type=str,
                       help='Create config file from template')
    parser.add_argument('--output', type=Path, default=None,
                       help='Output file for created config')
    
    args = parser.parse_args()
    
    # List adapters
    if args.list_adapters:
        print("Available Adapters:")
        print("=" * 60)
        for name, metadata in AdapterRegistry.list_adapters().items():
            print(f"\n{name.upper()}")
            print(f"  Domain: {metadata.domain}")
            print(f"  Description: {metadata.description}")
            print(f"  Analyses: {', '.join(metadata.supported_analyses)}")
        return
    
    # List templates
    if args.list_templates:
        print("Available Configuration Templates:")
        print("=" * 60)
        for template in list_available_templates():
            print(f"  - {template}")
        return
    
    # Create config
    if args.create_config:
        output_file = args.output or Path(f"config-{args.create_config}.yaml")
        create_config_file(args.create_config, output_file)
        print(f"✓ Created {output_file}")
        return
    
    # Run analysis
    if args.config:
        try:
            config = AnalysisConfig.from_yaml(args.config)
            antenna = MistTrackerAntenna(config)
            result = antenna.run()
        except Exception as e:
            print(f"ERROR: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        parser.print_help()


if __name__ == "__main__":
    # Import numpy here to avoid issues
    import numpy as np
    main()
