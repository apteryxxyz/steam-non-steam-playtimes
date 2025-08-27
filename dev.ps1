function Stop-SteamProcess {
  Write-Host "Stopping Steam process..."
  Get-Process -Name "steam" -ErrorAction SilentlyContinue | Stop-Process -Force
}

function Start-SteamProcess {
  param ([string]$SteamPath)

  Write-Host "Starting Steam process in dev mode..."
  Start-Process -FilePath "$SteamPath/steam.exe" -ArgumentList "-dev"
}

function Get-PluginName {
  param ([string]$Path)

  $json = Get-Content $Path | ConvertFrom-Json
  return @($json.name, $json.common_name)
}

function Set-PluginName {
  param ([string]$Path, [string]$Name, [string]$CommonName)

  $json = Get-Content $Path | ConvertFrom-Json
  $json.name = $Name
  $json.common_name = $CommonName
  $json | ConvertTo-Json -Depth 100 | Set-Content $Path

  pnpm biome format plugin.json --write
}

function Build-Plugin {
  Write-Host "Building plugin..."
  pnpm millennium-ttc --build dev
}

function Copy-PluginFiles {
  param ([string]$Destination)

  Write-Host "Copying plugin files to $Destination..."
  New-Item -Path $Destination -ItemType Directory -Force | Out-Null
  Copy-Item -Path "plugin.json" -Destination $Destination -Force
  Copy-Item -Path ".millennium" -Destination $Destination -Recurse -Force
  Copy-Item -Path "backend" -Destination $Destination -Recurse -Force
}

function Toggle-Plugin {
  param ([string]$Path, [string]$Name, [bool]$Enable)

  Write-Host "$(if ($Enable) { "Enabling" } else { "Disabling" }) plugin $Name..."

  $lines = Get-Content $Path

  for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s*enabled_plugins\s*=') {
      $plugins = ($lines[$i] -split '=')[1].Trim() -split '\|'

      if ($Enable) {
        if (-not ($plugins -contains $Name)) { $plugins += $Name }
        $plugins = $plugins | Sort-Object
      } else {
        $plugins = $plugins | Where-Object { $_ -ne $Name }
      }

      $lines[$i] = "enabled_plugins = " + ($plugins -join '|')
      break
    }
  }

  Set-Content $Path $lines
}

#####

$SteamPath = "C:\Program Files (x86)\Steam"
$IniPath = "$SteamPath\ext\millennium.ini"
$PluginName, $PluginCommonName = Get-PluginName -Path "./plugin.json"
Stop-SteamProcess
Set-PluginName -Path "plugin.json" -Name $PluginName-dev -CommonName "$PluginCommonName (dev)"
Build-Plugin
Copy-PluginFiles -Destination "$SteamPath\plugins\$PluginName-dev"
Set-PluginName -Path "plugin.json" -Name $PluginName -CommonName $PluginCommonName
Toggle-Plugin -Path $IniPath -Name $PluginName -Enable $false
Toggle-Plugin -Path $IniPath -Name $PluginName-dev -Enable $true
Start-SteamProcess $SteamPath
