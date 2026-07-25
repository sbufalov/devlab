<#
.SYNOPSIS
    Automated idempotent management of WSL2 virtual disks for Personal Home Lab.
.DESCRIPTION
    Run with Administrator privileges to manage disks and Scheduled Tasks.
.EXAMPLE
    .\homelab.ps1 -Action Mount|Umount|Destroy|InstallTask|RemoveTask
#>
[CmdletBinding()]
param (
    [ValidateSet('Mount', 'Unmount', 'Destroy', 'InstallTask', 'RemoveTask')]
    [string]$Action = 'Mount'
)

# =====================================================================
# CONFIGURATION BLOCK (Edit this to customize homelab)
# =====================================================================
$DistroName = "Ubuntu-26.04"
$TaskName   = "HomeLab Startup"

# D: PCIe 4 x4 4TB NVMe M.2 [READ: 5650.39 MB/s  WRITE: 6522.19 MB/s  LATENCY: 0.093 ms]
# C: PCIe 4 x1 2TB NVMe M.2 [READ: 1726.59 MB/s  WRITE: 1279.74 MB/s  LATENCY: 0.135 ms]
$HomelabDisks = @(
    @{
        Name       = "workspace"
        HostPath   = "D:\vhdx\workspace.vhdx"
        Size       = 2560GB
        LinuxMount = "/homelab/workspace"
        Format     = "ext4"
    },
    @{
        Name       = "services"
        HostPath   = "D:\vhdx\services.vhdx"
        Size       = 1024GB
        LinuxMount = "/homelab/services"
        Format     = "ext4"
    },
    @{
        Name       = "observability"
        HostPath   = "C:\vhdx\observability.vhdx"
        Size       = 512GB
        LinuxMount = "/homelab/observability"
        Format     = "ext4"
    },
    @{
        Name       = "library"
        HostPath   = "C:\vhdx\library.vhdx"
        Size       = 512GB
        LinuxMount = "/homelab/library"
        Format     = "ext4"
    }
)
# =====================================================================

# Helper function to enforce Admin rights
function Ensure-Admin {
    $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Host "Error: This action requires PowerShell to be run as Administrator." -ForegroundColor Red
        Exit
    }
}

# Ensure the WSL distro is running before executing commands
function Ensure-WslRunning {
    Write-Host "Waking up WSL distro: $DistroName..." -ForegroundColor DarkGray
    wsl -d $DistroName --exec bash -c "exit"
}

# --- MAIN EXECUTION SWITCH ---
switch ($Action) {
    'Mount' {
        Write-Host "Starting Idempotent Mount Process..." -ForegroundColor Cyan
        Ensure-WslRunning

        # Fetch the default WSL user dynamically so we can assign ownership without sudo
        $WslUser = (wsl -d $DistroName --exec bash -c "whoami").Trim()

        foreach ($Disk in $HomelabDisks) {
            Write-Host "`nProcessing Disk: $($Disk.Name)" -ForegroundColor Yellow
            $HostDir = Split-Path $Disk.HostPath

            # 1. Ensure Windows Directory exists
            if (-not (Test-Path $HostDir)) {
                New-Item -ItemType Directory -Path $HostDir -Force | Out-Null
                Write-Host "  -> Created host directory: $HostDir" -ForegroundColor DarkGray
            }

            # 2. Idempotent Creation & Formatting
            if (-not (Test-Path $Disk.HostPath)) {
                $SizeGB = [math]::Round($Disk.Size / 1GB)
                Write-Host "  -> VHDX not found. Creating ${SizeGB}GB dynamic disk..." -ForegroundColor Cyan
                New-VHD -Path $Disk.HostPath -SizeBytes $Disk.Size -Dynamic | Out-Null
                
                # Wait briefly for Hyper-V to release the file lock after creation
                Start-Sleep -Seconds 2 
                
                # To safely format, we compare block devices before and after bare mount
                $beforeDevices = (wsl -d $DistroName -u root --exec bash -c "lsblk -nd -o NAME").Split("`n").Trim()
                
                wsl --mount --vhd $Disk.HostPath --bare
                Start-Sleep -Seconds 3 
                
                $afterDevices = (wsl -d $DistroName -u root --exec bash -c "lsblk -nd -o NAME").Split("`n").Trim()
                $newDevice = ($afterDevices | Where-Object { $_ -notin $beforeDevices })

                if ($newDevice) {
                    Write-Host "  -> Formatting /dev/$newDevice as $($Disk.Format)..." -ForegroundColor Cyan
                    wsl -d $DistroName -u root --exec bash -c "mkfs.$($Disk.Format) /dev/$newDevice"
                } else {
                    Write-Host "  -> Error: Could not detect new block device for formatting." -ForegroundColor Red
                }
                
                wsl --unmount $Disk.HostPath
                Start-Sleep -Seconds 2
            } else {
                Write-Host "  -> VHDX file already exists. Skipping creation/format." -ForegroundColor Green
            }

            # 3. Idempotent Native Mount
            $isMounted = (wsl -d $DistroName -u root --exec bash -c "mountpoint -q /mnt/wsl/$($Disk.Name) && echo 'yes' || echo 'no'").Trim()
            
            # Check if it is already mounted in WSL
            if ($isMounted -eq 'no') {
                Write-Host "  -> Mounting to WSL..." -ForegroundColor Cyan
                wsl --mount --vhd $Disk.HostPath --name $Disk.Name
            } else {
                Write-Host "  -> Disk is already mounted in WSL. Skipping mount." -ForegroundColor Green
            }

            Write-Host "  -> Enforcing symlinks and permissions for user: $WslUser..." -ForegroundColor DarkGray
            
            # Safely calculate the Linux parent directory in Windows to avoid bash/PowerShell string conflicts
            $LinuxParent = $Disk.LinuxMount.Substring(0, $Disk.LinuxMount.LastIndexOf('/'))
            if ([string]::IsNullOrEmpty($LinuxParent)) { $LinuxParent = "/" }

            # 4. Idempotent Linking & Permissions
            # Execute via root (-u root) to completely bypass the sudo password prompt
            $linkCmd = "mkdir -p $LinuxParent && chown ${WslUser}:${WslUser} /mnt/wsl/$($Disk.Name) && ln -sfn /mnt/wsl/$($Disk.Name) $($Disk.LinuxMount)"
            wsl -d $DistroName -u root --exec bash -c $linkCmd
            
            Write-Host "  -> Available at $($Disk.LinuxMount)" -ForegroundColor Green
        }
        Write-Host "`nAll disks mounted successfully!" -ForegroundColor Green
    }

    'Unmount' {
        Write-Host "Stopping Docker to release file locks..." -ForegroundColor Yellow
        wsl -d $DistroName -u root --exec bash -c "systemctl stop docker 2>/dev/null || true"
        
        foreach ($Disk in $HomelabDisks) {
            Write-Host "Unmounting $($Disk.Name)..." -ForegroundColor Cyan
            wsl --unmount $Disk.HostPath 2>$null
        }
        Write-Host "All lab disks gracefully unmounted." -ForegroundColor Green
    }

    'Destroy' {
        Ensure-Admin
        $confirmation = Read-Host "WARNING: This will permanently DELETE all VHDX files and data! Type 'YES' to continue"
        if ($confirmation -cne 'YES') {
            Write-Host "Aborted." -ForegroundColor Yellow
            Exit
        }

        # Unmount first
        .\homelab.ps1 -Action Unmount

        foreach ($Disk in $HomelabDisks) {
            if (Test-Path $Disk.HostPath) {
                Remove-Item -Path $Disk.HostPath -Force
                Write-Host "Deleted: $($Disk.HostPath)" -ForegroundColor Red
            }
        }
        Write-Host "Destruction complete." -ForegroundColor Green
    }

    'InstallTask' {
        Ensure-Admin
        $scriptPath = $MyInvocation.MyCommand.Path
        $taskExists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

        if (-not $taskExists) {
            Write-Host "Registering task: '$TaskName'..." -ForegroundColor Cyan
            $taskAction    = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ExecutionPolicy Bypass -WindowStyle Hidden -File `"$scriptPath`" -Action Mount"
            $taskTrigger   = New-ScheduledTaskTrigger -AtLogOn
            $taskPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -RunLevel Highest
            $taskSettings  = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -Compatibility Win8

            Register-ScheduledTask -TaskName $TaskName -Action $taskAction -Trigger $taskTrigger -Principal $taskPrincipal -Settings $taskSettings | Out-Null
            Write-Host "Task successfully registered to run on logon." -ForegroundColor Green
        } else {
            Write-Host "Task '$TaskName' is already registered." -ForegroundColor Green
        }
    }

    'RemoveTask' {
        Ensure-Admin
        $taskExists = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

        if ($taskExists) {
            Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
            Write-Host "Task '$TaskName' removed successfully." -ForegroundColor Green
        } else {
            Write-Host "Task '$TaskName' was not found. Nothing to remove." -ForegroundColor Gray
        }
    }
}
