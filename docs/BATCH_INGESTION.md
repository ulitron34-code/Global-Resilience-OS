# Ingesta batch local

En `APP_MODE=production`, cada fuente debe estar conectada, no ser ilustrativa
y conservar licencia activa con ficha contractual completa.

`POST /api/ingest/batch` acepta entre 1 y 100 eventos con el mismo contrato de
ingesta individual.

La vista Operations permite importar un archivo `.json` o `.csv`, cargar
plantillas descargables y revisar el resultado por registro. El CSV requiere
encabezados; las columnas numéricas reconocidas son `impactUsd`, `confidence` y
`durationHours`.

- `mode: dry_run` valida contrato y fuente sin modificar estado.
- `mode: commit` sólo persiste si todo el lote es válido.
- Los `externalId` conservan deduplicación y cada evento queda auditado.
- El commit pide confirmación explícita en la interfaz y no se ejecuta si la
  sesión es de sólo lectura.
- Los conectores externos siguen fuera de alcance; el lote es una interfaz local
  para preparar CSV/adaptadores autorizados.
