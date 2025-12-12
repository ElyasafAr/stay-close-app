# Script to check why Railway is skipping commits
# Run this and send me the output

Write-Host "=== Railway Deployment Check ===" -ForegroundColor Cyan
Write-Host ""

# Check Git status
Write-Host "=== 1. Git Status ===" -ForegroundColor Yellow
Write-Host "Current branch:" -ForegroundColor Cyan
git branch --show-current
Write-Host ""
Write-Host "Last 5 commits:" -ForegroundColor Cyan
git log --oneline -5
Write-Host ""

# Check if commits are pushed
Write-Host "=== 2. Push Status ===" -ForegroundColor Yellow
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Local commit:  $localCommit" -ForegroundColor Cyan
    Write-Host "Remote commit: $remoteCommit" -ForegroundColor Cyan
    
    if ($localCommit -eq $remoteCommit) {
        Write-Host "✅ Local and remote are in sync" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Local and remote are NOT in sync!" -ForegroundColor Yellow
        $ahead = git rev-list --count origin/main..HEAD
        Write-Host "   Local is ahead by $ahead commits" -ForegroundColor Yellow
        Write-Host "   ❌ Commits are NOT pushed to GitHub!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Cannot reach remote!" -ForegroundColor Red
}

Write-Host ""

# Check remote URL
Write-Host "=== 3. Git Remote ===" -ForegroundColor Yellow
$remote = git remote get-url origin
Write-Host "Remote URL: $remote" -ForegroundColor Cyan

# Extract repository name
if ($remote -match "github\.com[:/]([^/]+)/([^/]+)") {
    $repoOwner = $matches[1]
    $repoName = $matches[2] -replace '\.git$', ''
    Write-Host "Repository: $repoOwner/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "GitHub URL: https://github.com/$repoOwner/$repoName" -ForegroundColor Cyan
} else {
    Write-Host "⚠️  Could not parse repository name" -ForegroundColor Yellow
}

Write-Host ""

# Check for Railway configuration files
Write-Host "=== 4. Railway Configuration ===" -ForegroundColor Yellow
if (Test-Path "railway.json") {
    Write-Host "✅ railway.json exists" -ForegroundColor Green
    $railway = Get-Content "railway.json" | ConvertFrom-Json
    Write-Host "Content:" -ForegroundColor Cyan
    Write-Host ($railway | ConvertTo-Json -Depth 10) -ForegroundColor Gray
} else {
    Write-Host "⚠️  railway.json not found in root" -ForegroundColor Yellow
}

if (Test-Path "backend/railway.json") {
    Write-Host "✅ backend/railway.json exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend/railway.json not found" -ForegroundColor Yellow
}

Write-Host ""

# Check .railwayignore
Write-Host "=== 5. Railway Ignore Files ===" -ForegroundColor Yellow
if (Test-Path ".railwayignore") {
    Write-Host "⚠️  .railwayignore exists - this might skip files!" -ForegroundColor Yellow
    Write-Host "Content:" -ForegroundColor Cyan
    Get-Content ".railwayignore" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ No .railwayignore file" -ForegroundColor Green
}

Write-Host ""

# Check recent commits for backend changes
Write-Host "=== 6. Recent Backend Changes ===" -ForegroundColor Yellow
$backendChanges = git log --oneline -5 --name-only | Select-String -Pattern "backend/main.py"
if ($backendChanges) {
    Write-Host "✅ Found backend/main.py in recent commits:" -ForegroundColor Green
    $backendChanges | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "⚠️  No backend/main.py changes in last 5 commits" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common reasons Railway skips commits:" -ForegroundColor Yellow
Write-Host "1. Commits not pushed to GitHub" -ForegroundColor Gray
Write-Host "2. Railway not connected to GitHub repository" -ForegroundColor Gray
Write-Host "3. Auto-deploy disabled in Railway settings" -ForegroundColor Gray
Write-Host "4. Wrong branch configured (Railway might be watching 'master' instead of 'main')" -ForegroundColor Gray
Write-Host "5. Root Directory misconfigured" -ForegroundColor Gray
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Check Railway Dashboard → Backend Service → Settings" -ForegroundColor Cyan
Write-Host "2. Verify 'Source' is connected to GitHub" -ForegroundColor Cyan
Write-Host "3. Check 'Branch' is set to 'main'" -ForegroundColor Cyan
Write-Host "4. Verify 'Root Directory' is set to 'backend'" -ForegroundColor Cyan
Write-Host "5. Check 'Auto Deploy' is enabled" -ForegroundColor Cyan
Write-Host ""




