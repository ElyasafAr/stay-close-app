# Script to check and push all missing files
# Usage: .\check_and_push_all.ps1

Write-Host "=== Checking and Pushing All Files ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    exit 1
}

# Add all files
Write-Host "=== Adding all files ===" -ForegroundColor Cyan
git add -A

# Show status
Write-Host ""
Write-Host "=== Files to be committed ===" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Add all missing files including i18n, services, and components"
if ($LASTEXITCODE -ne 0) {
    Write-Host "No changes to commit or commit failed" -ForegroundColor Yellow
    git status
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "All files pushed to GitHub!" -ForegroundColor Green
    Write-Host "Railway will auto-deploy in 2-3 minutes" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green








