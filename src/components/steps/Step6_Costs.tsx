import { useEffect } from 'react';
import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Card, CalcRow, Select } from '../ui/FormField';
import { getTransportCost, getPMCost, fmtE, fmtN } from '../../utils/calculations';

export function Step6_Costs() {
  const { costInputs, updateCostInputs, project, zones } = useProjectStore();

  const transpCost = getTransportCost(project.country);
  const pmCost = getPMCost(costInputs.projectArea);

  const autoAreaM2 = zones.reduce((sum, z) => sum + z.length * z.width * z.numNaves, 0);
  const autoAreaHa = autoAreaM2 / 10000;

  useEffect(() => {
    if (costInputs.projectArea === 1 && autoAreaHa > 0) {
      updateCostInputs({ projectArea: Math.max(0.1, parseFloat(autoAreaHa.toFixed(2))) });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const installTechCost =
    (costInputs.installTechDays * costInputs.installTechCount +
      costInputs.installGreenhouseDays * costInputs.installGreenhouseCount +
      costInputs.diggingDays * costInputs.diggingCount +
      costInputs.commissioningDays * costInputs.commissioningCount) * 100;

  const dietsCost =
    (costInputs.installTechDays * costInputs.installTechCount +
      costInputs.installGreenhouseDays * costInputs.installGreenhouseCount +
      costInputs.diggingDays * costInputs.diggingCount +
      costInputs.commissioningDays * costInputs.commissioningCount) * 35;

  const accommodationCost = costInputs.accommodationNights * costInputs.accommodationTechs * 40;
  const salesTripsCost = (costInputs.salesTrips + costInputs.techTrips + costInputs.implTeamTrips) * 150;

  const totalLabour =
    installTechCost + dietsCost + accommodationCost + salesTripsCost +
    transpCost + costInputs.inspectionFixed + costInputs.designFixed +
    pmCost + (costInputs.mountingMaterial as number) + (costInputs.mountingMaterialStation as number) +
    1400 + 350;

  const mountingOptions = [
    { value: 500, label: '500 €' },
    { value: 750, label: '750 €' },
    { value: 1000, label: '1 000 €' },
    { value: 1500, label: '1 500 €' },
  ];

  return (
    <StepLayout
      stepNum={6}
      title="Montáž, doprava a ostatné náklady"
      subtitle="6A – Montáž a práca  ·  6B – Doprava, ubytovanie a ostatné"
      canContinue={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6A Labour */}
        <Card title="6A · Montáž a práca (100 €/deň/technik · 35 € diéta)">
          <div className="space-y-3">
            {[
              { label: 'Montáž technológia', daysKey: 'installTechDays', countKey: 'installTechCount' },
              { label: 'Montáž skleník', daysKey: 'installGreenhouseDays', countKey: 'installGreenhouseCount' },
              { label: 'Kopanie', daysKey: 'diggingDays', countKey: 'diggingCount' },
              { label: 'Uvedenie do prevádzky', daysKey: 'commissioningDays', countKey: 'commissioningCount' },
            ].map((row) => (
              <div key={row.label}>
                <p className="text-xs font-semibold text-gray-600 mb-1">{row.label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    min={0}
                    label="Dni"
                    value={(costInputs as any)[row.daysKey]}
                    onChange={(e) => updateCostInputs({ [row.daysKey]: Number(e.target.value) } as any)}
                  />
                  <Input
                    type="number"
                    min={0}
                    label="Technici"
                    value={(costInputs as any)[row.countKey]}
                    onChange={(e) => updateCostInputs({ [row.countKey]: Number(e.target.value) } as any)}
                  />
                </div>
              </div>
            ))}

            <div className="border-t pt-3 grid grid-cols-2 gap-2">
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Obhliadka / zameranie</p>
                <p className="font-bold text-gray-800">200 €</p>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Projektovanie</p>
                <p className="font-bold text-gray-800">200 €</p>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2 flex items-center gap-2 flex-wrap">
                <span>Celková plocha projektu:</span>
                <span className="font-semibold text-blue-600">{autoAreaHa.toFixed(2)} ha</span>
                <span className="text-gray-400">(zo zón: {fmtN(autoAreaM2)} m²)</span>
              </div>
              <Input
                label="Plocha projektu (PM)"
                unit="ha"
                type="number"
                min={0.1}
                step={0.5}
                value={costInputs.projectArea}
                onChange={(e) => updateCostInputs({ projectArea: Number(e.target.value) })}
                hint={`Náklady PM: ${fmtE(pmCost)} (≤2ha=300€, ≤4ha=600€, ≤6ha=900€)`}
              />
            </div>
          </div>
        </Card>

        {/* 6B Transport */}
        <Card title="6B · Doprava, ubytovanie a ostatné">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <p className="text-xs font-semibold text-blue-700">Preprava tovaru ({project.country})</p>
            <p className="font-bold text-blue-800 text-lg">{fmtE(transpCost)}</p>
            <p className="text-xs text-blue-600">Automaticky z kroku 1</p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'Výjazdy Sales', key: 'salesTrips' },
              { label: 'Výjazdy technici', key: 'techTrips' },
              { label: 'Výjazdy realizácia', key: 'implTeamTrips' },
            ].map((item) => (
              <Input
                key={item.key}
                label={item.label}
                type="number"
                min={0}
                value={(costInputs as any)[item.key]}
                onChange={(e) => updateCostInputs({ [item.key]: Number(e.target.value) } as any)}
              />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Input
              label="Ubytovanie – noci"
              type="number"
              min={0}
              value={costInputs.accommodationNights}
              onChange={(e) => updateCostInputs({ accommodationNights: Number(e.target.value) })}
            />
            <Input
              label="Ubytovanie – technici"
              type="number"
              min={0}
              value={costInputs.accommodationTechs}
              onChange={(e) => updateCostInputs({ accommodationTechs: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Montážny materiál – rezerva"
              value={costInputs.mountingMaterial}
              onChange={(e) => updateCostInputs({ mountingMaterial: Number(e.target.value) as any })}
              options={mountingOptions}
            />
            <Select
              label="Montážny materiál pri stanici"
              value={costInputs.mountingMaterialStation}
              onChange={(e) => updateCostInputs({ mountingMaterialStation: Number(e.target.value) as any })}
              options={mountingOptions}
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-lg border mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ďalšie náklady, colnica</span>
              <span className="font-semibold">1 400 €</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Balné (SNFG.00001)</span>
              <span className="font-semibold">350 €</span>
            </div>
          </div>
        </Card>

        {/* Summary */}
        <Card variant="calc" title="📊 Súhrn nákladov (krok 6)">
          <CalcRow label="Práca (100€/deň)" value={fmtE(installTechCost)} />
          <CalcRow label="Diéty (35€/deň)" value={fmtE(dietsCost)} />
          <CalcRow label="Ubytovanie" value={fmtE(accommodationCost)} />
          <CalcRow label="Doprava výjazdy" value={fmtE(salesTripsCost)} />
          <CalcRow label="Preprava tovaru" value={fmtE(transpCost)} />
          <CalcRow label="Obhliadka + projektovanie" value={fmtE(400)} />
          <CalcRow label="Náklady PM" value={fmtE(pmCost)} />
          <CalcRow label="Montážny materiál" value={fmtE(Number(costInputs.mountingMaterial) + Number(costInputs.mountingMaterialStation))} />
          <CalcRow label="Colnica + ďalšie" value={fmtE(1400)} />
          <CalcRow label="Balné" value={fmtE(350)} />
          <div className="border-t mt-2 pt-2">
            <CalcRow label="SPOLU náklady (krok 6)" value={fmtE(totalLabour)} highlight />
          </div>
        </Card>
      </div>
    </StepLayout>
  );
}
