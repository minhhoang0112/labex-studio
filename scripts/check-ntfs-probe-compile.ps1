$ErrorActionPreference='Stop'
# Compilation only. Do not create users or impersonate on the developer workstation.
Add-Type -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\server\runtime\windows\ntfs-user-probe.cs') -Raw)
if(-not('LabExNtfsProbe' -as [type])){throw 'Probe type missing'}
Write-Output 'PASS: Windows PowerShell/.NET Framework probe compiles. No users or files changed.'
