import { useMemo, useState } from 'react';
import { generateWorldDots, project } from '../utils/worldDots';
import { useAppStore } from '../store/useAppStore';
import { CHOKEPOINTS } from '../data/cables';

const WIDTH = 960;
const HEIGHT = 480;

// Corredores de Oleoductos / Gasoductos / Tuberías globales
const PIPELINES = [
  {
    id: 'sumed-pipeline',
    name: 'Sumed Pipeline (Egipto / Mar Rojo)',
    type: 'pipeline',
    category: 'Petróleo crudo',
    waypoints: [[33.8, 27.5], [32.5, 29.9], [29.9, 31.2]],
    capacity: '2.5M bpd',
    status: 'active'
  },
  {
    id: 'druzhba-pipeline',
    name: 'Oleoducto Druzhba (Eurasia -> Europa)',
    type: 'pipeline',
    category: 'Petróleo crudo',
    waypoints: [[53.2, 53.2], [37.6, 55.7], [21.0, 52.2], [13.4, 52.5]],
    capacity: '1.4M bpd',
    status: 'active'
  },
  {
    id: 'tanap-pipeline',
    name: 'TANAP / Gasoducto Transanatoliano',
    type: 'pipeline',
    category: 'Gas Natural',
    waypoints: [[49.8, 40.4], [39.9, 39.9], [26.6, 40.8], [19.9, 40.7]],
    capacity: '16 BCM/año',
    status: 'active'
  },
  {
    id: 'baltic-corridor',
    name: 'Corredor Báltico / Nord Stream',
    type: 'pipeline',
    category: 'Gas Natural',
    waypoints: [[28.0, 59.4], [19.0, 56.5], [13.6, 54.1]],
    capacity: '55 BCM/año',
    status: 'degraded'
  },
  {
    id: 'eastmed-corridor',
    name: 'Corredor Energético Mediterráneo Este',
    type: 'pipeline',
    category: 'Gas / Petróleo',
    waypoints: [[34.8, 31.8], [33.0, 34.6], [25.0, 35.0], [23.6, 37.9]],
    capacity: '10 BCM/año',
    status: 'active'
  }
];

export default function WorldMap() {
  const cables = useAppStore((s) => s.cables);
  const selectedCableId = useAppStore((s) => s.selectedCableId);
  const selectCable = useAppStore((s) => s.selectCable);
  const result = useAppStore((s) => s.result);
  const isSimulating = useAppStore((s) => s.isSimulating);

  const [hoveredCableId, setHoveredCableId] = useState(null);
  const [hoveredChokepointId, setHoveredChokepointId] = useState(null);
  const [hoveredPipelineId, setHoveredPipelineId] = useState(null);

  // Controles dinámicos de capas de mapa
  const [showFlowAnimation, setShowFlowAnimation] = useState(true);
  const [showPipelines, setShowPipelines] = useState(true);
  const [showRadar, setShowRadar] = useState(true);

  const dots = useMemo(() => generateWorldDots(2.4).map((d) => project(d, WIDTH, HEIGHT)), []);

  const selectedCableIds = useMemo(() => {
    return selectedCableId ? String(selectedCableId).split(',').map(x => x.trim()).filter(Boolean) : [];
  }, [selectedCableId]);

  const isCableSelected = (id) => selectedCableIds.includes(id);

  const isRuptured = (cableId) => {
    const rupturedIds = result?.cable?.id ? String(result.cable.id).split(',').map(x => x.trim()) : [];
    return rupturedIds.includes(cableId);
  };

  const detourPoints = useMemo(() => [
    [80.0, 6.0], [56.3, 10.0], [39.2, -6.8], [18.4, -33.9], [-15.0, -10.0], [-17.0, 15.0], [-9.1, 38.7]
  ].map(wp => project(wp, WIDTH, HEIGHT)), []);

  const detourPathD = useMemo(() => detourPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' '), [detourPoints]);

  const showAlternateRoute = result && !isSimulating && (result.cable?.id === 'suez' || result.chokepoints?.includes('Canal de Suez') || result.chokepoints?.includes('Suez / Mar Rojo'));

  // Centro del radar (Canal de Suez)
  const radarCenter = useMemo(() => project([32.5, 29.9], WIDTH, HEIGHT), []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border border-line bg-panel">
      {/* Scanline ambient effect */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #2DD4BF 0px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Controles de Capas Dinámicas (Top-Right Overlay) */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 bg-void/80 backdrop-blur px-3 py-1.5 rounded border border-line text-[10px] font-mono select-none">
        <button
          onClick={() => setShowFlowAnimation(!showFlowAnimation)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showFlowAnimation ? 'bg-signal/20 text-signal border border-signal/40' : 'text-ink-muted hover:text-ink'}`}
          title="Activar/Desactivar partículas animadas de flujo en vivo"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showFlowAnimation ? 'bg-signal animate-ping' : 'bg-ink-dim'}`} />
          ⚡ Flujo en vivo
        </button>
        <button
          onClick={() => setShowPipelines(!showPipelines)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showPipelines ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-ink-muted hover:text-ink'}`}
          title="Mostrar/Ocultar Tuberías y Oleoductos de Energía"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showPipelines ? 'bg-amber-400' : 'bg-ink-dim'}`} />
          🛢️ Tuberías
        </button>
        <button
          onClick={() => setShowRadar(!showRadar)}
          className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors ${showRadar ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'text-ink-muted hover:text-ink'}`}
          title="Activar/Desactivar radar táctico de tráfico"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${showRadar ? 'bg-sky-400' : 'bg-ink-dim'}`} />
          🛰️ Radar
        </button>
      </div>

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stopColor="#0B1326" />
            <stop offset="100%" stopColor="#050814" />
          </radialGradient>
          
          <radialGradient id="radarSector" cx="0%" cy="0%" r="100%">
            <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.0" />
          </radialGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="glowStrong" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="landGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <style>{`
            @keyframes dash {
              to {
                stroke-dashoffset: -40;
              }
            }
            .animate-dash {
              animation: dash 4s linear infinite;
            }
            @keyframes pulseRing {
              0% { r: 3px; opacity: 0.9; }
              100% { r: 18px; opacity: 0; }
            }
            .animate-pulse-ring-fast {
              animation: pulseRing 1.8s cubic-bezier(0, 0.2, 0.8, 1) infinite;
            }
          `}</style>
        </defs>

        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#oceanGlow)" />

        {/* Latitude/longitude grid — command-center feel */}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`lat-${i}`} x1="0" x2={WIDTH} y1={(HEIGHT / 6) * i} y2={(HEIGHT / 6) * i}
            stroke="#1B2A40" strokeWidth="0.5" opacity="0.35" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`lon-${i}`} y1="0" y2={HEIGHT} x1={(WIDTH / 12) * i} x2={(WIDTH / 12) * i}
            stroke="#1B2A40" strokeWidth="0.5" opacity="0.35" />
        ))}

        {/* Continentes — Matriz de puntos de alto contraste con silueta definida */}
        <g id="continents-matrix" filter="url(#landGlow)">
          {dots.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.2" fill="#3B5478" opacity="0.95" />
          ))}
        </g>

        {/* Radar Táctico sobre Chokepoint Crítico (Suez) */}
        {showRadar && (
          <g transform={`translate(${radarCenter[0]}, ${radarCenter[1]})`} className="pointer-events-none select-none">
            <circle r="55" fill="none" stroke="#2DD4BF" strokeWidth="0.4" strokeDasharray="3 3" opacity="0.35" />
            <circle r="35" fill="none" stroke="#2DD4BF" strokeWidth="0.4" opacity="0.25" />
            <circle r="18" fill="none" stroke="#2DD4BF" strokeWidth="0.4" opacity="0.2" />
            <line x1="-60" y1="0" x2="60" y2="0" stroke="#2DD4BF" strokeWidth="0.3" opacity="0.3" />
            <line x1="0" y1="-60" x2="0" y2="60" stroke="#2DD4BF" strokeWidth="0.3" opacity="0.3" />
            
            {/* Sector giratorio de radar */}
            <g>
              <path d="M 0 0 L 55 0 A 55 55 0 0 1 0 55 Z" fill="url(#radarSector)">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="4s"
                  repeatCount="indefinite"
                />
              </path>
            </g>
          </g>
        )}

        {/* Capa de Oleoductos / Gasoductos / Tuberías */}
        {showPipelines && PIPELINES.map((pipeline, idx) => {
          const points = pipeline.waypoints.map((wp) => project(wp, WIDTH, HEIGHT));
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
          const hovered = hoveredPipelineId === pipeline.id;

          return (
            <g key={pipeline.id}>
              {/* Click target invisible */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="10"
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPipelineId(pipeline.id)}
                onMouseLeave={() => setHoveredPipelineId(null)}
              />
              {/* Línea de Tubería (Amber/Gold) */}
              <path
                d={pathD}
                fill="none"
                stroke={hovered ? '#FBBF24' : '#F59E0B'}
                strokeWidth={hovered ? 2.2 : 1.4}
                strokeOpacity={hovered ? 0.95 : 0.65}
                strokeDasharray="4 2"
                filter={hovered ? 'url(#glow)' : undefined}
                style={{ transition: 'all 0.3s' }}
              />

              {/* Partícula animada de flujo de energía */}
              {showFlowAnimation && (
                <circle r="2.2" fill="#FBBF24" filter="url(#glow)">
                  <animateMotion
                    dur={`${4.5 + (idx % 3)}s`}
                    repeatCount="indefinite"
                    path={pathD}
                  />
                </circle>
              )}

              {/* Tooltip de Tubería */}
              {hovered && (
                <g className="pointer-events-none" style={{ zIndex: 95 }}>
                  <rect
                    x={points[Math.floor(points.length / 2)][0] - 65}
                    y={points[Math.floor(points.length / 2)][1] - 28}
                    width="130"
                    height="24"
                    fill="#111827"
                    stroke="#F59E0B"
                    strokeWidth="0.5"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={points[Math.floor(points.length / 2)][0]}
                    y={points[Math.floor(points.length / 2)][1] - 17}
                    fill="#FDE68A"
                    fontSize="7.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    🛢️ {pipeline.name}
                  </text>
                  <text
                    x={points[Math.floor(points.length / 2)][0]}
                    y={points[Math.floor(points.length / 2)][1] - 8}
                    fill="#F59E0B"
                    fontSize="6.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pipeline.category} · Capacidad: {pipeline.capacity}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Cables submarinos de telecomunicaciones */}
        {cables.map((cable, idx) => {
          const points = cable.waypoints.map((wp) => project(wp, WIDTH, HEIGHT));
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
          const ruptured = isRuptured(cable.id);
          const selected = isCableSelected(cable.id);
          const hovered = hoveredCableId === cable.id;
          const active = selected || hovered;

          return (
            <g key={cable.id}>
              {/* Click target invisible más grueso */}
              <path
                d={pathD}
                fill="none"
                stroke="transparent"
                strokeWidth="12"
                className="cursor-pointer"
                onClick={(event) => {
                  const currentIds = selectedCableId ? String(selectedCableId).split(',').map(x => x.trim()).filter(Boolean) : [];
                  if (event.shiftKey || event.ctrlKey || event.metaKey) {
                    if (currentIds.includes(cable.id)) {
                      selectCable(currentIds.filter(x => x !== cable.id).join(',') || null);
                    } else {
                      selectCable([...currentIds, cable.id].join(','));
                    }
                  } else {
                    selectCable(cable.id);
                  }
                }}
                onMouseEnter={() => setHoveredCableId(cable.id)}
                onMouseLeave={() => setHoveredCableId(null)}
              />
              {/* Línea visible */}
              <path
                d={pathD}
                fill="none"
                stroke={ruptured ? '#FB923C' : active ? '#38BDF8' : '#2DD4BF'}
                strokeWidth={active || ruptured ? 2 : 1.1}
                strokeOpacity={active || ruptured ? 0.95 : 0.4}
                strokeDasharray={ruptured ? '4 3' : undefined}
                filter={active || ruptured ? 'url(#glow)' : undefined}
                style={{ transition: 'stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s' }}
                className="pointer-events-none"
              />

              {/* Partículas animadas de paquetes de datos en flujo constante */}
              {showFlowAnimation && !ruptured && (
                <g className="pointer-events-none">
                  <circle r={active ? 2.8 : 2} fill={active ? '#38BDF8' : '#2DD4BF'} filter="url(#glow)">
                    <animateMotion
                      dur={`${5.5 + (idx % 4)}s`}
                      repeatCount="indefinite"
                      path={pathD}
                    />
                  </circle>
                  {/* Segunda partícula desfasada */}
                  <circle r="1.5" fill="#7DD3FC" opacity="0.75">
                    <animateMotion
                      dur={`${5.5 + (idx % 4)}s`}
                      begin={`${2 + (idx % 2)}s`}
                      repeatCount="indefinite"
                      path={pathD}
                    />
                  </circle>
                </g>
              )}

              {/* Punto de ruptura simulada */}
              {ruptured && !isSimulating && (
                <g transform={`translate(${points[Math.floor(points.length / 2)][0]}, ${points[Math.floor(points.length / 2)][1]})`}>
                  <circle r="5" fill="#FB923C" filter="url(#glowStrong)" />
                  <circle r="5" fill="none" stroke="#FB923C" strokeWidth="1.8" className="animate-pulse-ring-fast" />
                  <circle r="5" fill="none" stroke="#FB923C" strokeWidth="1.8" className="animate-pulse-ring-fast" style={{ animationDelay: '0.6s' }} />
                </g>
              )}

              {/* Tooltip táctico del cable al pasar el cursor */}
              {hovered && !ruptured && (
                <g className="pointer-events-none" style={{ zIndex: 90 }}>
                  <rect
                    x={points[Math.floor(points.length / 2)][0] - 60}
                    y={points[Math.floor(points.length / 2)][1] - 28}
                    width="120"
                    height="24"
                    fill="#0A1120"
                    stroke="#38BDF8"
                    strokeWidth="0.5"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={points[Math.floor(points.length / 2)][0]}
                    y={points[Math.floor(points.length / 2)][1] - 17}
                    fill="#E7ECF5"
                    fontSize="7.5"
                    fontWeight="bold"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    📡 {cable.name}
                  </text>
                  <text
                    x={points[Math.floor(points.length / 2)][0]}
                    y={points[Math.floor(points.length / 2)][1] - 8}
                    fill="#38BDF8"
                    fontSize="6.5"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Criticidad: {cable.criticality} · Landings: {cable.landings}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Marcadores de landing points para el cable seleccionado */}
        {selectedCableId && cables.find((c) => c.id === selectedCableId)?.waypoints.map((wp, i) => {
          const [x, y] = project(wp, WIDTH, HEIGHT);
          return (
            <g key={i} className="pointer-events-none">
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="1"
                className="animate-ping"
                style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '1.8s' }}
                opacity="0.75"
              />
              <circle cx={x} cy={y} r="2.5" fill="#38BDF8" />
            </g>
          );
        })}

        {/* Chokepoints Marítimos Clave */}
        {Object.entries(CHOKEPOINTS).map(([id, cp]) => {
          const [x, y] = project([cp.lon, cp.lat], WIDTH, HEIGHT);
          const isSelected = isCableSelected(id);
          const isHovered = hoveredChokepointId === id;
          return (
            <g
              key={id}
              className="cursor-pointer"
              onClick={(event) => {
                const currentIds = selectedCableId ? String(selectedCableId).split(',').map(x => x.trim()).filter(Boolean) : [];
                if (event.shiftKey || event.ctrlKey || event.metaKey) {
                  if (currentIds.includes(id)) {
                    selectCable(currentIds.filter(x => x !== id).join(',') || null);
                  } else {
                    selectCable([...currentIds, id].join(','));
                  }
                } else {
                  selectCable(id);
                }
              }}
              onMouseEnter={() => setHoveredChokepointId(id)}
              onMouseLeave={() => setHoveredChokepointId(null)}
            >
              <circle
                cx={x}
                cy={y}
                r="8"
                fill="none"
                stroke={isSelected ? '#EF4444' : '#FB7185'}
                strokeWidth="1.5"
                opacity="0.85"
                className="animate-ping"
                style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '2.5s' }}
              />
              <circle
                cx={x}
                cy={y}
                r="4.8"
                fill={isSelected ? '#DC2626' : '#FDA4AF'}
                stroke="#4C0519"
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x={x + 8}
                y={y + 3}
                fill={isSelected ? '#F43F5E' : '#FDA4AF'}
                fontSize="8"
                fontWeight={isSelected || isHovered ? 'bold' : 'normal'}
                fontFamily="monospace"
                className="pointer-events-none select-none opacity-85 hover:opacity-100 transition-opacity"
              >
                {cp.label}
              </text>
              {/* Tooltip táctico de exposición */}
              {isHovered && (
                <g className="pointer-events-none" style={{ zIndex: 100 }}>
                  <rect
                    x={x + 8}
                    y={y - 22}
                    width="145"
                    height="18"
                    fill="#101B2E"
                    stroke="#FDA4AF"
                    strokeWidth="0.5"
                    rx="3"
                    opacity="0.95"
                  />
                  <text
                    x={x + 13}
                    y={y - 10}
                    fill="#FDA4AF"
                    fontSize="7"
                    fontFamily="monospace"
                  >
                    Exposición: {cp.globalShare}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Ruta Alternativa Animada con Partículas de Flujo Marítimo */}
        {showAlternateRoute && (
          <g>
            <path
              d={detourPathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.2"
              strokeOpacity="0.9"
              strokeDasharray="6 4"
              className="animate-dash"
              filter="url(#glow)"
            />

            {/* Buques / Flujo de desvío animado */}
            {showFlowAnimation && (
              <circle r="3" fill="#34D399" filter="url(#glow)">
                <animateMotion
                  dur="7s"
                  repeatCount="indefinite"
                  path={detourPathD}
                />
              </circle>
            )}

            {/* Etiqueta de ruta alternativa */}
            <rect
              x={detourPoints[3][0] - 65}
              y={detourPoints[3][1] - 25}
              width="130"
              height="16"
              fill="#0A1120"
              stroke="#10B981"
              strokeWidth="0.5"
              rx="3"
              opacity="0.9"
            />
            <text
              x={detourPoints[3][0]}
              y={detourPoints[3][1] - 14}
              fill="#34D399"
              fontSize="7"
              fontWeight="bold"
              fontFamily="monospace"
              textAnchor="middle"
              className="pointer-events-none select-none"
            >
              DESVÍO CABO BUENA ESPERANZA
            </text>
          </g>
        )}
      </svg>

      {/* Overlay de estado de simulación */}
      {isSimulating && (
        <div className="absolute inset-0 flex items-center justify-center bg-void/40 backdrop-blur-[1px]">
          <div className="font-mono text-sm text-signal tracking-widest animate-pulse">
            CALCULANDO PROPAGACIÓN DE IMPACTO...
          </div>
        </div>
      )}

      {/* Leyenda Dinámica */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-3.5 font-mono text-[10px] text-ink-muted bg-void/70 backdrop-blur px-3 py-1.5 rounded border border-line">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-signal inline-block" /> Cables de fibra</span>
        {showPipelines && (
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Tuberías / Oleoductos</span>
        )}
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-alert inline-block" /> Ruptura simulada</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FDA4AF] inline-block border border-[#4C0519]" /> Chokepoint clave</span>
        {showAlternateRoute && (
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" /> Ruta alternativa</span>
        )}
      </div>
    </div>
  );
}
