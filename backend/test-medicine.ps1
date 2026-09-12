param(
  [Parameter(Mandatory = $true)]
  [string]$Email,

  [Parameter(Mandatory = $true)]
  [string]$Password
)

$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:5000"

$loginBody = @{
  email = $Email
  password = $Password
} | ConvertTo-Json

try {
  $login = Invoke-RestMethod `
    -Uri "$baseUrl/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody
} catch {
  throw "Login failed. Check the email, password, and that the backend is running. $($_.ErrorDetails.Message)"
}

$headers = @{ Authorization = "Bearer $($login.token)" }
$profile = Invoke-RestMethod `
  -Uri "$baseUrl/api/auth/me" `
  -Method Get `
  -Headers $headers

Write-Host "Logged in as $($profile.user.email) with role $($profile.user.role)."

if ($profile.user.role -notin @("pharmacist", "admin")) {
  throw "This account cannot manage medicines. Change its role to pharmacist or admin in MongoDB Compass, then run this script again."
}

$medicineBody = @{
  name = "Paracetamol"
  category = "Pain Relief"
  description = "Used for fever and pain"
  manufacturer = "MediCare Labs"
  price = 50
  stock = 100
  requiresPrescription = $false
} | ConvertTo-Json

$medicine = Invoke-RestMethod `
  -Uri "$baseUrl/api/medicines" `
  -Method Post `
  -ContentType "application/json" `
  -Headers $headers `
  -Body $medicineBody

Write-Host "Medicine added successfully:" -ForegroundColor Green
$medicine | ConvertTo-Json -Depth 5
