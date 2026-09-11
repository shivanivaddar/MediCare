$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000"
$email = "test$(Get-Random)@example.com"
$password = "password123"

Write-Host "Testing health endpoint..."
$health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get
$health | ConvertTo-Json

Write-Host "Registering $email..."
$registerBody = @{
  name = "Test User"
  email = $email
  password = $password
} | ConvertTo-Json

$register = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/register" `
  -Method Post `
  -ContentType "application/json" `
  -Body $registerBody
$register | ConvertTo-Json

Write-Host "Logging in..."
$loginBody = @{
  email = $email
  password = $password
} | ConvertTo-Json

$login = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/login" `
  -Method Post `
  -ContentType "application/json" `
  -Body $loginBody
$login | ConvertTo-Json

Write-Host "Testing protected profile endpoint..."
$headers = @{ Authorization = "Bearer $($login.token)" }
$profile = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/me" `
  -Method Get `
  -Headers $headers
$profile | ConvertTo-Json

Write-Host "API test completed successfully." -ForegroundColor Green
