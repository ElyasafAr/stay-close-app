# Script to push notification permission fix to Git
# Usage: .\push_notification_fix.ps1

Write-Host "=== Pushing Notification Permission Fix ===" -ForegroundColor Cyan
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
    Write-Host "No changes (files already committed)" -ForegroundColor Green
}

# Add files
Write-Host ""
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan
git add components/ReminderChecker.tsx components/ReminderModal.tsx NOTIFICATIONS_EXPLANATION.md
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Fix: Request notification permission only when creating reminders (better UX)"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit may have failed or nothing to commit" -ForegroundColor Yellow
}

# Push
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Notification permission fix pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Changes:" -ForegroundColor Yellow
    Write-Host "- Notification permission now requested only when creating reminders" -ForegroundColor Cyan
    Write-Host "- Better user experience - users understand the context" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
    Write-Host "2. Test by creating a new reminder" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green


