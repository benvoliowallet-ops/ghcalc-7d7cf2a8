import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Save, RotateCcw, Loader2, Check, AlertTriangle } from 'lucide-react';
import voraLogo from './assets/vora-logo.png';
import { useProjectStore } from './store/projectStore';
import { useAuthStore } from './store/authStore';
import { supabase } from '@/integrations/supabase/client';
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
import { ProjectSummary } from './components/ProjectSummary';
import { Sidebar } from './components/Sidebar';
import { useLoadProjects, useAutoSave } from './hooks/useProjects';
import { ConfirmProvider, useConfirm } from './hooks/useConfirm';
import { VoraAIChat } from './components/VoraAIChat';
import Portal from './pages/Portal';

type AppView = 'dashboard' | 'project' | 'stock' | 'changelog' | 'users' | 'summary';

const STEPS = [
{ num: 1, label: 'Nový projekt' },
{ num: 2, label: 'Globálne param.' },
{ num: 3, label: 'Zóny (3A–3L)' },
{ num: 4, label: 'Výber čerpadla' },
{ num: 5, label: 'Čerpadlo & ETNA' },
{ num: 6, label: 'Montáž & náklady' },
{ num: 7, label: 'NORMIST' },
{ num: 8, label: 'Dokumenty' },
{ num: 9, label: 'Kontrola' },
{ num: 10, label: 'Objednávka' }];


function SaveIndicator() {
  const saveStatus = useProjectStore((s) => s.saveStatus);
  if (saveStatus === 'idle') return null;
  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all"
      style={{
        color:
        saveStatus === 'saving' ? 'hsl(var(--white) / 0.5)' :
        saveStatus === 'saved' ? 'hsl(var(--teal))' :
        'hsl(0 80% 65%)'
      }}>
      {saveStatus === 'saving' && <Loader2 className="w-3 h-3 animate-spin" />}
      {saveStatus === 'saved' && <Check className="w-3 h-3" />}
      {saveStatus === 'error' && <AlertTriangle className="w-3 h-3" />}
      <span>
        {saveStatus === 'saving' ? 'Ukladám...' :
        saveStatus === 'saved' ? 'Uložené' :
        'Chyba ukladania'}
      </span>
    </div>);
}

function AutoSaveSubscriber({ view }: {view: AppView;}) {
  const { debouncedSave } = useAutoSave();
  const store = useProjectStore();

  useEffect(() => {
    if (view !== 'project') return;
    const snapshot = {
      currentStep: store.currentStep,
      project: store.project,
      globalParams: store.globalParams,
      zones: store.zones,
      zoneCalcs: store.zoneCalcs,
      cad: store.cad,
      pumpSelection: store.pumpSelection,
      etnaConfig: store.etnaConfig,
      normistPrice: store.normistPrice,
      costInputs: store.costInputs,
      uvSystemCode: store.uvSystemCode,
      ssFilter30: store.ssFilter30,
      activeZoneIndex: store.activeZoneIndex,
      ropeOverrides: store.ropeOverrides,
      preOrderState: store.preOrderState
    };
    debouncedSave(snapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
  store.currentStep, store.project, store.globalParams, store.zones,
  store.zoneCalcs, store.cad, store.pumpSelection, store.etnaConfig,
  store.normistPrice, store.costInputs, store.uvSystemCode, store.ssFilter30,
  store.activeZoneIndex, store.ropeOverrides, store.preOrderState, view]
  );

  return null;
}

function AppInner() {
  const { currentStep, setStep, project, resetProject, saveCurrentProject, loadProject, openProjectId } = useProjectStore();
  const { currentUser, loading, setCurrentUser, setLoading, loadProfile } = useAuthStore();
  const [view, setView] = useState<AppView>('dashboard');
  const confirm = useConfirm();

  useLoadProjects();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Načítavam...</div>
      </div>);
  }

  if (!currentUser) return <LoginPage />;

  const handleNewProject = async () => {
    const ok = await confirm({
      title: 'Vytvoriť nový projekt?',
      description: 'Neuložené zmeny budú stratené.',
      confirmLabel: 'Áno, nový projekt',
      variant: 'default'
    });
    if (ok) {
      resetProject();
      setView('project');
    }
  };

  const handleOpenProject = (id: string) => {
    loadProject(id);
    setView('project');
  };

  const handleOpenSummary = (id: string) => {
    loadProject(id);
    setView('summary');
  };

  const handleSaveAndClose = () => {
    saveCurrentProject();
    setView('dashboard');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:return <Step1_NewProject />;
      case 2:return <Step2_GlobalParams />;
      case 3:return <Step3_Zones />;
      case 4:return <Step4_PumpSelection />;
      case 5:return <Step5_PumpETNA />;
      case 6:return <Step6_Costs />;
      case 7:return <Step7_Normist />;
      case 8:return <Step8_Documents />;
      case 9:return <Step9_PreOrderCheck />;
      case 10:return <Step10_OrderForm />;
      default:return <Step1_NewProject />;
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard':return <Dashboard onOpenProject={handleOpenProject} onOpenSummary={handleOpenSummary} onNewProject={handleNewProject} />;
      case 'project':return <div className="max-w-7xl mx-auto px-4 py-6">{renderStep()}</div>;
      case 'summary':return <ProjectSummary onOpenWizard={() => setView('project')} onBack={() => setView('dashboard')} />;
      case 'stock':return <StockPage />;
      case 'changelog':return <ChangeLogPage />;
      case 'users':return currentUser.role === 'admin' ? <UsersPage /> :
        <div className="max-w-xl mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Prístup zamietnutý – iba pre adminov.</p>
        </div>;
    }
  };

  // Show comments panel only when viewing a project (wizard or summary)
  const showComments = view === 'project' || view === 'summary';

  return (
    <div className="min-h-screen bg-background flex" style={{ position: 'relative' }}>
      <AutoSaveSubscriber view={view} />

      {/* Sidebar */}
      <Sidebar
        view={view}
        setView={setView}
        onNewProject={handleNewProject}
        isAdmin={currentUser.role === 'admin'} />
      

      {/* Main content area — offset by sidebar icon width (w-14 = 3.5rem) */}
      <div className="flex flex-col flex-1 min-h-screen" style={{ marginLeft: '3.5rem' }}>

        {/* Project step strip */}
        {view === 'project' &&
        <div className="bg-navy border-b border-white/10 sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3">
              {/* Project info */}
              <div className="flex items-center gap-2 shrink-0">
                {project.quoteNumber &&
              <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-teal/40 bg-teal/10" style={{ borderRadius: 'var(--radius)' }}>
                    <span className="text-xs text-teal font-semibold font-mono">{project.quoteNumber}</span>
                    {project.customerName && <span className="text-xs text-white/50">· {project.customerName}</span>}
                  </div>
              }
                <SaveIndicator />
              </div>

              {/* Steps scroll */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {STEPS.map((step) => {
                  const isDone = step.num < currentStep;
                  const isActive = step.num === currentStep;
                  return (
                    <button
                      key={step.num}
                      onClick={() => setStep(step.num)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all whitespace-nowrap border ${
                      isActive ?
                      'bg-teal text-white border-teal' :
                      isDone ?
                      'bg-white/10 text-teal border-teal/30 hover:bg-teal/20' :
                      'text-white/30 border-transparent hover:text-white/60 hover:bg-white/5'}`
                      }
                      style={{ borderRadius: 'var(--radius)' }}>
                      
                        <span className={`w-4 h-4 flex items-center justify-center text-xs font-bold ${isActive ? 'text-white' : isDone ? 'text-teal' : 'text-white/30'}`}>
                          {isDone ? '✓' : step.num}
                        </span>
                        <span>{step.label}</span>
                      </button>);

                })}
                </div>
              </div>

              {/* Save + New */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                onClick={handleSaveAndClose}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-teal hover:bg-teal/90 text-white transition-colors"
                style={{ borderRadius: 'var(--radius)' }}>
                  <Save className="w-3.5 h-3.5" /> Uložiť
                </button>
                <button
                onClick={handleNewProject}
                className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white px-2 py-1 transition-colors">
                  <RotateCcw className="w-3.5 h-3.5" /> Nový
                </button>
              </div>
            </div>
          </div>
        }

        <main className="flex-1 overflow-auto">
          {renderContent()}
        </main>

        <footer className="border-t border-border bg-navy shrink-0">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-xs text-white/30">GreenHouse Calc · 2026 · v13</span>
            <div className="flex items-center gap-2 text-xs text-white/30">
              <span>made by VORA </span>
              <img alt="VORA" className="h-8 w-auto opacity-70" src="/lovable-uploads/029f5085-4877-4e0f-902e-565d9bab748c.png" />
            </div>
          </div>
        </footer>
      </div>

      <VoraAIChat />
    </div>);
}

function AppWithRouter() {
  return (
    <ConfirmProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/portal/:projectId" element={<Portal />} />
          <Route path="*" element={<AppInner />} />
        </Routes>
      </BrowserRouter>
    </ConfirmProvider>
  );
}

export default AppWithRouter;
