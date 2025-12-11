# Main Git push script - Update this script for each fix
# Usage: .\push_to_git.ps1

Write-Host "=== Git Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path package.json)) {
    Write-Host "Error: package.json not found!" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Current directory: $(Get-Location)" -ForegroundColor Gray
Write-Host ""

# ============================================
# UPDATE THIS SECTION FOR EACH FIX
# ============================================
$commitMessage = "Fix: Improve error handling in check_reminders (return empty list on serialization error) and add logging to create/update reminder time calculations"

# Files/directories to add (update as needed)
# Use empty array to add ALL changes, or specify specific files
# Empty array = add ALL changes (recommended for fixing build issues)
$filesToAdd = @()
# ============================================

Write-Host "=== Adding files to Git ===" -ForegroundColor Cyan

# Add all files if $filesToAdd is empty, otherwise add specified files
if ($filesToAdd.Count -eq 0) {
    Write-Host "Adding ALL changes..." -ForegroundColor Cyan
    git add -A
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error adding files!" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ All files added" -ForegroundColor Green
} else {
    # Add all specified files/directories
    foreach ($item in $filesToAdd) {
        if (Test-Path $item) {
            Write-Host "Adding: $item" -ForegroundColor Cyan
            git add $item
            if ($LASTEXITCODE -ne 0) {
                Write-Host "⚠️  Warning: Failed to add $item" -ForegroundColor Yellow
            }
        } else {
            Write-Host "Warning: $item not found, skipping..." -ForegroundColor Yellow
        }
    }
}

# Always force add critical directories to ensure they're tracked
Write-Host "Force adding critical directories..." -ForegroundColor Cyan
git add -f i18n/ services/ components/ lib/ state/ types/ 2>&1 | Out-Null
# Also add specific critical files explicitly to ensure they're tracked
Write-Host "Force adding specific critical files..." -ForegroundColor Cyan
git add -f i18n/useTranslation.ts i18n/he.json 2>&1 | Out-Null
git add -f services/contacts.ts services/reminders.ts services/messages.ts services/api.ts services/auth.ts 2>&1 | Out-Null
git add -f components/Loading.tsx components/AuthGuard.tsx components/Header.tsx components/ReminderChecker.tsx components/ReminderModal.tsx 2>&1 | Out-Null
Write-Host "✅ Critical directories and files force-added" -ForegroundColor Green

# Check status after adding
Write-Host ""
Write-Host "=== Files to be committed ===" -ForegroundColor Cyan
$status = git status --short
if ($status) {
    Write-Host $status
    $hasChanges = $true
} else {
    Write-Host "No changes to commit (checking for unpushed commits...)" -ForegroundColor Yellow
    $hasChanges = $false
}

# Commit only if there are changes
if ($hasChanges) {
    Write-Host ""
    Write-Host "=== Committing ===" -ForegroundColor Cyan
    Write-Host "Commit message: $commitMessage" -ForegroundColor Gray
    
    git commit -m $commitMessage
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Commit successful!" -ForegroundColor Green
    } else {
        Write-Host "❌ Commit failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "No changes to commit. Checking for unpushed commits..." -ForegroundColor Yellow
    
    # Check if we're ahead of origin
    $ahead = git rev-list --count origin/main..HEAD 2>&1
    if ($ahead -gt 0) {
        Write-Host "Found $ahead unpushed commits. Will push them..." -ForegroundColor Yellow
    } else {
        Write-Host "Everything is already committed and pushed." -ForegroundColor Green
        Write-Host "If build is still failing, the files may not be in the repository." -ForegroundColor Yellow
        Write-Host "Checking if critical files exist in Git..." -ForegroundColor Yellow
        
        # Verify critical files are in Git
        $criticalFiles = @(
            "i18n/useTranslation.ts",
            "i18n/he.json",
            "services/contacts.ts",
            "services/reminders.ts",
            "services/messages.ts",
            "services/api.ts",
            "services/auth.ts",
            "components/Loading.tsx",
            "components/AuthGuard.tsx",
            "tsconfig.json"
        )
        foreach ($file in $criticalFiles) {
            if (Test-Path $file) {
                $inGit = git ls-files --error-unmatch $file 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "✅ $file is in Git" -ForegroundColor Green
                } else {
                    Write-Host "❌ $file is NOT in Git!" -ForegroundColor Red
                    Write-Host "Adding $file..." -ForegroundColor Yellow
                    git add -f $file
                }
            } else {
                Write-Host "⚠️  $file not found locally!" -ForegroundColor Yellow
            }
        }
        
        # If we added files, commit them
        $newStatus = git status --short
        if ($newStatus) {
            Write-Host "Found missing files, committing..." -ForegroundColor Yellow
            git commit -m "Fix: Add missing critical files to repository"
            $hasChanges = $true
        }
    }
}

# Push (always try to push, even if no new commit)
Write-Host ""
Write-Host "=== Pushing to GitHub ===" -ForegroundColor Cyan

# Check if we're ahead of origin before pushing
$ahead = git rev-list --count origin/main..HEAD 2>&1
if ($ahead -gt 0 -or $hasChanges) {
    Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ SUCCESS!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Changes pushed to GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Railway will auto-deploy" -ForegroundColor Cyan
        Write-Host "2. Wait 2-3 minutes" -ForegroundColor Cyan
        Write-Host "3. Check Railway logs for deployment status" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "❌ Push failed!" -ForegroundColor Red
        Write-Host "Please check your Git configuration and try again." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "No changes to push. Everything is up to date." -ForegroundColor Green
    Write-Host ""
    Write-Host "If build is still failing, check:" -ForegroundColor Yellow
    Write-Host "1. Are the files in GitHub? Check: https://github.com/ElyasafAr/stay-close-app" -ForegroundColor Cyan
    Write-Host "2. Did Railway redeploy after the last push?" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
