$ErrorActionPreference='Stop'
Add-Type -TypeDefinition (Get-Content -LiteralPath (Join-Path $PSScriptRoot '..\server\runtime\windows\performance-worker.cs') -Raw)
if(-not('LabExPerformanceApp' -as [type])){throw 'Missing worker type'}
Write-Output 'PASS: bounded worker compiles on .NET Framework; Main was not executed.'
