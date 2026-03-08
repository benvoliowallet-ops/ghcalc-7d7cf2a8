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
                <p className="font-semibold text-foreground">Systém vygeneruje Order Form pre NAZLI</p>
                <p className="text-muted-foreground text-xs">Krok 8A – proforma faktúra pre NOR ELEKTRONIK Istanbul</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-amber-500 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
              <div>
                <p className="font-semibold text-foreground">NAZLI pošle cenovú ponuku (CP)</p>
                <p className="text-muted-foreground text-xs">Počkajte na odpoveď z Istanbulu</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-teal text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
              <div>
                <p className="font-semibold text-foreground">Zadajte cenu NORMIST manuálne</p>
                <p className="text-muted-foreground text-xs">Táto položka vstúpi do finálnej kalkulácie (krok 8B)</p>
              </div>
            </li>
          </ol>
        </Card>

        <Card title="Cena FOGSYSTEM NORMIST">
          <div className="mb-4 p-3 bg-muted rounded-lg border border-border text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Variant (osmotická voda)</span>
              <span className="font-semibold">{globalParams.osmoticWater ? 'SS' : 'ŠTANDARD'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Počet zón</span>
              <span className="font-semibold">{globalParams.numberOfZones}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Krajina dodávky</span>
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
            <div className="mt-4 p-3 bg-teal/10 border border-teal/30 rounded-lg">
              <p className="text-xs text-teal font-semibold">✓ Cena zadaná</p>
              <p className="text-2xl font-bold text-teal mt-1">{fmtE(normistPrice)}</p>
              <p className="text-xs text-muted-foreground mt-1">Vstúpi automaticky do BOM (krok 8B)</p>
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
            {[
              { label: 'SHIPPER', value: 'Sanfog s.r.o.' },
              { label: 'CUSTOMER', value: 'NOR ELEKTRONIK' },
              { label: 'SHIP VIA', value: 'AIR' },
              { label: 'PAYMENT', value: 'Prior to Shipment' },
              { label: 'Banka', value: 'YAPI VE KREDI BANKASI' },
              { label: 'IBAN', value: 'TR69...' },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold text-xs">{value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </StepLayout>
  );
}
