import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Select, Card, Toggle, CalcRow } from '../ui/FormField';

export function Step2_GlobalParams() {
  const { globalParams, updateGlobalParams } = useProjectStore();

  const zoneOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} ${i + 1 === 1 ? 'zóna' : i + 1 < 5 ? 'zóny' : 'zón'}`,
  }));

  const pressureOptions = [
    { value: 70, label: '70 bar' },
    { value: 80, label: '80 bar' },
    { value: 90, label: '90 bar' },
    { value: 100, label: '100 bar' },
    { value: 110, label: '110 bar' },
  ];

  const pumpLocationOptions = [
    { value: 'NÁVRH', label: 'NÁVRH – poloha ešte nie je potvrdená' },
    { value: 'POTVRDENÉ', label: 'POTVRDENÉ – poloha je definitívna' },
  ];

  return (
    <StepLayout
      stepNum={2}
      title="Globálne vstupné parametre projektu"
      subtitle="Parametre platné pre celý projekt – všetky zóny."
      canContinue={globalParams.fogCapacity > 0 && globalParams.systemPressure > 0}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Základné parametre">
          <Select
            label="Počet klimatizačných zón"
            value={globalParams.numberOfZones}
            onChange={(e) =>
              updateGlobalParams({ numberOfZones: Number(e.target.value) })
            }
            options={zoneOptions}
            hint={`= počet čerpadiel (${globalParams.numberOfZones} čerpadlo${globalParams.numberOfZones > 1 ? 'a' : ''})`}
          />
          <Input
            label="Požadovaná kapacita foggingu"
            unit="ml/hod/m²"
            type="number"
            min={10}
            max={500}
            step={10}
            value={globalParams.fogCapacity}
            onChange={(e) => updateGlobalParams({ fogCapacity: Number(e.target.value) })}
            hint="Typická hodnota: 100–250 ml/hod/m²"
          />
          <Select
            label="Tlak systému"
            unit="bar"
            value={globalParams.systemPressure}
            onChange={(e) =>
              updateGlobalParams({ systemPressure: Number(e.target.value) })
            }
            options={pressureOptions}
          />
        </Card>

        <Card title="Umiestnenie čerpadla & ostatné">
          <Select
            label="Umiestnenie čerpadla"
            value={globalParams.pumpLocation}
            onChange={(e) =>
              updateGlobalParams({
                pumpLocation: e.target.value as 'POTVRDENÉ' | 'NÁVRH',
              })
            }
            options={pumpLocationOptions}
          />

          <div className="space-y-4 mt-4">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Osmotická voda</p>
              <Toggle
                checked={globalParams.osmoticWater}
                onChange={(v) => updateGlobalParams({ osmoticWater: v })}
                label={globalParams.osmoticWater ? 'ÁNO – SS variant' : 'NIE – štandard variant'}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Oceľové lano</p>
              <div className="flex gap-3">
                {(['SS_NEREZ', 'OCEĽ'] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => updateGlobalParams({ steelRope: v })}
                    className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                      globalParams.steelRope === v
                        ? 'bg-green-600 text-white border-green-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {v === 'SS_NEREZ' ? '⚡ SS NEREZ' : '🔩 OCEĽ'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card variant="info" title="ℹ️ Pravidlá materiálov">
          <div className="space-y-3 text-sm">
            <div className="p-3 bg-white rounded-lg border border-blue-100">
              <p className="font-semibold text-blue-800 mb-1">Osmotická voda = ÁNO</p>
              <p className="text-gray-600 text-xs">
                → ETNA filter HF KI-ST, MAXIVAREM, FOGSYSTEM NORMIST sa prepnú na SS variant
              </p>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <p className="font-semibold text-amber-800 mb-1">⚠ Vždy SS (bez ohľadu na osmózu)</p>
              <p className="text-gray-600 text-xs">
                Trubka A304 TIG 22×1,5 · VT Spojka P22F AK · T-kus prepoj · Dilatácia DN25 · Závesný
                diel 400mm · Ventil ihlový G1/2F · Prepoj čerpadlo→vedenie DN25
              </p>
            </div>
          </div>
        </Card>

        <Card variant="calc" title="📊 Zhrnutie parametrov">
          <CalcRow label="Počet zón" value={globalParams.numberOfZones} />
          <CalcRow label="Počet čerpadiel" value={globalParams.numberOfZones} />
          <CalcRow label="Kapacita foggingu" value={globalParams.fogCapacity} unit="ml/hod/m²" />
          <CalcRow label="Tlak systému" value={globalParams.systemPressure} unit="bar" />
          <CalcRow
            label="Osmotická voda"
            value={globalParams.osmoticWater ? 'ÁNO → SS variant' : 'NIE → štandard'}
          />
          <CalcRow
            label="Oceľové lano"
            value={globalParams.steelRope === 'SS_NEREZ' ? 'SS NEREZ' : 'OCEĽ'}
          />
        </Card>
      </div>
    </StepLayout>
  );
}
