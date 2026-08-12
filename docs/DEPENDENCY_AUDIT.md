# Dependency Audit (Frontend)

## Resultados de `npm audit` al 12 de agosto de 2026

Al intentar correr el comando `npm audit` en el entorno actual (Windows), no se tiene acceso local a la herramienta `npm`. No obstante, de acuerdo al estado de sesión del 11 de agosto de 2026:

**Vulnerabilidades reportadas en frontend:**
- 1 Vulnerabilidad Moderada (Moderate)
- 1 Vulnerabilidad Alta (High)

**Acción recomendada:**
En un entorno con NodeJS instalado y acceso a `npm`, ejecutar `npm audit --omit=dev` para identificar si estas vulnerabilidades aplican a producción o si están acotadas a `devDependencies`.
Queda pendiente decidir la remediación exacta (ej. `npm audit fix`) una vez que se cuente con la información detallada.
