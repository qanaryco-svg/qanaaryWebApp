# Production deployment packager for Next.js
param (
    [int]$ChunkSizeMB = 30,
    [switch]$IncludeNodeModules
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host "Creating deployment packages (${ChunkSizeMB}MB chunks)..."

# Setup paths
$root = (Get-Location).Path
$nextDir = Join-Path -Path $root -ChildPath ".next"
$temp = Join-Path -Path $root -ChildPath ".deploy_temp"
$outDir = Join-Path -Path $root -ChildPath "deploy_zips"

# Verify .next exists
if (-not (Test-Path -Path $nextDir)) {
    Write-Error ".next directory not found. Please run 'npm run build' first."
    exit 1
}

# Clean/create temp dir
if (Test-Path -Path $temp) { 
    Remove-Item -Path $temp -Recurse -Force 
}
New-Item -Path $temp -ItemType Directory -Force | Out-Null

# Clean/create output dir
if (Test-Path -Path $outDir) { 
    Remove-Item -Path $outDir -Recurse -Force 
}
New-Item -Path $outDir -ItemType Directory -Force | Out-Null

# Copy required files
$include = @(
    "package.json",
    "package-lock.json",
    "yarn.lock",
    "server.js",
    "next.config.js",
    ".htaccess"
)

$dirs = @(
    ".next",
    "public"
)

foreach ($file in $include) {
    $src = Join-Path -Path $root -ChildPath $file
    if (Test-Path -Path $src) {
        Copy-Item -Path $src -Destination $temp -Force
    }
}

foreach ($dir in $dirs) {
    $src = Join-Path -Path $root -ChildPath $dir
    if (Test-Path -Path $src) {
        Copy-Item -Path $src -Destination $temp -Recurse -Force
    }
}

if ($IncludeNodeModules) {
    Write-Host "Including node_modules (this will increase package size significantly)..."
    $nodeModules = Join-Path -Path $root -ChildPath "node_modules"
    if (Test-Path -Path $nodeModules) {
        Copy-Item -Path $nodeModules -Destination $temp -Recurse -Force
    }
}

# Create chunks
$limitBytes = $ChunkSizeMB * 1MB
$files = Get-ChildItem -Path $temp -Recurse -File | Sort-Object Length -Descending
$partIndex = 1
$currentSize = 0
$currentFiles = @()

function New-ZipPart {
    param (
        [Parameter(Mandatory)]
        $files,
        [Parameter(Mandatory)]
        [int]$index
    )

    if ($files.Count -eq 0) { return }
    
    $partDir = Join-Path -Path $temp -ChildPath "_part_$index"
    if (Test-Path -Path $partDir) {
        Remove-Item -Path $partDir -Recurse -Force
    }
    New-Item -Path $partDir -ItemType Directory -Force | Out-Null

    foreach ($file in $files) {
        $rel = $file.FullName.Substring($temp.Length + 1)
        $target = Join-Path -Path $partDir -ChildPath $rel
        $targetDir = Split-Path -Path $target -Parent
        
        if (-not (Test-Path -Path $targetDir)) {
            New-Item -Path $targetDir -ItemType Directory -Force | Out-Null
        }
        
        Copy-Item -Path $file.FullName -Destination $target -Force
    }

    $zipName = Join-Path -Path $outDir -ChildPath ("deploy-part-{0:00}.zip" -f $index)
    Write-Host "Creating $zipName (files: $($files.Count))"
    
    if (Test-Path -Path $zipName) {
        Remove-Item -Path $zipName -Force
    }
    
    Compress-Archive -Path (Join-Path -Path $partDir -ChildPath "*") -DestinationPath $zipName -CompressionLevel Optimal
    Remove-Item -Path $partDir -Recurse -Force
}

foreach ($file in $files) {
    if ($file.Length -gt $limitBytes) {
        if ($currentFiles.Count -gt 0) {
            New-ZipPart -files $currentFiles -index $partIndex
            $partIndex++
            $currentFiles = @()
            $currentSize = 0
        }
        New-ZipPart -files @($file) -index $partIndex
        $partIndex++
        continue
    }

    if (($currentSize + $file.Length) -gt $limitBytes) {
        New-ZipPart -files $currentFiles -index $partIndex
        $partIndex++
        $currentFiles = @()
        $currentSize = 0
    }

    $currentFiles += $file
    $currentSize += $file.Length
}

if ($currentFiles.Count -gt 0) {
    New-ZipPart -files $currentFiles -index $partIndex
}

Write-Host "`nPackaging complete!"
Write-Host "Output directory: $outDir"
Get-ChildItem -Path $outDir | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name) ($size MB)"
}

# Cleanup
Remove-Item -Path $temp -Recurse -Force