# Trusted networking exercises. Listeners bind only IPv4 loopback and are always disposed.
function Get-NwfAddresses {
  return @(Get-NetIPAddress -AddressFamily IPv4 | Sort-Object InterfaceIndex,IPAddress | ForEach-Object {
    "$($_.InterfaceIndex)|$($_.IPAddress)|$($_.PrefixLength)|$($_.PrefixOrigin)|$($_.AddressState)"
  })
}
function Get-NwfRoutes {
  return @(Get-NetRoute -AddressFamily IPv4 | Sort-Object InterfaceIndex,DestinationPrefix,NextHop,RouteMetric | ForEach-Object {
    "$($_.InterfaceIndex)|$($_.DestinationPrefix)|$($_.NextHop)|$($_.RouteMetric)"
  })
}
function Get-NwfDhcp {
  return @(Get-NetIPInterface -AddressFamily IPv4 | Sort-Object InterfaceIndex | ForEach-Object {
    "$($_.InterfaceIndex)|$($_.Dhcp)|$($_.ConnectionState)"
  })
}
function Get-NwfDns {
  return @(Get-DnsClientServerAddress -AddressFamily IPv4 | Sort-Object InterfaceIndex | ForEach-Object {
    "$($_.InterfaceIndex)|$(@($_.ServerAddresses) -join ',')"
  })
}
function Get-NwfSubnet([string]$address,[int]$prefix){
  if($prefix -lt 0 -or $prefix -gt 32 -or $address -notmatch '^\d{1,3}(\.\d{1,3}){3}$'){throw 'IPv4/prefix invalid'}
  $ip=[Net.IPAddress]::Parse($address)
  $bytes=$ip.GetAddressBytes();[uint64]$number=0
  foreach($b in $bytes){$number=($number*256)+$b}
  [uint64]$size=[Math]::Pow(2,32-$prefix)
  [uint64]$network=[Math]::Floor($number/$size)*$size
  [uint64]$last=$network+$size-1
  $firstText=(@(24,16,8,0)|ForEach-Object {[string](($network -shr $_) -band 255)}) -join '.'
  $lastText=(@(24,16,8,0)|ForEach-Object {[string](($last -shr $_) -band 255)}) -join '.'
  [pscustomobject]@{Network=$firstText;LastAddress=$lastText;Prefix=$prefix}
}
function Get-NwfLocalNames {
  # OS resolver test; localhost is NOT proof of an external DNS-server query.
  return @([Net.Dns]::GetHostAddresses('localhost') | ForEach-Object {$_.IPAddressToString} | Sort-Object)
}
function Test-NwfConnect([int]$port){
  $client=[Net.Sockets.TcpClient]::new()
  try{
    $pending=$client.BeginConnect([Net.IPAddress]::Loopback,$port,$null,$null)
    try{if(-not $pending.AsyncWaitHandle.WaitOne(1500)){return $false};$client.EndConnect($pending);return $client.Connected}
    catch{return $false}finally{$pending.AsyncWaitHandle.Close()}
  }finally{$client.Dispose()}
}
function Get-NwfTcpExperiment {
  $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
  $accepted=$null
  try{
    $listener.Start();$port=([Net.IPEndPoint]$listener.LocalEndpoint).Port
    $open=Test-NwfConnect $port
    if(-not $open){throw 'Loopback connection failed'}
    $accepted=$listener.AcceptTcpClient();$accepted.Dispose();$accepted=$null
    $listener.Stop()
    $closed=Test-NwfConnect $port
    if($closed){throw 'Port was reused; rerun experiment'}
    [pscustomobject]@{Address='127.0.0.1';OpenReachable=$open;ClosedReachable=$closed;Transport='TCP';Scope='LoopbackOnly'}
  }finally{if($accepted){$accepted.Dispose()};$listener.Stop()}
}
function Get-NwfHttpExperiment([string]$path){
  if($path -notin @('/health','/missing')){throw 'Only known local exercise paths allowed'}
  $listener=[Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback,0)
  $client=$null;$server=$null
  try{
    $listener.Start();$port=([Net.IPEndPoint]$listener.LocalEndpoint).Port
    $client=[Net.Sockets.TcpClient]::new();$pending=$client.BeginConnect([Net.IPAddress]::Loopback,$port,$null,$null)
    try{if(-not $pending.AsyncWaitHandle.WaitOne(1500)){throw 'Connection timeout'};$client.EndConnect($pending)}finally{$pending.AsyncWaitHandle.Close()}
    $server=$listener.AcceptTcpClient()
    $cs=$client.GetStream();$cs.ReadTimeout=2000;$cs.WriteTimeout=2000
    $ss=$server.GetStream();$ss.ReadTimeout=2000;$ss.WriteTimeout=2000
    $request=[Text.Encoding]::ASCII.GetBytes("GET $path HTTP/1.1`r`nHost: localhost`r`nConnection: close`r`n`r`n")
    $cs.Write($request,0,$request.Length)
    $requestReader=[IO.StreamReader]::new($ss,[Text.Encoding]::ASCII)
    $firstLine=$requestReader.ReadLine()
    if($firstLine -notmatch '^GET (/health|/missing) HTTP/1.1$'){throw 'Unexpected request'}
    $status=if($Matches[1] -eq '/health'){200}else{404}
    $body=if($status -eq 200){'NETLAB_OK'}else{'NETLAB_NOT_FOUND'}
    $reason=if($status -eq 200){'OK'}else{'Not Found'}
    $response=[Text.Encoding]::ASCII.GetBytes("HTTP/1.1 $status $reason`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n$body")
    $ss.Write($response,0,$response.Length);$ss.Flush();$server.Dispose();$server=$null
    $reader=[IO.StreamReader]::new($cs,[Text.Encoding]::ASCII);$received=$reader.ReadToEnd();$reader.Dispose()
    if($received -notmatch '^HTTP/1.1 (200|404) '){throw 'Invalid HTTP response'}
    $actualStatus=[int]$Matches[1];$actualBody=($received -split "`r`n`r`n",2)[1]
    [pscustomobject]@{Scope='LoopbackOnly';Path=$path;TcpConnected=$true;Status=$actualStatus;Body=$actualBody}
  }finally{if($server){$server.Dispose()};if($client){$client.Dispose()};$listener.Stop()}
}
