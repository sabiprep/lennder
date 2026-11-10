import React from 'react';
import {
  X,
  Grid,
  Clock,
  Zap,
  PlusCircle,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react';
import type { StudentProfile } from '../types/lennder.ts';

export type ActiveTabView =
  | 'DIRECTORY'
  | 'MY_RENTALS'
  | 'URGENT_BOARD'
  | 'LEND_ITEM';

interface DashMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTabView;
  onSelectTab: (tab: ActiveTabView) => void;
  currentStudent: StudentProfile;
  onSwitchAccount: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  activeRentalsCount: number;
  urgentOpenCount: number;
}

export const DashMenuDrawer: React.FC<DashMenuDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentStudent,
  onSwitchAccount,
  isDark,
  onToggleTheme,
  activeRentalsCount,
  urgentOpenCount,
}) => {
  if (!isOpen) return null;

  const navItems: {
    id: ActiveTabView;
    label: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }[] = [
    {
      id: 'DIRECTORY',
      label: 'Main Directories & Items',
      icon: Grid,
    },
    {
      id: 'MY_RENTALS',
      label: 'My Rentals & Pickup Pass',
      icon: Clock,
      count: activeRentalsCount,
    },
    {
      id: 'URGENT_BOARD',
      label: 'Request Urgent Item',
      icon: Zap,
      count: urgentOpenCount,
    },
    {
      id: 'LEND_ITEM',
      label: 'Lend My Item',
      icon: PlusCircle,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <aside className="relative w-full max-w-xs bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 h-full flex flex-col justify-between z-10 overflow-y-auto">
        <div>
          {/* Top Brand */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#84CC16] flex items-center justify-center text-zinc-950 font-extrabold text-base">
                L
              </div>
              <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white font-display">
                lennder
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Summary Card */}
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-[#84CC16]/10 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-zinc-900 dark:text-white">
                {currentStudent.fullName}
              </p>
              <span className="text-[11px] font-mono font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                {currentStudent.verificationStatus}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
              ID: {currentStudent.id} · {currentStudent.regNumber} ({currentStudent.level})
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {currentStudent.department} · {currentStudent.institution}
            </p>
          </div>

          {/* Student-Only Menu Items (Zero Admin/Venue Leakage) */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    onClose();
                  }}
                  className={`w-full px-4 py-3 min-h-[48px] rounded-xl flex items-center justify-between text-left transition-colors ${
                    isActive
                      ? 'bg-[#84CC16] text-zinc-950 font-bold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span className="text-xs font-mono font-bold tabular-nums">
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Controls */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300"
          >
            <span>Theme</span>
            <span className="flex items-center gap-1.5">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSwitchAccount();
            }}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white flex items-center justify-center gap-2 text-xs font-bold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out / Auth &amp; Portal Switcher</span>
          </button>
        </div>
      </aside>
    </div>
  );
};
