import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Card } from '../ui/FormField';
import { fmtE } from '../../utils/calculations';

export function Step7_Normist() {
  const { normistPrice, setNormistPrice, globalParams, project } = useProjectStore();

  return (
    <StepLayout
      stepNum={7}
      title="FOGSYSTEM NORMIST – manuálny vstup"
      subtitle="Čakanie na cenovú ponuku (CP) od NAZLI (NOR ELEKTRONIK, Istanbul)"
      canContinue={true}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card variant="warning" title="⚠ Postup">
          <ol className="space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
              <div>
                <p className="font-semibold text-gray-800">Systém vygeneruje Order Form pre NAZLI</p>
                <p className="text-gray-500 text-xs">Krok 8A – proforma faktúra pre NOR ELEKTRONIK Istanbul</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-semibold text-gray-800">NAZLI pošle cenovú ponuku (CP)</p>
                <p className="text-gray-500 text-xs">Počkajte na odpoveď z Istanbulu</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-semibold text-gray-800">Zadajte cenu NORMIST manuálne</p>
                <p className="text-gray-500 text-xs">Táto položka vstúpi do finálnej kalkulácie (krok 8B)</p>
              </div>
            </li>
          </ol>
        </Card>

        <Card title="Cena FOGSYSTEM NORMIST">
          <div className="mb-4 p-3 bg-gray-50 rounded-lg border text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Variant (osmotická voda)</span>
              <span className="font-semibold">{globalParams.osmoticWater ? 'SS' : 'ŠTANDARD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Počet zón</span>
              <span className="font-semibold">{globalParams.numberOfZones}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Krajina dodávky</span>
              <span className="font-semibold">{project.country}</span>
            </div>
          </div>

          <Input
            label="Cena FOGSYSTEM NORMIST (po CP od NAZLI)"
            unit="€"
            type="number"
            min={0}
            step={100}
            value={normistPrice}
            onChange={(e) => setNormistPrice(Number(e.target.value))}
            hint="Zadajte celkovú cenu po prijatí ponuky od NAZLI"
          />

          {normistPrice > 0 && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-600 font-semibold">✓ Cena zadaná</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{fmtE(normistPrice)}</p>
              <p className="text-xs text-gray-400 mt-1">Vstúpi automaticky do BOM (krok 8B)</p>
            </div>
          )}

          {normistPrice === 0 && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                Môžete pokračovať bez ceny NORMIST, ale BOM bude neúplný.
                Cenu doplníte neskôr.
              </p>
            </div>
          )}
        </Card>

        <Card variant="info" title="ℹ️ NAZLI bankové údaje (pre Order Form)">
          <div className="text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">SHIPPER</span>
              <span className="font-semibold">Sanfog s.r.o.</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">CUSTOMER</span>
              <span className="font-semibold">NOR ELEKTRONIK</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">SHIP VIA</span>
              <span className="font-semibold">AIR</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">PAYMENT</span>
              <span className="font-semibold">Prior to Shipment</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Banka</span>
              <span className="font-semibold">YAPI VE KREDI BANKASI</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">IBAN</span>
              <span className="font-semibold text-xs">TR69...</span>
            </div>
          </div>
        </Card>
      </div>
    </StepLayout>
  );
}
