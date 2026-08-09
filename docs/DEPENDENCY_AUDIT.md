# Auditoría de dependencias

Última ejecución local: 8 de agosto de 2026.

- Backend: `npm audit --omit=dev` → **0 vulnerabilidades**.
- Frontend: `npm audit --omit=dev` → **0 vulnerabilidades**.

La revisión cubre el estado instalado/lockfile local. Debe repetirse en CI y
antes de cada despliegue porque las advisories pueden cambiar.
