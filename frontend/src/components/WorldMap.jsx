import { useMemo, useState } from 'react';
import { generateWorldDots, project } from '../utils/worldDots';
import { useAppStore } from '../store/useAppStore';
import { CHOKEPOINTS } from '../data/cables';

const WIDTH = 960;
const HEIGHT = 480;

export default function WorldMap() {
  const cables = useAppStore((s) => s.cables);
  const selectedCableId = useAppStore((s) => s.selectedCableId);
  const selectCable = useAppStore((s) => s.selectCable);
  const result = useAppStore((s) => s.result);
  const isSimulating = useAppStore((s) => s.isSimulating);

  const [hoveredCableId, setHoveredCableId] = useState(null);

  const dots = useMemo(() => generateWorldDots(2.4).map((d) => project(d, WIDTH, HEIGHT)), []);

  const isRuptured = (cableId) => result?.cable?.id === cableId;

  const detourPoints = useMemo(() => [
    [80.0, 6.0], [56.3, 10.0], [39.2, -6.8], [18.4, -33.9], [-15.0, -10.0], [-17.0, 15.0], [-9.1, 38.7]
  ].map(wp => project(wp, WIDTH, HEIGHT)), []);

  const detourPathD = useMemo(() => detourPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' '), [detourPoints]);

  const showAlternateRoute = result && !isSimulating && (result.cable?.id === 'suez' || result.chokepoints?.includes('Canal de Suez') || result.chokepoints?.includes('Suez / Mar Rojo'));

  return (
    <div className="relative w-full h-full overflow-hidden rounded-lg border border-line bg-panel">
      {/* Scanline ambient effect */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, #2DD4BF 0px, transparent 1px, transparent 3px)',
        }}
      />

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="oceanGlow" cx="50%" cy="45%" r="70%">
            <stop offset="0%" stopColor="#152238" />
            <stop offset="100%" stopColor="#0A1120" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="blur" />
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
              animation: dash 5s linear infinite;
            }
          `}</style>
        </defs>

        <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="url(#oceanGlow)" />

        {/* Latitude/longitude grid — command-center feel */}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`lat-${i}`} x1="0" x2={WIDTH} y1={(HEIGHT / 6) * i} y2={(HEIGHT / 6) * i}
            stroke="#22334E" strokeWidth="0.5" opacity="0.5" />
        ))}
        {Array.from({ length: 13 }).map((_, i) => (
          <line key={`lon-${i}`} y1="0" y2={HEIGHT} x1={(WIDTH / 12) * i} x2={(WIDTH / 12) * i}
            stroke="#22334E" strokeWidth="0.5" opacity="0.5" />
        ))}

        {/* Continentes — dot matrix */}
        {dots.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="0.9" fill="#2B3B58" />
        ))}

        {/* Cables submarinos */}
        {cables.map((cable) => {
          const points = cable.waypoints.map((wp) => project(wp, WIDTH, HEIGHT));
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
          const ruptured = isRuptured(cable.id);
          const selected = selectedCableId === cable.id;
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
                onClick={() => selectCable(cable.id)}
                onMouseEnter={() => setHoveredCableId(cable.id)}
                onMouseLeave={() => setHoveredCableId(null)}
              />
              {/* Línea visible */}
              <path
                d={pathD}
                fill="none"
                stroke={ruptured ? '#FB923C' : active ? '#5EEAD4' : '#2DD4BF'}
                strokeWidth={active || ruptured ? 1.8 : 1}
                strokeOpacity={active || ruptured ? 0.95 : 0.35}
                strokeDasharray={ruptured ? '4 3' : undefined}
                filter={active || ruptured ? 'url(#glow)' : undefined}
                style={{ transition: 'stroke 0.3s, stroke-opacity 0.3s, stroke-width 0.3s' }}
                className="pointer-events-none"
              />
              {/* Punto de ruptura simulada */}
              {ruptured && !isSimulating && (
                <g transform={`translate(${points[Math.floor(points.length / 2)][0]}, ${points[Math.floor(points.length / 2)][1]})`}>
                  <circle r="4" fill="#FB923C" filter="url(#glow)" />
                  <circle r="4" fill="none" stroke="#FB923C" strokeWidth="1.5" className="animate-pulse-ring" />
                  <circle r="4" fill="none" stroke="#FB923C" strokeWidth="1.5" className="animate-pulse-ring" style={{ animationDelay: '0.6s' }} />
                </g>
              )}
            </g>
          );
        })}

        {/* Marcadores de landing points para el cable seleccionado */}
        {selectedCableId && cables.find((c) => c.id === selectedCableId)?.waypoints.map((wp, i) => {
          const [x, y] = project(wp, WIDTH, HEIGHT);
          return <circle key={i} cx={x} cy={y} r="2.2" fill="#5EEAD4" className="pointer-events-none" />;
        })}

        {/* Chokepoints Marítimos Clave */}
        {Object.entries(CHOKEPOINTS).map(([id, cp]) => {
          const [x, y] = project([cp.lon, cp.lat], WIDTH, HEIGHT);
          const isSelected = selectedCableId === id;
          return (
            <g key={id} className="cursor-pointer" onClick={() => selectCable(id)}>
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="none"
                stroke={isSelected ? '#EF4444' : '#FB7185'}
                strokeWidth="1.5"
                opacity="0.85"
                className="animate-ping"
                style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '3s' }}
              />
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill={isSelected ? '#DC2626' : '#FDA4AF'}
                stroke="#4C0519"
                strokeWidth="1"
                opacity="0.95"
              />
              <text
                x={x + 7}
                y={y + 3}
                fill={isSelected ? '#F43F5E' : '#FDA4AF'}
                fontSize="8"
                fontWeight={isSelected ? 'bold' : 'normal'}
                fontFamily="monospace"
                className="pointer-events-none select-none opacity-80 hover:opacity-100 transition-opacity"
              >
                {cp.label}
              </text>
            </g>
          );
        })}

        {/* Ruta Alternativa Animada */}
        {showAlternateRoute && (
          <g>
            <path
              d={detourPathD}
              fill="none"
              stroke="#10B981"
              strokeWidth="2"
              strokeOpacity="0.85"
              strokeDasharray="6 4"
              className="animate-dash"
              filter="url(#glow)"
            />
            {/* Detour text label along route */}
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

      {/* Leyenda */}
      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-4 font-mono text-[10px] text-ink-muted bg-void/60 backdrop-blur px-3 py-1.5 rounded border border-line">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-signal inline-block" /> Cable activo</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-alert inline-block" /> Ruptura simulada</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FDA4AF] inline-block border border-[#4C0519]" /> Chokepoint clave</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" /> Ruta alternativa</span>
      </div>
    </div>
  );
}
