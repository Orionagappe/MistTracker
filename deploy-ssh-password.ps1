# Deploy MistTracker modules via SSH with password authentication
# Uses a workaround for Windows SSH password prompts

param(
  [string]$DevuanIP = "10.144.113.100",
  [string]$DevuanUser = "orion",
  [string]$DevuanPassword = "Popsnap1",
  [string]$DevuanPath = "/home/orion/Desktop/misttracker",
  [string]$SourceDir = "."
)

Write-Host ""
Write-Host "=========================================================="
Write-Host "  MistTracker - SSH Deployment (Password Auth)"
Write-Host "=========================================================="
Write-Host ""

$requiredFiles = @(
  "hardware-fitness-validator.js",
  "phase-17-5-beta-extended-aggregator.js",
  "phase-17-5-beta-aggregator.js",
  "phase-17-5-beta-cve-forecaster.js",
  "phase-17-5-beta-friction-predictor.js",
  "phase-17-5-beta-stability-modeler.js",
  "phase-17-5-beta-network-predictor.js"
)

Write-Host "[*] Checking local files..."
$missingFiles = @()

foreach ($file in $requiredFiles) {
  $filePath = Join-Path $SourceDir $file
  if (-not (Test-Path $filePath)) {
    Write-Host "  [MISSING] $file"
    $missingFiles += $file
  } else {
    $size = (Get-Item $filePath).Length
    Write-Host "  [OK] $file ($size bytes)"
  }
}

Write-Host ""

if ($missingFiles.Count -gt 0) {
  Write-Host "[ERROR] $($missingFiles.Count) file(s) missing"
  exit 1
}

# Use Python with Paramiko for reliable password-based SSH copy
$pythonScript = @"
import paramiko
import sys
from pathlib import Path

host = "$DevuanIP"
port = 22
user = "$DevuanUser"
password = "$DevuanPassword"
remote_dir = "$DevuanPath"

files = [
    "hardware-fitness-validator.js",
    "phase-17-5-beta-extended-aggregator.js",
    "phase-17-5-beta-aggregator.js",
    "phase-17-5-beta-cve-forecaster.js",
    "phase-17-5-beta-friction-predictor.js",
    "phase-17-5-beta-stability-modeler.js",
    "phase-17-5-beta-network-predictor.js"
]

print(f"[*] Connecting to {user}@{host}:{port}...")

try:
    # Connect via SSH
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, port=port, username=user, password=password, timeout=10,
                  look_for_keys=False, allow_agent=False)
    print("[OK] SSH connection established")
    
    # Create SFTP session
    sftp = client.open_sftp()
    print(f"[*] Deploying to {remote_dir}/...")
    print("")
    
    success_count = 0
    fail_count = 0
    
    for filename in files:
        local_path = Path(filename)
        remote_path = f"{remote_dir}/{filename}"
        
        if not local_path.exists():
            print(f"  [SKIP] {filename} (not found)")
            continue
        
        try:
            file_size = local_path.stat().st_size
            sftp.put(str(local_path), remote_path)
            print(f"  [OK] {filename} ({file_size} bytes)")
            success_count += 1
        except Exception as e:
            print(f"  [FAIL] {filename}: {e}")
            fail_count += 1
    
    sftp.close()
    client.close()
    
    print("")
    print(f"[SUMMARY] {success_count} deployed, {fail_count} failed")
    
    if fail_count == 0:
        print("")
        print("[OK] All files deployed successfully!")
        print("")
        print("Next step: Run validator on Devuan")
        print(f"  ssh {user}@{host} 'cd {remote_dir} ; node hardware-fitness-validator.js'")
        sys.exit(0)
    else:
        sys.exit(1)
        
except paramiko.AuthenticationException as e:
    print(f"[ERROR] Authentication failed: {e}")
    sys.exit(1)
except Exception as e:
    print(f"[ERROR] Connection failed: {e}")
    sys.exit(1)
"@

Write-Host "[*] Deploying via SSH (Python/Paramiko)..."
Write-Host ""

# Save Python script to temp file
$tempPy = "$env:TEMP\deploy_misttracker_$([DateTime]::Now.Ticks).py"
Set-Content -Path $tempPy -Value $pythonScript -Encoding UTF8

# Run it
$pythonExe = ".\.venv\Scripts\python.exe"
if (-not (Test-Path $pythonExe)) {
  $pythonExe = "python"
}

& $pythonExe $tempPy
$exitCode = $LASTEXITCODE

# Cleanup
Remove-Item $tempPy -Force -ErrorAction SilentlyContinue

exit $exitCode
