import { useProjectStore } from '../../store/projectStore';
import { StepLayout } from '../ui/StepLayout';
import { Input, Select, Card } from '../ui/FormField';

export function Step1_NewProject() {
  const { project, updateProject } = useProjectStore();

  const countryOptions = [
    { value: 'SK', label: '🇸🇰 Slovensko — 450 €' },
    { value: 'CZ', label: '🇨🇿 Česká republika — 450 €' },
    { value: 'HU', label: '🇭🇺 Maďarsko — 750 €' },
  ];

  return (
    <StepLayout
      stepNum={1}
      title="Štart – Nový projekt"
      subtitle="Zadajte základné informácie o projekte a zákazníkovi."
      canContinue={!!project.customerName && !!project.projectAddress}
      continueHint="Vyplňte meno zákazníka a adresu projektu"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Informácie o ponuke">
          <Input
            label="Číslo ponuky"
            value={project.quoteNumber}
            onChange={(e) => updateProject({ quoteNumber: e.target.value })}
            hint="Generuje sa automaticky, možno editovať"
          />
          <Input
            label="Dátum vystavenia"
            type="date"
            value={project.quoteDate}
            onChange={(e) => updateProject({ quoteDate: e.target.value })}
          />
        </Card>

        <Card title="Zákazník / Projekt">
          <Input
            label="Meno / Názov spoločnosti"
            value={project.customerName}
            onChange={(e) => updateProject({ customerName: e.target.value })}
            required
            placeholder="napr. Záhradníctvo Novák s.r.o."
          />
          <Input
            label="Adresa projektu (miesto inštalácie)"
            value={project.projectAddress}
            onChange={(e) => updateProject({ projectAddress: e.target.value })}
            required
            placeholder="napr. Veľké Nemčice, CZ"
          />
          <Select
            label="Krajina dodávky"
            value={project.country}
            onChange={(e) =>
              updateProject({ country: e.target.value as 'SK' | 'CZ' | 'HU' })
            }
            options={countryOptions}
            hint="Ovplyvňuje cenu prepravy"
          />
        </Card>

        <Card title="Kontaktné údaje">
          <Input
            label="Kontaktná osoba"
            value={project.contactPerson}
            onChange={(e) => updateProject({ contactPerson: e.target.value })}
            placeholder="Meno a priezvisko"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefón"
              type="tel"
              value={project.phone}
              onChange={(e) => updateProject({ phone: e.target.value })}
              placeholder="+421 ..."
            />
            <Input
              label="E-mail"
              type="email"
              value={project.email}
              onChange={(e) => updateProject({ email: e.target.value })}
              placeholder="email@example.com"
            />
          </div>
        </Card>

        <Card variant="info" title="ℹ️ Pravidlá dopravy">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">🇸🇰 Slovensko</span>
              <span className="font-semibold">450 €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">🇨🇿 Česká republika</span>
              <span className="font-semibold">450 €</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">🇭🇺 Maďarsko</span>
              <span className="font-semibold">750 €</span>
            </div>
            <p className="text-xs text-gray-400 pt-2 border-t">
              Táto hodnota vstupuje automaticky do kroku 6B (Doprava).
            </p>
          </div>
        </Card>
      </div>
    </StepLayout>
  );
}
