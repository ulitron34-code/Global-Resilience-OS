const REGION_PROFILES = [
  { id: 'global', label: 'Global', operatingContext: 'Cobertura transversal; requiere desagregación regional antes de una decisión productiva.', dataNeeds: ['activos y rutas del tenant', 'fuentes licenciadas por jurisdicción'], evidenceClass: 'assumed' },
  { id: 'north-america', label: 'Norteamérica', operatingContext: 'Corredores energéticos, manufactura y conectividad con exposición transfronteriza.', dataNeeds: ['aduanas y tiempos de cruce', 'capacidad logística regional'], evidenceClass: 'assumed' },
  { id: 'latin-america', label: 'Latinoamérica', operatingContext: 'Dependencias portuarias, energía y concentración de proveedores con mayor variabilidad operativa.', dataNeeds: ['rutas portuarias y terrestres', 'concentración de proveedores'], evidenceClass: 'assumed' },
  { id: 'europe', label: 'Europa', operatingContext: 'Interdependencia energética, industrial y regulatoria entre jurisdicciones.', dataNeeds: ['marcos regulatorios aplicables', 'rutas energéticas y sustitución'], evidenceClass: 'assumed' },
  { id: 'asia-pacific', label: 'Asia-Pacífico', operatingContext: 'Cadenas de suministro marítimas y manufactura concentrada con ventanas largas de recuperación.', dataNeeds: ['rutas marítimas y lead times', 'dependencias de manufactura'], evidenceClass: 'assumed' },
  { id: 'middle-east-africa', label: 'Medio Oriente y África', operatingContext: 'Chokepoints, energía y rutas alternativas condicionadas por capacidad y jurisdicción.', dataNeeds: ['estado de chokepoints', 'capacidad alternativa verificable'], evidenceClass: 'assumed' },
];

const VERTICAL_PROFILES = {
  petroleo: { label: 'Petróleo', decisionLenses: ['flujo físico', 'capacidad de almacenamiento', 'sustitución de ruta'], criticalInputs: ['volumen comprometido', 'inventario disponible', 'lead time alterno'] },
  lng: { label: 'LNG', decisionLenses: ['capacidad de regasificación', 'ventana de entrega', 'ruta marítima'], criticalInputs: ['capacidad contratada', 'terminal alterna', 'duración del evento'] },
  electricidad: { label: 'Electricidad', decisionLenses: ['capacidad firme', 'balance horario', 'interconexión'], criticalInputs: ['demanda crítica', 'reserva operativa', 'capacidad de respaldo'] },
  semiconductores: { label: 'Semiconductores', decisionLenses: ['proveedor único', 'inventario de seguridad', 'sustitución técnica'], criticalInputs: ['BOM afectado', 'días de inventario', 'calificación de segundo proveedor'] },
  trigo: { label: 'Trigo', decisionLenses: ['origen alterno', 'almacenamiento', 'ruta portuaria'], criticalInputs: ['tonelaje comprometido', 'stock de seguridad', 'capacidad de descarga'] },
};

function clone(value) { return structuredClone(value); }

export function listModelProfiles({ vertical, region } = {}) {
  const regionId = String(region || 'global').trim().toLowerCase() || 'global';
  const verticalId = String(vertical || '').trim().toLowerCase();
  const selectedRegion = REGION_PROFILES.find((item) => item.id === regionId) || REGION_PROFILES[0];
  const verticalProfile = VERTICAL_PROFILES[verticalId] || { label: vertical || 'Vertical no clasificada', decisionLenses: ['exposición', 'continuidad', 'evidencia'], criticalInputs: ['activo afectado', 'duración', 'alternativas'] };
  return {
    schemaVersion: '1.0.0-local',
    selection: { region: selectedRegion.id, vertical: verticalId || 'unclassified' },
    region: clone(selectedRegion),
    vertical: { id: verticalId || 'unclassified', ...clone(verticalProfile) },
    model: {
      id: 'decision-profile-local',
      version: '0.1.0',
      status: 'assumed_profile',
      evidenceClass: 'assumed',
      decision: 'abstain_for_production',
      methodology: 'Perfil de preguntas y datos necesarios; no calcula predicciones regionales ni sustituye calibración histórica.',
      gates: { licensedData: false, historicalValidation: false, humanReview: true },
    },
    dataNeeds: [...new Set([...selectedRegion.dataNeeds, ...verticalProfile.criticalInputs])],
    disclaimer: 'Perfil local de diseño. Las características regionales y verticales son hipótesis de trabajo y deben validarse con datos licenciados, expertos y un piloto.',
  };
}

export function getModelProfileReadiness() {
  return { status: 'local_catalog_only', profileCount: REGION_PROFILES.length, specializedVerticalCount: Object.keys(VERTICAL_PROFILES).length, productionReady: false, requiredNextEvidence: ['datos licenciados regionales', 'fixtures históricos por vertical', 'revisión experta', 'aprobación de cambio de modelo'] };
}
