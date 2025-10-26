# Remove existing build artifacts and node_modules
Write-Host "Cleaning up old files..." -ForegroundColor Yellow
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "deploy.zip" -Force -ErrorAction SilentlyContinue

# Install production dependencies
Write-Host "Installing production dependencies..." -ForegroundColor Yellow
npm ci --only=prod

# Build the application
Write-Host "Building Next.js application..." -ForegroundColor Yellow
npm run build

# Create temporary deployment directory
Write-Host "Creating deployment package..." -ForegroundColor Yellow
$deployDir = "deploy-temp"
New-Item -Path $deployDir -ItemType Directory -Force

# Copy required files
$filesToCopy = @(
    ".next",
    "public",
    "server.js",
    ".htaccess",
    "package.json",
    "next.config.js",
    "postcss.config.js",
    "tailwind.config.js"
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item) {
        Copy-Item -Path $item -Destination "$deployDir\" -Recurse -Force
        Write-Host "Copied $item" -ForegroundColor Green
    } else {
        Write-Host "Warning: $item not found" -ForegroundColor Yellow
    }
}

# Clean up node_modules and keep only production dependencies
Push-Location $deployDir
npm ci --only=prod --omit=dev
Pop-Location

# Create optimized zip
Write-Host "Creating deployment zip..." -ForegroundColor Yellow
Compress-Archive -Path "$deployDir\*" -DestinationPath "deploy.zip" -Force

# Cleanup
Remove-Item -Path $deployDir -Recurse -Force

Write-Host "Done! Created deploy.zip" -ForegroundColor Green
Write-Host "ZIP file size:" -ForegroundColor Yellow
Get-Item deploy.zip | Select-Object Length,@{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB,2)}}