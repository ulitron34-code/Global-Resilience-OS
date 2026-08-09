# Respaldo local

La vista **Operación** permite descargar un snapshot JSON del estado actual.
El archivo contiene datos operativos, auditoría, notificaciones, comentarios,
webhooks, entregas y jobs; sirve para respaldo manual y diagnóstico local.

Cuando `AUTH_REQUIRED=true`, el endpoint está restringido al rol `admin`.
El snapshot puede contener información sensible: no debe subirse a GitHub ni
compartirse junto con la aplicación sin revisar su contenido.

El snapshot no sustituye la persistencia productiva de Supabase. Antes de la
migración, consérvalo fuera del repositorio y elimina copias innecesarias.
