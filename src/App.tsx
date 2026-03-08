import { useState } from 'react';
import sanfogLogoWhite from './assets/sanfog-logo-white.svg';
import voraLogo from './assets/vora-logo.png';
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
          <p className="text-muted-foreground">Prístup zamietnutý – iba pre adminov.</p>
        </div>
      );
    }
  };

  const NavBtn = ({ target, icon, label }: { target: AppView; icon: string; label: string }) => (
    <button
      onClick={() => setView(target)}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase transition-colors border ${
        view === target
          ? 'bg-teal text-white border-teal'
          : 'bg-transparent text-white/70 border-white/20 hover:border-teal hover:text-white'
      }`}
      style={{ borderRadius: 'var(--radius)' }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white border-b border-white/10 sticky top-0 z-50">
...
      <main className="flex-1">{renderContent()}</main>

      <footer className="border-t border-border bg-navy">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>Greenhouse Projekt · 2026 · v12</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/30">
            <span>made by</span>
            <img src={voraLogo} alt="VORA" className="h-5 w-auto opacity-50" />
          </div>
        </div>
      </footer>
    </div>
  );
}
