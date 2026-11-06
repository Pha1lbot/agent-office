# Sets up a Windows scheduled task that runs sync.ps1 at log-on and every
# 15 minutes, so this copy of agent-office stays up to date with GitHub.
# Run once, from the agent-office folder:
#   powershell -ExecutionPolicy Bypass -File shared\tools\install-sync.ps1
# To remove it:
#   Unregister-ScheduledTask -TaskName "agent-office git pull" -Confirm:$false
$script = Join-Path $PSScriptRoot "sync.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$every15 = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 15)
$atLogOn = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "agent-office git pull" -Action $action -Trigger $every15, $atLogOn `
    -Settings $settings -Description "Keeps agent-office up to date with GitHub (git pull --ff-only)" -Force | Out-Null
Write-Host "Scheduled task 'agent-office git pull' set up. It runs at log-on and every 15 minutes."
Write-Host "Log: $env:LOCALAPPDATA\agent-office-sync.log"
