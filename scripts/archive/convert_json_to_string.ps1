# Script to convert Firebase Service Account JSON to single-line string
# Usage: .\convert_json_to_string.ps1 -Path "path\to\serviceAccountKey.json"

param(
    [Parameter(Mandatory=$true)]
    [string]$Path
)

if (-not (Test-Path $Path)) {
    Write-Host "Error: File not found: $Path" -ForegroundColor Red
    exit 1
}

Write-Host "Reading JSON file..." -ForegroundColor Cyan
$jsonContent = Get-Content -Path $Path -Raw -Encoding UTF8

Write-Host "Converting to single-line string..." -ForegroundColor Cyan
# Remove all line breaks and extra whitespace
$jsonString = $jsonContent -replace "`r`n", "" -replace "`n", "" -replace "`r", ""
$jsonString = $jsonString -replace '\s+', ' '

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "Copy this value for FIREBASE_SERVICE_ACCOUNT_KEY_JSON:" -ForegroundColor Yellow
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host $jsonString -ForegroundColor White
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""
Write-Host "✅ Done! Copy the value above and paste it in Railway Variables." -ForegroundColor Green

