import React from 'react';
import { FolderOpen, Package, ScrollText, Users, Plus, LogOut, CheckSquare } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useTasks } from '../hooks/useTasks';

interface SidebarProps {
  onNewProject: () => void;
  isAdmin: boolean;
}

interface NavItem {
  path: string;
  icon: React.ElementType;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { path: '/', icon: FolderOpen, label: 'Projekty' },
  { path: '/tasks', icon: CheckSquare, label: 'Úlohy' },
  { path: '/stock', icon: Package, label: 'Sklad' },
  { path: '/changelog', icon: ScrollText, label: 'Zmeny' },
];

export function Sidebar({ onNewProject, isAdmin }: SidebarProps) {
  const { currentUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { tasks: openTasks } = useTasks({ assignedTo: currentUser?.id });
  const taskBadge = openTasks.length;

  const allItems = isAdmin
    ? [...NAV_ITEMS, { path: '/users', icon: Users, label: 'Používatelia' }]
    : NAV_ITEMS;

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname.startsWith('/projects/');
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen z-50 flex flex-col bg-navy border-r border-white/10 w-14 hover:w-52 transition-all duration-200 ease-in-out overflow-hidden group">
      {/* Logo */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center h-14 px-3.5 border-b border-white/10 shrink-0 w-full text-left hover:opacity-80 transition-opacity cursor-pointer"
        title="Projekty"
      >
        <img
          alt="Sanfog"
          className="h-6 w-auto shrink-0 object-left object-contain"
          style={{ minWidth: '24px' }}
          src="/lovable-uploads/cb890b03-0832-4130-9565-f3add01e4434.png"
        />
        <span className="ml-3 text-xs font-bold text-white/80 uppercase tracking-widest whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
          Greenhouse Calc
        </span>
      </button>

      {/* Nav items */}
      <nav className="flex-1 py-3 flex flex-col gap-0.5 px-2">
        {allItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center h-10 px-2 gap-3 transition-colors w-full text-left ${
                active
                  ? 'bg-teal/15 text-white border-l-2 border-teal'
                  : 'text-white/55 hover:text-white hover:bg-white/8 border-l-2 border-transparent'
              }`}
              style={{ borderRadius: '2px' }}
              title={label}
            >
              <div className="relative shrink-0">
                <Icon
                  size={18}
                  strokeWidth={active ? 2.5 : 1.75}
                  className={`shrink-0 ${active ? 'text-teal' : 'text-white/55 group-hover:text-white/70'}`}
                />
                {path === '/tasks' && taskBadge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-0.5 leading-none">
                    {taskBadge > 99 ? '99+' : taskBadge}
                  </span>
                )}
              </div>

              <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
                {label}
              </span>
            </button>
          );
        })}

        {/* Divider */}
        <div className="my-2 border-t border-white/10" />

        {/* New project */}
        <button
          onClick={onNewProject}
          className="flex items-center h-10 px-2 gap-3 hover:bg-teal/15 border-l-2 border-transparent hover:border-teal transition-colors w-full text-left text-orange"
          style={{ borderRadius: '2px' }}
          title="Nový projekt"
        >
          <Plus size={18} strokeWidth={2} className="shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
            Nový projekt
          </span>
        </button>
      </nav>

      {/* User + logout */}
      <div className="shrink-0 border-t border-white/10 px-2 py-3 flex flex-col gap-1">
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

        <button
          onClick={async () => { await logout(); }}
          className="flex items-center h-9 px-2 gap-3 text-orange/70 hover:text-orange hover:bg-orange/10 border-l-2 border-transparent hover:border-orange transition-colors w-full text-left"
          style={{ borderRadius: '2px' }}
          title="Odhlásiť sa"
        >
          <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
          <span className="text-xs font-semibold tracking-wide uppercase whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 delay-75">
            Odhlásiť sa
          </span>
        </button>
      </div>
    </aside>
  );
}
