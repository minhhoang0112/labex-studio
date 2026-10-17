$connections = Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | Where-Object { $_.LocalPort -in 5000, 5173 }
foreach ($connection in $connections) {
  $owner = Get-CimInstance Win32_Process -Filter ("ProcessId=" + $connection.OwningProcess)
  [pscustomobject]@{ Address = $connection.LocalAddress; Port = $connection.LocalPort; PID = $connection.OwningProcess; Parent = $owner.ParentProcessId; Command = $owner.CommandLine }
}
