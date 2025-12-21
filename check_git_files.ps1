# Script to check what's in Git and identify unnecessary files
# Run this and send me the output

Write-Host "=== Git Files Analysis ===" -ForegroundColor Cyan
Write-Host ""

# Count total files in Git
Write-Host "=== 1. Total Files in Git ===" -ForegroundColor Yellow
$totalFiles = (git ls-files | Measure-Object).Count
Write-Host "Total files tracked: $totalFiles" -ForegroundColor Cyan
Write-Host ""

# List all directories in Git
Write-Host "=== 2. Directories in Git ===" -ForegroundColor Yellow
$dirs = git ls-files | ForEach-Object { Split-Path $_ -Parent } | Where-Object { $_ } | Sort-Object -Unique
foreach ($dir in $dirs) {
    $count = (git ls-files | Where-Object { $_ -like "$dir/*" }).Count
    Write-Host "$dir/ ($count files)" -ForegroundColor Gray
}
Write-Host ""

# Check for potentially unnecessary files
Write-Host "=== 3. Potentially Unnecessary Files ===" -ForegroundColor Yellow
$unnecessaryPatterns = @(
    "*.md",
    "*.ps1",
    "*.test.ts",
    "*.test.tsx",
    "__tests__",
    "*.json.backup",
    "*.log"
)

$unnecessaryFiles = git ls-files | Where-Object {
    $file = $_
    foreach ($pattern in $unnecessaryPatterns) {
        if ($file -like $pattern -or $file -like "*/$pattern") {
            return $true
        }
    }
    return $false
}

if ($unnecessaryFiles) {
    Write-Host "Found potentially unnecessary files:" -ForegroundColor Yellow
    $unnecessaryFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
    Write-Host ""
    Write-Host "Total: $($unnecessaryFiles.Count) files" -ForegroundColor Cyan
} else {
    Write-Host "✅ No obviously unnecessary files found" -ForegroundColor Green
}

Write-Host ""

# Check for duplicate or backup files
Write-Host "=== 4. Backup/Duplicate Files ===" -ForegroundColor Yellow
$backupFiles = git ls-files | Where-Object {
    $_ -like "*backup*" -or 
    $_ -like "*old*" -or 
    $_ -like "*copy*" -or
    $_ -like "*-backup*" -or
    $_ -like "*-old*"
}

if ($backupFiles) {
    Write-Host "Found backup/duplicate files:" -ForegroundColor Yellow
    $backupFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Gray }
} else {
    Write-Host "✅ No backup files found" -ForegroundColor Green
}

Write-Host ""

# Check critical files are present
Write-Host "=== 5. Critical Files Check ===" -ForegroundColor Yellow
$criticalFiles = @(
    "package.json",
    "tsconfig.json",
    "next.config.js",
    "railway.json",
    "i18n/useTranslation.ts",
    "services/contacts.ts",
    "services/reminders.ts",
    "components/Loading.tsx"
)

foreach ($file in $criticalFiles) {
    $inGit = git ls-files | Select-String -Pattern "^$([regex]::Escape($file))$"
    if ($inGit) {
        Write-Host "✅ $file" -ForegroundColor Green
    } else {
        Write-Host "❌ $file MISSING!" -ForegroundColor Red
    }
}

Write-Host ""

# Check .gitignore
Write-Host "=== 6. .gitignore Analysis ===" -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore"
    Write-Host "Total ignore patterns: $($gitignore.Count)" -ForegroundColor Cyan
    
    # Check if critical directories are ignored
    $criticalDirs = @("i18n", "services", "components")
    foreach ($dir in $criticalDirs) {
        $ignored = $gitignore | Where-Object { $_ -like "*$dir*" }
        if ($ignored) {
            Write-Host "⚠️  Warning: '$dir' might be ignored:" -ForegroundColor Yellow
            $ignored | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
        }
    }
} else {
    Write-Host "⚠️  .gitignore not found" -ForegroundColor Yellow
}

Write-Host ""

# Check tsconfig.json baseUrl issue
Write-Host "=== 7. TypeScript baseUrl Fix Needed ===" -ForegroundColor Yellow
if (Test-Path "tsconfig.json") {
    $tsconfig = Get-Content "tsconfig.json" -Raw | ConvertFrom-Json
    if (-not $tsconfig.compilerOptions.baseUrl) {
        Write-Host "⚠️  baseUrl is missing!" -ForegroundColor Yellow
        Write-Host "   This might cause path resolution issues in Railway" -ForegroundColor Yellow
        Write-Host "   Should add: 'baseUrl': '.'" -ForegroundColor Cyan
    } else {
        Write-Host "✅ baseUrl is set: $($tsconfig.compilerOptions.baseUrl)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "Please send me the complete output above." -ForegroundColor Yellow
Write-Host ""








