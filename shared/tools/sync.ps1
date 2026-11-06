# Pulls the latest agent-office from GitHub. Run every 15 minutes by Windows
# Task Scheduler (set up with install-sync.ps1). Safe: --ff-only means it never
# merges or overwrites local changes; if your copy has diverged it does nothing
# and logs why. Log: %LOCALAPPDATA%\agent-office-sync.log
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$log = Join-Path $env:LOCALAPPDATA "agent-office-sync.log"
$env:GIT_TERMINAL_PROMPT = "0"

$output = & git -C $repo pull --ff-only 2>&1 | Out-String
$result = if ($LASTEXITCODE -eq 0) { "ok" } else { "FAILED" }
"$(Get-Date -Format 'yyyy-MM-dd HH:mm') $result $($output.Trim())" | Add-Content -Path $log

# Keep the log short: last 500 lines.
$lines = Get-Content -Path $log -Tail 500
Set-Content -Path $log -Value $lines
