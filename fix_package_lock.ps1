# Script to fix package-lock.json and push to Git
# Usage: .\fix_package_lock.ps1

Write-Host "=== Fixing package-lock.json ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "❌ Error: package.json not found!" -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

# Install dependencies to update package-lock.json
Write-Host "=== Installing dependencies ===" -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: npm install failed!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Check if package-lock.json was updated
Write-Host ""
Write-Host "=== Checking Git status ===" -ForegroundColor Cyan
$status = git status --porcelain package-lock.json
if ($status) {
    Write-Host "Changes found in package-lock.json:" -ForegroundColor Yellow
    Write-Host $status
} else {
    Write-Host "No changes in package-lock.json (already up to date)" -ForegroundColor Green
}

# Add files
Write-Host ""
Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan
git add package-lock.json package.json
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Files added" -ForegroundColor Green
} else {
    Write-Host "❌ Error adding files" -ForegroundColor Red
    exit 1
}

# Commit
Write-Host ""
Write-Host "=== Committing ===" -ForegroundColor Cyan
git commit -m "Fix: Update package-lock.json with firebase dependencies"
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
    Write-Host "✅ package-lock.json updated and pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Go to Railway" -ForegroundColor Cyan
    Write-Host "2. Frontend Service → Redeploy" -ForegroundColor Cyan
    Write-Host "3. Build should succeed now!" -ForegroundColor Cyan
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    Write-Host "Error code: $LASTEXITCODE" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Done!" -ForegroundColor Green



