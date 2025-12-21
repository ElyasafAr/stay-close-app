# Script to check GitHub CI status
# Run this and send me the output

Write-Host "=== GitHub CI Check ===" -ForegroundColor Cyan
Write-Host ""

# Check if .github/workflows exists
Write-Host "=== 1. GitHub Workflows ===" -ForegroundColor Yellow
if (Test-Path ".github/workflows") {
    Write-Host "✅ .github/workflows directory exists" -ForegroundColor Green
    $workflows = Get-ChildItem ".github/workflows" -Filter "*.yml"
    foreach ($workflow in $workflows) {
        Write-Host "  - $($workflow.Name)" -ForegroundColor Cyan
    }
} else {
    Write-Host "❌ .github/workflows directory not found!" -ForegroundColor Red
}

Write-Host ""

# Check CI workflow file
Write-Host "=== 2. CI Workflow Content ===" -ForegroundColor Yellow
if (Test-Path ".github/workflows/ci.yml") {
    Write-Host "✅ ci.yml exists" -ForegroundColor Green
    Write-Host ""
    Write-Host "Workflow content:" -ForegroundColor Cyan
    Get-Content ".github/workflows/ci.yml" | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
} else {
    Write-Host "❌ ci.yml not found!" -ForegroundColor Red
}

Write-Host ""

# Check for common CI issues
Write-Host "=== 3. Common CI Issues ===" -ForegroundColor Yellow

# Check if check_python.py exists
if (Test-Path "backend/check_python.py") {
    Write-Host "✅ backend/check_python.py exists" -ForegroundColor Green
} else {
    Write-Host "⚠️  backend/check_python.py NOT found - CI might fail!" -ForegroundColor Yellow
}

# Check if requirements.txt exists
if (Test-Path "backend/requirements.txt") {
    Write-Host "✅ backend/requirements.txt exists" -ForegroundColor Green
} else {
    Write-Host "❌ backend/requirements.txt NOT found - CI will fail!" -ForegroundColor Red
}

# Check if package.json exists
if (Test-Path "package.json") {
    Write-Host "✅ package.json exists" -ForegroundColor Green
} else {
    Write-Host "❌ package.json NOT found - CI will fail!" -ForegroundColor Red
}

Write-Host ""

# Check Git remote
Write-Host "=== 4. Git Repository ===" -ForegroundColor Yellow
$remote = git remote get-url origin
Write-Host "Remote: $remote" -ForegroundColor Cyan

if ($remote -match "github\.com[:/]([^/]+)/([^/]+)") {
    $repoOwner = $matches[1]
    $repoName = $matches[2] -replace '\.git$', ''
    Write-Host "Repository: $repoOwner/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "GitHub Actions URL:" -ForegroundColor Cyan
    Write-Host "https://github.com/$repoOwner/$repoName/actions" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Check the Actions tab to see why CI is failing!" -ForegroundColor Yellow
}

Write-Host ""

# Summary
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "To fix Railway skipping commits:" -ForegroundColor Yellow
Write-Host "1. Go to GitHub Actions: https://github.com/$repoOwner/$repoName/actions" -ForegroundColor Cyan
Write-Host "2. Check the latest workflow run" -ForegroundColor Cyan
Write-Host "3. See what step is failing" -ForegroundColor Cyan
Write-Host "4. Fix the issue in the workflow file" -ForegroundColor Cyan
Write-Host ""
Write-Host "Common fixes:" -ForegroundColor Yellow
Write-Host "- If check_python.py is missing, remove that step from CI" -ForegroundColor Gray
Write-Host "- If tests are failing, fix the tests or skip them temporarily" -ForegroundColor Gray
Write-Host "- If build is failing, check the error message" -ForegroundColor Gray
Write-Host ""








