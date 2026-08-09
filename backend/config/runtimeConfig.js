const DEMO_SECRET = 'global-resilience-local-demo-secret';
import { getSupabaseReadiness } from './supabase.js';

function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
}

export function getRuntimeConfig() {
  const mode = process.env.APP_MODE || 'demo';
  return {
    mode,
    dataMode: process.env.DATA_MODE || 'illustrative',
    authRequired: asBool(process.env.AUTH_REQUIRED),
    authSecretConfigured: Boolean(process.env.AUTH_SECRET),
    authSecretLength: (process.env.AUTH_SECRET || DEMO_SECRET).length,
    corsConfigured: Boolean(process.env.CORS_ORIGIN),
    allowExternalActions: asBool(process.env.ALLOW_EXTERNAL_ACTIONS),
    persistence: process.env.DATA_FILE || 'backend/storage/state.json',
    environment: process.env.NODE_ENV || 'development',
  };
}

export function getRuntimeReadiness() {
  const config = getRuntimeConfig();
  const supabase = getSupabaseReadiness();
  const production = config.mode === 'production';
  const checks = {
    modeExplicit: config.mode === 'demo' || config.mode === 'staging' || config.mode === 'production',
    authSecret: !production || (config.authRequired && config.authSecretConfigured && config.authSecretLength >= 32),
    authRequired: !production || config.authRequired,
    dataMode: !production || config.dataMode !== 'illustrative',
    cors: !production || config.corsConfigured,
    externalActionsDisabledByDefault: !config.allowExternalActions,
  };
  return { ready: Object.values(checks).every(Boolean), scope: 'local-runtime', generatedAt: new Date().toISOString(), production, checks, supabase, config: { ...config, authSecretLength: config.authSecretLength, authSecretConfigured: config.authSecretConfigured } };
}
