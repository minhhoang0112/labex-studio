$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
$chromeExecutable = Join-Path ${env:ProgramFiles} 'Google\Chrome\Application\chrome.exe'
if (-not (Test-Path -LiteralPath $chromeExecutable)) { throw 'Google Chrome was not found.' }
$profileDirectory = Join-Path $projectDirectory '.artifacts\reference-browser-profile'
New-Item -ItemType Directory -Force -Path $profileDirectory | Out-Null
$chromeArguments = @(
  '--remote-debugging-address=127.0.0.1',
  '--remote-debugging-port=9222',
  ('--user-data-dir="' + $profileDirectory + '"'),
  '--no-first-run',
  '--new-window',
  'https://labex.io/courses/quick-start-with-linux'
)
Start-Process -FilePath $chromeExecutable -ArgumentList $chromeArguments -WindowStyle Normal | Out-Null
Write-Output 'Reference browser opened. Sign in to LabEx in that window. CDP: http://127.0.0.1:9222'
