import { MapPin, Droplets, Gauge, Layers } from 'lucide-react';
import sanfogLogoColor from '../../assets/sanfog-logo-color.svg';
import type { ProjectState, ZoneCalc, ZoneParams } from '../../types';
import { PUMP_TABLE, fmtN, calcETNACapacity, NOZZLE_BY_ORIFICE } from '../../utils/calculations';
import { getPipe10mmForSpacing } from '../../data/stockItems';

interface PortalProjectData {
  id: string;
  quote_number: string;
  customer_name: string;
  project_address: string;
  country: string;
  saved_at: string;
  snapshot: ProjectState;
}

interface PortalProjectViewProps {
  projectData: PortalProjectData;
}

function KPI({ val, lbl }: { val: string; lbl: string }) {
  return (
    <div className="bg-card border border-border rounded-lg px-4 py-4 text-center">
      <div className="text-xl font-bold" style={{ color: 'hsl(var(--teal))' }}>{val}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{lbl}</div>
    </div>
  );
}

function ZoneBOM({ zone, calc, zoneIndex }: { zone: ZoneParams; calc: ZoneCalc; zoneIndex: number }) {
  const items: { code: string; name: string; qty: number; unit: string }[] = [];
  const add = (code: string, name: string, qty: number, unit: string) => {
    if (qty > 0) items.push({ code, name, qty, unit });
  };

  const nCode = NOZZLE_BY_ORIFICE[zone.nozzleOrifice];
  add(nCode, `Tryska D${zone.nozzleOrifice}mm AK SS`, calc.numNozzles, 'ks');
  add('NOR 301188', 'Swivel adaptér', calc.numSwivel, 'ks');
  const pipe10mm = getPipe10mmForSpacing(zone.nozzleSpacing);
  add(pipe10mm.code, pipe10mm.name, calc.numPipes10mmTotal, 'ks');
  add('NORMIST 0311002SS-180', 'Fitting SS 180°', calc.numFitting180, 'ks');
  add('NORMIST 0311008SS', 'End plug 10mm SS', calc.numEndPlug, 'ks');
  add('NORMIST 0311001SS', 'Drziak trysky 1 tryska SS', calc.numNozzles - calc.numFitting180, 'ks');
  add('ITALINOX', 'Trubka A304 TIG 22×1,5 [SS]', Math.ceil(calc.inoxPipeLength), 'm');
  add('183022000', 'VT Spojka P22F AK [SS]', calc.numInoxConnectors, 'ks');
  add('RACMET 182022000', 'VT T-kus P22F AK [SS]', calc.numTJunctions, 'ks');
  add('snfg.05.0002', 'Dilatácia hydraulická DN25 2m [SS]', calc.numDilations, 'ks');
  add('snfg.05.0014', 'Zostava vyprázdňovania 0-90bar', calc.numDrainAssemblies, 'ks');

  if (items.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Layers className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
        <span className="font-bold text-sm text-foreground">Zóna {zoneIndex + 1}: {zone.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {fmtN(calc.area, 1)} m² · {calc.numNozzles} trysky
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
              <th className="text-left px-4 py-2">Kód</th>
              <th className="text-left px-4 py-2">Popis</th>
              <th className="text-right px-4 py-2">Qty</th>
              <th className="text-left px-4 py-2">MJ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-t border-border hover:bg-muted/40 transition-colors">
                <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{item.code}</td>
                <td className="px-4 py-2 text-foreground">{item.name}</td>
                <td className="px-4 py-2 text-right font-mono font-semibold">{fmtN(item.qty, 1)}</td>
                <td className="px-4 py-2 text-muted-foreground text-xs">{item.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PortalProjectView({ projectData }: PortalProjectViewProps) {
  const snap = projectData.snapshot;
  const { zones, zoneCalcs, globalParams } = snap;

  const totalArea = zoneCalcs.reduce((s, c) => s + (c?.area ?? 0), 0);
  const totalFlowMlH = zoneCalcs.reduce((s, c) => s + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = calcETNACapacity(totalFlowMlH);
  const totalNozzles = zoneCalcs.reduce((s, c) => s + (c?.numNozzles ?? 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div style={{ background: 'hsl(var(--navy))' }}>
        <div className="max-w-5xl mx-auto px-4 py-5 flex items-center justify-between">
          <img src={sanfogLogoColor} alt="Sanfog" className="h-10 w-auto" />
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'hsl(var(--white) / 0.4)' }}>
              Zákaznícky portál
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'hsl(var(--white) / 0.25)' }}>
              GreenHouse Calc
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Project header card */}
        <div className="bg-card border border-border rounded-lg px-6 py-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-lg font-bold" style={{ color: 'hsl(var(--teal))' }}>
                  {projectData.quote_number}
                </span>
                <span
                  className="text-xs px-2 py-0.5 font-semibold border uppercase tracking-wide"
                  style={{
                    borderRadius: 'var(--radius)',
                    background: 'hsl(var(--teal) / 0.1)',
                    border: '1px solid hsl(var(--teal) / 0.3)',
                    color: 'hsl(var(--teal))',
                  }}
                >
                  {projectData.country}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-foreground">{projectData.customer_name || 'Projekt'}</h1>
              {projectData.project_address && (
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {projectData.project_address}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Dátum</p>
              <p className="text-sm font-semibold text-foreground">
                {snap.project.quoteDate || new Date(projectData.saved_at).toLocaleDateString('sk-SK')}
              </p>
              <p className="text-xs text-muted-foreground mt-2">Kontakt</p>
              <p className="text-sm text-foreground">{snap.project.contactPerson || '—'}</p>
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KPI val={`${fmtN(totalArea, 1)} m²`} lbl="Celková plocha" />
          <KPI val={`${totalNozzles} ks`} lbl="Trysky celkom" />
          <KPI val={`${globalParams.numberOfZones}`} lbl="Počet zón" />
          <KPI val={`${fmtN(etnaCapacity, 2)} m³/h`} lbl="ETNA kapacita" />
        </div>

        {/* System info */}
        <div className="bg-card border border-border rounded-lg px-6 py-5">
          <h2 className="font-bold text-foreground uppercase tracking-wide text-sm mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            Parametre systému
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Tlak systému</p>
              <p className="font-semibold text-foreground">{globalParams.systemPressure} bar</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Prietok</p>
              <p className="font-semibold text-foreground">{fmtN(totalFlowMlH, 0)} ml/h</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Osmotická voda</p>
              <p className="font-semibold text-foreground">{globalParams.osmoticWater ? 'Áno' : 'Nie'}</p>
            </div>
          </div>
        </div>

        {/* Zone overview table */}
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border flex items-center gap-2">
            <Droplets className="w-4 h-4" style={{ color: 'hsl(var(--teal))' }} />
            <h2 className="font-bold text-foreground uppercase tracking-wide text-sm">Prehľad zón</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground text-xs uppercase tracking-wide">
                  <th className="text-left px-4 py-2">Zóna</th>
                  <th className="text-right px-4 py-2">Plocha m²</th>
                  <th className="text-right px-4 py-2">Trysky ks</th>
                  <th className="text-right px-4 py-2">Prietok ml/h</th>
                  <th className="text-left px-4 py-2">Čerpadlo</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone, i) => {
                  const calc = zoneCalcs[i];
                  const flowLpm = (calc?.zoneFlow ?? 0) / 1000 / 60;
                  const pump = PUMP_TABLE.find(p => p.maxFlow >= flowLpm);
                  return (
                    <tr key={i} className="border-t border-border hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">{zone.name}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmtN(calc?.area ?? 0, 1)}</td>
                      <td className="px-4 py-3 text-right font-mono">{calc?.numNozzles ?? 0}</td>
                      <td className="px-4 py-3 text-right font-mono">{fmtN(calc?.zoneFlow ?? 0, 0)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{pump?.name ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zone BOM sections */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">
            Technický zoznam materiálu (BOM)
          </h2>
          {zones.map((zone, i) => {
            const calc = zoneCalcs[i];
            if (!calc) return null;
            return <ZoneBOM key={i} zone={zone} calc={calc} zoneIndex={i} />;
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
          <p>Tento portál je určený iba pre zákazníka. Obsahuje technickú špecifikáciu bez cenových informácií.</p>
          <p className="mt-1">© {new Date().getFullYear()} Sanfog s.r.o. · GreenHouse Calc by VORA</p>
        </div>
      </div>
    </div>
  );
}
