param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..'))
)

$required = @(
  'README.md',
  'backend/package.json',
  'backend/package-lock.json',
  'frontend/package.json',
  'frontend/package-lock.json',
  'docs/API_CONTRACT.md',
  'docs/openapi.local.json'
)

foreach ($relative in $required) {
  $path = Join-Path $Root $relative
  if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw "Falta archivo requerido: $relative" }
}

$forbidden = @(
  (Join-Path $Root 'backend/storage/state.json'),
  (Join-Path $Root 'backend/.env'),
  (Join-Path $Root 'frontend/.env')
)

$present = $forbidden | Where-Object { Test-Path -LiteralPath $_ -PathType Leaf }
if ($present) {
  Write-Warning "La copia contiene estado o secretos locales: $($present -join ', ')"
} else {
  Write-Output 'Copia portable: no se detectaron secretos ni estado de ejecución.'
}

foreach ($folder in @('node_modules', 'dist')) {
  $matches = Get-ChildItem -LiteralPath $Root -Directory -Recurse -Force -ErrorAction SilentlyContinue | Where-Object { $_.Name -eq $folder }
  if ($matches) { Write-Warning "Se detectó $folder; exclúyelo al copiar a GitHub o compartir la USB." }
}

Write-Output "Estructura portable verificada: $Root"
