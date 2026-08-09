param([Parameter(Mandatory=$true)][string]$FrontendRoot)
$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $FrontendRoot
try {
  & npm.cmd run build
  exit $LASTEXITCODE
} finally {
  Pop-Location
}
