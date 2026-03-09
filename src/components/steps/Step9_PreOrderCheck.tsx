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
    setRoundedTotal(null); // reset stale rounded total
  };

  const totalRope = ropeOverrides.reduce((s, v) => s + (v || 0), 0);

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
