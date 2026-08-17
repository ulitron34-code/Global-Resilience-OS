function parseCsvLine(line) {
  const values = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const next = line[index + 1];
    if (character === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === ',' && !quoted) {
      values.push(value.trim());
      value = '';
    } else {
      value += character;
    }
  }
  if (quoted) throw new Error('Invalid CSV: unclosed quotes');
  values.push(value.trim());
  return values;
}

function coerceCsvValue(key, value) {
  if (value === '') return '';
  if (['impactUsd', 'confidence', 'durationHours'].includes(key)) {
    const number = Number(value);
    return Number.isNaN(number) ? value : number;
  }
  return value;
}

export function parseBatchText(text, fileName = '') {
  const raw = String(text || '').trim();
  if (!raw) throw new Error('The file is empty');
  const looksLikeJson = fileName.toLowerCase().endsWith('.json') || /^(?:\[|\{)/.test(raw);
  if (looksLikeJson) {
    const parsed = JSON.parse(raw);
    const events = Array.isArray(parsed) ? parsed : parsed.events;
    if (!Array.isArray(events)) throw new Error('JSON debe ser un arreglo o contener la propiedad events');
    return events;
  }
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('CSV debe incluir encabezados y al menos un registro');
  const headers = parseCsvLine(lines[0]).map((header) => header.replace(/^\uFEFF/, ''));
  if (headers.some((header) => !header)) throw new Error('CSV contains an empty header');
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    if (values.length !== headers.length) throw new Error('CSV contains a row with a different number of columns');
    return headers.reduce((event, header, index) => ({ ...event, [header]: coerceCsvValue(header, values[index]) }), {});
  });
}

export function batchTemplate(format = 'json') {
  const event = { sourceId: 'ais-demo', externalId: 'batch-example-001', eventType: 'ais_gap', title: 'Sample signal', severity: 'medium', impactUsd: 1000, location: 'Strait of Hormuz' };
  return format === 'csv'
    ? `sourceId,externalId,eventType,title,severity,impactUsd,location\n${Object.values(event).map((value) => String(value).includes(',') ? `"${String(value).replaceAll('"', '""')}"` : value).join(',')}`
    : JSON.stringify([event], null, 2);
}

