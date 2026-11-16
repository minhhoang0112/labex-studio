$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$folder='C:\LabEx\PracticeFaults\useracl\Documents'
$form=New-Object Windows.Forms.Form
$form.Text='LabEx - Employee document editor - '+[Security.Principal.WindowsIdentity]::GetCurrent().Name
$form.Size=New-Object Drawing.Size(760,470)
$form.StartPosition='CenterScreen'
$label=New-Object Windows.Forms.Label
$label.Text='Lab application: Open reference, edit a copy, Save as. Your Windows identity is shown in the title.'
$label.SetBounds(15,15,710,40)
$text=New-Object Windows.Forms.TextBox
$text.Multiline=$true;$text.ScrollBars='Both';$text.SetBounds(15,65,710,290)
$open=New-Object Windows.Forms.Button;$open.Text='Open reference';$open.SetBounds(15,370,150,35)
$save=New-Object Windows.Forms.Button;$save.Text='Save as...';$save.SetBounds(180,370,150,35)
$open.Add_Click({try{$text.Text=[IO.File]::ReadAllText((Join-Path $folder 'reference.txt'))}catch{[Windows.Forms.MessageBox]::Show($_.Exception.Message,'Read failed') | Out-Null}})
$save.Add_Click({
    $dialog=New-Object Windows.Forms.SaveFileDialog
    $dialog.InitialDirectory=$folder;$dialog.Filter='Text documents (*.txt)|*.txt';$dialog.FileName='work-note.txt'
    try {
        if($dialog.ShowDialog() -eq 'OK'){
            if([IO.Path]::GetDirectoryName($dialog.FileName) -ne $folder -or [IO.Path]::GetFileName($dialog.FileName) -ieq 'reference.txt'){throw 'Save a new copy inside the lab Documents folder; preserve reference.txt.'}
            [IO.File]::WriteAllText($dialog.FileName,$text.Text)
            [Windows.Forms.MessageBox]::Show('Saved: '+$dialog.FileName,'Saved') | Out-Null
        }
    } catch {[Windows.Forms.MessageBox]::Show($_.Exception.Message,'Save failed') | Out-Null}
    finally {$dialog.Dispose()}
})
$form.Controls.AddRange(@($label,$text,$open,$save))
[void]$form.ShowDialog();$form.Dispose()
