const CHANNELS = ['in_app', 'email', 'webhook', 'slack'];
const DEFAULT_RECIPIENTS = {
  critical: [{ role: 'admin', escalationMinutes: 5 }, { role: 'risk_analyst', escalationMinutes: 10 }],
  high: [{ role: 'risk_analyst', escalationMinutes: 15 }, { role: 'admin', escalationMinutes: 30 }],
  medium: [{ role: 'risk_analyst', escalationMinutes: 60 }],
  low: [{ role: 'risk_analyst', escalationMinutes: 240 }],
};

export function buildNotificationPolicy(input = {}) {
  const severity = ['critical', 'high', 'medium', 'low'].includes(input.severity) ? input.severity : 'medium';
  const channels = (Array.isArray(input.channels) ? input.channels : ['in_app']).filter((channel) => CHANNELS.includes(channel));
  const uniqueChannels = [...new Set(channels.length ? channels : ['in_app'])];
  const recipients = DEFAULT_RECIPIENTS[severity].map((item) => ({ ...item, channels: uniqueChannels }));
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), severity, channels: uniqueChannels, recipients, deduplication: { key: ['eventType', 'entityId', 'severity'], windowMinutes: 30 }, quietHours: { enabled: false, timezone: 'UTC', start: '22:00', end: '07:00', criticalBypasses: true }, delivery: { mode: 'dry_run', retries: 3, backoffSeconds: [30, 120, 600], externalActionsEnabled: false }, disclaimer: 'Politica local de escalamiento. No envia correo, Slack ni webhooks externos hasta configurar infraestructura y autorizacion.' };
}

export function getNotificationPolicyReadiness() { return { ready: false, channels: CHANNELS.map((id) => ({ id, status: id === 'in_app' ? 'local' : 'not_configured' })), blocking: ['provider_credentials', 'recipient_directory', 'delivery_worker', 'quiet_hours_policy'], disclaimer: 'Readiness local; no se han activado canales externos.' }; }
