import React, { useState } from 'react';
import {
  X,
  Grid,
  Clock,
  Zap,
  PlusCircle,
  ShieldAlert,
  UserCheck,
  MapPin,
  Sun,
  Moon,
  LogOut,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import type {
  StudentProfile,
  StockLocation,
  RentalAsset,
  UrgentCampusRequest,
  ItemCategory,
  OwnershipType,
} from '../types/lennder.ts';
import {
  createNewAssetListing,
  broadcastUrgentCampusRequest,
} from '../services/lennderApi.ts';

export type ActiveTabView =
  | 'DIRECTORY'
  | 'MY_RENTALS'
  | 'URGENT_BOARD'
  | 'LEND_ITEM'
  | 'OPERATIONS_ADMIN';

interface DashMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTabView;
  onSelectTab: (tab: ActiveTabView) => void;
  currentStudent: StudentProfile;
  onOpenOnboarding: () => void;
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
  onOpenOnboarding,
  isDark,
  onToggleTheme,
  activeRentalsCount,
  urgentOpenCount,
}) => {
  if (!isOpen) return null;

  const navItems: {
    id: ActiveTabView;
    label: string;
    subtitle: string;
    icon: React.FC<{ className?: string }>;
    count?: number;
  }[] = [
    {
      id: 'DIRECTORY',
      label: 'Campus Equipment Directory',
      subtitle: 'Lab Coats, Calculators & Laptops',
      icon: Grid,
    },
    {
      id: 'MY_RENTALS',
      label: 'My Rentals & Pickup Passes',
      subtitle: 'OTP Codes, Collateral Proof & Returns',
      icon: Clock,
      count: activeRentalsCount,
    },
    {
      id: 'URGENT_BOARD',
      label: 'Urgent Practical & Exam Board',
      subtitle: 'Broadcast or fulfill nearby needs',
      icon: Zap,
      count: urgentOpenCount,
    },
    {
      id: 'LEND_ITEM',
      label: 'Lend My Extra Item (P2P)',
      subtitle: 'List your extra lab coat or calculator',
      icon: PlusCircle,
    },
    {
      id: 'OPERATIONS_ADMIN',
      label: 'Stock Point & Founder Console',
      subtitle: 'Handover desk, ID review & unit economics',
      icon: ShieldAlert,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <aside className="relative w-full max-w-sm bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex flex-col justify-between z-10 overflow-y-auto">
        <div>
          {/* Top Brand & Close */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
                Lennder
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Campus Rental &amp; Stock Point Network
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Student Institutional Identity Card */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {currentStudent.fullName}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  {currentStudent.regNumber} · {currentStudent.level}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {currentStudent.department} · {currentStudent.institution}
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                {currentStudent.verificationStatus}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="w-full py-2.5 px-3.5 min-h-[44px] rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-500 transition-colors flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Update Institution / Student ID Verification</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
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
                  className={`w-full p-3.5 min-h-[56px] rounded-xl flex items-center justify-between text-left transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive
                          ? 'text-emerald-400 dark:text-white'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <div className="truncate">
                      <p className="text-sm font-semibold truncate">{item.label}</p>
                      <p
                        className={`text-xs truncate ${
                          isActive
                            ? 'text-slate-300 dark:text-emerald-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                  {typeof item.count === 'number' && item.count > 0 && (
                    <span
                      className={`ml-2 text-xs font-mono font-bold tabular-nums ${
                        isActive
                          ? 'text-emerald-300 dark:text-white'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Appearance & Blueprint Reference */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span>Interface Theme</span>
            <span className="flex items-center gap-1.5">
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              <span>{isDark ? 'Switch to Daylight Mode' : 'Switch to Dark Mode'}</span>
            </span>
          </button>

          <a
            href="/assets/aistudio/BorrowBox_Campus_Rental_Business_and_MVP_Plan_7d8f9bcb.pdf"
            target="_blank"
            rel="noreferrer"
            className="w-full py-2.5 px-4 min-h-[44px] rounded-xl bg-slate-100 dark:bg-slate-800/70 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>View Founder MVP Blueprint PDF</span>
            </span>
            <span className="font-mono text-[11px]">PDF</span>
          </a>
        </div>
      </aside>
    </div>
  );
};
