#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""NASA CDAWeb Parker Solar Probe FIELDS Data Downloader"""

import os
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime
import json

# Configuration
ARCHIVE_ROOT = Path(r"j:\Portfolio Site\Gdocsdev\MistTracker\Reference\NASA CDAWeb archive")
CDAWEB_BASE = "https://cdaweb.gsfc.nasa.gov/sp_phys/data/parker_solar_probe/fields"

# Test dates (diverse heliospheric conditions)
TEST_DATES = [
    {
        "date": "2021-06-15",
        "description": "High turbulence period",
        "duration_hours": 48
    },
    {
        "date": "2022-03-10",
        "description": "Quiet solar wind period",
        "duration_hours": 48
    },
    {
        "date": "2023-08-20",
        "description": "Sector boundary crossing",
        "duration_hours": 72
    },
    {
        "date": "2024-12-05",
        "description": "Recent data validation",
        "duration_hours": 48
    }
]

# PSP FIELDS Level 2 data products
PRODUCTS = {
    "magnetometer": {
        "path_template": "l2/mag/{date_str}/",
        "file_pattern": "psp_fld_l2_mag_*.cdf",
        "description": "Magnetometer B-field data"
    },
    "electric_field": {
        "path_template": "l2/ac_lfr_wf_burst/{date_str}/",
        "file_pattern": "psp_fld_l2_ac_lfr_wf_burst_*.cdf",
        "description": "Electric field waveform data"
    }
}

class PSPDataDownloader:
    def __init__(self, archive_root):
        self.archive_root = Path(archive_root)
        self.archive_root.mkdir(parents=True, exist_ok=True)
        self.download_log = []
        
    def download_date_data(self, date_str, description):
        """Download all PSP FIELDS data for a given date."""
        print("\n" + "="*70)
        print("Downloading PSP FIELDS data for " + date_str)
        print("Condition: " + description)
        print("="*70)
        
        date_folder = self.archive_root / date_str
        date_folder.mkdir(parents=True, exist_ok=True)
        
        for product_name, product_info in PRODUCTS.items():
            self.download_product(date_str, date_folder, product_name, product_info)
    
    def download_product(self, date_str, date_folder, product_name, product_info):
        """Download a specific PSP FIELDS product."""
        print("\n  Downloading " + product_name + " (" + product_info['description'] + ")...")
        
        date_formatted = date_str.replace("-", "")
        path_part = product_info["path_template"].format(date_str=date_formatted)
        url_base = CDAWEB_BASE + "/" + path_part
        
        try:
            self.download_from_cdaweb(url_base, date_folder, product_name, date_formatted)
        except Exception as e:
            print("    Warning: CDAWeb download failed")
            print("    Creating reference file instead...")
            self.create_synthetic_data_reference(date_folder, product_name, date_str)
    
    def download_from_cdaweb(self, url_base, date_folder, product_name, date_formatted):
        """Attempt to download from NASA CDAWeb."""
        print("    URL: " + url_base)
        
        try:
            response = urllib.request.urlopen(url_base, timeout=10)
            print("    Connection successful to CDAWeb")
        except urllib.error.URLError:
            print("    CDAWeb not accessible (expected in sandbox)")
            self.create_synthetic_data_reference(date_folder, product_name, date_formatted)
    
    def create_synthetic_data_reference(self, date_folder, product_name, date_str):
        """Create reference files for Phase 17 testing."""
        if product_name == "magnetometer":
            filename = "psp_fld_l2_mag_" + date_str.replace("-", "") + "_v01.cdf"
            description = "Magnetometer B-field (3 components in RTN coordinates)"
            channels = ["B_RTN_x", "B_RTN_y", "B_RTN_z", "B_magnitude"]
        else:
            filename = "psp_fld_l2_ac_lfr_wf_burst_" + date_str.replace("-", "") + "_v01.cdf"
            description = "Electric field waveform (3 components in RTN coordinates)"
            channels = ["E_RTN_x", "E_RTN_y", "E_RTN_z", "E_magnitude"]
        
        filepath = date_folder / filename
        
        metadata = {
            "filename": filename,
            "date": date_str,
            "product": product_name,
            "description": description,
            "format": "CDF (Common Data Format)",
            "source": "NASA CDAWeb / Parker Solar Probe FIELDS Instrument",
            "data_level": "L2 (Calibrated)",
            "channels": channels,
            "sampling_rate": "1 Hz" if product_name == "magnetometer" else "128 Hz or higher",
            "coordinates": "RTN (Radial-Tangential-Normal)",
            "note": "For production: download from https://cdaweb.gsfc.nasa.gov/",
            "expected_download_url": "https://cdaweb.gsfc.nasa.gov/sp_phys/data/parker_solar_probe/fields/l2/" + product_name + "/archive/" + date_str.replace("-", "") + "/" + filename
        }
        
        meta_file = filepath.with_suffix(".json")
        with open(str(meta_file), "w", encoding="utf-8") as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
        
        print("    Created reference: " + filename)
        print("    Metadata: " + meta_file.name)
        
        self.download_log.append({
            "date": date_str,
            "product": product_name,
            "filename": filename,
            "status": "reference_created",
            "metadata_file": str(meta_file)
        })
    
    def generate_download_script(self):
        """Generate instructions for downloading real data."""
        script_path = self.archive_root / "DOWNLOAD_REAL_DATA.md"
        
        script_content = """# Download Real Parker Solar Probe FIELDS Data

This archive contains reference files for Phase 17 real-data validation.
To download actual CDF files from NASA CDAWeb:

## Option 1: NASA CDAWeb Web Interface (Manual)

1. Visit: https://cdaweb.gsfc.nasa.gov/
2. Search: "Parker Solar Probe" -> "FIELDS"
3. Select Level 2 data:
   - Magnetometer (MAG): psp_fld_l2_mag
   - RFS (AC/DC): psp_fld_l2_ac_lfr_wf_burst
4. For each test date, select 24-72 hour window:
   - 2021-06-15 to 2021-06-17 (48 hrs)
   - 2022-03-10 to 2022-03-12 (48 hrs)
   - 2023-08-20 to 2023-08-23 (72 hrs)
   - 2024-12-05 to 2024-12-07 (48 hrs)
5. Download CDF files to corresponding date folders

## Option 2: Using wget (Linux/Mac/Windows Git Bash)

```bash
#!/bin/bash
ARCHIVE_ROOT="Reference/NASA CDAWeb archive"
DATES=("2021-06-15" "2022-03-10" "2023-08-20" "2024-12-05")

for date in "${DATES[@]}"; do
  date_fmt=$(echo $date | tr -d '-')
  mkdir -p "$ARCHIVE_ROOT/$date"
  
  # Download magnetometer
  wget -O "$ARCHIVE_ROOT/$date/mag_${date_fmt}.cdf" \\
    "https://cdaweb.gsfc.nasa.gov/sp_phys/data/parker_solar_probe/fields/l2/mag/${date_fmt}/"
  
  # Download E-field
  wget -O "$ARCHIVE_ROOT/$date/efield_${date_fmt}.cdf" \\
    "https://cdaweb.gsfc.nasa.gov/sp_phys/data/parker_solar_probe/fields/l2/ac_lfr_wf_burst/${date_fmt}/"
done
```

## File Organization

```
Reference/NASA CDAWeb archive/
├── 2021-06-15/
│   ├── psp_fld_l2_mag_20210615_v01.cdf
│   ├── psp_fld_l2_mag_20210615_v01.json
│   ├── psp_fld_l2_ac_lfr_wf_burst_20210615_v01.cdf
│   └── psp_fld_l2_ac_lfr_wf_burst_20210615_v01.json
├── 2022-03-10/ ...
├── 2023-08-20/ ...
├── 2024-12-05/ ...
```

## References

- NASA CDAWeb: https://cdaweb.gsfc.nasa.gov/
- Parker Solar Probe: https://parker.jhuapl.edu/
- Phase 17 Validation: See PHASE-17-REAL-DATA-VALIDATION-PLAN.md
"""
        
        with open(str(script_path), "w", encoding="utf-8") as f:
            f.write(script_content)
        
        print("\n(+) Download guide created: " + script_path.name)
    
    def generate_index_file(self):
        """Generate index of reference data."""
        index_path = self.archive_root / "INDEX.json"
        
        index = {
            "archive": "NASA CDAWeb Parker Solar Probe FIELDS Level 2",
            "purpose": "Phase 17 Real-Data Validation Testing",
            "created": datetime.now().isoformat(),
            "test_dates": TEST_DATES,
            "downloads": self.download_log,
            "notes": [
                "Reference files (.json) contain metadata about expected CDF files",
                "Actual .cdf files should be downloaded from NASA CDAWeb",
                "See DOWNLOAD_REAL_DATA.md for detailed download instructions",
                "Phase 17 coherence analyzer will read .cdf files when available"
            ]
        }
        
        with open(str(index_path), "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)
        
        print("(+) Index file created: " + index_path.name)
    
    def run(self):
        """Execute full setup sequence."""
        print("\n" + "="*70)
        print("NASA CDAWeb Parker Solar Probe FIELDS Archive Setup")
        print("="*70)
        print("Archive location: " + str(self.archive_root))
        
        for test_case in TEST_DATES:
            self.download_date_data(test_case["date"], test_case["description"])
        
        self.generate_download_script()
        self.generate_index_file()
        
        print("\n" + "="*70)
        print("ARCHIVE SETUP COMPLETE")
        print("="*70)
        print("\nArchive created at:")
        print("  " + str(self.archive_root))
        print("\nNext steps:")
        print("  1. Read: DOWNLOAD_REAL_DATA.md")
        print("  2. Download real CDF files from NASA CDAWeb")
        print("  3. Place .cdf files in date folders")
        print("  4. Run Phase 17 analysis script")
        print()


if __name__ == "__main__":
    downloader = PSPDataDownloader(ARCHIVE_ROOT)
    downloader.run()
