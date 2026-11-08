# One-off setup for a new Windows PC or laptop. Run it from the agent-office
# folder after cloning:
#   powershell -ExecutionPolicy Bypass -File shared\tools\setup-pc.ps1
# Safe to run again: it skips anything that's already done.
# It installs (with winget) whatever is missing of Node.js, Python, pandoc and
# LibreOffice, sets your git name and email if they aren't set, installs the
# office's packages, puts this copy on main and sets up the automatic pull.
$ErrorActionPreference = "Continue"
$repo = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
Set-Location $repo

function Have($cmd) { [bool](Get-Command $cmd -ErrorAction SilentlyContinue) }
function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host "`n1. Programs" -ForegroundColor Cyan
$soffice = "C:\Program Files\LibreOffice\program\soffice.exe"
$programs = @(
    @{ Name = "Node.js";     Id = "OpenJS.NodeJS.LTS";             Have = { Have node } },
    @{ Name = "Python";      Id = "Python.Python.3.14";            Have = { (Have py) -or ((Have python) -and ((python --version 2>&1) -match "Python 3")) } },
    @{ Name = "pandoc";      Id = "JohnMacFarlane.Pandoc";         Have = { Have pandoc } },
    @{ Name = "LibreOffice"; Id = "TheDocumentFoundation.LibreOffice"; Have = { Test-Path $soffice } }
)
foreach ($p in $programs) {
    if (& $p.Have) { Write-Host "   $($p.Name): already installed"; continue }
    if (-not (Have winget)) { Write-Host "   $($p.Name): missing. Install it yourself (winget isn't available)." -ForegroundColor Yellow; continue }
    Write-Host "   $($p.Name): installing..."
    winget install --id $p.Id -e --accept-source-agreements --accept-package-agreements --silent
    Refresh-Path
}

Write-Host "`n2. Git name and email (used for the office's backups)" -ForegroundColor Cyan
foreach ($key in "user.name", "user.email") {
    $value = (git config --global $key) 2>$null
    if (-not $value) { $value = Read-Host "   Your git $key"; git config --global $key $value }
    Write-Host "   $key = $value"
}

Write-Host "`n3. This copy on main, up to date" -ForegroundColor Cyan
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne "main") {
    if (git status --porcelain) { Write-Host "   On branch $branch with unsaved changes, so leaving it. Switch to main when you can." -ForegroundColor Yellow }
    else { git checkout main }
}
# Run the sync in the background so setup never waits on GitHub.
Start-Process powershell.exe -WindowStyle Hidden -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$(Join-Path $PSScriptRoot 'sync.ps1')`""
Write-Host "   Getting the latest from GitHub in the background (log: $env:LOCALAPPDATA\agent-office-sync.log)"
Write-Host "   Latest: $(git log -1 --format='%h %s')"

Write-Host "`n4. Office packages" -ForegroundColor Cyan
if (Have npm) {
    # One office per person; install the packages for each one in this copy.
    foreach ($office in Get-ChildItem -Directory -Path $repo | Where-Object { Test-Path (Join-Path $_.FullName "shared\office-view\package.json") }) {
        Write-Host "   $($office.Name)"
        Push-Location (Join-Path $office.FullName "shared\office-view")
        npm.cmd install --no-audit --no-fund --loglevel=error
        Pop-Location
    }
    Write-Host "   done"
} else { Write-Host "   npm not found yet. Close this window, open a new one and run this script again." -ForegroundColor Yellow }

Write-Host "`n5. Automatic pull" -ForegroundColor Cyan
& (Join-Path $PSScriptRoot "install-sync.ps1")

Write-Host "`n6. Claude Code" -ForegroundColor Cyan
if (Have claude) { Write-Host "   already installed" }
else { Write-Host "   Not found. Hal's automatic runs need it: see https://code.claude.com/docs/en/setup, then run 'claude' once to sign in." -ForegroundColor Yellow }

Write-Host "`nAll set. Open your own office folder (Tim's Job Search or Hal's Job Search), then double-click shared\office-view\Open Office.cmd to open the office." -ForegroundColor Green
