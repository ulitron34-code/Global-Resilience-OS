import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function formatUsd(value) { if (!Number.isFinite(value)) return '—'; if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }

export function createScenarioPdf(result, generatedAt = new Date()) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const marginX = 48;
  doc.setFillColor(10, 17, 32);
  doc.rect(0, 0, 612, 88, 'F');
  doc.setTextColor(45, 212, 191);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('GLOBAL RESILIENCE OS', marginX, 40);
  doc.setTextColor(139, 152, 180);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Reporte de escenario - Ruptura de infraestructura de cables submarinos', marginX, 56);
  doc.text(`Generado: ${generatedAt.toLocaleString('es-MX')}`, marginX, 70);

  let y = 110;
  doc.setTextColor(20, 20, 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(`Cable: ${result.cable.name}`, marginX, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Ruta: ${result.cable.route}`, marginX, y);
  y += 14;
  doc.text(`Escenario: ${result.severity === 'total' ? 'Corte total' : 'Corte parcial'} - Duración: ${result.durationHours}h`, marginX, y);
  y += 14;
  if (result.chokepoints?.length) { doc.text(`Chokepoints en ruta: ${result.chokepoints.join(', ')}`, marginX, y); y += 14; }
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(251, 146, 60);
  doc.text(`Pérdida total estimada: ${formatUsd(result.totalUsdLoss)}`, marginX, y);
  doc.setTextColor(20, 20, 20);

  autoTable(doc, {
    startY: y + 24,
    head: [['Vertical', 'Categoría de impacto', '% impacto', 'Pérdida estimada (USD)']],
    body: (result.affected || []).map((item) => [item.label, item.tier === 'directo' ? 'Directo' : item.tier === 'moderado' ? 'Moderado' : 'Sistémico', `${(item.impactPct * 100).toFixed(1)}%`, formatUsd(item.usdLoss)]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5 },
    headStyles: { fillColor: [16, 27, 46], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    margin: { left: marginX, right: marginX },
  });

  let finalY = (doc.lastAutoTable?.finalY || y + 40) + 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Lectura del escenario', marginX, finalY);
  finalY += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const narrativeLines = doc.splitTextToSize(result.narrative || 'Sin narrativa disponible.', 612 - marginX * 2);
  doc.text(narrativeLines, marginX, finalY);
  finalY += narrativeLines.length * 12 + 20;
  doc.setFillColor(250, 240, 225);
  doc.rect(marginX, finalY, 612 - marginX * 2, 40, 'F');
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(120, 80, 30);
  const disclaimer = doc.splitTextToSize('Este reporte fue generado por una demo funcional de Global Resilience OS. Los valores de flujo diario son estimaciones ilustrativas y no deben usarse para decisiones de inversión, trading o cobertura de riesgo real.', 612 - marginX * 2 - 16);
  doc.text(disclaimer, marginX + 8, finalY + 12);
  return doc;
}
