# Deployment

## Para presentaciones (lo que necesitas HOY)

No necesitas desplegar nada a internet. La opción más simple y confiable
para llevar la demo a una reunión:

```bash
cd frontend
npm install
npm run build
npx serve dist -p 3000
```

Abre `http://localhost:3000` en el navegador de la laptop que lleves a la
reunión. Funciona sin internet (modo local automático). Si el wifi del
lugar es bueno y quieres mostrar el "mini-backend conectado" real, levanta
también el backend (`cd backend && npm start`) antes de abrir el frontend.

**Alternativa aún más simple para compartir por link:** sube la carpeta
`frontend/dist/` a Vercel o Netlify (ambos tienen tier gratuito y no
requieren tarjeta):

```bash
cd frontend
npm run build
npx vercel deploy --prod dist  # o arrastra la carpeta dist/ a netlify.com/drop
```

Esto te da una URL pública (ej. `resilience-os-demo.vercel.app`) que puedes
mandar por WhatsApp/email a inversionistas antes de la reunión.

## Para producción real (cuando levanten capital)

### Frontend
- **Vercel** (recomendado): conecta el repo de GitHub, deploy automático en
  cada push. Configura `VITE_BACKEND_URL` como variable de entorno apuntando
  al backend real.
- Build command: `npm run build` — Output directory: `dist`

### Backend
- **Render** o **Railway**: ambos soportan Node/Express con deploy directo
  desde GitHub, tier gratuito para empezar.
- Variables de entorno: `PORT` (la plataforma normalmente la inyecta sola).
- **Antes de producción real, el backend necesita** (no incluido en esta
  demo): base de datos (Postgres — Supabase o Neon son buenas opciones
  gratuitas para empezar), autenticación (ver `docs/ROADMAP.md`), rate
  limiting, logging estructurado (ej. Pino), variables de entorno para
  secrets.

### Dominio
Sugerido: subdominio tipo `demo.globalresilienceos.com` apuntando al
frontend en Vercel, `api.globalresilienceos.com` al backend.

## Variables de entorno

**Frontend** (`frontend/.env`):
```
VITE_BACKEND_URL=http://localhost:4000
```
En producción, cambia a la URL real del backend desplegado.

**Backend** (`backend/.env` — no incluido, créalo si agregas secrets):
```
PORT=4000
```

## Checklist antes de mostrar a un inversionista

- [ ] `npm run build` corre sin errores
- [x] Probar el artefacto standalone sin backend: `node scripts/standalone-artifact-check.js`
- [ ] Probar exportación de PDF
- [ ] Revisar que el disclaimer "Demo — datos ilustrativos" sea visible
- [ ] Probar en el navegador/laptop específico que llevarás a la reunión, no solo en tu máquina de desarrollo
