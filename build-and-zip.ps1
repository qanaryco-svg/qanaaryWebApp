Param(
  [string]$ProjectDir = (Get-Location).Path,
  [string]$OutDir = "out",
  [string]$ZipName = "site-export.zip"
)

Write-Host "ProjectDir: $ProjectDir"
Set-Location $ProjectDir

Write-Host "Installing dependencies (production)..."
npm ci

Write-Host "Building Next.js..."
npm run build

Write-Host "Running next export (will create the '$OutDir' folder)..."
npm run export

# Create an SPA-friendly .htaccess inside the exported folder
$htaccessPath = Join-Path $OutDir ".htaccess"
$htContent = @"
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^.*$ /index.html [L,QSA]
</IfModule>
"@

Write-Host "Writing $htaccessPath"
Set-Content -Path $htaccessPath -Value $htContent -Encoding UTF8

# Create ZIP
if (Test-Path $ZipName) { Remove-Item $ZipName -Force }
Write-Host "Creating zip $ZipName from $OutDir"
Compress-Archive -Path (Join-Path $OutDir "*") -DestinationPath $ZipName
Write-Host "Done. Created: $ZipName"
