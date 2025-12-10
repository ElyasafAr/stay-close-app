# Script to push changes to GitHub
# Usage: .\push_to_git.ps1 [commit message]

param(
    [string]$Message = "Update code"
)

Write-Host "=== Git Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in a git repository
if (-not (Test-Path .git)) {
    Write-Host "❌ Error: Not a git repository!" -ForegroundColor Red
    Write-Host "Run: git init" -ForegroundColor Yellow
    exit 1
}

# Check status
Write-Host "=== Checking Status ===" -ForegroundColor Cyan
$status = git status --porcelain
if ($status) {
    Write-Host "Changes found:" -ForegroundColor Yellow
    Write-Host $status
} else {
    Write-Host "No uncommitted changes" -ForegroundColor Green
    Write-Host "Checking if there are unpushed commits..." -ForegroundColor Yellow
    
    # Check if there are commits to push
    $localCommits = git log origin/main..HEAD --oneline 2>$null
    if ($localCommits) {
        Write-Host "Found unpushed commits, pushing..." -ForegroundColor Yellow
    } else {
        Write-Host "✅ Everything is up to date!" -ForegroundColor Green
        exit 0
    }
}

# Add all changes
Write-Host "`n=== Adding Files ===" -ForegroundColor Cyan
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host "`n=== Committing ===" -ForegroundColor Cyan
git commit -m $Message
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Commit successful" -ForegroundColor Green
} else {
    Write-Host "⚠️  Commit may have failed or nothing to commit" -ForegroundColor Yellow
    # Continue anyway - maybe there's nothing to commit
}

# Push
Write-Host "`n=== Pushing to GitHub ===" -ForegroundColor Cyan
git push origin main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Push successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "✅ Code uploaded to GitHub!" -ForegroundColor Green
    Write-Host "Repository: https://github.com/ElyasafAr/stay-close-app" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "1. Authentication failed - check GitHub credentials" -ForegroundColor Yellow
    Write-Host "2. Network issue - check internet connection" -ForegroundColor Yellow
    Write-Host "3. Remote not configured - run: git remote add origin https://github.com/ElyasafAr/stay-close-app.git" -ForegroundColor Yellow
    exit 1
}

# Verify
Write-Host "`n=== Verification ===" -ForegroundColor Cyan
$lastCommit = git log --oneline -1
Write-Host "Last commit: $lastCommit" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green
