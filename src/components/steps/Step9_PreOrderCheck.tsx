import { useEffect, useState } from 'react';
import { CheckCircle, Check, AlertTriangle } from 'lucide-react';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Card, Badge, Button } from '../ui/FormField';
import { fmtE, fmtN } from '../../utils/calculations';

export function Step9_PreOrderCheck() {
  const { globalParams, zones, zoneCalcs, ropeOverrides, setRopeOverrides, preOrderState, updatePreOrderState } = useProjectStore();
  const [roundedTotal, setRoundedTotal] = useState<number | null>(null);

  const { pumpConnectorMeters, etnaDistance, etnaCustomCost } = preOrderState;

  // Ensure pumpConnectorMeters length matches zone count (C5 fix)
  useEffect(() => {
    const count = globalParams.numberOfZones;
    if (pumpConnectorMeters.length !== count) {
      const arr = Array(count).fill(3).map((v, i) => pumpConnectorMeters[i] ?? v);
      updatePreOrderState({ pumpConnectorMeters: arr });
    }
    // Sync rope overrides if needed
    if (ropeOverrides.length !== count) {
      const defaults = zoneCalcs.map(c => c?.ropeLength ?? 0);
      setRopeOverrides(defaults);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalParams.numberOfZones]);

  const handleRopeChange = (i: number, val: number) => {
    const arr = [...ropeOverrides];
    arr[i] = val;
    setRopeOverrides(arr);
  };

  const etnaAccessoryCost = etnaDistance <= 10 ? 200 : etnaCustomCost;
  const allGood = pumpConnectorMeters.every((m) => m > 0);

  return (
    <StepLayout
      stepNum={9}
      title="Kontrola pred objednávkou"
      subtitle="Väčšina parametrov je definitívna po kroku 3G (výkres). Zostávajú iba manuálne kontroly."
      canContinue={allGood}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1 – Pump connector */}
        <Card variant="warning" title="Kontrola 1 – Prepoj čerpadlo → hl. vedenie DN25">
          <p className="text-sm text-muted-foreground mb-4">
            Štandard je <strong>3 m</strong>. Overte skutočné metre pre konkrétny projekt.
          </p>
          <div className="space-y-3">
            {Array.from({ length: globalParams.numberOfZones }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground w-20 flex-shrink-0">
                  {zones[i]?.name ?? `Zóna ${i + 1}`}
                </span>
                <Input
                  type="number"
                  min={1}
                  step={0.5}
                  unit="m"
                  value={pumpConnectorMeters[i] ?? 3}
                  onChange={(e) => {
                    const arr = [...pumpConnectorMeters];
                    arr[i] = Number(e.target.value);
                    updatePreOrderState({ pumpConnectorMeters: arr });
                  }}
                />
                <Badge variant={(pumpConnectorMeters[i] ?? 3) === 3 ? 'gray' : 'amber'}>
                  {(pumpConnectorMeters[i] ?? 3) === 3 ? 'štandard' : 'upravené'}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Card 2 – ETNA accessories */}
        <Card variant="warning" title="Kontrola 2 – Príslušenstvo k ETNA">
          <p className="text-sm text-muted-foreground mb-4">
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
            onChange={(e) => updatePreOrderState({ etnaDistance: Number(e.target.value) })}
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
                onChange={(e) => updatePreOrderState({ etnaCustomCost: Number(e.target.value) })}
              />
              <Badge variant="amber">Vlastná suma: {fmtE(etnaCustomCost)}</Badge>
            </div>
          ) : (
          <div className="p-3 bg-teal/5 border border-teal/20 rounded-md mt-2">
              <p className="text-sm text-teal font-semibold flex items-center gap-1"><Check className="w-3 h-3" />Fixná sadzba 200 € (≤ 10m)</p>
            </div>
          )}
        </Card>

        {/* Card 3 – Rope lengths */}
        <Card variant="info" title="Kontrola 3 – Dĺžky lana">
          <p className="text-sm text-muted-foreground mb-4">
            Lano sa objednáva v cievkach po <strong>500 m</strong>. Systém vypočítal potrebu per zóna.
            Upravte množstvo ak chcete objednať inak (napr. spojiť viaceré zóny).
          </p>
          <div className="space-y-3">
            {Array.from({ length: globalParams.numberOfZones }, (_, i) => {
              const calc = zoneCalcs[i];
              if (!calc) return null;
              const ropeRaw = calc.ropeLength - calc.ropeWaste; // = (L+10)*N
              const ropeRounded = calc.ropeLength;               // ceil to 500
              const waste = calc.ropeWaste;
              const override = ropeOverrides[i] ?? ropeRounded;
              return (
                <div key={i} className="border border-border rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {zones[i]?.name ?? `Zóna ${i + 1}`}
                    </span>
                    <div className="flex gap-2 text-xs">
                      <span className="text-muted-foreground">potreba: <strong>{fmtN(ropeRaw, 1)} m</strong></span>
                      <span className="text-muted-foreground">↑ cievka: <strong>{fmtN(ropeRounded, 0)} m</strong></span>
                      <Badge variant={waste > 100 ? 'amber' : 'green'}>
                        odpad {fmtN(waste, 0)} m
                      </Badge>
                    </div>
                  </div>
                  <Input
                    label="Objednávkové množstvo"
                    unit="m"
                    type="number"
                    min={ropeRaw}
                    step={500}
                    value={override}
                    onChange={(e) => handleRopeChange(i, Number(e.target.value))}
                  />
                </div>
              );
            })}
          </div>
          {/* Total */}
          <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Celkom lano</span>
            <span className="text-sm font-bold text-teal">
              {fmtN(ropeOverrides.reduce((s, v) => s + (v || 0), 0), 0)} m
            </span>
          </div>
        </Card>

        {/* Summary card */}
        <Card variant="success" title="Zhrnutie kontroly">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-foreground">Prepoj čerpadlo → vedenie DN25</span>
              <Badge variant={allGood ? 'green' : 'amber'}>
                {allGood ? <span className="flex items-center gap-1"><Check className="w-3 h-3" />Skontrolované</span> : <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Chýba</span>}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-border">
              <span className="text-sm text-foreground">Príslušenstvo k ETNA ({etnaDistance}m)</span>
              <Badge variant="green"><span className="flex items-center gap-1">{etnaAccessoryCost} € <Check className="w-3 h-3" /></span></Badge>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-foreground">Lano celkom</span>
              <Badge variant="green">
                <span className="flex items-center gap-1">{fmtN(ropeOverrides.reduce((s, v) => s + (v || 0), 0), 0)} m <Check className="w-3 h-3" /></span>
              </Badge>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Po tejto kontrole môžete vygenerovať finálnu objednávku pre Attiho (krok 10).
          </p>
        </Card>
      </div>
    </StepLayout>
  );
}
