# Sets up a Windows scheduled task that runs sync.ps1 at log-on, so this copy of
# agent-office is brought up to date with GitHub each time you sign in. (There is no
# repeating timer. "Open Office.cmd" also runs sync.ps1, and you can run 'git pull' any time.)
# Run once, from the agent-office folder:
#   powershell -ExecutionPolicy Bypass -File shared\tools\install-sync.ps1
# To remove it:
#   Unregister-ScheduledTask -TaskName "agent-office git pull" -Confirm:$false
$script = Join-Path $PSScriptRoot "sync.ps1"
$action = New-ScheduledTaskAction -Execute "powershell.exe" `
    -Argument "-NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$script`""
$atLogOn = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries -AllowStartIfOnBatteries `
    -ExecutionTimeLimit (New-TimeSpan -Minutes 5)
Register-ScheduledTask -TaskName "agent-office git pull" -Action $action -Trigger $atLogOn `
    -Settings $settings -Description "Keeps agent-office up to date with GitHub (pulls merged work when you log on)" -Force | Out-Null
Write-Host "Scheduled task 'agent-office git pull' set up. It runs at log-on only, with no 5-minute repeat."
Write-Host "Log: $env:LOCALAPPDATA\agent-office-sync.log"
