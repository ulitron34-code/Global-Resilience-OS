# Contrato frontend-backend

El frontend puede operar en dos modos explícitos:

- `VITE_BACKEND_REQUIRED=false`: modo demo/standalone. Si el backend no responde, las vistas compatibles usan datos locales ilustrativos.
- `VITE_BACKEND_REQUIRED=true`: modo conectado. Si Render está caído, protegido, mal configurado o devuelve un error, la operación falla y la interfaz muestra `Backend no disponible`; no se presenta un cálculo local como si fuera operativo.

Para Vercel conectado a Render se deben configurar:

```env
VITE_BACKEND_URL=https://global-resilience-os.onrender.com
VITE_BACKEND_REQUIRED=true
```

El valor `false` permanece en `frontend/.env.example` para facilitar la ejecución local de la demo. Las claves de Supabase nunca deben entrar en variables `VITE_*` porque serían públicas en el bundle.

El indicador superior distingue `Mini-backend conectado`, `Backend no disponible` y `Modo local (standalone)`. La distinción es operacional: una interfaz visible no implica que las acciones hayan sido persistidas o auditadas.
