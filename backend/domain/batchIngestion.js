import { validateEventEnvelope } from './eventContract.js';

export function validateBatchInput(input = {}, sources = [], options = {}) {
  const mode = input.mode === undefined ? 'dry_run' : String(input.mode);
  if (!['dry_run', 'commit'].includes(mode)) throw new Error('mode debe ser dry_run o commit');
  if (!Array.isArray(input.events) || input.events.length < 1 || input.events.length > 100) throw new Error('events debe contener entre 1 y 100 registros');
  const sourceIds = new Set(sources.map((source) => source.id));
  const items = input.events.map((event, index) => {
    try {
      const normalized = validateEventEnvelope(event, options);
      if (!sourceIds.has(normalized.sourceId)) throw new Error(`Fuente desconocida: ${normalized.sourceId}`);
      return { index, externalId: normalized.externalId, status: 'valid', event: normalized };
    } catch (error) {
      return { index, externalId: event?.externalId || null, status: 'invalid', error: error.message };
    }
  });
  return { mode, items, counts: { total: items.length, valid: items.filter((item) => item.status === 'valid').length, invalid: items.filter((item) => item.status === 'invalid').length }, readyToCommit: items.every((item) => item.status === 'valid'), disclaimer: 'Validación local de lote. El modo dry_run no cambia estado; commit conserva deduplicación y auditoría por evento.' };
}
