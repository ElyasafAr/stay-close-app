# Script to check deployment status
# Run this and send me the output

Write-Host "=== Deployment Status Check ===" -ForegroundColor Cyan
Write-Host ""

# 1. Check if critical files exist locally
Write-Host "=== 1. Checking Local Files ===" -ForegroundColor Yellow
$criticalFiles = @(
    "i18n/useTranslation.ts",
    "services/contacts.ts",
    "services/reminders.ts",
    "components/Loading.tsx",
    "tsconfig.json",
    "railway.json",
    "package.json"
)

foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file exists" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MISSING!" -ForegroundColor Red
    }
}

Write-Host ""

# 2. Check Git status
Write-Host "=== 2. Git Status ===" -ForegroundColor Yellow
Write-Host "Current branch:" -ForegroundColor Cyan
git branch --show-current
Write-Host ""
Write-Host "Last commit:" -ForegroundColor Cyan
git log --oneline -1
Write-Host ""
Write-Host "Uncommitted changes:" -ForegroundColor Cyan
$status = git status --short
if ($status) {
    Write-Host $status
} else {
    Write-Host "No uncommitted changes" -ForegroundColor Green
}

Write-Host ""

# 3. Check if files are tracked in Git
Write-Host "=== 3. Files in Git ===" -ForegroundColor Yellow
$gitFiles = @(
    "i18n/useTranslation.ts",
    "services/contacts.ts",
    "services/reminders.ts",
    "components/Loading.tsx"
)

foreach ($file in $gitFiles) {
    $inGit = git ls-files $file 2>&1
    if ($LASTEXITCODE -eq 0 -and $inGit) {
        Write-Host "✅ $file is tracked in Git" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is NOT tracked in Git!" -ForegroundColor Red
    }
}

Write-Host ""

# 4. Check if files are in HEAD commit
Write-Host "=== 4. Files in HEAD Commit ===" -ForegroundColor Yellow
foreach ($file in $gitFiles) {
    $inCommit = git ls-tree -r HEAD --name-only | Select-String -Pattern "^$([regex]::Escape($file))$"
    if ($inCommit) {
        Write-Host "✅ $file is in HEAD commit" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is NOT in HEAD commit!" -ForegroundColor Red
    }
}

Write-Host ""

# 5. Check tsconfig.json paths
Write-Host "=== 5. TypeScript Configuration ===" -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" | ConvertFrom-Json
    Write-Host "Paths configuration:" -ForegroundColor Cyan
    if ($tsconfig.compilerOptions.paths) {
        $tsconfig.compilerOptions.paths.PSObject.Properties | ForEach-Object {
            Write-Host "  $($_.Name) -> $($_.Value)" -ForegroundColor Gray
        }
    } else {
        Write-Host "❌ No paths configured!" -ForegroundColor Red
    }
} else {
    Write-Host "❌ tsconfig.json not found!" -ForegroundColor Red
}

Write-Host ""

# 6. Check railway.json
Write-Host "=== 6. Railway Configuration ===" -ForegroundColor Yellow
if (Test-Path "railway.json") {
    Write-Host "✅ railway.json exists" -ForegroundColor Green
    $railway = Get-Content "railway.json" | ConvertFrom-Json
    Write-Host "Start command: $($railway.deploy.startCommand)" -ForegroundColor Gray
} else {
    Write-Host "❌ railway.json not found!" -ForegroundColor Red
}

Write-Host ""

# 7. Check directory structure
Write-Host "=== 7. Directory Structure ===" -ForegroundColor Yellow
Write-Host "i18n/ contents:" -ForegroundColor Cyan
if (Test-Path "i18n") {
    Get-ChildItem "i18n" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "  ❌ i18n/ directory not found!" -ForegroundColor Red
}

Write-Host "services/ contents:" -ForegroundColor Cyan
if (Test-Path "services") {
    Get-ChildItem "services" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "  ❌ services/ directory not found!" -ForegroundColor Red
}

Write-Host "components/ contents:" -ForegroundColor Cyan
if (Test-Path "components") {
    Get-ChildItem "components" | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }
} else {
    Write-Host "  ❌ components/ directory not found!" -ForegroundColor Red
}

Write-Host ""

# 8. Check .gitignore
Write-Host "=== 8. .gitignore Check ===" -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore"
    $blockingPatterns = @("i18n", "services", "components")
    foreach ($pattern in $blockingPatterns) {
        $matches = $gitignore | Select-String -Pattern "^$pattern|^/$pattern|/\*$pattern"
        if ($matches) {
            Write-Host "⚠️  Warning: '$pattern' might be ignored by .gitignore:" -ForegroundColor Yellow
            Write-Host "   $matches" -ForegroundColor Gray
        }
    }
    if (-not $matches) {
        Write-Host "✅ No blocking patterns found in .gitignore" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  .gitignore not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Please send me the complete output above." -ForegroundColor Yellow
Write-Host ""





