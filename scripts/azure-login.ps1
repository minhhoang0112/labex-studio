param([switch]$DeviceCode)
$ErrorActionPreference = 'Stop'
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$python = Join-Path $workspace '.tools\azure-cli\Scripts\python.exe'
if (-not (Test-Path -LiteralPath $python)) { throw 'Install the project-local Azure CLI before running this script.' }
$loginArgs = @('-m','azure.cli','login','--output','none')
if ($DeviceCode) { $loginArgs += '--use-device-code' }
& $python @loginArgs
if ($LASTEXITCODE -ne 0) { throw 'Azure login failed.' }
$accountJson = & $python -m azure.cli account show --output json --only-show-errors
if ($LASTEXITCODE -ne 0) { throw 'Cannot read the selected Azure subscription.' }
$account = $accountJson | ConvertFrom-Json
$configPath = Join-Path $workspace '.env'
$existing = if (Test-Path -LiteralPath $configPath) { [IO.File]::ReadAllText($configPath) } else { '' }
$settings = @{ AZURE_SUBSCRIPTION_ID=$account.id; AZURE_AUTH_MODE='cli' }
foreach ($entry in $settings.GetEnumerator()) {
    $pattern = '(?m)^\s*' + [regex]::Escape($entry.Key) + '=.*$'
    $line = $entry.Key + '=' + $entry.Value
    if ([regex]::IsMatch($existing, $pattern)) { $existing = [regex]::Replace($existing, $pattern, $line) }
    else { $existing = $existing.TrimEnd() + "`r`n" + $line + "`r`n" }
}
[IO.File]::WriteAllText($configPath, $existing, (New-Object Text.UTF8Encoding($false)))
Write-Output ('Azure login ready; selected subscription: ' + $account.name)
Write-Output 'Restart the local backend to load the subscription setting.'
