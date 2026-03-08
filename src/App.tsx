import { useState } from 'react';
import { useProjectStore } from './store/projectStore';
import { useAuthStore } from './store/authStore';
import { Dashboard } from './components/Dashboard';
import { LoginPage } from './components/auth/LoginPage';
import { StockPage } from './components/stock/StockPage';
import { UsersPage } from './components/admin/UsersPage';
import { ChangeLogPage } from './components/admin/ChangeLogPage';
import { Step1_NewProject } from './components/steps/Step1_NewProject';
import { Step2_GlobalParams } from './components/steps/Step2_GlobalParams';
import { Step3_Zones } from './components/steps/Step3_Zones';
import { Step4_PumpSelection } from './components/steps/Step4_PumpSelection';
import { Step5_PumpETNA } from './components/steps/Step5_PumpETNA';
import { Step6_Costs } from './components/steps/Step6_Costs';
import { Step7_Normist } from './components/steps/Step7_Normist';
import { Step8_Documents } from './components/steps/Step8_Documents';
import { Step9_PreOrderCheck } from './components/steps/Step9_PreOrderCheck';
import { Step10_OrderForm } from './components/steps/Step10_OrderForm';

type AppView = 'dashboard' | 'project' | 'stock' | 'changelog' | 'users';

const STEPS = [
  { num: 1, label: 'Nový projekt', icon: '📋' },
  { num: 2, label: 'Globálne param.', icon: '⚙️' },
  { num: 3, label: 'Zóny (3A–3L)', icon: '🌿' },
  { num: 4, label: 'Výber čerpadla', icon: '💧' },
  { num: 5, label: 'Čerpadlo & ETNA', icon: '🔧' },
  { num: 6, label: 'Montáž & náklady', icon: '🚚' },
  { num: 7, label: 'NORMIST', icon: '📦' },
  { num: 8, label: 'Dokumenty', icon: '📄' },
  { num: 9, label: 'Kontrola', icon: '✅' },
  { num: 10, label: 'Objednávka', icon: '🛒' },
];

export default function App() {
  const { currentStep, setStep, project, resetProject, saveCurrentProject, loadProject } = useProjectStore();
  const { currentUser, logout } = useAuthStore();
  const [view, setView] = useState<AppView>('dashboard');

  if (!currentUser) return <LoginPage />;

  const handleNewProject = () => {
    if (window.confirm('Vytvoriť nový projekt? Neuložené zmeny budú stratené.')) {
      resetProject();
      setView('project');
    }
  };

  const handleOpenProject = (id: string) => {
    loadProject(id);
    setView('project');
  };

  const handleSaveAndClose = () => {
    saveCurrentProject();
    setView('dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1_NewProject />;
      case 2: return <Step2_GlobalParams />;
      case 3: return <Step3_Zones />;
      case 4: return <Step4_PumpSelection />;
      case 5: return <Step5_PumpETNA />;
      case 6: return <Step6_Costs />;
      case 7: return <Step7_Normist />;
      case 8: return <Step8_Documents />;
      case 9: return <Step9_PreOrderCheck />;
      case 10: return <Step10_OrderForm />;
      default: return <Step1_NewProject />;
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <Dashboard onOpenProject={handleOpenProject} onNewProject={handleNewProject} />;
      case 'project': return <div className="max-w-7xl mx-auto px-4 py-6">{renderStep()}</div>;
      case 'stock': return <StockPage />;
      case 'changelog': return <ChangeLogPage />;
      case 'users': return currentUser.role === 'admin' ? <UsersPage /> : (
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-500">Prístup zamietnutý – iba pre adminov.</p>
        </div>
      );
    }
  };

  const NavBtn = ({ target, icon, label }: { target: AppView; icon: string; label: string }) => (
    <button
      onClick={() => setView(target)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        view === target ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-9 w-auto flex items-center">
              <span className="text-green-600 font-bold text-lg">🌿 Sanfog</span>
            </div>
            <div className="hidden sm:block border-l border-gray-200 pl-3">
              <p className="text-xs font-semibold text-gray-700 leading-tight">Greenhouse Projekt</p>
              <p className="text-xs text-gray-400">Interný BOM kalkulátor</p>
            </div>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            <NavBtn target="dashboard" icon="📂" label="Projekty" />
            <NavBtn target="stock" icon="📦" label="Sklad" />
            <NavBtn target="changelog" icon="📋" label="Zmeny" />
            {currentUser.role === 'admin' && <NavBtn target="users" icon="👥" label="Používatelia" />}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {view === 'project' && (
              <>
                {project.quoteNumber && (
                  <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-xs text-green-600 font-semibold">📋</span>
                    <span className="text-xs text-green-700 font-mono font-bold">{project.quoteNumber}</span>
                    {project.customerName && <span className="text-xs text-gray-500">· {project.customerName}</span>}
                  </div>
                )}
                <button
                  onClick={handleSaveAndClose}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  💾 Uložiť
                </button>
                <button
                  onClick={handleNewProject}
                  className="text-xs text-gray-400 hover:text-red-500 px-2 py-1 rounded transition-colors"
                >
                  ↺ Nový
                </button>
              </>
            )}
            {view === 'dashboard' && (
              <button
                onClick={handleNewProject}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 hover:bg-green-700 text-white transition-colors"
              >
                ＋ Nový projekt
              </button>
            )}
            <div className="flex items-center gap-2 ml-1 pl-2 border-l border-gray-200">
              <span className="hidden md:block text-xs text-gray-500 font-medium">
                {currentUser.name.split(' ')[0]}
                {currentUser.role === 'admin' && <span className="ml-1 text-purple-500">👑</span>}
              </span>
              <button
                onClick={() => { if (window.confirm('Odhlásiť sa?')) logout(); }}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
              >
                🚪
              </button>
            </div>
          </div>
        </div>

        {view === 'project' && (
          <div className="max-w-7xl mx-auto px-4 pb-2 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {STEPS.map(step => {
                const isDone = step.num < currentStep;
                const isActive = step.num === currentStep;
                return (
                  <button
                    key={step.num}
                    onClick={() => setStep(step.num)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      isActive ? 'bg-green-600 text-white shadow-sm'
                      : isDone ? 'bg-green-50 text-green-700 hover:bg-green-100'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                      isActive ? 'bg-white/20' : isDone ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {isDone ? '✓' : step.num}
                    </span>
                    <span>{step.icon} {step.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main>{renderContent()}</main>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>🌿 Greenhouse Projekt · 2026 · v12</span>
          </div>
          <div className="text-xs text-gray-300">made by VORA</div>
        </div>
      </footer>
    </div>
  );
}
