# Script to push api.ts fix to Git
# Usage: .\push_api_fix.ps1

Write-Host "=== Pushing api.ts Fix ===" -ForegroundColor Cyan
Write-Host ""

# Add file
git add services/api.ts

# Commit
git commit -m "Fix: Resolve TypeScript error in api.ts headers"

# Push
git push origin main

Write-Host ""
Write-Host "✅ Done! Now redeploy in Railway." -ForegroundColor Green


