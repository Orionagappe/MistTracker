# Minimal deployment - pipe files directly via SSH

$remoteHost = "10.144.113.100"
$remoteUser = "orion"
$remotePath = "/home/orion/Desktop/misttracker"

$files = @(
  "hardware-fitness-validator.js",
  "phase-17-5-beta-extended-aggregator.js",
  "phase-17-5-beta-aggregator.js",
  "phase-17-5-beta-cve-forecaster.js",
  "phase-17-5-beta-friction-predictor.js",
  "phase-17-5-beta-stability-modeler.js",
  "phase-17-5-beta-network-predictor.js"
)

Write-Host "Deploying MistTracker to $remoteUser@$remoteHost"
Write-Host ""

foreach ($file in $files) {
  Write-Host "Sending $file..."
  Get-Content $file | ssh $remoteUser@$remoteHost "cat > $remotePath/$file"
}

Write-Host ""
Write-Host "Running validator..."
Write-Host ""

ssh $remoteUser@$remoteHost "cd $remotePath && node hardware-fitness-validator.js"
