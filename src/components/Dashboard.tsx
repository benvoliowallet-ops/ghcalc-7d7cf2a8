import { useProjectStore } from '../store/projectStore';
import type { SavedProject } from '../types';

const COUNTRY_FLAG: Record<string, string> = { SK: '🇸🇰', CZ: '🇨🇿', HU: '🇭🇺' };

const STEP_LABELS: Record<number, string> = {
  1: 'Nový projekt', 2: 'Globálne param.', 3: 'Zóny', 4: 'Čerpadlo',
  5: 'ETNA', 6: 'Náklady', 7: 'NORMIST', 8: 'Dokumenty', 9: 'Kontrola', 10: '✅ Hotovo',
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('sk-SK', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso.slice(0, 10);
  }
}

function StepProgress({ step }: { step: number }) {
  const pct = Math.round((step / 10) * 100);
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Krok {step}/10 – {STEP_LABELS[step] ?? ''}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-muted overflow-hidden" style={{ borderRadius: 'var(--radius)' }}>
        <div
          className="h-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: step === 10 ? 'hsl(var(--teal))' : 'hsl(var(--teal))' }}
        />
      </div>
    </div>
  );
}

interface ProjectCardProps {
  project: SavedProject;
  onOpen: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, onOpen, onDelete }: ProjectCardProps) {
  const done = project.currentStep === 10;
  return (
    <div
      className={`bg-card border transition-shadow hover:shadow-sm p-5 flex flex-col gap-3 ${
        done ? 'border-teal/40' : 'border-border'
      }`}
      style={{ borderRadius: 'var(--radius)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-teal">{project.quoteNumber}</span>
            <span className="text-lg">{COUNTRY_FLAG[project.country] ?? ''}</span>
            {done && (
              <span
                className="text-xs bg-teal/10 text-teal px-2 py-0.5 font-semibold border border-teal/30 uppercase tracking-wide"
                style={{ borderRadius: 'var(--radius)' }}
              >
                Hotovo
              </span>
            )}
          </div>
          {project.customerName ? (
            <p className="font-semibold text-foreground mt-0.5">{project.customerName}</p>
          ) : (
            <p className="text-muted-foreground text-sm italic mt-0.5">Bez zákazníka</p>
          )}
          {project.projectAddress && (
            <p className="text-xs text-muted-foreground mt-0.5">📍 {project.projectAddress}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Naozaj zmazať projekt ${project.quoteNumber}?`)) onDelete();
          }}
          className="text-muted-foreground/30 hover:text-destructive transition-colors text-lg leading-none p-1"
          title="Zmazať projekt"
        >
          🗑
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>🌿 {project.numZones} {project.numZones === 1 ? 'zóna' : 'zóny'}</span>
        <span>🕒 {formatDate(project.savedAt)}</span>
      </div>

      <StepProgress step={project.currentStep} />

      {/* Actions */}
      <button
        onClick={onOpen}
        className="mt-1 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold uppercase tracking-wide transition-colors"
        style={{ borderRadius: 'var(--radius)' }}
      >
        {done ? '📄 Prehľad projektu' : '▶ Pokračovať'}
      </button>
    </div>
  );
}

interface DashboardProps {
  onOpenProject: (id: string) => void;
  onOpenSummary: (id: string) => void;
  onNewProject: () => void;
}

export function Dashboard({ onOpenProject, onOpenSummary, onNewProject }: DashboardProps) {
  const { savedProjects, deleteSavedProject } = useProjectStore();

  const sorted = [...savedProjects].sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
  );

  const done = sorted.filter((p) => p.currentStep === 10);
  const inProgress = sorted.filter((p) => p.currentStep < 10);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground uppercase tracking-wide">Projekty</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sorted.length === 0
              ? 'Žiadne uložené projekty'
              : `${sorted.length} projektov · ${done.length} dokončených`}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wide text-sm transition-colors"
          style={{ borderRadius: 'var(--radius)' }}
        >
          ＋ Nový projekt
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div
          className="text-center py-24 bg-card border border-dashed border-border"
          style={{ borderRadius: 'var(--radius)' }}
        >
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-xl font-semibold text-foreground mb-2">Zatiaľ žiadne projekty</p>
          <p className="text-muted-foreground mb-6">Začni tým, že vytvoríš nový projekt</p>
          <button
            onClick={onNewProject}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold uppercase tracking-wide transition-colors"
            style={{ borderRadius: 'var(--radius)' }}
          >
            ＋ Nový projekt
          </button>
        </div>
      )}

      {/* In-progress */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2">
            V procese ({inProgress.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => onOpenProject(p.id)}
                onDelete={() => deleteSavedProject(p.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {done.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3 border-b border-border pb-2">
            Dokončené ({done.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {done.map((p) => (
              <ProjectCard
                key={p.id}
                project={p}
                onOpen={() => onOpenProject(p.id)}
                onDelete={() => deleteSavedProject(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
