# Script to push the fix to GitHub

Write-Host "=== Checking Git Status ===" -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "Changes found:" -ForegroundColor Yellow
    Write-Host $status
} else {
    Write-Host "No uncommitted changes" -ForegroundColor Green
}

Write-Host "`n=== Adding files ===" -ForegroundColor Cyan
git add backend/auth.py
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git commit -m "Fix: Add missing create_or_get_firebase_user function"
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit may have failed or nothing to commit" -ForegroundColor Yellow
}

Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host "`n✅ Code uploaded to GitHub!" -ForegroundColor Green
    Write-Host "Now go to Railway and click 'Redeploy'" -ForegroundColor Yellow
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Verifying ===" -ForegroundColor Cyan
$lastCommit = git log --oneline -1
Write-Host "Last commit: $lastCommit" -ForegroundColor Cyan









