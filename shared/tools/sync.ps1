# Keeps this copy of agent-office up to date with GitHub. Windows Task Scheduler
# runs it at log-on and every 5 minutes (set up with install-sync.ps1), and
# "Open Office.cmd" runs it before opening the office.
#
# - On main: brings in what was merged, as soon as it's on GitHub.
# - On another branch: still updates your local main in the background.
# - If this laptop has its own commits that aren't on GitHub yet (e.g. an office
#   backup whose push failed), it merges the two. If they clash, it undoes the
#   merge, changes nothing and logs why.
# - Never deletes or overwrites your work, and never force-pushes.
# Log: %LOCALAPPDATA%\agent-office-sync.log
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
$log = Join-Path $env:LOCALAPPDATA "agent-office-sync.log"
$env:GIT_TERMINAL_PROMPT = "0"
$env:GCM_INTERACTIVE = "never"  # never wait on a sign-in window; fail and log instead
$ErrorActionPreference = "Continue"  # git writes progress to stderr; don't treat it as an error

function Git { & git -C $repo @args 2>&1 | Out-String }
function Write-Log($result, $text) {
    "$(Get-Date -Format 'yyyy-MM-dd HH:mm') $result $($text.Trim())" | Add-Content -Path $log
    Set-Content -Path $log -Value (Get-Content -Path $log -Tail 500)  # keep the last 500 lines
    if ($result -ne "ok") { Write-Host "Sync: $result $($text.Trim())" }
}

# Give up on a stalled connection after about 20 seconds.
$out = Git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin --prune
if ($LASTEXITCODE -ne 0) {
    Write-Log "FAILED" "Couldn't sign in to or reach GitHub. Open PowerShell in the agent-office folder and run 'git fetch' once to sign in. $out"
    exit 1
}

$branch = (Git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") {
    # Fast-forward the local main without switching to it.
    $out = Git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=20 fetch origin main:main
    if ($LASTEXITCODE -ne 0) { Write-Log "FAILED" "On branch $branch; local main couldn't be updated: $out"; exit 1 }
    Write-Log "ok" "On branch $branch (not main); local main updated. Run 'git checkout main' to use it."
    exit 0
}

$behind = [int](Git rev-list --count HEAD..origin/main).Trim()
$ahead = [int](Git rev-list --count origin/main..HEAD).Trim()
if ($behind -eq 0) { Write-Log "ok" "Up to date ($ahead local commit(s) not yet pushed)"; exit 0 }

if ($ahead -eq 0) {
    $out = Git merge --ff-only origin/main
} else {
    $out = Git merge --no-edit origin/main
    if ($LASTEXITCODE -ne 0) {
        Git merge --abort | Out-Null
        Write-Log "FAILED" "Your local commits clash with GitHub's. Nothing changed. Ask Claude to sort it out. $out"
        exit 1
    }
}
if ($LASTEXITCODE -ne 0) { Write-Log "FAILED" "Couldn't update (probably unsaved edits to the same files). Nothing changed. $out"; exit 1 }
Write-Log "ok" "Pulled $behind new commit(s) from GitHub"
