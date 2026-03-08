import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Select, Card, CalcRow, Toggle, Badge, Button } from '../ui/FormField';
import { CADModule } from '../cad/CADModule';
import { fmtN, getNozzleFlowLpm, NOZZLE_FLOW_LPM, generateNozzleCombos } from '../../utils/calculations';
import type { ZoneCalc, ZoneParams, GlobalParams, NozzleCombo } from '../../types';

const ZONE_COLORS = [
  '#16a34a', '#2563eb', '#dc2626', '#d97706', '#7c3aed', '#0891b2',
];

interface NumInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> {
  label?: string;
  unit?: string;
  hint?: string;
  error?: string;
  value: number;
  onChange: (n: number) => void;
}

function NumInput({ value, onChange, label, unit, hint, error, ...inputProps }: NumInputProps) {
  const [raw, setRaw] = useState(String(value));
  useEffect(() => { setRaw(String(value)); }, [value]);
  return (
    <Input
      label={label} unit={unit} hint={hint} error={error} type="number"
      value={raw}
      onChange={(e) => { setRaw(e.target.value); const n = parseFloat(e.target.value); if (!isNaN(n)) onChange(n); }}
      onBlur={() => setRaw(String(value))}
      {...(inputProps as React.InputHTMLAttributes<HTMLInputElement>)}
    />
  );
}

const FLOW_PRESSURES = [50, 60, 70, 80, 90, 100, 110];

export function Step3_Zones() {
  const { zones, zoneCalcs, globalParams, updateZone, activeZoneIndex, setActiveZone, recalcAllZones, initCADZones, cad } = useProjectStore();
  const [activeTab, setActiveTab] = useState<'params' | 'cad' | 'results'>('params');

  useEffect(() => { recalcAllZones(); }, []);

  const allZonesComplete = zones.every((_, i) => zoneCalcs[i]?.drawingComplete);
  const currentZone = zones[activeZoneIndex];
  const currentCalc: ZoneCalc | undefined = zoneCalcs[activeZoneIndex];
  const pressure = globalParams.systemPressure;

  const nozzleOrificeOptions = ([0.15, 0.20, 0.25, 0.30] as const).map((o) => ({
    value: o,
    label: `${o.toFixed(2).replace('.', ',')} mm — ${getNozzleFlowLpm(o, pressure).toFixed(3)} l/min @ ${pressure} bar`,
  }));
  const spacingOptions = [200, 250, 300, 350, 400, 450, 500].map((v) => ({ value: v, label: `${v} cm` }));
  const controlOptions = [{ value: 'Snímač', label: 'Snímač (senzor teploty/vlhkosti)' }, { value: 'Priva', label: 'Priva (externý riadiaci systém)' }];
  const connectionOptions = [{ value: 'T-kus', label: 'T-kus' }, { value: 'rovny-spoj', label: 'Rovný spoj' }];

  const handleOrificeChange = (orifice: number) => {
    updateZone(activeZoneIndex, { nozzleOrifice: orifice as ZoneParams['nozzleOrifice'], nozzleFlow: getNozzleFlowLpm(orifice, globalParams.systemPressure) });
  };
  const handleCopyZone = (sourceIndex: number) => {
    if (sourceIndex === activeZoneIndex) return;
    const { name: _name, ...rest } = zones[sourceIndex];
    updateZone(activeZoneIndex, rest);
  };
  const handleInitCADZones = () => {
    if (cad.segments.length > 0 || cad.zones.length > 0) {
      if (!window.confirm('Toto resetuje pozície zón v CAD náčrte. Pokračovať?')) return;
    }
    initCADZones();
  };

  if (!currentZone) return null;

  return (
    <StepLayout stepNum={3} title="Výpočty pre každú zónu" subtitle={`Slučka i = 1 .. ${globalParams.numberOfZones} – kroky 3A až 3L pre každú zónu`} canContinue={allZonesComplete} continueHint="Dokončite výkres pre všetky zóny (krok 3G)">
      <div className="flex gap-2 mb-4 flex-wrap">
        {zones.map((zone, i) => {
          const calc = zoneCalcs[i];
          const isComplete = calc?.drawingComplete;
          return (
            <button key={i} onClick={() => setActiveZone(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${activeZoneIndex === i ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}>
              <span className="w-3 h-3 rounded-full" style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }} />
              <span>{zone.name || `Zóna ${i + 1}`}</span>
              {isComplete ? <span className="text-green-500">✓</span> : <span className="text-gray-300">○</span>}
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200">
          {([{ key: 'params', label: '📋 3A–3D Parametre' }, { key: 'cad', label: '✏️ 3G Výkres (CAD)' }, { key: 'results', label: '📊 3E–3L Výsledky' }] as const).map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 px-4 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'bg-green-50 text-green-700 border-b-2 border-green-500' : 'text-gray-500 hover:bg-gray-50'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'params' && (
            <ZoneParamsTab zone={currentZone} zoneIndex={activeZoneIndex} zones={zones} globalParams={globalParams}
              onUpdate={(p) => updateZone(activeZoneIndex, p)} nozzleOrificeOptions={nozzleOrificeOptions}
              spacingOptions={spacingOptions} controlOptions={controlOptions} connectionOptions={connectionOptions}
              onOrificeChange={handleOrificeChange} onCopyZone={handleCopyZone} />
          )}
          {activeTab === 'cad' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Krok 3G – Interaktívny CAD výkres</h3>
                  <p className="text-sm text-gray-500">Nakreslite napájacie vedenie pre zónu {currentZone.name}.</p>
                </div>
                <Button variant="secondary" size="sm" onClick={handleInitCADZones}>↺ Vygenerovať zóny</Button>
              </div>
              <CADModule activeZoneIndex={activeZoneIndex} />
            </div>
          )}
          {activeTab === 'results' && currentCalc && (
            <ZoneResultsTab calc={currentCalc} zone={currentZone} globalParams={globalParams} />
          )}
          {activeTab === 'results' && !currentCalc && (
            <div className="text-center py-12 text-gray-400"><p className="text-3xl mb-2">📊</p><p>Výsledky sa vypočítajú po zadaní parametrov</p></div>
          )}
        </div>
      </div>

      {zoneCalcs.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100"><h3 className="font-bold text-gray-800">📋 Súhrnná tabuľka zón</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs">
                  <th className="text-left p-3">Zóna</th><th className="text-right p-3">Plocha</th>
                  <th className="text-right p-3">Prietok</th><th className="text-right p-3">Trysky</th>
                  <th className="text-right p-3">Rúry 10mm</th><th className="text-right p-3">Lano</th>
                  <th className="text-right p-3">Nap. vedenie</th><th className="text-right p-3">Δp</th>
                  <th className="text-center p-3">Výkres</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, i) => {
                  const calc = zoneCalcs[i];
                  if (!calc) return null;
                  return (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="p-3 font-medium"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ZONE_COLORS[i % ZONE_COLORS.length] }} />{zone.name}</div></td>
                      <td className="p-3 text-right">{fmtN(calc.area, 1)} m²</td>
                      <td className="p-3 text-right">{fmtN(calc.zoneFlow / 1000, 1)} l/hod</td>
                      <td className="p-3 text-right"><span>{calc.numNozzles} ks</span>{(calc.nozzlesPerNave ?? 0) > 0 && <span className="text-gray-400 text-xs ml-1">({calc.nozzlesPerNave}/loď)</span>}</td>
                      <td className="p-3 text-right">{calc.numPipes10mmTotal} ks</td>
                      <td className="p-3 text-right">{fmtN(calc.ropeLength)} m{calc.ropeWaste > 0 && <span className="text-gray-400 text-xs block">odpad: {fmtN(calc.ropeWaste, 0)} m</span>}</td>
                      <td className="p-3 text-right font-mono">{fmtN(calc.supplyPipeLength, 1)} m</td>
                      <td className="p-3 text-right">{fmtN(calc.pressureDrop, 4)} bar</td>
                      <td className="p-3 text-center">{calc.drawingComplete ? <Badge variant="green">✓ Hotovo</Badge> : <Badge variant="amber">⚠ Chýba</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </StepLayout>
  );
}

interface ZoneParamsTabProps {
  zone: ZoneParams; zoneIndex: number; zones: ZoneParams[]; globalParams: GlobalParams;
  onUpdate: (p: Partial<ZoneParams>) => void;
  nozzleOrificeOptions: { value: number; label: string }[];
  spacingOptions: { value: number; label: string }[];
  controlOptions: { value: string; label: string }[];
  connectionOptions: { value: string; label: string }[];
  onOrificeChange: (v: number) => void;
  onCopyZone: (sourceIndex: number) => void;
}

function ZoneParamsTab({ zone, zoneIndex, zones, globalParams, onUpdate, nozzleOrificeOptions, spacingOptions, controlOptions, connectionOptions, onOrificeChange, onCopyZone }: ZoneParamsTabProps) {
  const area = zone.length * zone.width * zone.numNaves;
  const pressure = globalParams.systemPressure;
  return (
    <div>
      {zones.length > 1 && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <select defaultValue="" onChange={(e) => { const idx = Number(e.target.value); if (!isNaN(idx) && idx !== zoneIndex) { if (window.confirm(`Kopírovať parametre zo zóny "${zones[idx].name ?? `Zóna ${idx + 1}`}"?`)) { onCopyZone(idx); } } e.target.value = ''; }}
            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white">
            <option value="">📋 Kopírovať parametre zo zóny...</option>
            {zones.map((z, i) => i !== zoneIndex ? <option key={i} value={i}>Zóna {i + 1}: {z.name || `Zóna ${i + 1}`}</option> : null)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Input label="Názov zóny" value={zone.name} onChange={(e) => onUpdate({ name: e.target.value })} placeholder="napr. Sever A" />
          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Dĺžka lode (L)" unit="m" min={1} step={0.5} value={zone.length} onChange={(n) => onUpdate({ length: n })} />
            <NumInput label="Šírka lode (S)" unit="m" min={1} step={0.5} value={zone.width} onChange={(n) => onUpdate({ width: n })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Výška (V)" unit="m" min={1} step={0.5} value={zone.height} onChange={(n) => onUpdate({ height: n })} />
            <NumInput label="Počet lodí (N)" min={1} max={30} value={zone.numNaves} onChange={(n) => onUpdate({ numNaves: n })} />
          </div>
          <NumInput label="Rozostup držiakov kratovníc (R_krat)" unit="m" min={0.5} step={0.1} value={zone.trellisPitch} onChange={(n) => onUpdate({ trellisPitch: n })} />
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 mt-2 text-xs">
            <p className="font-semibold text-blue-700">Plocha zóny: {fmtN(area, 1)} m²</p>
            <p className="text-blue-600">= {zone.length} × {zone.width} × {zone.numNaves} lodí</p>
          </div>
          <div className="mt-4">
            <Select label="Prepoj na napájacie potrubie" value={zone.connectionType ?? 'T-kus'} onChange={(e) => onUpdate({ connectionType: e.target.value as ZoneParams['connectionType'] })} options={connectionOptions} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumInput label="Prevýšenie (P_výš)" unit="ks" min={0} value={zone.elevation} onChange={(n) => onUpdate({ elevation: n })} />
            <NumInput label="Dĺžka prevýšenia" unit="m" min={0} step={0.5} value={zone.elevationLength ?? 0} onChange={(n) => onUpdate({ elevationLength: n })} hint="Pripočíta sa k inox potrubie" />
          </div>
          <div className="mt-2 mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-0.5">Hydraulická hadica</p>
            <Toggle checked={zone.hydraulicHoseEnabled ?? false} onChange={(v) => onUpdate({ hydraulicHoseEnabled: v })} label={(zone.hydraulicHoseEnabled ?? false) ? 'ÁNO – hadica je použitá' : 'NIE – bez hadice'} />
            {(zone.hydraulicHoseEnabled ?? false) && (
              <div className="grid grid-cols-2 gap-3 mt-3">
                <NumInput label="Dĺžka hadice" unit="m" min={0} value={zone.hydraulicHoseLength} onChange={(n) => onUpdate({ hydraulicHoseLength: n })} />
                <NumInput label="Prepoj ks" unit="ks" min={0} value={zone.hydraulicHoseConnectors} onChange={(n) => onUpdate({ hydraulicHoseConnectors: n })} />
              </div>
            )}
          </div>
        </div>
        <div>
          <Select label="Tryska – orifice" value={zone.nozzleOrifice} onChange={(e) => onOrificeChange(Number(e.target.value))} options={nozzleOrificeOptions} />
          <NumInput label="Prietok trysky (Q_tryska)" unit="l/min" min={0} step={0.001} value={zone.nozzleFlow} onChange={(n) => onUpdate({ nozzleFlow: n })} hint="Vypĺňa sa automaticky podľa orifice a tlaku" />
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">📊 Referenčná tabuľka prietoku trysiek [l/min]</p>
            <div className="overflow-x-auto">
              <table className="text-xs w-full">
                <thead>
                  <tr>
                    <th className="text-left text-gray-500 pb-1 pr-3 font-medium">Orifice</th>
                    {FLOW_PRESSURES.map((p) => (
                      <th key={p} className={`text-right pb-1 px-1 font-medium ${pressure === p ? 'text-green-700 bg-green-100 rounded px-2' : 'text-gray-400'}`}>{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {([0.15, 0.20, 0.25, 0.30] as const).map((o) => (
                    <tr key={o} className={zone.nozzleOrifice === o ? 'bg-green-50' : ''}>
                      <td className="pr-3 text-gray-700 font-mono py-0.5 font-medium">{zone.nozzleOrifice === o ? '▶ ' : <span className="opacity-0">▶ </span>}{o.toFixed(2).replace('.', ',')} mm</td>
                      {FLOW_PRESSURES.map((p) => (
                        <td key={p} className={`text-right px-1 font-mono py-0.5 ${pressure === p ? 'text-green-700 font-semibold bg-green-50' : 'text-gray-500'}`}>
                          {(NOZZLE_FLOW_LPM[o]?.[p] ?? 0).toFixed(3)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Select label="Rozostup trysiek" unit="cm" value={zone.nozzleSpacing} onChange={(e) => onUpdate({ nozzleSpacing: Number(e.target.value) as ZoneParams['nozzleSpacing'] })} options={spacingOptions} />
          <NozzleComboTable zone={zone} globalParams={globalParams} onSelect={(combo) => onUpdate({ nozzleOrifice: combo.orifice, nozzleSpacing: combo.spacingCm as ZoneParams['nozzleSpacing'], nozzleFlow: getNozzleFlowLpm(combo.orifice, globalParams.systemPressure) })} />
          <Select label="Typ riadenia" value={zone.controlType} onChange={(e) => onUpdate({ controlType: e.target.value as ZoneParams['controlType'] })} options={controlOptions} />
          <div className="grid grid-cols-2 gap-3 mt-2">
            <Toggle checked={zone.hasMagnet} onChange={(v) => onUpdate({ hasMagnet: v })} label="Magnet (ÁNO/NIE)" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ZoneResultsTab({ calc, zone }: { calc: ZoneCalc; zone: ZoneParams; globalParams: GlobalParams }) {
  const ropeWaste = calc.ropeWaste ?? 0;
  const nozzlesPerNave = calc.nozzlesPerNave ?? 0;
  if (!calc.drawingComplete) {
    return (
      <div className="p-6 text-center">
        <div className="text-4xl mb-3">✏️</div>
        <p className="font-semibold text-gray-700">Najprv dokončite výkres (krok 3G)</p>
        <p className="text-sm text-gray-500 mt-1">Výsledky krokov 3E a 3H závisia od výkresu napájacieho vedenia.</p>
      </div>
    );
  }
  const sections = [
    { title: '3B · Plocha a trysky', rows: [{ label: 'Plocha zóny', value: fmtN(calc.area, 1), unit: 'm²', formula: 'L × S × N' }, { label: 'Prietok zóny', value: fmtN(calc.zoneFlow / 1000, 1), unit: 'l/hod' }, { label: 'Počet trysiek', value: `${calc.numNozzles} ks (${nozzlesPerNave}/loď)` }, { label: 'Swivel adaptéry', value: calc.numSwivel, unit: 'ks' }] },
    { title: '3C · Rúrky 10 mm', rows: [{ label: 'Rúrky/loď', value: calc.numPipes10mm, unit: 'ks' }, { label: 'Rúrky celkom', value: calc.numPipes10mmTotal, unit: 'ks' }, { label: 'Fitting 180° SS', value: calc.numFitting180, unit: 'ks' }, { label: 'End plug', value: calc.numEndPlug, unit: 'ks' }] },
    { title: '3D · Závesný systém', rows: [{ label: 'Lano', value: `${fmtN(calc.ropeLength)} m${ropeWaste > 0 ? ` (odpad: ${fmtN(ropeWaste, 0)} m)` : ''}` }, { label: 'Závesné diely 400mm', value: calc.numHangers, unit: 'ks' }, { label: 'GRIPPLE', value: calc.numGripple, unit: 'ks' }] },
    { title: '3H · Darcy-Weisbach', rows: [{ label: 'Dĺžka nap. vedenia', value: fmtN(calc.supplyPipeLength, 1), unit: 'm' }, { label: 'Rýchlosť prúdenia', value: fmtN(calc.velocity, 3), unit: 'm/s' }, { label: 'Tlaková strata', value: fmtN(calc.pressureDrop, 4), unit: 'bar' }] },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((section) => (
        <Card key={section.title} variant="calc" title={section.title} className="!p-4">
          {section.rows.map((row) => <CalcRow key={row.label} label={row.label} value={row.value} unit={row.unit} formula={(row as any).formula} />)}
        </Card>
      ))}
    </div>
  );
}

function NozzleComboTable({ zone, globalParams, onSelect }: { zone: ZoneParams; globalParams: GlobalParams; onSelect: (c: NozzleCombo) => void }) {
  const combos = generateNozzleCombos(zone, globalParams);
  const pressure = globalParams.systemPressure;
  const qRequired = Math.round(globalParams.fogCapacity * zone.length * zone.width * zone.numNaves);
  if (combos.length === 0) return <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-200 text-xs text-red-700">⚠ Žiadna kombinácia nedosahuje požadovaný výkon {fmtN(qRequired)} ml/hod.</div>;
  const sorted = [...combos].sort((a, b) => { const aA = a.pressure === pressure ? 0 : 1; const bA = b.pressure === pressure ? 0 : 1; if (aA !== bA) return aA - bA; if (a.orifice !== b.orifice) return a.orifice - b.orifice; return a.spacingCm - b.spacingCm; });
  const isSelected = (c: NozzleCombo) => c.orifice === zone.nozzleOrifice && c.spacingCm === zone.nozzleSpacing;
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-gray-600 mb-1">🔍 Kombinácie trysiek</p>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="text-xs w-full">
          <thead><tr className="bg-gray-50 text-gray-500"><th className="text-left px-2 py-1.5">Orifice</th><th className="text-right px-2 py-1.5">Rozostup</th><th className="text-right px-2 py-1.5">Trysky</th><th className="text-right px-2 py-1.5">Q skut.</th><th className="text-right px-2 py-1.5">%</th><th className="text-right px-2 py-1.5">bar</th></tr></thead>
          <tbody>
            {sorted.map((c, idx) => {
              const active = c.pressure === pressure;
              const selected = isSelected(c);
              return (
                <tr key={idx} onClick={() => onSelect(c)} className={`border-t border-gray-100 cursor-pointer ${selected ? 'bg-blue-100 ring-2 ring-blue-400' : active ? 'bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-50'}`}>
                  <td className={`px-2 py-1.5 font-mono font-bold ${active ? 'text-green-700' : ''}`}>{c.orifice.toFixed(2).replace('.', ',')} mm</td>
                  <td className="px-2 py-1.5 text-right">{c.spacingCm} cm</td>
                  <td className="px-2 py-1.5 text-right font-mono">{c.numNozzles}</td>
                  <td className="px-2 py-1.5 text-right font-mono">{fmtN(c.qActualMlH)} ml/h</td>
                  <td className={`px-2 py-1.5 text-right font-bold ${c.coveragePct >= 100 ? (active ? 'text-green-700' : 'text-gray-500') : 'text-red-500'}`}>{c.coveragePct}%</td>
                  <td className="px-2 py-1.5 text-right">{c.pressure}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
