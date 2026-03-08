import { useState } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Card, Toggle, Badge } from '../ui/FormField';
import { fmtE } from '../../utils/calculations';

export function Step9_PreOrderCheck() {
  const { globalParams, zones, zoneCalcs } = useProjectStore();
  const [pumpConnectorMeters, setPumpConnectorMeters] = useState<number[]>(
    Array(globalParams.numberOfZones).fill(3)
  );
  const [etnaDistance, setEtnaDistance] = useState(8);
  const [etnaCustomCost, setEtnaCustomCost] = useState(200);

  const etnaAccessoryCost = etnaDistance <= 10 ? 200 : etnaCustomCost;
  const allGood = pumpConnectorMeters.every((m) => m > 0);

  return (
    <StepLayout
      stepNum={9}
      title="Kontrola pred objednávkou"
      subtitle="Väčšina parametrov je definitívna po kroku 3G (výkres). Zostávajú iba 2 manuálne kontroly."
      canContinue={allGood}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="warning" title="🔍 Kontrola 1 – Prepoj čerpadlo → hl. vedenie DN25">
          <p className="text-sm text-gray-600 mb-4">
            Štandard je <strong>3 m</strong>. Overte skutočné metre pre konkrétny projekt.
          </p>
          <div className="space-y-3">
            {Array.from({ length: globalParams.numberOfZones }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700 w-20 flex-shrink-0">
                  {zones[i]?.name ?? `Zóna ${i + 1}`}
                </span>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  unit="m"
                  value={pumpConnectorMeters[i]}
                  onChange={(e) => {
                    const arr = [...pumpConnectorMeters];
                    arr[i] = Number(e.target.value);
                    setPumpConnectorMeters(arr);
                  }}
                />
                <Badge variant={pumpConnectorMeters[i] === 3 ? 'gray' : 'amber'}>
                  {pumpConnectorMeters[i] === 3 ? 'štandard' : 'upravené'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card variant="warning" title="🔍 Kontrola 2 – Príslušenstvo k ETNA">
          <p className="text-sm text-gray-600 mb-4">
            Fixný náklad <strong>200 €</strong> platí len do 10 m.
            Ak je vzdialenosť od čerpadla k ETNA nad 10 m, zadajte skutočný náklad.
          </p>
          <Input
            label="Vzdialenosť čerpadlo → ETNA"
            unit="m"
            type="number"
            min={1}
            step={1}
            value={etnaDistance}
            onChange={(e) => setEtnaDistance(Number(e.target.value))}
          />
          {etnaDistance > 10 ? (
            <div className="mt-3">
              <Input
                label="Skutočný náklad príslušenstvo ETNA"
                unit="€"
                type="number"
                min={0}
                step={50}
                value={etnaCustomCost}
                onChange={(e) => setEtnaCustomCost(Number(e.target.value))}
              />
              <Badge variant="amber">Vlastná suma: {fmtE(etnaCustomCost)}</Badge>
            </div>
          ) : (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg mt-2">
              <p className="text-sm text-green-700 font-semibold">✓ Fixná sadzba 200 € (≤ 10m)</p>
            </div>
          )}
        </Card>

        <Card variant="success" title="✅ Zhrnutie kontroly">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-700">Prepoj čerpadlo → vedenie DN25</span>
              <Badge variant={allGood ? 'green' : 'amber'}>
                {allGood ? '✓ Skontrolované' : '⚠ Chýba'}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700">Príslušenstvo k ETNA ({etnaDistance}m)</span>
              <Badge variant="green">
                {etnaAccessoryCost} € ✓
              </Badge>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Po tejto kontrole môžete vygenerovať finálnu objednávku pre Attiho (krok 10).
          </p>
        </Card>
      </div>
    </StepLayout>
  );
}
