# Data Contracts - Global Resilience OS

## Envelope común de evento

```json
{
  "schemaVersion": "1.0",
  "externalId": "provider-event-001",
  "sourceId": "ais-demo",
  "eventType": "port_delay",
  "title": "Descripción breve",
  "observedAt": "2026-08-08T12:00:00.000Z",
  "location": { "country": "MX", "region": "Golfo", "lat": 19.2, "lon": -96.1 },
  "severity": "high",
  "confidence": 0.82,
  "provenance": { "uri": "https://provider.example/event/001", "retrievedAt": "2026-08-08T12:01:00.000Z", "licenseRef": "contract-001" },
  "payload": {}
}
```

## Reglas

- `externalId`, `sourceId`, `eventType`, `observedAt` y `title` son obligatorios.
- `severity` sólo acepta `low`, `medium`, `high` o `critical`.
- `confidence` debe estar entre 0 y 1.
- Los timestamps deben ser ISO-8601 UTC.
- La ingesta es idempotente por `sourceId + externalId`.
- Ningún dato licenciado se persiste sin `licenseRef` y política de retención.
- Los campos no reconocidos se conservan únicamente dentro de `payload`.

## Entidad temporal del grafo

Cada nodo y arista productiva deberá incluir:

```json
{
  "id": "asset:cable-001",
  "type": "cable",
  "label": "Cable 001",
  "validFrom": "2026-01-01T00:00:00Z",
  "validTo": null,
  "confidence": 0.9,
  "provenance": ["source-001"],
  "reviewStatus": "unreviewed"
}
```

## Estado de calidad

Los conectores deben publicar `lastEventAt`, `latencySeconds`, `coverage`, `duplicateRate`, `licenseStatus` y `health`. El readiness debe impedir recomendaciones materiales cuando una fuente crítica está stale, vencida o sin licencia.

## Registro de conectores

`GET /api/connectors` documenta los adaptadores de AIS, cables submarinos,
puertos y mercados. En esta fase todos declaran `dry_run_only`; no existe
ninguna llamada de red ni afirmación de datos reales. `POST /api/ingest/validate`
permite validar un evento antes de enviarlo a la ingesta persistente.

## Resolución de entidades local

`POST /api/entities/resolve` recibe `{ "type": "cable|vertical|chokepoint", "query": "nombre externo" }` y devuelve candidatos, score, alias aplicado y entidad resuelta. En producción deberá incorporar identificadores del proveedor, vigencia, fuente y revisión humana.
