# Script to push code to GitHub

Write-Host "Starting upload to GitHub..." -ForegroundColor Cyan

if (-not (Test-Path .git)) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
}

Write-Host "Adding files..." -ForegroundColor Yellow
git add .

$status = git status --short
if ($status) {
    Write-Host "Creating commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: Stay Close App - Full stack with Firebase Auth"
    
    Write-Host "Configuring remote..." -ForegroundColor Yellow
    git remote remove origin 2>$null
    git remote add origin https://github.com/ElyasafAr/stay-close-app.git
    
    Write-Host "Setting branch..." -ForegroundColor Yellow
    git branch -M main 2>$null
    
    Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    Write-Host ""
    Write-Host "Done! Check: https://github.com/ElyasafAr/stay-close-app" -ForegroundColor Green
} else {
    Write-Host "No changes to commit" -ForegroundColor Yellow
    $remote = git remote -v
    if (-not $remote) {
        git remote add origin https://github.com/ElyasafAr/stay-close-app.git
    }
    git push -u origin main
}

