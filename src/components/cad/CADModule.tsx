import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { useProjectStore } from '../../store/projectStore';
import type { CADSegment, CADSymbol, CADPoint, LineType } from '../../types';
import { detectConcurrentPipes, bracketPipeCount, getTrellisBracketCode, getRacmetBracketCode } from '../../utils/calculations';

const ZONE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

const LINE_COLORS: Record<LineType, string> = {
  pipe: '#0EA5E9',
  cable_cysy: '#F97316',
  cable_ftp: '#22C55E',
};
const LINE_WIDTH: Record<LineType, number> = {
  pipe: 3,
  cable_cysy: 2,
  cable_ftp: 1.5,
};
const LINE_DASH: Record<LineType, number[]> = {
  pipe: [],
  cable_cysy: [12, 6],
  cable_ftp: [4, 4, 1, 4],
};

const SNAP_RADIUS = 12;
const GRID_SIZE = 0.25;
const GUIDE_SNAP_THRESHOLD = 5;

interface CADModuleProps {
  activeZoneIndex: number;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: CADPoint | null;
  currentPoint: CADPoint | null;
}

interface HistoryEntry {
  segments: CADSegment[];
  symbols: CADSymbol[];
}

interface GuideLine { x1: number; y1: number; x2: number; y2: number; }

type Tool = 'select' | 'pipe' | 'cable_cysy' | 'cable_ftp' | 'drain_magnet' | 'sensor' | 'pump' | 'pan';
type SelectedType = 'segment' | 'symbol' | null;

export function CADModule({ activeZoneIndex }: CADModuleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenRef = useRef<HTMLDivElement>(null);

  const {
    cad, addSegment, removeSegment, addSymbol, removeSymbol,
    setCADData, updateCADZonePosition, markDrawingComplete, zones,
    zoneCalcs, toggleCADZoneLock,
  } = useProjectStore();

  const [tool, setTool] = useState<Tool>('pipe');
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1200, h: 700 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ mx: number; my: number; vx: number; vy: number } | null>(null);
  const [drawing, setDrawing] = useState<DrawingState>({ isDrawing: false, startPoint: null, currentPoint: null });
  const [snapPoint, setSnapPoint] = useState<CADPoint | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<SelectedType>(null);
  const [ghostLine, setGhostLine] = useState<{ start: CADPoint; end: CADPoint } | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const [draggingZone, setDraggingZone] = useState<{ index: number; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [floatLabel, setFloatLabel] = useState<{ x: number; y: number; text: string } | null>(null);
  const [guideLines, setGuideLines] = useState<GuideLine[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scale = cad.scale || 8;

  useEffect(() => {
    const vis: Record<string, boolean> = {};
    zones.forEach((_, i) => {
      vis[`zone_${i}`] = true;
      vis[`zone_${i}_pipe`] = true;
      vis[`zone_${i}_cable_cysy`] = true;
      vis[`zone_${i}_cable_ftp`] = true;
    });
    setLayerVisibility(vis);
  }, [zones.length]);

  const getSVGPoint = useCallback((e: React.MouseEvent): CADPoint => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgPt = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: svgPt.x, y: svgPt.y };
  }, []);

  const snapToGrid = useCallback((p: CADPoint): CADPoint => {
    const g = GRID_SIZE * scale;
    return {
      x: Math.round(p.x / g) * g,
      y: Math.round(p.y / g) * g,
    };
  }, [scale]);

  const findSnapPoint = useCallback((p: CADPoint): CADPoint | null => {
    for (const seg of cad.segments) {
      for (const pt of [seg.start, seg.end]) {
        if (Math.hypot(pt.x - p.x, pt.y - p.y) < SNAP_RADIUS) return pt;
      }
    }
    for (const zone of cad.zones) {
      const corners = [
        { x: zone.x, y: zone.y },
        { x: zone.x + zone.width, y: zone.y },
        { x: zone.x, y: zone.y + zone.height },
        { x: zone.x + zone.width, y: zone.y + zone.height },
      ];
      for (const c of corners) {
        if (Math.hypot(c.x - p.x, c.y - p.y) < SNAP_RADIUS) return c;
      }
    }
    return null;
  }, [cad.segments, cad.zones]);

  const applyOrtho = useCallback((start: CADPoint, end: CADPoint): CADPoint => {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    return dx >= dy ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
  }, []);

  const zoneOverlaps = useCallback((zoneIndex: number, x: number, y: number, w: number, h: number): boolean => {
    const PAD = 4;
    for (const z of cad.zones) {
      if (z.zoneIndex === zoneIndex) continue;
      if (
        x < z.x + z.width + PAD &&
        x + w + PAD > z.x &&
        y < z.y + z.height + PAD &&
        y + h + PAD > z.y
      ) return true;
    }
    return false;
  }, [cad.zones]);

  const pushHistory = useCallback(() => {
    setHistory((h) => [...h.slice(-29), { segments: [...cad.segments], symbols: [...cad.symbols] }]);
  }, [cad.segments, cad.symbols]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rawPt = getSVGPoint(e);

    if (isPanning && panStart) {
      const dx = rawPt.x - panStart.mx;
      const dy = rawPt.y - panStart.my;
      setViewBox((v) => ({ ...v, x: panStart.vx - dx, y: panStart.vy - dy }));
      return;
    }

    if (draggingZone) {
      const dx = rawPt.x - draggingZone.startX;
      const dy = rawPt.y - draggingZone.startY;
      let newX = draggingZone.origX + dx;
      let newY = draggingZone.origY + dy;
      const cadZone = cad.zones.find((z) => z.zoneIndex === draggingZone.index);
      const guides: GuideLine[] = [];

      if (cadZone) {
        for (const other of cad.zones) {
          if (other.zoneIndex === draggingZone.index) continue;

          const dragEdgesX = [newX, newX + cadZone.width, newX + cadZone.width / 2];
          const otherEdgesX = [other.x, other.x + other.width, other.x + other.width / 2];
          for (const de of dragEdgesX) {
            for (const oe of otherEdgesX) {
              if (Math.abs(de - oe) < GUIDE_SNAP_THRESHOLD) {
                newX += oe - de;
                guides.push({ x1: oe, y1: -5000, x2: oe, y2: 5000 });
              }
            }
          }

          const dragEdgesY = [newY, newY + cadZone.height, newY + cadZone.height / 2];
          const otherEdgesY = [other.y, other.y + other.height, other.y + other.height / 2];
          for (const de of dragEdgesY) {
            for (const oe of otherEdgesY) {
              if (Math.abs(de - oe) < GUIDE_SNAP_THRESHOLD) {
                newY += oe - de;
                guides.push({ x1: -5000, y1: oe, x2: 5000, y2: oe });
              }
            }
          }
        }

        if (!zoneOverlaps(draggingZone.index, newX, newY, cadZone.width, cadZone.height)) {
          updateCADZonePosition(draggingZone.index, newX, newY);
        }
      }

      setGuideLines(guides);
      return;
    }

    const snap = findSnapPoint(rawPt);
    setSnapPoint(snap);

    if (drawing.isDrawing && drawing.startPoint) {
      const rawEnd = snap ?? snapToGrid(rawPt);
      const orthoEnd = applyOrtho(drawing.startPoint, rawEnd);
      setGhostLine({ start: drawing.startPoint, end: orthoEnd });

      const dx = orthoEnd.x - drawing.startPoint.x;
      const dy = orthoEnd.y - drawing.startPoint.y;
      const lenM = Math.sqrt(dx * dx + dy * dy) / scale;
      setFloatLabel({ x: orthoEnd.x + 12, y: orthoEnd.y - 8, text: `${lenM.toFixed(1)} m` });
    }
  }, [isPanning, panStart, draggingZone, drawing, findSnapPoint, snapToGrid, applyOrtho, scale, getSVGPoint, updateCADZonePosition, zoneOverlaps, cad.zones]);

  const stopDrawing = useCallback(() => {
    setDrawing({ isDrawing: false, startPoint: null, currentPoint: null });
    setGhostLine(null);
    setFloatLabel(null);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      const rawPt = getSVGPoint(e);
      setPanStart({ mx: rawPt.x, my: rawPt.y, vx: viewBox.x, vy: viewBox.y });
      return;
    }

    if (tool === 'select') {
      setSelectedId(null);
      setSelectedType(null);
      return;
    }

    const rawPt = getSVGPoint(e);
    const snapPt = findSnapPoint(rawPt) ?? snapToGrid(rawPt);

    if (['pipe', 'cable_cysy', 'cable_ftp'].includes(tool)) {
      if (!drawing.isDrawing) {
        pushHistory();
        setDrawing({ isDrawing: true, startPoint: snapPt, currentPoint: snapPt });
      } else if (drawing.startPoint) {
        const end = applyOrtho(drawing.startPoint, findSnapPoint(rawPt) ?? snapToGrid(rawPt));
        const len = Math.hypot(end.x - drawing.startPoint.x, end.y - drawing.startPoint.y);
        if (len < 1) { stopDrawing(); return; }
        const seg: CADSegment = {
          id: crypto.randomUUID(),
          zoneIndex: activeZoneIndex,
          lineType: tool as LineType,
          start: drawing.startPoint,
          end,
        };
        addSegment(seg);
        markDrawingComplete(activeZoneIndex, true);
        setDrawing({ isDrawing: true, startPoint: end, currentPoint: end });
        setGhostLine(null);
      }
    } else if (['drain_magnet', 'sensor', 'pump'].includes(tool)) {
      pushHistory();
      const sym: CADSymbol = {
        id: crypto.randomUUID(),
        type: tool as 'drain_magnet' | 'sensor' | 'pump',
        x: snapPt.x,
        y: snapPt.y,
        zoneIndex: activeZoneIndex,
      };
      addSymbol(sym);
    }
  }, [tool, getSVGPoint, viewBox, findSnapPoint, snapToGrid, drawing, applyOrtho, activeZoneIndex, addSegment, addSymbol, markDrawingComplete, pushHistory, stopDrawing]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setPanStart(null);
    setDraggingZone(null);
    setGuideLines([]);
  }, []);

  const handleDoubleClick = useCallback(() => {
    if (drawing.isDrawing) stopDrawing();
  }, [drawing.isDrawing, stopDrawing]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    if (selectedType === 'segment') {
      pushHistory();
      removeSegment(selectedId);
    } else if (selectedType === 'symbol') {
      pushHistory();
      removeSymbol(selectedId);
    }
    setSelectedId(null);
    setSelectedType(null);
  }, [selectedId, selectedType, removeSegment, removeSymbol, pushHistory]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

    if (e.key === 'Escape') stopDrawing();

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      const prev = history[history.length - 1];
      if (prev) {
        setHistory((h) => h.slice(0, -1));
        setCADData(prev.segments, prev.symbols);
      }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (selectedId) deleteSelected();
    }
  }, [history, selectedId, stopDrawing, deleteSelected, setCADData]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.1 : 0.9;
    setViewBox((v) => ({
      ...v,
      w: Math.max(200, Math.min(5000, v.w * factor)),
      h: Math.max(200, Math.min(3000, v.h * factor)),
    }));
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.addEventListener('wheel', handleWheel, { passive: false });
    return () => svg.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  useEffect(() => {
    const handleFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      fullscreenRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const fitToView = useCallback(() => {
    if (cad.zones.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const z of cad.zones) {
      minX = Math.min(minX, z.x);
      minY = Math.min(minY, z.y);
      maxX = Math.max(maxX, z.x + z.width);
      maxY = Math.max(maxY, z.y + z.height);
    }
    const pad = 60;
    setViewBox({ x: minX - pad, y: minY - pad, w: maxX - minX + pad * 2, h: maxY - minY + pad * 2 });
  }, [cad.zones]);

  const pipeLength = cad.segments
    .filter((s) => s.zoneIndex === activeZoneIndex && s.lineType === 'pipe')
    .reduce((sum, s) => {
      const dx = s.end.x - s.start.x;
      const dy = s.end.y - s.start.y;
      return sum + Math.sqrt(dx * dx + dy * dy) / scale;
    }, 0);

  const isLayerVisible = (zoneIndex: number, type?: LineType) => {
    if (!layerVisibility[`zone_${zoneIndex}`]) return false;
    if (type && layerVisibility[`zone_${zoneIndex}_${type}`] === false) return false;
    return true;
  };

  const toggleLayer = (key: string) => {
    setLayerVisibility((v) => ({ ...v, [key]: !v[key] }));
  };

  const selectElement = (id: string, type: SelectedType, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tool === 'select') {
      setSelectedId(id === selectedId ? null : id);
      setSelectedType(id === selectedId ? null : type);
    }
  };

  const hasSelection = selectedId !== null;

  const dilationPoints = zoneCalcs[activeZoneIndex]?.dilationPoints ?? [];

  const concurrentIntervals = useMemo(() => detectConcurrentPipes(cad).intervals, [cad]);

  return (
    <div ref={fullscreenRef} className="flex gap-3 bg-white" style={{ height: isFullscreen ? '100vh' : '600px' }}>
      {/* Left: Toolbar */}
      <div className="flex flex-col gap-1.5 w-36 flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nástroj</p>
        {([
          { key: 'select', icon: '↖', label: 'Výber' },
          { key: 'pan', icon: '✋', label: 'Pan' },
          { key: 'pipe', icon: '—', label: 'Potrubie' },
          { key: 'cable_cysy', icon: '~', label: 'CYSY kábel' },
          { key: 'cable_ftp', icon: '·', label: 'FTP kábel' },
          { key: 'pump', icon: '⚙', label: 'Čerpadlo' },
          { key: 'drain_magnet', icon: '⊕', label: 'Drain Mag.' },
          { key: 'sensor', icon: '◈', label: 'Snímač' },
        ] as const).map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTool(t.key);
              stopDrawing();
              setSelectedId(null);
              setSelectedType(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              tool === t.key
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <span className="text-base w-5 text-center">{t.icon}</span>
            {t.label}
          </button>
        ))}

        <div className="mt-1 border-t pt-2 flex flex-col gap-1">
          <button
            onClick={fitToView}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            ⊡ Fit to view
          </button>

          <button
            onClick={() => {
              const prev = history[history.length - 1];
              if (prev) {
                setHistory((h) => h.slice(0, -1));
                setCADData(prev.segments, prev.symbols);
              }
            }}
            disabled={history.length === 0}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ↩ Undo ({history.length})
          </button>

          <button
            onClick={deleteSelected}
            disabled={!hasSelection}
            className={`w-full px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              hasSelection
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            🗑 Zmazať
            {hasSelection && (
              <span className="block text-xs opacity-80">
                {selectedType === 'segment' ? 'čiara' : 'symbol'}
              </span>
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            {isFullscreen ? '✕ Ukončiť' : '⛶ Celá obrazovka'}
          </button>
        </div>

        <div className="mt-1 p-2 bg-green-50 rounded-lg border border-green-200 text-xs">
          <p className="font-bold text-green-800">Σ Potrubie</p>
          <p className="text-green-700 font-mono text-base">{pipeLength.toFixed(1)} m</p>
          <p className="text-gray-400 mt-1">Zóna {activeZoneIndex + 1}</p>
          {dilationPoints.length > 0 && (
            <p className="text-amber-600 mt-1 font-semibold">
              🟨 {dilationPoints.length} dilatáci{dilationPoints.length === 1 ? 'a' : 'í'}
            </p>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-1 space-y-0.5 leading-relaxed">
          <p>↖ Výber → klikni prvok</p>
          <p>Del/⌫ = zmazať výber</p>
          <p>Dbl-klik = koniec čiary</p>
          <p>Esc = zrušiť</p>
          <p>Ctrl+Z = undo</p>
          <p>🟨 = dilatácia</p>
        </div>
      </div>

      {/* Center: SVG Canvas */}
      <div
        ref={containerRef}
        className="flex-1 border border-gray-300 rounded-xl overflow-hidden bg-gray-50 relative"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: isPanning ? 'grabbing' : tool === 'pan' ? 'grab' : tool === 'select' ? 'default' : 'crosshair',
          }}
        >
          <defs>
            <pattern id="grid" width={GRID_SIZE * scale} height={GRID_SIZE * scale} patternUnits="userSpaceOnUse">
              <path
                d={`M ${GRID_SIZE * scale} 0 L 0 0 0 ${GRID_SIZE * scale}`}
                fill="none" stroke="#e2e8f0" strokeWidth="0.5"
              />
            </pattern>
            <filter id="labelShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
            </filter>
          </defs>
          <rect x={viewBox.x - 1000} y={viewBox.y - 1000} width={viewBox.w + 2000} height={viewBox.h + 2000} fill="url(#grid)" />

          {/* Zones */}
          {cad.zones.map((zone) => {
            const zoneData = zones[zone.zoneIndex];
            if (!zoneData) return null;
            const color = ZONE_COLORS[zone.zoneIndex % ZONE_COLORS.length];
            const isActive = zone.zoneIndex === activeZoneIndex;
            const isVisible = isLayerVisible(zone.zoneIndex);
            const labelSize = Math.min(20, Math.max(12, Math.round(zone.height / 5)));

            return (
              <g key={zone.zoneIndex} opacity={isVisible ? (isActive ? 1 : 0.4) : 0}>
                <rect
                  x={zone.x} y={zone.y}
                  width={zone.width} height={zone.height}
                  fill={`${color}40`}
                  stroke={color}
                  strokeWidth={isActive ? 2.5 : 1.5}
                  rx={4}
                  style={{
                    cursor: zone.locked
                      ? 'not-allowed'
                      : (tool === 'select' || tool === 'pan') ? 'move' : 'default',
                  }}
                  onMouseDown={(e) => {
                    if ((tool === 'select' || tool === 'pan') && !zone.locked) {
                      e.stopPropagation();
                      setDraggingZone({
                        index: zone.zoneIndex,
                        startX: getSVGPoint(e).x,
                        startY: getSVGPoint(e).y,
                        origX: zone.x,
                        origY: zone.y,
                      });
                    }
                  }}
                />
                {Array.from({ length: zoneData.numNaves - 1 }, (_, ni) => {
                  const naveH = zone.height / zoneData.numNaves;
                  return (
                    <line key={ni}
                      x1={zone.x} y1={zone.y + naveH * (ni + 1)}
                      x2={zone.x + zone.width} y2={zone.y + naveH * (ni + 1)}
                      stroke={color} strokeWidth={0.8} strokeOpacity={0.4}
                    />
                  );
                })}
                <text
                  x={zone.x + zone.width / 2}
                  y={zone.y + zone.height / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={labelSize}
                  fill="white"
                  fontWeight="bold"
                  filter="url(#labelShadow)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {zoneData.name}
                </text>
                {zone.locked && (
                  <text
                    x={zone.x + zone.width / 2}
                    y={zone.y + zone.height / 2 + labelSize + 4}
                    textAnchor="middle"
                    fontSize={14}
                    style={{ pointerEvents: 'none' }}
                  >
                    🔒
                  </text>
                )}
                <text x={zone.x + zone.width / 2} y={zone.y + zone.height + 14}
                  textAnchor="middle" fontSize={9} fill="#9ca3af"
                  style={{ pointerEvents: 'none' }}>
                  {zoneData.length}m
                </text>
                <text x={zone.x - 8} y={zone.y + zone.height / 2}
                  textAnchor="end" fontSize={9} fill="#9ca3af"
                  style={{ pointerEvents: 'none' }}>
                  {(zoneData.width * zoneData.numNaves).toFixed(0)}m
                </text>
              </g>
            );
          })}

          {/* Smart guide lines during drag */}
          {guideLines.map((g, i) => (
            <line
              key={`guide-${i}`}
              x1={g.x1} y1={g.y1} x2={g.x2} y2={g.y2}
              stroke="#ef4444" strokeWidth={1} strokeDasharray="4,2"
              opacity={0.75} style={{ pointerEvents: 'none' }}
            />
          ))}

          {/* Segments */}
          {cad.segments.map((seg) => {
            if (!isLayerVisible(seg.zoneIndex, seg.lineType)) return null;
            const color = LINE_COLORS[seg.lineType];
            const isSelected = seg.id === selectedId;
            const isActiveZone = seg.zoneIndex === activeZoneIndex;
            const dx = seg.end.x - seg.start.x;
            const dy = seg.end.y - seg.start.y;
            const len = Math.sqrt(dx * dx + dy * dy) / scale;
            const mx = (seg.start.x + seg.end.x) / 2;
            const my = (seg.start.y + seg.end.y) / 2;

            return (
              <g key={seg.id}>
                <line
                  x1={seg.start.x} y1={seg.start.y}
                  x2={seg.end.x} y2={seg.end.y}
                  stroke="transparent" strokeWidth={12}
                  style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                  onMouseDown={(e) => selectElement(seg.id, 'segment', e)}
                />
                <line
                  x1={seg.start.x} y1={seg.start.y}
                  x2={seg.end.x} y2={seg.end.y}
                  stroke={isSelected ? '#ef4444' : color}
                  strokeWidth={isSelected ? LINE_WIDTH[seg.lineType] + 2 : LINE_WIDTH[seg.lineType]}
                  strokeDasharray={LINE_DASH[seg.lineType].join(',')}
                  opacity={isActiveZone ? 1 : 0.3}
                  strokeLinecap="round"
                  style={{ pointerEvents: 'none' }}
                />
                {isSelected && (
                  <>
                    <circle cx={seg.start.x} cy={seg.start.y} r={5} fill="#ef4444" />
                    <circle cx={seg.end.x} cy={seg.end.y} r={5} fill="#ef4444" />
                  </>
                )}
                {isActiveZone && len >= 0.5 && (
                  <text x={mx} y={my - 5}
                    textAnchor="middle" fontSize={9} fill={isSelected ? '#ef4444' : color}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}>
                    {len.toFixed(1)}m
                  </text>
                )}
              </g>
            );
          })}

          {/* Symbols */}
          {cad.symbols.map((sym) => {
            const isActive = sym.zoneIndex === activeZoneIndex;
            const isSelected = sym.id === selectedId;
            return (
              <g key={sym.id}
                transform={`translate(${sym.x}, ${sym.y})`}
                opacity={isActive ? 1 : 0.3}
                style={{ cursor: tool === 'select' ? 'pointer' : 'default' }}
                onMouseDown={(e) => selectElement(sym.id, 'symbol', e)}
              >
                {isSelected && <circle r={16} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4,2" />}
                {sym.type === 'pump' && (
                  <>
                    <circle r={10} fill="#fff" stroke={isSelected ? '#ef4444' : '#6b7280'} strokeWidth={1.5} />
                    <text textAnchor="middle" dy="4" fontSize={14} style={{ pointerEvents: 'none' }}>⚙</text>
                  </>
                )}
                {sym.type === 'drain_magnet' && (
                  <>
                    <circle r={8} fill="#fff" stroke={isSelected ? '#ef4444' : '#f59e0b'} strokeWidth={1.5} />
                    <text textAnchor="middle" dy="4" fontSize={12} style={{ pointerEvents: 'none' }}>⊕</text>
                  </>
                )}
                {sym.type === 'sensor' && (
                  <>
                    <rect x={-8} y={-8} width={16} height={16} fill="#fff" stroke={isSelected ? '#ef4444' : '#3b82f6'} strokeWidth={1.5} />
                    <text textAnchor="middle" dy="4" fontSize={12} style={{ pointerEvents: 'none' }}>◈</text>
                  </>
                )}
              </g>
            );
          })}

          {/* Dilation markers */}
          {dilationPoints.map((pt, i) => (
            <g key={`dil-${i}`} style={{ pointerEvents: 'none' }}>
              <rect
                x={pt.x - 5} y={pt.y - 5}
                width={10} height={10}
                fill="#FBBF24" opacity={0.9}
                stroke="#D97706" strokeWidth={1}
                rx={1}
              />
              <title>{pt.type === 'bend' ? 'Dilatácia – zmena smeru' : 'Dilatácia – 80 m'}</title>
            </g>
          ))}

          {/* Concurrent pipe ×N badges */}
          {concurrentIntervals.map((iv, i) => {
            const cx = iv.direction === 'H' ? (iv.start + iv.end) / 2 : iv.axisCoord;
            const cy = iv.direction === 'H' ? iv.axisCoord        : (iv.start + iv.end) / 2;
            const label = `×${iv.count}`;
            const nSlots = bracketPipeCount(iv.count);
            const code   = iv.direction === 'H' ? getRacmetBracketCode(iv.count) : getTrellisBracketCode(iv.count);
            const tip    = `${iv.count} súbežné potrubia → ${iv.direction === 'H' ? 'RACMET' : 'Kratovnica'} ${code} (${nSlots} vedení)`;
            return (
              <g key={`cpipe-${i}`} style={{ pointerEvents: 'none' }}>
                <rect x={cx - 11} y={cy - 17} width={22} height={14} rx={3} fill="#1e40af" opacity={0.88} />
                <text x={cx} y={cy - 7}
                  textAnchor="middle" fontSize={10} fontWeight="bold" fill="white"
                  style={{ userSelect: 'none' }}>
                  {label}
                </text>
                <title>{tip}</title>
              </g>
            );
          })}

          {/* Ghost line while drawing */}
          {ghostLine && (
            <line
              x1={ghostLine.start.x} y1={ghostLine.start.y}
              x2={ghostLine.end.x} y2={ghostLine.end.y}
              stroke={LINE_COLORS[tool as LineType] || '#999'}
              strokeWidth={2}
              strokeDasharray="6,3"
              opacity={0.75}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Snap indicator */}
          {snapPoint && (
            <circle cx={snapPoint.x} cy={snapPoint.y} r={6}
              fill="none" stroke="#fbbf24" strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
          )}

          {/* Floating length label */}
          {floatLabel && (
            <text x={floatLabel.x} y={floatLabel.y}
              fontSize={11} fill="#374151" fontWeight="bold"
              style={{ pointerEvents: 'none' }}>
              {floatLabel.text}
            </text>
          )}
        </svg>

        {drawing.isDrawing && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-full shadow">
            Klikni = ďalší bod  ·  Dbl-klik = koniec  ·  Esc = zrušiť
          </div>
        )}
        {tool === 'select' && !hasSelection && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-blue-700 text-white text-xs px-3 py-1.5 rounded-full shadow">
            Klikni na čiaru alebo symbol pre výber  ·  Del = zmazať
          </div>
        )}
        {hasSelection && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-xs px-4 py-1.5 rounded-full shadow flex items-center gap-2">
            <span>Vybraný prvok</span>
            <button onClick={deleteSelected} className="bg-white text-red-600 font-bold px-2 py-0.5 rounded text-xs hover:bg-red-50">
              🗑 Zmazať
            </button>
            <button onClick={() => { setSelectedId(null); setSelectedType(null); }} className="opacity-60 hover:opacity-100">✕</button>
          </div>
        )}
      </div>

      {/* Right: Layer Panel */}
      <div className="w-44 flex-shrink-0 overflow-y-auto">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Vrstvy</p>
        <button
          onClick={() => {
            const vis: Record<string, boolean> = {};
            zones.forEach((_, i) => {
              vis[`zone_${i}`] = true;
              vis[`zone_${i}_pipe`] = true;
              vis[`zone_${i}_cable_cysy`] = true;
              vis[`zone_${i}_cable_ftp`] = true;
            });
            setLayerVisibility(vis);
          }}
          className="w-full text-xs py-1 mb-3 rounded bg-gray-100 hover:bg-gray-200"
        >
          Zobraziť všetky
        </button>

        {zones.map((zone, i) => {
          const color = ZONE_COLORS[i % ZONE_COLORS.length];
          const zoneVisible = layerVisibility[`zone_${i}`] !== false;
          const cadZoneEntry = cad.zones.find((z) => z.zoneIndex === i);
          const isLocked = cadZoneEntry?.locked ?? false;
          return (
            <div key={i} className="mb-3">
              <div className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold ${
                i === activeZoneIndex ? 'bg-green-50 border border-green-200' : 'hover:bg-gray-50'
              }`}>
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer"
                  style={{ background: color }}
                  onClick={() => toggleLayer(`zone_${i}`)}
                />
                <span
                  className="flex-1 truncate cursor-pointer"
                  onClick={() => toggleLayer(`zone_${i}`)}
                  title={zone.name}
                >
                  {zone.name}
                </span>
                <button
                  onClick={() => toggleLayer(`zone_${i}`)}
                  className="text-sm hover:opacity-70 flex-shrink-0"
                  title={zoneVisible ? 'Skryť' : 'Zobraziť'}
                >
                  {zoneVisible ? '👁' : '🚫'}
                </button>
                <button
                  onClick={() => { if (cadZoneEntry) toggleCADZoneLock(i); }}
                  className="text-sm hover:opacity-70 flex-shrink-0"
                  title={isLocked ? 'Odomknúť' : 'Zamknúť'}
                >
                  {isLocked ? '🔒' : '🔓'}
                </button>
              </div>
              <div className="ml-5 mt-1 space-y-0.5">
                {(['pipe', 'cable_cysy', 'cable_ftp'] as LineType[]).map((lt) => {
                  const count = cad.segments.filter((s) => s.zoneIndex === i && s.lineType === lt).length;
                  if (count === 0 && i !== activeZoneIndex) return null;
                  const labels: Record<LineType, string> = {
                    pipe: '💧 Potrubie',
                    cable_cysy: '⚡ CYSY',
                    cable_ftp: '📡 FTP',
                  };
                  const vis = layerVisibility[`zone_${i}_${lt}`] !== false;
                  return (
                    <button key={lt}
                      onClick={() => toggleLayer(`zone_${i}_${lt}`)}
                      className="w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left hover:bg-gray-50"
                    >
                      <span className="text-gray-600">{labels[lt]}</span>
                      <span className="text-gray-400">{count > 0 ? count : ''} {vis ? '👁' : '🚫'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
