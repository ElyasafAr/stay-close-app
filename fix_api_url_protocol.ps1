# Script to fix API URL protocol issue
# Usage: .\fix_api_url_protocol.ps1

Write-Host "=== Fixing API URL Protocol ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    exit 1
}

# Add files
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan
git add services/api.ts
if ($LASTEXITCODE -eq 0) {
    Write-Host "Files added" -ForegroundColor Green
} else {
    Write-Host "Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Fix: Ensure API URL always has https:// protocol"
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
    Write-Host "Fix pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Important:" -ForegroundColor Yellow
    Write-Host "Make sure NEXT_PUBLIC_API_URL in Railway starts with https://" -ForegroundColor Cyan
    Write-Host "Example: https://stay-close-app-backend-production.up.railway.app" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
    Write-Host "2. Wait 2-3 minutes" -ForegroundColor Cyan
    Write-Host "3. Refresh the app (Ctrl+F5)" -ForegroundColor Cyan
    Write-Host "4. Check Console - URL should have https://" -ForegroundColor Cyan
} else {
    Write-Host "Push failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green



