import assert from 'node:assert/strict';
import { createScenarioPdf } from '../frontend/src/utils/reportPdf.js';

const doc = createScenarioPdf({
  cable: { id: 'pdf-check', name: 'Cable de prueba', route: 'Ruta de prueba' },
  severity: 'partial', durationHours: 24, chokepoints: ['Chokepoint de prueba'], totalUsdLoss: 125000,
  affected: [{ label: 'Telecom', tier: 'directo', impactPct: 0.25, usdLoss: 125000 }],
  narrative: 'Escenario de validación de exportación PDF local.',
}, new Date('2026-08-08T12:00:00.000Z'));
const bytes = Buffer.from(doc.output('arraybuffer'));
assert.ok(bytes.length > 1000, 'el PDF generado debe contener contenido');
assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', 'la salida debe ser un PDF válido');
console.log(JSON.stringify({ gate: 'PASS', mode: 'pdf-export', bytes: bytes.length, header: bytes.subarray(0, 5).toString() }));
