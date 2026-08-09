# Gobernanza local de modelos

El registro de gobernanza combina modelo, validacion de invariantes, calibracion,
benchmark contra baseline y decision de aptitud productiva.

Endpoints:

- `GET /api/models/governance`
- `GET /api/models/governance/:id`

Mientras no existan fixtures historicos licenciados, backtesting independiente y
revision humana, la decision es `abstain_for_production`. Esto hace visible la
incertidumbre en lugar de convertir un modelo heuristico de demo en una afirmacion
de precision.
