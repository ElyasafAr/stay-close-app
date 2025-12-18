# Complete script to fix missing frontend files
# Usage: .\fix_missing_files_complete.ps1

Write-Host "=== Fixing Missing Frontend Files ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# List of required files/directories
$requiredFiles = @(
    "i18n/useTranslation.ts",
    "i18n/he.json",
    "services/contacts.ts",
    "services/reminders.ts",
    "services/api.ts",
    "services/auth.ts",
    "services/messages.ts",
    "services/notifications.ts",
    "components/Loading.tsx",
    "components/Loading.module.css",
    "components/AuthGuard.tsx",
    "components/Header.tsx",
    "components/Header.module.css",
    "components/ReminderModal.tsx",
    "components/ReminderModal.module.css",
    "components/ReminderChecker.tsx"
)

# Check which files exist
Write-Host "=== Checking Required Files ===" -ForegroundColor Cyan
$missingFiles = @()
$existingFiles = @()

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        $existingFiles += $file
        Write-Host "✓ Found: $file" -ForegroundColor Green
    } else {
        $missingFiles += $file
        Write-Host "✗ Missing: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Found: $($existingFiles.Count) files" -ForegroundColor Green
Write-Host "Missing: $($missingFiles.Count) files" -ForegroundColor $(if ($missingFiles.Count -eq 0) { "Green" } else { "Red" })

if ($missingFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Warning: Some required files are missing!" -ForegroundColor Yellow
    Write-Host "Missing files:" -ForegroundColor Yellow
    foreach ($file in $missingFiles) {
        Write-Host "  - $file" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Adding All Files to Git ===" -ForegroundColor Cyan

# Add all directories
$directories = @("i18n", "services", "components", "lib", "state", "app")
foreach ($dir in $directories) {
    if (Test-Path $dir) {
        Write-Host "Adding directory: $dir/" -ForegroundColor Cyan
        git add "$dir/*" 2>&1 | Out-Null
        git add "$dir/**/*" 2>&1 | Out-Null
    }
}

# Add specific files
Write-Host "Adding specific files..." -ForegroundColor Cyan
git add i18n/ services/ components/ lib/ state/ 2>&1 | Out-Null
git add backend/main.py 2>&1 | Out-Null

# Check what will be committed
Write-Host ""
Write-Host "=== Files to be committed ===" -ForegroundColor Cyan
$status = git status --short
if ($status) {
    Write-Host $status
} else {
    Write-Host "No changes to commit (files may already be in Git)" -ForegroundColor Yellow
}

# Check if files are already tracked
Write-Host ""
Write-Host "=== Checking if files are tracked in Git ===" -ForegroundColor Cyan
$trackedFiles = @()
foreach ($file in $existingFiles) {
    $tracked = git ls-files --error-unmatch $file 2>&1
    if ($LASTEXITCODE -eq 0) {
        $trackedFiles += $file
        Write-Host "✓ Tracked: $file" -ForegroundColor Green
    } else {
        Write-Host "✗ Not tracked: $file" -ForegroundColor Red
        git add $file 2>&1 | Out-Null
    }
}

# Force add all files (including untracked)
Write-Host ""
Write-Host "=== Force adding all files ===" -ForegroundColor Cyan
git add -f i18n/ services/ components/ lib/ state/ 2>&1 | Out-Null
git add -A 2>&1 | Out-Null

# Check status again
Write-Host ""
Write-Host "=== Final Status ===" -ForegroundColor Cyan
$finalStatus = git status --short
if ($finalStatus) {
    Write-Host $finalStatus
    Write-Host ""
    
    # Commit
    Write-Host "=== Committing ===" -ForegroundColor Cyan
    git commit -m "Fix: Add all missing frontend files (i18n, services, components) and fix CORS"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Commit successful!" -ForegroundColor Green
        Write-Host ""
        
        # Push
        Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan
        git push origin main
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host ""
            Write-Host "✅ SUCCESS!" -ForegroundColor Green
            Write-Host ""
            Write-Host "All files have been pushed to GitHub!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Yellow
            Write-Host "1. Railway will auto-deploy Frontend and Backend" -ForegroundColor Cyan
            Write-Host "2. Wait 2-3 minutes for deployment" -ForegroundColor Cyan
            Write-Host "3. Check Railway logs:" -ForegroundColor Cyan
            Write-Host "   - Frontend Service → Deployments → View Logs" -ForegroundColor Gray
            Write-Host "   - Backend Service → Deployments → View Logs" -ForegroundColor Gray
            Write-Host "4. Look for '[CORS]' in Backend logs" -ForegroundColor Cyan
            Write-Host "5. Try login again after deployment completes" -ForegroundColor Cyan
        } else {
            Write-Host ""
            Write-Host "❌ Push failed!" -ForegroundColor Red
            Write-Host "Please check your Git configuration and try again." -ForegroundColor Yellow
            exit 1
        }
    } else {
        Write-Host ""
        Write-Host "⚠️ Commit failed or no changes to commit" -ForegroundColor Yellow
        Write-Host "Files may already be committed. Checking..." -ForegroundColor Yellow
        
        # Check if we're ahead of origin
        $ahead = git rev-list --count origin/main..HEAD 2>&1
        if ($ahead -gt 0) {
            Write-Host "You have $ahead unpushed commits. Pushing..." -ForegroundColor Yellow
            git push origin main
        } else {
            Write-Host "Everything is up to date!" -ForegroundColor Green
        }
    }
} else {
    Write-Host "No changes detected. Files may already be in Git." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Checking if we need to push..." -ForegroundColor Cyan
    $ahead = git rev-list --count origin/main..HEAD 2>&1
    if ($ahead -gt 0) {
        Write-Host "You have $ahead unpushed commits. Pushing..." -ForegroundColor Yellow
        git push origin main
    } else {
        Write-Host "Everything is up to date!" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== Verification ===" -ForegroundColor Cyan
Write-Host "Checking if critical files are tracked:" -ForegroundColor Cyan

$criticalFiles = @(
    "i18n/useTranslation.ts",
    "services/contacts.ts",
    "services/reminders.ts",
    "components/Loading.tsx"
)

$allTracked = $true
foreach ($file in $criticalFiles) {
    $tracked = git ls-files --error-unmatch $file 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $file is tracked" -ForegroundColor Green
    } else {
        Write-Host "✗ $file is NOT tracked" -ForegroundColor Red
        $allTracked = $false
    }
}

if ($allTracked) {
    Write-Host ""
    Write-Host "✅ All critical files are tracked in Git!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "⚠️ Some critical files are not tracked!" -ForegroundColor Yellow
    Write-Host "Please run this script again or manually add the files." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green








