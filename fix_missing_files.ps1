# Script to add missing files and push to Git
# Usage: .\fix_missing_files.ps1

Write-Host "=== Fixing Missing Files ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Add missing directories
Write-Host "=== Adding missing files to Git ===" -ForegroundColor Cyan
git add i18n/ services/ components/
if ($LASTEXITCODE -eq 0) {
    Write-Host "Files added" -ForegroundColor Green
} else {
    Write-Host "Error adding files" -ForegroundColor Red
    exit 1
}

# Check what was added
Write-Host ""
Write-Host "=== Files to be committed ===" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Add missing i18n, services, and components files"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful" -ForegroundColor Green
} else {
    Write-Host "Commit may have failed or nothing to commit" -ForegroundColor Yellow
    Write-Host "Checking status..." -ForegroundColor Yellow
    git status
    exit 1
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Missing files pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
    Write-Host "2. Wait 2-3 minutes for deployment" -ForegroundColor Cyan
    Write-Host "3. Build should succeed now!" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green








