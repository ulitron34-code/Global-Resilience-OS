import { FileDown } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { createScenarioPdf } from '../utils/reportPdf';

export default function ReportExport() {
  const result = useAppStore((state) => state.result);
  const [error, setError] = useState('');
  if (!result) return null;
  const handleExport = () => {
    setError('');
    try { createScenarioPdf(result).save(`resilience-os-${result.cable.id}-${Date.now()}.pdf`); }
    catch (exportError) { setError(exportError.message); }
  };
  return <div className="flex flex-col gap-2"><button onClick={handleExport} className="flex items-center justify-center gap-2 border border-signal/40 text-signal text-xs font-medium py-2 rounded hover:bg-signal/10 transition-colors"><FileDown size={14} />Exportar reporte PDF</button>{error && <div role="alert" className="text-[11px] text-alert">No se pudo exportar: {error}</div>}</div>;
}
