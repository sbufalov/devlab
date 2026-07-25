<#
.SYNOPSIS
    Automated installation of Caddy Local CA root certificate into Windows Trusted Root store.
.DESCRIPTION
    Extracts the certificate from WSL2 using root privileges (no password required)
    and installs it into the Windows certificate store.
.EXAMPLE
    .\root-cert.ps1
#>

# =====================================================================
# CONFIGURATION BLOCK
# =====================================================================
$DistroName = "Ubuntu-26.04"
$WslCertPath = "/homelab/services/caddy/data/caddy/pki/authorities/local/root.crt"
$TempCertPath = "$env:TEMP\caddy-root.crt"
$StoreName = "Root"
$StoreLocation = "LocalMachine"
# =====================================================================

# Ensure the WSL distro is running before executing commands
function Ensure-WslRunning {
    Write-Host "Waking up WSL distro: $DistroName..." -ForegroundColor DarkGray
    wsl -d $DistroName --exec bash -c "exit"
}

Write-Host "Checking for Caddy local root certificate..." -ForegroundColor Yellow
Ensure-WslRunning

# 1. Verify certificate exists in WSL (using root to bypass any permission issues)
$certExists = (wsl -d $DistroName -u root --exec bash -c "test -f $WslCertPath && echo 'yes' || echo 'no'").Trim()

if ($certExists -ne 'yes') {
    Write-Host "Error: Certificate file not found at path:" -ForegroundColor Red
    Write-Host "  $WslCertPath" -ForegroundColor Red
    Write-Host "Please ensure your WSL2 Ubuntu distro is running and Caddy has generated the local CA." -ForegroundColor DarkYellow
    Exit
}

# 2. Copy certificate from WSL to Windows temp folder (using root for guaranteed access)
try {
    Write-Host "Copying certificate from WSL..." -ForegroundColor Cyan
    
    # Use root to read the file and pipe to Windows
    $certContent = wsl -d $DistroName -u root --exec bash -c "cat $WslCertPath"
    
    # Write the content to temp file
    $certContent | Set-Content -Path $TempCertPath -Encoding UTF8
    
    if (-not (Test-Path $TempCertPath)) {
        throw "Failed to copy certificate from WSL to $TempCertPath"
    }
    
    Write-Host "Certificate copied successfully to temp location." -ForegroundColor Green
    
} catch {
    Write-Host "Error: Could not access certificate in WSL:" -ForegroundColor Red
    Write-Host "  $WslCertPath" -ForegroundColor Red
    Write-Error $_
    Exit
}

# 3. Import certificate into Windows Trusted Root store
try {
    # Instantiate a new X509Certificate2 object from the file
    $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($TempCertPath)
    
    Write-Host "Certificate details:" -ForegroundColor DarkGray
    Write-Host "  Subject: $($cert.Subject)" -ForegroundColor DarkGray
    Write-Host "  Issuer: $($cert.Issuer)" -ForegroundColor DarkGray
    Write-Host "  Thumbprint: $($cert.Thumbprint)" -ForegroundColor DarkGray
    Write-Host "  Valid: $($cert.NotBefore) to $($cert.NotAfter)" -ForegroundColor DarkGray
    
    # Open the target Windows Certificate Store
    $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($StoreName, $StoreLocation)
    $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
    
    # Check if the certificate is already installed to prevent duplicates
    $duplicates = $store.Certificates | Where-Object { $_.Thumbprint -eq $cert.Thumbprint }
    
    if ($duplicates.Count -eq 0) {
        Write-Host "Importing Local CA into Trusted Root Certification Authorities..." -ForegroundColor Cyan
        $store.Add($cert)
        Write-Host "Success! The certificate has been successfully trusted globally on this machine." -ForegroundColor Green
    } else {
        Write-Host "Certificate is already present in the Trusted Root store. Skipping import." -ForegroundColor Gray
    }
    
    # Safely close the system store resources
    $store.Close()
}
catch {
    Write-Host "An unexpected error occurred during the certificate import pipeline:" -ForegroundColor Red
    Write-Error $_
}
finally {
    # Clean up temporary file
    if (Test-Path $TempCertPath) {
        Remove-Item $TempCertPath -Force
        Write-Host "Cleaned up temporary certificate file." -ForegroundColor DarkGray
    }
}
