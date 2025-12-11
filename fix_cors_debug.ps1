# Script to fix CORS issue with debug configuration
# Usage: .\fix_cors_debug.ps1

Write-Host "=== Fixing CORS Configuration (Debug Mode) ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    exit 1
}

# Add files
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan
git add backend/main.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "Files added" -ForegroundColor Green
} else {
    Write-Host "Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Fix: Allow all origins in CORS for debugging (temporary)"
if ($LASTEXITCODE -eq 0) {
    Write-Host "Commit successful" -ForegroundColor Green
} else {
    Write-Host "Commit may have failed" -ForegroundColor Yellow
    exit 1
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "CORS debug fix pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Note:" -ForegroundColor Yellow
    Write-Host "This allows ALL origins temporarily for debugging." -ForegroundColor Cyan
    Write-Host "After confirming it works, we'll restrict it to specific origins." -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy Backend" -ForegroundColor Cyan
    Write-Host "2. Wait 2-3 minutes" -ForegroundColor Cyan
    Write-Host "3. Refresh the app (Ctrl+F5)" -ForegroundColor Cyan
    Write-Host "4. Try login again - should work now!" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green



