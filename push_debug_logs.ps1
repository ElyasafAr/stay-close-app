# Script to push debug logs for API URL
# Usage: .\push_debug_logs.ps1

Write-Host "=== Pushing Debug Logs ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Check Git status
Write-Host "=== Checking Git status ===" -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "Changes found:" -ForegroundColor Yellow
    Write-Host $status
} else {
    Write-Host "No changes to commit" -ForegroundColor Green
    exit 0
}

# Add files
Write-Host ""
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan
git add services/api.ts next.config.js DEBUG_API_URL.md
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Add debug logs for API URL environment variable"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit may have failed or nothing to commit" -ForegroundColor Yellow
    exit 1
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Debug logs pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
    Write-Host "2. Wait 2-3 minutes for deployment" -ForegroundColor Cyan
    Write-Host "3. Refresh the app (Ctrl+F5)" -ForegroundColor Cyan
    Write-Host "4. Open Console (F12) and look for: 🔍 [API] Environment check:" -ForegroundColor Cyan
    Write-Host "5. Send me the logs!" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green

