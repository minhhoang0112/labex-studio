$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$runtimeOptions = @{}
$configPath = Join-Path $workspace '.env'
if (Test-Path -LiteralPath $configPath) {
    foreach ($line in Get-Content -LiteralPath $configPath) {
        if ($line -match '^\s*(LABEX_RUNTIME_PROVIDER|WSL_DISTRO)\s*=\s*(.*?)\s*$') {
            $runtimeOptions[$matches[1]] = $matches[2].Split('#')[0].Trim().Trim([char]'"').Trim([char]"'")
        }
    }
}
$provider = [Environment]::GetEnvironmentVariable('LABEX_RUNTIME_PROVIDER')
if (-not $provider) { $provider = $runtimeOptions['LABEX_RUNTIME_PROVIDER'] }
if ($provider -ne 'docker') { return }
$distro = [Environment]::GetEnvironmentVariable('WSL_DISTRO')
if (-not $distro) { $distro = $runtimeOptions['WSL_DISTRO'] }
if (-not $distro) { $distro = 'Ubuntu' }
$helper = Join-Path $workspace 'scripts\bootstrap-rootless-docker.py'
$linuxHelper = & wsl.exe --distribution $distro --exec wslpath -u $helper
if ($LASTEXITCODE -ne 0) { throw 'Cannot locate the runtime startup helper inside WSL.' }
$retries = 3
$started = $false
for ($i = 1; $i -le $retries; $i++) {
    & wsl.exe --distribution $distro --exec /usr/bin/python3 $linuxHelper.Trim() start
    if ($LASTEXITCODE -eq 0) {
        $started = $true
        break
    }
    if ($i -lt $retries) {
        Write-Warning "Rootless Docker cold-start delay (attempt $i/$retries), retrying in 2 seconds..."
        Start-Sleep -Seconds 2
    }
}
if (-not $started) { throw 'Rootless Docker did not start. Review the message above; the current server was not stopped.' }

