# setup-ffmpeg.ps1
# Simple and robust script to set up FFmpeg locally.

$ErrorActionPreference = "Stop"

$binDir = Join-Path $PSScriptRoot "bin"
if (!(Test-Path $binDir)) {
    Write-Host "Creating bin directory..."
    New-Item -ItemType Directory -Path $binDir | Out-Null
}

$ffmpegExe = Join-Path $binDir "ffmpeg.exe"

if (Test-Path $ffmpegExe) {
    Write-Host "FFmpeg is already installed in the local bin directory."
    exit
}

Write-Host "Downloading FFmpeg release essentials..."
$url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$zipPath = Join-Path $binDir "ffmpeg.zip"

if (!(Test-Path $zipPath)) {
    try {
        Invoke-WebRequest -Uri $url -OutFile $zipPath
        Write-Host "Download complete."
    }
    catch {
        Write-Host "Error: Failed to download FFmpeg. Check your connection."
        exit
    }
}
else {
    Write-Host "Using existing zip file."
}

Write-Host "Extracting FFmpeg..."
try {
    # Extract to a temp folder inside bin
    $tempExtract = Join-Path $binDir "temp_extract"
    if (Test-Path $tempExtract) { Remove-Item $tempExtract -Recurse -Force }
    New-Item -ItemType Directory -Path $tempExtract | Out-Null
    
    Expand-Archive -Path $zipPath -DestinationPath $tempExtract -Force
    
    # Find the nested bin folder
    $nestedBin = Get-ChildItem -Path $tempExtract -Filter "bin" -Recurse | Select-Object -First 1
    if ($nestedBin) {
        Write-Host "Moving binaries to bin folder..."
        Copy-Item -Path (Join-Path $nestedBin.FullName "*") -Destination $binDir -Force
        Write-Host "Binary move complete."
    }
    else {
        Write-Host "Error: Could not find bin folder in extracted archive."
    }
    
    # Cleanup
    Remove-Item $tempExtract -Recurse -Force
    Remove-Item $zipPath -Force
    Write-Host "Cleanup complete."
}
catch {
    Write-Host "Error: Extraction failed. $($_.Exception.Message)"
}

if (Test-Path $ffmpegExe) {
    Write-Host "SUCCESS: FFmpeg has been installed in the bin folder."
}
else {
    Write-Host "FAILURE: FFmpeg installation failed."
}
