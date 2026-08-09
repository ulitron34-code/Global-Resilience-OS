# Comprobación de reproducibilidad local

`node scripts/local-reproducibility-check.js` valida los insumos que deben sobrevivir a una instalación nueva:

- manifests y lockfiles de backend/frontend;
- coincidencia de nombre, versión y `lockfileVersion`;
- variables documentadas en ambos `.env.example`;
- exclusión de `node_modules`, `dist`, secretos y estado local;
- entrypoints mínimos de backend y frontend.

La comprobación no ejecuta una instalación ni requiere red; `npm ci` se ejecutará posteriormente en CI o en la máquina de destino con la infraestructura elegida.
