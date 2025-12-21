# Script to verify files are actually in GitHub
# Run this and send me the output

Write-Host "=== GitHub Files Verification ===" -ForegroundColor Cyan
Write-Host ""

# Check remote URL
Write-Host "=== 1. Git Remote ===" -ForegroundColor Yellow
$remote = git remote get-url origin
Write-Host "Remote URL: $remote" -ForegroundColor Cyan
Write-Host ""

# Check if we're in sync with origin
Write-Host "=== 2. Sync Status ===" -ForegroundColor Yellow
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "Local commit:  $localCommit" -ForegroundColor Cyan
    Write-Host "Remote commit: $remoteCommit" -ForegroundColor Cyan
    
    if ($localCommit -eq $remoteCommit) {
        Write-Host "✅ Local and remote are in sync" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Local and remote are NOT in sync!" -ForegroundColor Yellow
        Write-Host "   Local is ahead by:" -ForegroundColor Yellow
        $ahead = git rev-list --count origin/main..HEAD
        Write-Host "   $ahead commits" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ Cannot reach remote!" -ForegroundColor Red
}

Write-Host ""

# Verify files in remote commit
Write-Host "=== 3. Files in Remote Commit (origin/main) ===" -ForegroundColor Yellow
$criticalFiles = @(
    "i18n/useTranslation.ts",
    "services/contacts.ts",
    "services/reminders.ts",
    "components/Loading.tsx"
)

foreach ($file in $criticalFiles) {
    $inRemote = git ls-tree -r origin/main --name-only | Select-String -Pattern "^$([regex]::Escape($file))$"
    if ($inRemote) {
        Write-Host "✅ $file is in origin/main" -ForegroundColor Green
    } else {
        Write-Host "❌ $file is NOT in origin/main!" -ForegroundColor Red
    }
}

Write-Host ""

# Check file sizes
Write-Host "=== 4. File Sizes ===" -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $size = (Get-Item $file).Length
        Write-Host "$file : $size bytes" -ForegroundColor Gray
    }
}

Write-Host ""

# Check if files are empty
Write-Host "=== 5. File Content Check ===" -ForegroundColor Yellow
foreach ($file in $criticalFiles) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        if ($content.Length -eq 0) {
            Write-Host "⚠️  $file is EMPTY!" -ForegroundColor Yellow
        } else {
            $lines = (Get-Content $file).Count
            Write-Host "✅ $file has $lines lines" -ForegroundColor Green
        }
    }
}

Write-Host ""

# Check tsconfig.json baseUrl
Write-Host "=== 6. TypeScript baseUrl Check ===" -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" -Raw | ConvertFrom-Json
    if ($tsconfig.compilerOptions.baseUrl) {
        Write-Host "baseUrl: $($tsconfig.compilerOptions.baseUrl)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  No baseUrl set (should be '.' or './')" -ForegroundColor Yellow
    }
}

Write-Host ""

# Check next.config.js
Write-Host "=== 7. Next.js Configuration ===" -ForegroundColor Yellow
if (Test-Path "next.config.js") {
    Write-Host "✅ next.config.js exists" -ForegroundColor Green
    $nextConfig = Get-Content "next.config.js" -Raw
    Write-Host "Content preview:" -ForegroundColor Cyan
    Write-Host $nextConfig -ForegroundColor Gray
} else {
    Write-Host "❌ next.config.js not found!" -ForegroundColor Red
}

Write-Host ""

# Check package.json scripts
Write-Host "=== 8. Package.json Scripts ===" -ForegroundColor Yellow
if (Test-Path "package.json") {
    $package = Get-Content "package.json" | ConvertFrom-Json
    Write-Host "Build script: $($package.scripts.build)" -ForegroundColor Cyan
    Write-Host "Start script: $($package.scripts.start)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Please send me the complete output above." -ForegroundColor Yellow
Write-Host ""








