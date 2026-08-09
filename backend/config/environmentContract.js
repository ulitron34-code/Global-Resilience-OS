function bool(value) { return String(value || '').toLowerCase() === 'true'; }

export function getEnvironmentContract(env = process.env) {
  const mode = env.APP_MODE || 'demo';
  const production = mode === 'production';
  const checks = [
    { id: 'mode', label: 'APP_MODE reconocido', pass: ['demo', 'staging', 'production'].includes(mode), evidence: mode },
    { id: 'auth', label: 'Autenticación adecuada al entorno', pass: !production || (bool(env.AUTH_REQUIRED) && String(env.AUTH_SECRET || '').length >= 32), evidence: production ? 'AUTH_REQUIRED + secret >= 32' : 'demo permite sesión opcional' },
    { id: 'data', label: 'DATA_MODE no ilustrativo en producción', pass: !production || (env.DATA_MODE && env.DATA_MODE !== 'illustrative'), evidence: env.DATA_MODE || 'illustrative' },
    { id: 'cors', label: 'CORS explícito en producción', pass: !production || Boolean(env.CORS_ORIGIN), evidence: production ? (env.CORS_ORIGIN ? 'configurado' : 'ausente') : 'no requerido en demo' },
    { id: 'external_actions', label: 'Acciones externas desactivadas por defecto', pass: !bool(env.ALLOW_EXTERNAL_ACTIONS), evidence: bool(env.ALLOW_EXTERNAL_ACTIONS) ? 'habilitadas explícitamente' : 'deshabilitadas' },
    { id: 'persistence', label: 'Ruta de persistencia declarada', pass: Boolean(env.DATA_FILE || 'backend/storage/state.json'), evidence: env.DATA_FILE || 'backend/storage/state.json' },
  ];
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), mode, production, ready: checks.every((item) => item.pass), checks, disclaimer: 'Contrato de configuración local; no sustituye secretos gestionados, IAM ni controles del proveedor de infraestructura.' };
}
