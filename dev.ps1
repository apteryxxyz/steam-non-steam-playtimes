Add-Type -AssemblyName System.Windows.Forms

#

Write-Output "Checking for existing Steam process..."
$steamProcess = Get-Process -Name "steam" -ErrorAction SilentlyContinue

if ($steamProcess) {
  Write-Output "Steam is running. Stopping process..."
  Stop-Process -Name "steam" -Force
}
else {
  Write-Output "Steam is not running."
}

#

Write-Output "Building plugin..."
pnpm millennium-ttc --build dev

#

Write-Output "Starting Steam in dev mode..."
Start-Process -FilePath "C:\Program Files (x86)\Steam\steam.exe" -ArgumentList "-dev"
Start-Sleep -Seconds 10
