# Functions selected by the backend; never load a learner-provided script.
function Assert-SrvStorage {
  if($labId -notmatch '^win-(adg|dnsdhcp)-[a-z0-9-]+$'){throw 'Invalid enterprise lab'}
  foreach($p in @('C:\ProgramData\LabEx','C:\ProgramData\LabEx\EnterpriseLabs')){
    if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse storage refused'}
  }
}
function Save-SrvContext($m){
  Assert-SrvStorage
  $folder='C:\ProgramData\LabEx\EnterpriseLabs'
  if(-not(Test-Path -LiteralPath $folder)){
    New-Item -ItemType Directory -Path $folder -Force|Out-Null
    $acl=[Security.AccessControl.DirectorySecurity]::new();$acl.SetAccessRuleProtection($true,$false)
    foreach($sid in @('S-1-5-18','S-1-5-32-544')){
      $rule=[Security.AccessControl.FileSystemAccessRule]::new([Security.Principal.SecurityIdentifier]::new($sid),'FullControl','ContainerInherit,ObjectInherit','None','Allow');$acl.AddAccessRule($rule)
    }
    Set-Acl -LiteralPath $folder -AclObject $acl
  }
  $file=Join-Path $folder ($labId+'.json')
  if((Test-Path -LiteralPath $file) -and ((Get-Item -LiteralPath $file -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse manifest refused'}
  $m|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $file -Encoding UTF8
}
function Get-SrvContext {
  Assert-SrvStorage
  if((Get-CimInstance Win32_OperatingSystem).ProductType -lt 2){throw 'Windows Server required'}
  $file='C:\ProgramData\LabEx\EnterpriseLabs\'+$labId+'.json'
  if(-not(Test-Path -LiteralPath $file)){throw 'Prepare this lesson first'}
  if((Get-Item -LiteralPath $file -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse manifest refused'}
  if((Get-Item -LiteralPath $file).Length -gt 1048576){throw 'Manifest too large'}
  $m=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json
  if($m.Schema -ne 1 -or $m.LabId -ne $labId -or $m.Host -ne $env:COMPUTERNAME -or $m.Run -notmatch '^[a-f0-9]{32}$'){throw 'Wrong manifest context'}
  if($labId.StartsWith('win-adg-') -and -not $m.RootGuid){throw 'Prepare incomplete; inspect intent manifest before retry'}
  if($m.RootGuid){
    $domain=Get-ADDomain
    $ou=Get-ADOrganizationalUnit -Identity $m.RootGuid -Properties Description
    if($m.DomainDN -ne $domain.DistinguishedName -or $ou.DistinguishedName -ne $m.RootDN -or $ou.Description -ne ('LabEx:'+ $m.Run)){throw 'AD ownership mismatch'}
  }
  return $m
}
function Initialize-SrvContext {
  Assert-SrvStorage
  $file='C:\ProgramData\LabEx\EnterpriseLabs\'+$labId+'.json'
  if((Get-CimInstance Win32_OperatingSystem).ProductType -lt 2){throw 'Windows Server required'}
  if(Test-Path -LiteralPath $file){
    if((Get-Item -LiteralPath $file -Force).Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Reparse manifest refused'}
    if((Get-Item -LiteralPath $file).Length -gt 1048576){throw 'Manifest too large'}
    $pending=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json
    if($labId.StartsWith('win-adg-') -and -not $pending.RootGuid){
      $d=Get-ADDomain
      if($pending.Schema -ne 1 -or $pending.LabId -ne $labId -or $pending.Host -ne $env:COMPUTERNAME -or $pending.Run -notmatch '^[a-f0-9]{32}$' -or $pending.DomainDN -ne $d.DistinguishedName){throw 'Invalid prepare intent'}
      $name='LabEx-'+$labId+'-'+$pending.Run.Substring(0,8)
      if($pending.RootDN -ne ('OU='+$name+','+$d.DistinguishedName)){throw 'Wrong prepare intent DN'}
      $ou=Get-ADOrganizationalUnit -Filter "Name -eq '$name'" -SearchBase $d.DistinguishedName -SearchScope OneLevel -Properties Description
      if($ou -and $ou.Description -ne ('LabEx:'+$pending.Run)){throw 'Cannot recover foreign OU'}
      if(-not $ou){$ou=New-ADOrganizationalUnit -Name $name -Path $d.DistinguishedName -Description ('LabEx:'+$pending.Run) -ProtectedFromAccidentalDeletion $true -PassThru}
      $pending.RootGuid=$ou.ObjectGUID.ToString();Save-SrvContext $pending
    }
    return Get-SrvContext
  }
  $run=[guid]::NewGuid().ToString('N');$short=$run.Substring(0,8)
  $m=[pscustomobject]@{Schema=1;LabId=$labId;Host=$env:COMPUTERNAME;Run=$run;DomainDN='';DomainDNS='';RootDN='';RootGuid='';Zone=('lx-'+$short+'.test');ZoneFile=('labex-'+$run+'.dns');GpoA='';GpoB='';Created=@();UpdatedUtc=[DateTimeOffset]::UtcNow.ToString('o')}
  if($labId.StartsWith('win-adg-')){
    $domain=Get-ADDomain;$m.DomainDN=$domain.DistinguishedName;$m.DomainDNS=$domain.DNSRoot
    $name='LabEx-'+$labId+'-'+$short;$m.RootDN='OU='+$name+','+$m.DomainDN
    # Save intent first; a failed prepare never silently adopts an existing OU.
    Save-SrvContext $m
    $ou=New-ADOrganizationalUnit -Name $name -Path $m.DomainDN -Description ('LabEx:'+$run) -ProtectedFromAccidentalDeletion $true -PassThru
    $m.RootGuid=$ou.ObjectGUID.ToString()
  }
  Save-SrvContext $m
  return Get-SrvContext
}
function Register-SrvObject([string]$type,[string]$id){
  $m=Get-SrvContext
  if($type -notin @('AD','GPO','ZONE','SCOPE')){throw 'Invalid owned object type'}
  if($type -eq 'AD'){
    $o=Get-ADObject -Identity $id -Properties Description
    if(-not $o.DistinguishedName.EndsWith(','+$m.RootDN,[StringComparison]::OrdinalIgnoreCase)){throw 'Object outside lesson OU'}
    if($o.ObjectClass -notin @('organizationalUnit','user','group') -or $o.Description -ne ('LabEx:'+$m.Run)){throw 'Only tagged lesson OUs/users/groups can be registered; computers are forbidden'}
  }
  if($type -eq 'GPO'){
    $g=Get-GPO -Guid $id
    if(-not $g.DisplayName.StartsWith('LabEx-'+$m.Run+'-')){throw 'GPO outside lesson namespace'}
  }
  if($type -eq 'ZONE'){
    $z=Get-DnsServerZone -Name $id
    if($id -ne $m.Zone -and $id -ne '2.0.192.in-addr.arpa'){throw 'DNS zone outside lesson namespace'}
    $expected=if($id -eq $m.Zone){$m.ZoneFile}else{'reverse-'+$m.ZoneFile}
    if($z.ZoneFile -ne $expected){throw 'DNS zone file ownership mismatch'}
  }
  if($type -eq 'SCOPE'){
    $s=Get-DhcpServerv4Scope -ScopeId $id
    if($s.Name -ne ('LabEx-'+$m.Run) -or $s.State -ne 'Inactive'){throw 'Only owned inactive scope allowed'}
  }
  if(-not @($m.Created|Where-Object {$_.Type -eq $type -and $_.Id -eq $id}).Count){$m.Created=@($m.Created)+@([pscustomobject]@{Type=$type;Id=$id});Save-SrvContext $m}
}
function Test-SrvOwned([string]$type,[string]$id){
  $m=Get-SrvContext
  return @($m.Created|Where-Object {$_.Type -eq $type -and $_.Id -eq $id}).Count -eq 1
}
function New-SrvOU([string]$name){
  if($name -notin @('Users','Groups','Workstations','Control')){throw 'Unexpected OU name'}
  $m=Get-SrvContext;$dn='OU='+$name+','+$m.RootDN
  $o=Get-ADOrganizationalUnit -Filter * -SearchBase $m.RootDN -SearchScope OneLevel|Where-Object DistinguishedName -eq $dn
  if(-not $o){$o=New-ADOrganizationalUnit -Name $name -Path $m.RootDN -Description ('LabEx:'+$m.Run) -ProtectedFromAccidentalDeletion $true -PassThru;Register-SrvObject 'AD' $o.ObjectGUID.ToString()}
  if(-not(Test-SrvOwned 'AD' $o.ObjectGUID.ToString())){throw 'Unregistered OU; do not adopt it'}
  return $o
}
function New-SrvUser([string]$suffix){
  if($suffix -notin @('learner','delegate','control')){throw 'Unexpected user role'}
  $m=Get-SrvContext;$ou=New-SrvOU 'Users';$sam='lx'+$m.Run.Substring(0,8)+$suffix
  $u=Get-ADUser -Filter "SamAccountName -eq '$sam'" -Properties Description
  if(-not $u){
    $password=ConvertTo-SecureString ([guid]::NewGuid().ToString('N')+'aA!2') -AsPlainText -Force
    $u=New-ADUser -Name $sam -SamAccountName $sam -Path $ou.DistinguishedName -AccountPassword $password -Enabled $true -Description ('LabEx:'+$m.Run) -PassThru
    Register-SrvObject 'AD' $u.ObjectGUID.ToString()
  }
  if(-not(Test-SrvOwned 'AD' $u.ObjectGUID.ToString())){throw 'Unregistered user'}
  return Get-ADUser -Identity $u.ObjectGUID -Properties Description,Enabled,MemberOf
}
function New-SrvGroup([string]$scope){
  if($scope -notin @('Global','DomainLocal')){throw 'Unexpected group scope'}
  $m=Get-SrvContext;$ou=New-SrvOU 'Groups';$name='lx'+$m.Run.Substring(0,8)+$scope
  $g=Get-ADGroup -Filter "Name -eq '$name'"
  if(-not $g){$g=New-ADGroup -Name $name -GroupScope $scope -GroupCategory Security -Path $ou.DistinguishedName -Description ('LabEx:'+$m.Run) -PassThru;Register-SrvObject 'AD' $g.ObjectGUID.ToString()}
  if(-not(Test-SrvOwned 'AD' $g.ObjectGUID.ToString())){throw 'Unregistered group'}
  return $g
}
function New-SrvGpo([string]$slot){
  if($slot -notin @('GpoA','GpoB')){throw 'Unexpected GPO slot'}
  $m=Get-SrvContext
  if($m.$slot){$g=Get-GPO -Guid $m.$slot;if(-not(Test-SrvOwned 'GPO' $g.Id.ToString())){throw 'Unknown GPO'};return $g}
  $g=New-GPO -Name ('LabEx-'+$m.Run+'-'+$slot) -Comment ('Owned by '+$labId)
  $m.$slot=$g.Id.ToString();Save-SrvContext $m;Register-SrvObject 'GPO' $g.Id.ToString();return $g
}
function Reset-SrvContext {
  $m=Get-SrvContext
  # Refuse unknown children before deleting anything. No recursive domain deletes.
  if($m.RootGuid){
    foreach($o in @(Get-ADObject -SearchBase $m.RootDN -SearchScope Subtree -Filter *)){
      if($o.ObjectGUID.ToString() -ne $m.RootGuid -and -not(Test-SrvOwned 'AD' $o.ObjectGUID.ToString())){throw 'Unknown object in lab OU; reset refused'}
    }
  }
  $items=@($m.Created);[array]::Reverse($items)
  foreach($o in $items){
    switch($o.Type){
      'GPO' {$g=Get-GPO -Guid $o.Id -ErrorAction SilentlyContinue;if($g){if(-not $g.DisplayName.StartsWith('LabEx-'+$m.Run+'-')){throw 'GPO identity changed'};$links=[xml](Get-GPOReport -Guid $o.Id -ReportType Xml);$root=Get-ADOrganizationalUnit -Identity $m.RootGuid -Properties CanonicalName;$allowed=$root.CanonicalName.TrimEnd('/');if(@($links.GPO.LinksTo|Where-Object {$_.SOMPath -and $_.SOMPath -ne $allowed -and -not $_.SOMPath.StartsWith($allowed+'/',[StringComparison]::OrdinalIgnoreCase)}).Count){throw 'GPO linked outside lesson; reset refused'};Remove-GPO -Guid $o.Id -Confirm:$false}}
      'AD' {$a=Get-ADObject -Identity $o.Id -Properties Description -ErrorAction SilentlyContinue;if($a){if($a.ObjectClass -notin @('organizationalUnit','user','group') -or $a.Description -ne ('LabEx:'+$m.Run) -or -not $a.DistinguishedName.EndsWith(','+$m.RootDN,[StringComparison]::OrdinalIgnoreCase)){throw 'Owned object changed or moved outside lesson; reset refused'};Set-ADObject -Identity $o.Id -ProtectedFromAccidentalDeletion $false;Remove-ADObject -Identity $o.Id -Confirm:$false}}
      'ZONE' {$z=Get-DnsServerZone -Name $o.Id -ErrorAction SilentlyContinue;if($z){$expected=if($o.Id -eq $m.Zone){$m.ZoneFile}else{'reverse-'+$m.ZoneFile};if($z.ZoneFile -ne $expected){throw 'Zone ownership changed'};Remove-DnsServerZone -Name $o.Id -Force}}
      'SCOPE' {$s=Get-DhcpServerv4Scope -ScopeId $o.Id -ErrorAction SilentlyContinue;if($s){if($s.Name -ne ('LabEx-'+$m.Run) -or $s.State -ne 'Inactive'){throw 'Scope changed; reset refused'};Remove-DhcpServerv4Scope -ScopeId $o.Id -Force}}
    }
  }
  if($m.RootGuid){Set-ADObject -Identity $m.RootGuid -ProtectedFromAccidentalDeletion $false;Remove-ADOrganizationalUnit -Identity $m.RootGuid -Confirm:$false}
  Remove-Item -LiteralPath ('C:\ProgramData\LabEx\EnterpriseLabs\'+$labId+'.json')
  Write-Output 'RESET_OK'
}
function Get-SrvResetRight {
  $config=(Get-ADRootDSE).configurationNamingContext
  $right=Get-ADObject -SearchBase ('CN=Extended-Rights,'+$config) -Filter "Name -eq 'User-Force-Change-Password'" -Properties rightsGuid
  if(@($right).Count -ne 1){throw 'Cannot resolve Reset Password extended right'}
  return [guid]$right.rightsGuid
}
function Test-SrvDelegation {
  $m=Get-SrvContext;$group=Get-ADGroup -Identity ('lx'+$m.Run.Substring(0,8)+'Global')
  if(-not(Test-SrvOwned 'AD' $group.ObjectGUID.ToString())){return $false}
  $dn='OU=Users,'+$m.RootDN;$acl=Get-Acl ('AD:\'+$dn);$right=Get-SrvResetRight
  $userSchema=Get-ADObject -Identity ('CN=User,'+(Get-ADRootDSE).schemaNamingContext) -Properties schemaIDGUID
  $class=[guid]::new([byte[]]$userSchema.schemaIDGUID)
  $ace=@($acl.Access|Where-Object { $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -eq $group.SID.Value })
  $good=@($ace|Where-Object {$_.AccessControlType -eq 'Allow' -and $_.ActiveDirectoryRights -eq 'ExtendedRight' -and $_.ObjectType -eq $right -and $_.InheritanceType -eq 'Descendents' -and $_.InheritedObjectType -eq $class})
  return $good.Count -eq 1 -and $ace.Count -eq 1
}
function Test-SrvResetAudit {
  $m=Get-SrvContext;$target=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'learner');$actor=Get-ADUser -Identity ('lx'+$m.Run.Substring(0,8)+'delegate')
  if(-not(Test-SrvOwned 'AD' $target.ObjectGUID.ToString()) -or -not(Test-SrvOwned 'AD' $actor.ObjectGUID.ToString())){return $false}
  $events=Get-WinEvent -FilterHashtable @{LogName='Security';Id=4724;StartTime=([DateTimeOffset]::Parse($m.UpdatedUtc).LocalDateTime)} -MaxEvents 200 -ErrorAction SilentlyContinue
  foreach($event in $events){
    if(-not($event.Keywords -band [long][Diagnostics.Eventing.Reader.StandardEventKeywords]::AuditSuccess)){continue}
    $xml=[xml]$event.ToXml();$data=@{};foreach($item in $xml.Event.EventData.Data){$data[$item.Name]=$item.'#text'}
    if($data.TargetSid -eq $target.SID.Value -and $data.SubjectUserSid -eq $actor.SID.Value){return $true}
  }
  return $false
}
function Test-SrvDnsRecord([string]$name,[string]$type,[string]$value){
  $m=Get-SrvContext
  if(-not(Test-SrvOwned 'ZONE' $m.Zone)){return $false}
  $r=@(Get-DnsServerResourceRecord -ZoneName $m.Zone -Name $name -RRType $type)
  if($r.Count -ne 1){return $false}
  $q=@(Resolve-DnsName -Name ($name+'.'+$m.Zone) -Server '127.0.0.1' -Type $type -DnsOnly -NoHostsFile -ErrorAction Stop)
  if($type -eq 'A'){return $r[0].RecordData.IPv4Address.IPAddressToString -eq $value -and @($q|Where-Object {$_.Type -eq 'A' -and $_.IPAddress -eq $value}).Count -eq 1}
  if($type -eq 'CNAME'){return $r[0].RecordData.HostNameAlias.TrimEnd('.') -eq $value.TrimEnd('.') -and @($q|Where-Object {$_.Type -eq 'CNAME' -and $_.NameHost.TrimEnd('.') -eq $value.TrimEnd('.')}).Count -eq 1}
  return $false
}
function New-SrvZone {
  $m=Get-SrvContext;$z=Get-DnsServerZone -Name $m.Zone -ErrorAction SilentlyContinue
  if(-not $z){Add-DnsServerPrimaryZone -Name $m.Zone -ZoneFile $m.ZoneFile -DynamicUpdate None;Register-SrvObject 'ZONE' $m.Zone}
  if(-not(Test-SrvOwned 'ZONE' $m.Zone)){throw 'Unregistered DNS zone; do not adopt'}
  return Get-DnsServerZone -Name $m.Zone
}
function New-SrvScope {
  $m=Get-SrvContext
  $network=switch -Regex ($labId){'^win-dnsdhcp-scope-options(?:-check-[a-z0-9]+)?$' {'192.0.2'};'^win-dnsdhcp-lease-audit(?:-check-[a-z0-9]+)?$' {'198.51.100'};'^win-dnsdhcp-dhcp-incident(?:-check-[a-z0-9]+)?$' {'203.0.113'};default{throw 'No DHCP scope for this lab'}}
  $id=$network+'.0';$s=Get-DhcpServerv4Scope -ScopeId $id -ErrorAction SilentlyContinue
  if(-not $s){Add-DhcpServerv4Scope -Name ('LabEx-'+$m.Run) -StartRange ($network+'.20') -EndRange ($network+'.100') -SubnetMask '255.255.255.0' -LeaseDuration (New-TimeSpan -Hours 8) -State Inactive;Register-SrvObject 'SCOPE' $id}
  if(-not(Test-SrvOwned 'SCOPE' $id)){throw 'Existing scope belongs to another lesson; do not adopt'}
  return Get-DhcpServerv4Scope -ScopeId $id
}
function Write-SrvObservation([string]$name,$data){
  $m=Get-SrvContext
  if($name -notmatch '^step[123]\.json$'){throw 'Invalid report filename'}
  $dir='C:\LabEx\Labs\'+$labId
  foreach($p in @('C:\LabEx','C:\LabEx\Labs',$dir)){
    if((Test-Path -LiteralPath $p) -and ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse workspace refused'}
  }
  New-Item -ItemType Directory -Path $dir -Force|Out-Null
  $file=Join-Path $dir $name
  if((Test-Path -LiteralPath $file) -and ((Get-Item -LiteralPath $file -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Reparse report refused'}
  @{Schema=1;LabId=$labId;Run=$m.Run;Host=$env:COMPUTERNAME;Utc=[DateTimeOffset]::UtcNow.ToString('o');Data=$data}|ConvertTo-Json -Depth 8|Set-Content -LiteralPath $file -Encoding UTF8
}
function Read-SrvObservation([string]$name){
  $m=Get-SrvContext
  if($name -notmatch '^step[123]\.json$'){throw 'Invalid report filename'}
  $dir='C:\LabEx\Labs\'+$labId
  foreach($p in @('C:\LabEx','C:\LabEx\Labs',$dir,(Join-Path $dir $name))){
    if(-not(Test-Path -LiteralPath $p) -or ((Get-Item -LiteralPath $p -Force).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Missing or reparse report'}
  }
  $file=Join-Path $dir $name;if((Get-Item -LiteralPath $file).Length -gt 1048576){throw 'Report too large'}
  $r=Get-Content -LiteralPath $file -Raw|ConvertFrom-Json
  [DateTimeOffset]$utc=[DateTimeOffset]::MinValue
  if($r.Schema -ne 1 -or $r.LabId -ne $labId -or $r.Run -ne $m.Run -or $r.Host -ne $env:COMPUTERNAME -or -not [DateTimeOffset]::TryParse([string]$r.Utc,[ref]$utc) -or $utc -lt [DateTimeOffset]::UtcNow.AddHours(-24) -or $utc -gt [DateTimeOffset]::UtcNow.AddMinutes(5)){throw 'Wrong or stale report'}
  return $r.Data
}
