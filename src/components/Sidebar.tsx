import React from 'react';
import { FolderOpen, Package, ScrollText, Users, Plus, LogOut, CheckSquare } from 'lucide-react';
import sanfogLogoWhite from '../assets/sanfog-logo-white.svg';
import { useAuthStore } from '../store/authStore';

type AppView = 'dashboard' | 'project' | 'stock' | 'changelog' | 'users' | 'summary' | 'tasks';

interface SidebarProps {
  view: AppView;
  setView: (v: AppView) => void;
  onNewProject: () => void;
  isAdmin: boolean;
}

interface NavItem {
  target: AppView;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
{ target: 'dashboard', icon: FolderOpen, label: 'Projekty' },
{ target: 'tasks', icon: CheckSquare, label: 'Úlohy' },
{ target: 'stock', icon: Package, label: 'Sklad' },
{ target: 'changelog', icon: ScrollText, label: 'Zmeny' }];


export function Sidebar({ view, setView, onNewProject, isAdmin }: SidebarProps) {
  const { currentUser, logout } = useAuthStore();

  const allItems = isAdmin ?
  [...NAV_ITEMS, { target: 'users' as AppView, icon: Users, label: 'Používatelia' }] :
  NAV_ITEMS;

  // 'summary' view should highlight the dashboard item
  const resolvedView = (view === 'summary' ? 'dashboard' : view) as AppView;

  return (
    <aside className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-navy border-r border-white/10 w-14 hover:w-52 transition-all duration-200 ease-in-out overflow-hidden group">
      {/* Logo */}
      <button
        onClick={() => setView('dashboard')}
        className="flex items-center h-14 px-3.5 border-b border-white/10 shrink-0 w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
        title="Projekty">
        <img
          alt="Sanfog"
          className="h-6 w-auto shrink-0 object-left object-contain"
          style={{ minWidth: '24px' }} src="/lovable-uploads/cb890b03-0832-4130-9565-f3add01e4434.png" />
        <span className="ml-3 text-xs font-bold text-white/80 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
          Greenhouse Calc
        </span>
      </button>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {allItems.map(({ target, icon: Icon, label }) => {
          const isActive = view === target || (target === 'dashboard' && view === 'summary');
          return (
            <button
              key={target}
              onClick={() => setView(target)}
              className={`flex items-center h-10 px-2 gap-3 transition-colors w-full text-left ${
              isActive ?
              'bg-teal/15 text-white border-l-2 border-teal' :
              'text-white/55 hover:text-white hover:bg-white/8 border-l-2 border-transparent'}`
              }
              style={{ borderRadius: '2px' }}
              title={label}>
              
              <div className="relative shrink-0">
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 1.75}
                  className={`shrink-0 ${isActive ? 'text-teal' : 'text-white/55 group-hover:text-white/70'}`} />
                {target === 'tasks' && taskBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none">
                    {taskBadge > 99 ? '99+' : taskBadge}
                  </span>
                )}
              </div>
              
              <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
                {label}
              </span>
            </button>);

        })}

        {/* Divider */}
        <div className="my-2 border-t border-white/10" />

        {/* New project */}
        <button
          onClick={onNewProject}
          className="flex items-center h-10 px-2 gap-3 hover:bg-teal/15 border-l-2 border-transparent hover:border-teal transition-colors w-full text-left text-orange"
          style={{ borderRadius: '2px' }}
          title="Nový projekt">
          
          <Plus size={18} strokeWidth={2} className="shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
            Nový projekt
          </span>
        </button>
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3 flex flex-col gap-1">
        {/* Username (visible on hover only) */}
        <div className="flex items-center gap-3 px-2 h-8 overflow-hidden">
          <div className="w-[18px] h-[18px] shrink-0 rounded-full bg-teal/30 flex items-center justify-center">
            <span className="text-[10px] font-bold text-teal uppercase">
              {currentUser?.name?.[0] ?? '?'}
            </span>
          </div>
          <span className="text-xs text-white/50 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75 truncate">
            {currentUser?.name?.split(' ')[0]}
            {currentUser?.role === 'admin' && <span className="ml-1 text-orange">★</span>}
          </span>
        </div>

        {/* Logout */}
        <button
          onClick={async () => {await logout();}}
          className="flex items-center h-9 px-2 gap-3 text-orange/70 hover:text-orange hover:bg-orange/10 border-l-2 border-transparent hover:border-orange transition-colors w-full text-left"
          style={{ borderRadius: '2px' }}
          title="Odhlásiť sa">
          
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
            Odhlásiť sa
          </span>
        </button>
      </div>
    </aside>);

}