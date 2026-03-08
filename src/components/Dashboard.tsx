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
      <div className="flex justify-between text-xs text-gray-400 mb-1">
        <span>Krok {step}/10 – {STEP_LABELS[step] ?? ''}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${step === 10 ? 'bg-emerald-500' : 'bg-green-400'}`}
          style={{ width: `${pct}%` }}
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
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-3 ${
      done ? 'border-emerald-200' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-green-700">{project.quoteNumber}</span>
            <span className="text-lg">{COUNTRY_FLAG[project.country] ?? ''}</span>
            {done && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Hotovo</span>}
          </div>
          {project.customerName ? (
            <p className="font-semibold text-gray-800 mt-0.5">{project.customerName}</p>
          ) : (
            <p className="text-gray-400 text-sm italic mt-0.5">Bez zákazníka</p>
          )}
          {project.projectAddress && (
            <p className="text-xs text-gray-500 mt-0.5">📍 {project.projectAddress}</p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Naozaj zmazať projekt ${project.quoteNumber}?`)) onDelete();
          }}
          className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none p-1"
          title="Zmazať projekt"
        >
          🗑
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>🌿 {project.numZones} {project.numZones === 1 ? 'zóna' : 'zóny'}</span>
        <span>🕒 {formatDate(project.savedAt)}</span>
      </div>

      <StepProgress step={project.currentStep} />

      {/* Actions */}
      <button
        onClick={onOpen}
        className="mt-1 w-full py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors"
      >
        {done ? '📄 Otvoriť / Tlačiť' : '▶ Pokračovať'}
      </button>
    </div>
  );
}

interface DashboardProps {
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
}

export function Dashboard({ onOpenProject, onNewProject }: DashboardProps) {
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
          <h1 className="text-2xl font-bold text-gray-900">📂 Projekty</h1>
          <p className="text-sm text-gray-500 mt-1">
            {sorted.length === 0
              ? 'Žiadne uložené projekty'
              : `${sorted.length} projektov · ${done.length} dokončených`}
          </p>
        </div>
        <button
          onClick={onNewProject}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow transition-colors"
        >
          ＋ Nový projekt
        </button>
      </div>

      {/* Empty state */}
      {sorted.length === 0 && (
        <div className="text-center py-24 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-6xl mb-4">🌿</div>
          <p className="text-xl font-semibold text-gray-600 mb-2">Zatiaľ žiadne projekty</p>
          <p className="text-gray-400 mb-6">Začni tým, že vytvoríš nový projekt</p>
          <button
            onClick={onNewProject}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors"
          >
            ＋ Nový projekt
          </button>
        </div>
      )}

      {/* In-progress */}
      {inProgress.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
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
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">
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
