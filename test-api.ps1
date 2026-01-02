# Test Backend API endpoints

Write-Host "Testing Backend API Endpoints..." -ForegroundColor Cyan

# Test 1: Health Check
Write-Host "`n1. Testing /api/health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/health' -Method GET -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content)" -ForegroundColor White
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get Activities
Write-Host "`n2. Testing /api/activities endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/activities' -Method GET -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)" -ForegroundColor White
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.Content)" -ForegroundColor Red
}

# Test 3: Verify Chain
Write-Host "`n3. Testing /api/verify-chain endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri 'http://localhost:8000/api/verify-chain' -Method GET -ErrorAction Stop
    Write-Host "✓ Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response: $($response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 2)" -ForegroundColor White
}
catch {
    Write-Host "✗ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host "`nTesting Complete!" -ForegroundColor Cyan
