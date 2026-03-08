import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, CalcRow, Toggle } from '../ui/FormField';
import { PUMP_TABLE, calcETNACapacity, fmtN } from '../../utils/calculations';
import { useItemsByGroup } from '../../hooks/useSupabaseItems';

export function Step5_PumpETNA() {
  const {
    globalParams,
    zoneCalcs,
    zones,
    uvSystemCode,
    ssFilter30,
    setUVSystemCode,
    setSSFilter,
  } = useProjectStore();

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const etnaCapacity = calcETNACapacity(totalFlowMlH);
  const osmoticSS = globalParams.osmoticWater;

  const maxivarem = osmoticSS
    ? 'MAXIVAREM SS variant (300L)'
    : 'MAXIVAREM ŠTANDARD (300L)';
  const etnaLabel = osmoticSS
    ? 'HF KI-ST 32/2-30 SS variant (snfg.001.0021)'
    : 'HF KI-ST 32/2-30 ŠTANDARD (snfg.001.0021)';

  const uvItems = useItemsByGroup('UV Lampy');

  return (
    <StepLayout
      stepNum={5}
      title="Komponenty čerpadla a ETNA stanica"
      subtitle="5A – Komponenty čerpadiel  ·  5B – ETNA stanica a systémové komponenty"
      canContinue={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 5A: Pump components */}
        <Card title="5A · Komponenty čerpadiel">
          <p className="text-xs text-gray-500 mb-3">
            Nasledujúce komponenty sa multiplilkujú × {globalParams.numberOfZones} čerpadiel:
          </p>
          <div className="space-y-2 text-sm">
            {[
              { name: 'Solenoid Valve Kit 70 Bar', code: '0204013A', qty: globalParams.numberOfZones },
              { name: 'Pressure Switch Kit', code: '0104003-kit', qty: globalParams.numberOfZones },
              { name: 'Keller Pressure Transmitter 0/160 Bar', code: '204091', qty: globalParams.numberOfZones },
              { name: 'Bypass ventil VRT100-100LPM@170bar', code: '4072000024', qty: globalParams.numberOfZones },
              { name: 'Poistný ventil VS220 G3/8F', code: '60.0525.00', qty: globalParams.numberOfZones },
              { name: 'Prepoj čerpadlo → hl. vedenie DN25 3m [SS]', code: 'snfg.006.0001', qty: globalParams.numberOfZones },
            ].map((item) => (
              <div
                key={item.code}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{item.code}</p>
                </div>
                <span className="font-bold text-green-700 text-lg">{item.qty}×</span>
              </div>
            ))}

            <div className="border-t pt-3 mt-2 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase">Ostatné (1× na projekt)</p>
              {[
                { name: 'Teltonika GSM brána', code: 'TELTONIKA_GSM' },
                { name: 'Náhradný rukávový filter 5 mic', code: 'BPONG-005-P2PWE' },
                { name: 'DANFOSS Drive', code: 'NORMIST_DANFOSS' },
                { name: 'DELTA PLC + HMI', code: 'DELTA_PLC' },
              ].map((item) => (
                <div key={item.code} className="flex items-center justify-between text-sm py-1">
                  <p className="text-gray-700">{item.name}</p>
                  <span className="text-gray-500">1×</span>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 mt-2 space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1">UV systém</p>
                <select
                  value={uvSystemCode ?? ''}
                  onChange={(e) => setUVSystemCode(e.target.value || null)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                >
                  <option value="">– bez UV systému –</option>
                  {uvItems.map((item) => (
                    <option key={item.code} value={item.code}>
                      {item.name}
                    </option>
                  ))}
                </select>
                {uvSystemCode && (
                  <p className="text-xs text-green-600 mt-1">✓ Vybrané: {uvSystemCode}</p>
                )}
              </div>

              <Toggle
                checked={ssFilter30}
                onChange={setSSFilter}
                label='SS Filter 30" Unit'
              />
            </div>
          </div>
        </Card>

        {/* 5B: ETNA station */}
        <Card title="5B · ETNA stanica a systémové komponenty">
          <CalcRow
            label="Celkový prietok Q_total"
            value={fmtN(totalFlowMlH / 1000, 1)}
            unit="l/hod"
          />
          <CalcRow
            label="Kapacita ETNA (Q_total × 1,5)"
            value={fmtN(etnaCapacity, 2)}
            unit="m³/hod"
            formula="Q × 1,5"
            highlight
          />

          <div className="mt-4 space-y-3">
            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs font-semibold text-gray-600 mb-1">ETNA</p>
              <p className="text-sm text-gray-800">{etnaLabel}</p>
              {osmoticSS && (
                <span className="text-xs text-blue-600 font-semibold">→ SS (osmotická voda)</span>
              )}
            </div>

            <div className="p-3 bg-gray-50 rounded-lg border">
              <p className="text-xs font-semibold text-gray-600 mb-1">MAXIVAREM tlaková nádoba</p>
              <p className="text-sm text-gray-800">{maxivarem}</p>
              {osmoticSS && (
                <span className="text-xs text-blue-600 font-semibold">→ SS (osmotická voda)</span>
              )}
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠ FOGSYSTEM NORMIST</p>
              <p className="text-xs text-gray-600">
                Zadáva sa manuálne po prijatí cenovej ponuky od NAZLI (krok 7).
                Variant: {osmoticSS ? 'SS' : 'ŠTANDARD'}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { name: 'Trojcestná armatúra', code: 'SNFG.TLK.001' },
                { name: 'Montáž ETNA', value: '300 €' },
                { name: 'Príslušenstvo k ETNA-NOR (do 10m)', value: '200 € (fixné)' },
                { name: 'Vodoinstalačný materiál ETNA-NOR', value: '300 €' },
              ].map((item) => (
                <div key={item.name} className="flex justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-700">{item.name}</span>
                  <span className="text-gray-500 text-xs">{(item as any).value ?? (item as any).code}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Pumps per zone */}
        <Card variant="calc" title="Čerpadlá pre zóny">
          {zoneCalcs.map((calc, i) => {
            const flowLpm = calc.zoneFlow / 1000 / 60;
            const pump = PUMP_TABLE.find((p) => p.maxFlow >= flowLpm) ?? null;
            return (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="text-sm font-medium">{zones[i]?.name}</p>
                  <p className="text-xs text-gray-500">
                    {pump ? pump.name : <span className="text-red-500">⚠ Nad kapacitou</span>}
                  </p>
                </div>
                <span className={`text-xs font-mono ${pump ? 'text-green-700' : 'text-red-600'}`}>
                  {fmtN(flowLpm, 1)} lpm
                </span>
              </div>
            );
          })}
        </Card>
      </div>
    </StepLayout>
  );
}
