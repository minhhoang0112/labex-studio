# Execute the real backup lesson commands/probes on isolated local fixture data.
# Does not touch Azure, IIS, services, user data or learner workspaces.
$ErrorActionPreference='Stop'
$workspace=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$artifacts=Join-Path $workspace '.artifacts'
$testRoot=Join-Path $artifacts ('professional-test-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $testRoot | Out-Null
$checks=0
function Require([bool]$ok,[string]$message){if(-not $ok){throw $message};$script:checks++}
try{
    . (Join-Path $workspace 'server\runtime\windows\professional-common.ps1')
    $rules=Get-Content (Join-Path $workspace 'server\data\windows-professional-rules.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $tokens=$null;$errors=$null
    foreach($entry in $rules.PSObject.Properties){
        [void][Management.Automation.Language.Parser]::ParseInput($entry.Value.probe,[ref]$tokens,[ref]$errors)
        Require ($errors.Count -eq 0) ('Invalid probe: '+$entry.Name)
    }
    foreach($labId in @('win-bkr-complete-restore','win-bkr-version-rollback','win-bkr-archive-validation','win-web-isolated-site')){
        $lab=Get-Content (Join-Path $workspace ('server\data\labs\'+$labId+'.json')) -Raw -Encoding UTF8 | ConvertFrom-Json
        $labRoot=Join-Path $testRoot $labId
        foreach($step in $lab.steps){
            $blocks=[regex]::Matches($step.content,'(?s)```powershell\s*\n(.*?)```')
            Require ($blocks.Count -eq 1) ('Missing lesson command: '+$step.id)
            $command=$blocks[0].Groups[1].Value
            [void][Management.Automation.Language.Parser]::ParseInput($command,[ref]$tokens,[ref]$errors)
            Require ($errors.Count -eq 0) ('Invalid lesson command: '+$step.id)
            if($labId -eq 'win-web-isolated-site'){continue} # Parse only: IIS is a Server integration acceptance.
            New-Item -ItemType Directory -Path $labRoot -Force | Out-Null
            $probe=[scriptblock]::Create($rules.($step.id).probe)
            Require (-not (& $probe)) ('Empty workspace passed: '+$step.id)
            $command=$command.Replace(('C:\LabEx\Labs\'+$labId),$labRoot)
            & ([scriptblock]::Create($command)) | Out-Null
            Require ([bool](& $probe)) ('Correct real lesson work failed: '+$step.id)
            if($labId -eq 'win-bkr-complete-restore'){
                $file=if($step.position -eq 1){'Backup\Contracts\contract.txt'}else{'Restore\invoice.txt'}
            }elseif($labId -eq 'win-bkr-version-rollback'){
                $file='Working\orders.txt'
            }else{
                $file='damaged.zip'
            }
            $path=Join-Path $labRoot $file
            $before=[IO.File]::ReadAllBytes($path)
            try{
                [IO.File]::WriteAllBytes($path,[byte[]](88))
                Require (-not (& $probe)) ('Damaged/incorrect data passed: '+$step.id)
            }finally{[IO.File]::WriteAllBytes($path,$before)}
            Require ([bool](& $probe)) ('Restored fixture failed: '+$step.id)
        }
    }
    Write-Output "Professional curriculum: $checks real local assertions passed (backup commands, partial/corrupt negatives, rule and IIS syntax). Azure/IIS live acceptance remains pending."
}finally{
    $resolved=[IO.Path]::GetFullPath($testRoot)
    if(-not $resolved.StartsWith($artifacts+[IO.Path]::DirectorySeparatorChar,[StringComparison]::OrdinalIgnoreCase) -or [IO.Path]::GetFileName($resolved) -notmatch '^professional-test-[a-f0-9]{32}$'){throw 'Unsafe cleanup path'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
