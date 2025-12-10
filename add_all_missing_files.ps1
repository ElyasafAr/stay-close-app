# Script to add all missing frontend files to Git
# Usage: .\add_all_missing_files.ps1

Write-Host "=== Adding All Missing Frontend Files ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    exit 1
}

# Add all directories that might be missing
Write-Host "=== Adding directories to Git ===" -ForegroundColor Cyan

# Add i18n directory
if (Test-Path "i18n") {
    git add i18n/
    Write-Host "Added i18n/" -ForegroundColor Green
}

# Add services directory
if (Test-Path "services") {
    git add services/
    Write-Host "Added services/" -ForegroundColor Green
}

# Add components directory
if (Test-Path "components") {
    git add components/
    Write-Host "Added components/" -ForegroundColor Green
}

# Add lib directory (for Firebase)
if (Test-Path "lib") {
    git add lib/
    Write-Host "Added lib/" -ForegroundColor Green
}

# Add state directory (if exists)
if (Test-Path "state") {
    git add state/
    Write-Host "Added state/" -ForegroundColor Green
}

# Check status
Write-Host ""
Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Add all missing frontend files (i18n, services, components, lib, state)"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful" -ForegroundColor Green
} else {
    Write-Host "No changes to commit or commit failed" -ForegroundColor Yellow
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All missing files pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy Frontend" -ForegroundColor Cyan
    Write-Host "2. Wait 2-3 minutes" -ForegroundColor Cyan
    Write-Host "3. Check Railway logs for build status" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green


