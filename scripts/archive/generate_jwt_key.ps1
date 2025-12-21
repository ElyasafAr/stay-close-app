# Script to generate JWT Secret Key
# Usage: .\generate_jwt_key.ps1

Write-Host "Generating JWT Secret Key..." -ForegroundColor Cyan

# Generate a secure random key (64 characters)
$chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
$key = ""
for ($i = 0; $i -lt 64; $i++) {
    $key += $chars[(Get-Random -Maximum $chars.Length)]
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "Your JWT Secret Key:" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host "JWT_SECRET_KEY=$key" -ForegroundColor White
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host "✅ Copy the value above and paste it in Railway Variables." -ForegroundColor Green
Write-Host "⚠️  Keep this key secret! Don't share it or commit it to Git." -ForegroundColor Yellow

