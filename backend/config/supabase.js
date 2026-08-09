const DEFAULT_PROJECT_URL = 'https://mhcpgjubmltcezxoysng.supabase.co';

export function getSupabaseConfig(env = process.env) {
  const url = String(env.SUPABASE_URL || env.SUPABASE_PROJECT_URL || DEFAULT_PROJECT_URL).replace(/\/$/, '');
  const anonKeyConfigured = Boolean(env.SUPABASE_ANON_KEY);
  const serviceRoleKeyConfigured = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);
  const dataMode = env.DATA_MODE || 'illustrative';
  const persistenceMode = env.PERSISTENCE_MODE || (dataMode === 'supabase' ? 'supabase' : 'local-file');
  return {
    projectUrl: url,
    projectRef: url.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || null,
    anonKeyConfigured,
    serviceRoleKeyConfigured,
    persistenceMode,
    configured: anonKeyConfigured || serviceRoleKeyConfigured,
    safeForClient: anonKeyConfigured,
  };
}

export function getSupabaseReadiness(env = process.env) {
  const config = getSupabaseConfig(env);
  const remotePersistenceRequested = config.persistenceMode === 'supabase' || env.DATA_MODE === 'licensed';
  const checks = {
    projectUrl: Boolean(config.projectUrl),
    clientKey: config.anonKeyConfigured || config.serviceRoleKeyConfigured,
    serverPersistenceKey: !remotePersistenceRequested || config.serviceRoleKeyConfigured,
    explicitMode: ['local-file', 'supabase'].includes(config.persistenceMode),
  };
  return {
    ready: Object.values(checks).every(Boolean),
    remotePersistenceRequested,
    checks,
    config: { ...config, anonKeyConfigured: config.anonKeyConfigured, serviceRoleKeyConfigured: config.serviceRoleKeyConfigured },
    disclaimer: 'La configuración no valida credenciales contra la red; la prueba de conexión se ejecuta al habilitar el adaptador remoto.',
  };
}
