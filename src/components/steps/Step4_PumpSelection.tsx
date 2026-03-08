import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Card, CalcRow, Badge } from '../ui/FormField';
import { PUMP_TABLE, fmtN } from '../../utils/calculations';

export function Step4_PumpSelection() {
  const { zones, zoneCalcs, globalParams, pumpSelection } = useProjectStore();

  const totalFlowMlH = zoneCalcs.reduce((sum, c) => sum + (c?.zoneFlow ?? 0), 0);
  const totalFlowLpm = totalFlowMlH / 1000 / 60;
  const MAX_PUMP_LPM = PUMP_TABLE[PUMP_TABLE.length - 1].maxFlow;
  const overCapacityZones = zoneCalcs.filter((c) => (c.zoneFlow / 1000 / 60) > MAX_PUMP_LPM);

  return (
    <StepLayout
      stepNum={4}
      title="Sumarizácia kapacity → Výber čerpadla"
      subtitle="Automatický výber čerpadla podľa celkového prietoku. Každá zóna má vlastné čerpadlo."
      canContinue={true}
    >
      {overCapacityZones.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 border-l-4 border-l-red-500 rounded-r-lg flex items-start gap-3">
          <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center bg-red-500 rounded-full text-white text-xs font-bold mt-0.5">!</div>
          <div>
            <p className="font-semibold text-red-700 text-sm">Kapacita presahuje dostupné čerpadlá</p>
            <p className="text-sm text-red-600 mt-1">
              {overCapacityZones.length === 1
                ? `Jedna zóna má prietok > ${MAX_PUMP_LPM} lpm.`
                : `${overCapacityZones.length} zóny majú prietok > ${MAX_PUMP_LPM} lpm.`}
              {' '}Konzultovať s technikom – potrebná špeciálna zostava čerpadla.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="calc" title="Celkový prietok systému">
          <CalcRow
            label="Počet zón"
            value={globalParams.numberOfZones}
            unit="ks"
          />
          {zoneCalcs.map((calc, i) => (
            <CalcRow
              key={i}
              label={`Zóna ${i + 1}: ${zones[i]?.name ?? ''}`}
              value={fmtN(calc.zoneFlow / 1000, 1)}
              unit="l/hod"
            />
          ))}
          <CalcRow
            label="SPOLU Q_total"
            value={fmtN(totalFlowMlH / 1000, 1)}
            unit="l/hod"
            highlight
          />
          <CalcRow
            label="Q_total"
            value={fmtN(totalFlowLpm, 2)}
            unit="lpm"
          />
        </Card>

        <Card title="Výber čerpadla — 1 čerpadlo / zóna">
          <p className="text-xs text-amber-800 bg-amber-50 border-l-2 border-amber-400 p-2 pl-3 rounded-r mb-4">
            Každé čerpadlo povinne dostane suffix:{' '}
            <strong>"with Control Unit PLC TOUCH SCREEN"</strong>
          </p>
          <div className="space-y-3">
            {zoneCalcs.map((calc, i) => {
              const flowLpm = calc.zoneFlow / 1000 / 60;
              const pump = PUMP_TABLE.find((p) => p.maxFlow >= flowLpm) ?? null;
              const overCap = pump === null;
              return (
                <div
                  key={i}
                  className={`p-3 border rounded-xl ${
                    overCap
                      ? 'bg-red-50 border-red-300'
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">
                        {zones[i]?.name ?? `Zóna ${i + 1}`}
                      </p>
                      {overCap ? (
                        <p className="text-xs text-red-600 mt-0.5 font-semibold">
                          Prietok presahuje max. čerpadlo ({MAX_PUMP_LPM} lpm)
                        </p>
                      ) : (
                        <>
                          <p className="text-xs text-gray-600 mt-0.5">{pump!.name}</p>
                          <p className="text-xs text-gray-400 font-mono">{pump!.code}</p>
                        </>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">Prietok</p>
                      <p className={`font-mono font-bold ${overCap ? 'text-red-600' : 'text-green-700'}`}>
                        {fmtN(flowLpm, 2)} lpm
                      </p>
                      {!overCap && <Badge variant="green">Max: {pump!.maxFlow} lpm</Badge>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card variant="info" title="Pravidlá výberu čerpadla — kapacitná tabuľka">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-blue-50 text-blue-700">
                  <th className="text-left p-2">Model</th>
                  <th className="text-right p-2">Max Q [lpm]</th>
                  <th className="text-right p-2">Tlak [bar]</th>
                </tr>
              </thead>
              <tbody>
                {PUMP_TABLE.map((p) => (
                  <tr key={p.code} className="border-t border-gray-100">
                    <td className="p-2 font-mono">{p.name.split(' ')[0]}</td>
                    <td className="p-2 text-right">{p.maxFlow}</td>
                    <td className="p-2 text-right">{p.pressure}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </StepLayout>
  );
}
