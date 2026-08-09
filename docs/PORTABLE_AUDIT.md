# Auditoría portable

`node scripts/local-portable-audit.js` comprueba los archivos mínimos para una
copia de la USB y busca estado local, `.env`, certificados, claves y patrones de
tokens conocidos. Excluye `node_modules`, `dist`, `.git` y `backend/storage` del
recorrido.

El gate debe ejecutarse antes de copiar el proyecto a GitHub o compartirlo. No
sustituye un secret scanner empresarial, pero reduce el riesgo de transportar
estado de ejecución o credenciales por accidente.
