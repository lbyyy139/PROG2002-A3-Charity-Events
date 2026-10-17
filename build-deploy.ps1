<#
.SYNOPSIS
    Builds both A3 Angular front ends against a given cPanel API URL and
    packages them for upload.

.USAGE
    powershell -ExecutionPolicy Bypass -NoProfile -File .\build-deploy.ps1 -ApiBase "https://你的学号.it.scu.edu.au"

    -ApiBase  your cPanel API base. A trailing "/api" is removed automatically,
              because the ApiService appends "/api/..." to this value itself.

.OUTPUT
    deploy-package\client-deploy.zip   -> upload to public_html
    deploy-package\admin-deploy.zip    -> upload to public_html\admin
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$ApiBase
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$node = Join-Path $root ".build-node\node-v22.22.3-win-x64"

# --- normalise the URL -----------------------------------------------------
$ApiBase = $ApiBase.TrimEnd('/')
if ($ApiBase -match '/api$') { $ApiBase = $ApiBase -replace '/api$', '' }
Write-Output "API base : $ApiBase"

if (-not (Test-Path (Join-Path $node "node.exe"))) {
    Write-Output "ERROR: portable Node not found at $node"
    exit 1
}
$env:Path = "$node;" + $env:Path

# --- point both front ends at the given API --------------------------------
$envFiles = @(
    (Join-Path $root "A3-clientside\src\environments\environment.ts"),
    (Join-Path $root "A3-adminside\src\environments\environment.ts")
)
foreach ($f in $envFiles) {
    (Get-Content $f -Raw) -replace "apiUrl: '[^']*'", "apiUrl: '$ApiBase'" |
        Set-Content $f -Encoding utf8 -NoNewline
    Write-Output "updated  : $f"
}

# --- build ------------------------------------------------------------------
Set-Location (Join-Path $root "A3-clientside")
npx ng build
if ($LASTEXITCODE -ne 0) { Write-Output "clientside build FAILED"; exit 1 }

Set-Location (Join-Path $root "A3-adminside")
npx ng build --base-href /admin/
if ($LASTEXITCODE -ne 0) { Write-Output "adminside build FAILED"; exit 1 }

Set-Location $root

# --- package ----------------------------------------------------------------
$out = Join-Path $root "deploy-package"
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
New-Item -ItemType Directory -Path $out | Out-Null

Compress-Archive -Path "A3-clientside\dist\A3-clientside\browser\*", "deploy\.htaccess" `
    -DestinationPath (Join-Path $out "client-deploy.zip") -Force

Compress-Archive -Path "A3-adminside\dist\A3-adminside\browser\*", "deploy\admin-htaccess\.htaccess" `
    -DestinationPath (Join-Path $out "admin-deploy.zip") -Force

# --- restore the committed environment files -------------------------------
git checkout -- A3-clientside/src/environments/environment.ts A3-adminside/src/environments/environment.ts
Write-Output "restored : environment.ts files are back to the committed version"

Write-Output "=== ready to upload ==="
Get-ChildItem $out | Select-Object Name, @{N = 'KB'; E = { [math]::Round($_.Length / 1KB) } }
