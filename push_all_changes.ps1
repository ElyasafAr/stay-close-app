# Script to push all recent changes to Git
# Usage: .\push_all_changes.ps1

Write-Host "=== Pushing All Changes to Git ===" -ForegroundColor Cyan
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
    Write-Host ""
    Write-Host "All changes are already committed!" -ForegroundColor Green
    exit 0
}

# Add all changed files
Write-Host ""
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan

# Frontend changes
git add services/auth.ts services/api.ts app/login/page.tsx
git add components/ReminderChecker.tsx components/ReminderModal.tsx

# Backend changes
git add backend/main.py backend/auth.py

# Documentation
git add NOTIFICATIONS_EXPLANATION.md FIX_NETWORK_ACCESS.md FIX_NETWORK_ACCESS_QUICK.md

# Scripts
git add push_logging_fix.ps1 push_notification_fix.ps1 push_all_changes.ps1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

# Show what will be committed
Write-Host ""
Write-Host "=== Files to be committed ===" -ForegroundColor Cyan
git status --short

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
$commitMessage = @"
Add comprehensive logging and improve notification UX

- Add detailed logging for authentication (frontend & backend)
- Request notification permission only when creating reminders (better UX)
- Add documentation for notifications and network access issues
- Improve error handling and debugging capabilities
"@

git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit may have failed or nothing to commit" -ForegroundColor Yellow
    Write-Host "Checking status..." -ForegroundColor Yellow
    git status
    exit 1
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ All changes pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary of changes:" -ForegroundColor Yellow
    Write-Host "- Comprehensive logging for authentication debugging" -ForegroundColor Cyan
    Write-Host "- Notification permission requested only when creating reminders" -ForegroundColor Cyan
    Write-Host "- Documentation for notifications and network access issues" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
    Write-Host "2. Check Railway logs for deployment status" -ForegroundColor Cyan
    Write-Host "3. Test the application after deployment" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check your internet connection" -ForegroundColor Cyan
    Write-Host "2. Verify you have push permissions" -ForegroundColor Cyan
    Write-Host "3. Try: git push origin main --verbose" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green


