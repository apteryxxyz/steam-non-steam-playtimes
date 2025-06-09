$STEAM = "C:\Program Files (x86)\Steam"

function Stop-Steam {
  Write-Output "Checking for existing Steam process..."
  $steamProcess = Get-Process -Name "steam" -ErrorAction SilentlyContinue

  if ($steamProcess) {
    Write-Output "Steam is running, stopping process..."
    Stop-Process -Name "steam" -Force
  }
  else {
    Write-Output "Steam is not running, skipping..."
  }
}

function Build-Plugin {
  Write-Output "Building plugin..."
  pnpm millennium-ttc --build dev
}

function Create-Plugin-Symlink {
  $pluginName = (Get-Content "./plugin.json" | ConvertFrom-Json).name
  $targetPath = "$STEAM\plugins\$pluginName"
  $sourcePath = Get-Location

  if (!(Test-Path $targetPath)) {
    Write-Output "Creating symlink to plugins directory..."
    New-Item -Path $targetPath -ItemType SymbolicLink -Value $sourcePath | Out-Null
  }
  else {
    Write-Output "Plugin symlink already exists, skipping..."
  }
}

function Enable-Plugin {
  $pluginName = (Get-Content "./plugin.json" | ConvertFrom-Json).name
  $millenniumPath = "$STEAM\ext\millennium.ini"
  $iniContent = Get-Content $millenniumPath
  
  if ($iniContent | Select-String -Pattern $pluginName) {
    Write-Output "Plugin already enabled, skipping..."
  }
  else {
    Write-Output "Enabling plugin..."
    $iniContent = $iniContent -replace "core", "core|$pluginName"
    $iniContent | Set-Content $millenniumPath
  }
}

function Start-SteamDevMode {
  Write-Output "Starting Steam in dev mode..."
  Start-Process -FilePath "$STEAM\steam.exe" -ArgumentList "-dev"
  Start-Sleep -Seconds 10
}

function Open-DevTools {
  Add-Type -AssemblyName System.Windows.Forms
  Write-Output "Pressing F12 to open DevTools..."
  [System.Windows.Forms.SendKeys]::SendWait("{F12}")
}

# ===== Main Execution ===== #

Stop-Steam
Build-Plugin
Create-Plugin-Symlink
Enable-Plugin
Start-SteamDevMode
Open-DevTools
