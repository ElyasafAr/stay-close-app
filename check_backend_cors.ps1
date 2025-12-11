# Script to check if backend CORS is working
# Run this and send me the output

Write-Host "=== Backend CORS Check ===" -ForegroundColor Cyan
Write-Host ""

$backendUrl = "https://stay-close-app-backend-production.up.railway.app"
$frontendUrl = "https://stay-close-app-front-production.up.railway.app"

Write-Host "Backend URL: $backendUrl" -ForegroundColor Cyan
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host ""

# Test OPTIONS request (preflight)
Write-Host "=== Testing OPTIONS (Preflight) Request ===" -ForegroundColor Yellow
try {
    $optionsResponse = Invoke-WebRequest -Uri "$backendUrl/api/auth/firebase" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $frontendUrl
            "Access-Control-Request-Method" = "POST"
            "Access-Control-Request-Headers" = "Content-Type,Authorization"
        } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ OPTIONS request successful" -ForegroundColor Green
    Write-Host "Status: $($optionsResponse.StatusCode)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Response Headers:" -ForegroundColor Cyan
    $optionsResponse.Headers.GetEnumerator() | Where-Object { $_.Key -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ OPTIONS request failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host ""

# Test GET request to health endpoint with Origin header
Write-Host "=== Testing GET Request (Health Check with Origin) ===" -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "$backendUrl/api/health" `
        -Method GET `
        -Headers @{
            "Origin" = $frontendUrl
        } `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "✅ Health check successful" -ForegroundColor Green
    Write-Host "Status: $($healthResponse.StatusCode)" -ForegroundColor Cyan
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Gray
    Write-Host ""
    Write-Host ""
    Write-Host "All Response Headers:" -ForegroundColor Cyan
    $healthResponse.Headers.GetEnumerator() | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "CORS Headers (filtered):" -ForegroundColor Cyan
    $corsHeaders = $healthResponse.Headers.GetEnumerator() | Where-Object { $_.Key -like "*Access-Control*" }
    if ($corsHeaders) {
        $corsHeaders | ForEach-Object {
            Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Green
        }
    } else {
        Write-Host "  ❌ No CORS headers found!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Health check failed!" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Summary ===" -ForegroundColor Cyan
Write-Host "If OPTIONS request fails, CORS is not configured correctly." -ForegroundColor Yellow
Write-Host "If OPTIONS succeeds but POST fails, check the actual endpoint." -ForegroundColor Yellow
Write-Host ""

