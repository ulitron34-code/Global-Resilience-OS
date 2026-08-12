$BaseUrl = "https://global-resilience-os.onrender.com"

Write-Host "--- Iniciando Smoke Test No-Demo ---" -ForegroundColor Cyan

# 1. Healthcheck
Write-Host "1. Verificando Healthcheck..."
$health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get
Write-Host "   Health Status: $($health.status) (Version: $($health.version))" -ForegroundColor Green

# 2. Login de prueba (asumiendo endpoint de auth habilitado)
Write-Host "`n2. Intentando login (simulado para validacion de endpoints)..."
try {
    # Usando credenciales dummy, se espera 401 si esta activo, o token si esta en modo bypass/demo
    $authBody = @{ email = "demo@example.com"; password = "demo" } | ConvertTo-Json
    $authRes = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $authBody -ContentType "application/json"
    Write-Host "   Respuesta de Auth (Demo mode): $($authRes | Out-String)" -ForegroundColor Green
    $Token = $authRes.token
} catch {
    Write-Host "   Login fallo o rechazo (Normal en prod sin credenciales correctas): $($_.Exception.Message)" -ForegroundColor Yellow
}

$Headers = @{
    "Content-Type" = "application/json"
}
if ($Token) {
    $Headers["Authorization"] = "Bearer $Token"
}

# 3. Verticals (Filtros base)
Write-Host "`n3. Probando lectura de verticales (Filtros)..."
$verticals = Invoke-RestMethod -Uri "$BaseUrl/api/verticals" -Method Get -Headers $Headers
Write-Host "   Verticales recuperadas: $($verticals.Count)" -ForegroundColor Green

# 4. Escenarios (Simulacion)
Write-Host "`n4. Probando simulacion de impacto (Suez)..."
$simBody = @{ cableId = "suez"; severity = "total"; durationHours = 24 } | ConvertTo-Json
$simRes = Invoke-RestMethod -Uri "$BaseUrl/api/simulate-rupture" -Method Post -Body $simBody -Headers $Headers
Write-Host "   Impacto Total Calculado: `$ $($simRes.totalUsdLoss)" -ForegroundColor Green

# 5. Ingesta de Eventos
Write-Host "`n5. Probando endpoint de ingesta de eventos..."
$ingestBody = @{ source = "system"; type = "test_event"; payload = @{ message = "smoke_test" } } | ConvertTo-Json
try {
    $ingestRes = Invoke-RestMethod -Uri "$BaseUrl/api/ingest/events" -Method Post -Body $ingestBody -Headers $Headers
    Write-Host "   Ingesta exitosa." -ForegroundColor Green
} catch {
    Write-Host "   Ingesta devolvio error (Puede requerir token admin): $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n--- Smoke Test Completado ---" -ForegroundColor Cyan
