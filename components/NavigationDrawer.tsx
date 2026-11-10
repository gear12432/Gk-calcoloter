'use client';

import React from 'react';
import {
  Percent,
  Globe,
  Calculator,
  History,
  Calendar,
  Banknote,
  Settings,
  Info,
  X,
  ChevronRight,
} from 'lucide-react';
import { ScreenId } from '@/lib/calculator-store';

interface NavigationDrawerProps {
  isOpen: boolean;
  activeScreen: ScreenId;
  onClose: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  historyCount: number;
}

interface NavItem {
  id: ScreenId;
  label: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'citizen',
    label: 'Citizen Calculator',
    subtitle: 'GT, MU, Memory & Loan EMI',
    icon: Calculator,
  },
  {
    id: 'gst',
    label: 'GST Rates',
    subtitle: 'CGST, SGST, IGST & Slabs',
    icon: Percent,
  },
  {
    id: 'currency',
    label: 'Currency Converter',
    subtitle: 'Live Global Exchange Rates',
    icon: Globe,
  },
  {
    id: 'history',
    label: 'History',
    subtitle: 'Saved Calculation Records',
    icon: History,
  },
  {
    id: 'age',
    label: 'Age Calculator',
    subtitle: 'Exact Age & Next Birthday',
    icon: Calendar,
  },
  {
    id: 'banknote',
    label: 'Banknote Counter',
    subtitle: 'Money Cash & Words Total',
    icon: Banknote,
  },
  {
    id: 'settings',
    label: 'Settings',
    subtitle: 'GST Slabs, Format & Sound',
    icon: Settings,
  },
  {
    id: 'about',
    label: 'About Application',
    subtitle: 'Features & Specifications',
    icon: Info,
  },
];

export default function NavigationDrawer({
  isOpen,
  activeScreen,
  onClose,
  onSelectScreen,
  historyCount,
}: NavigationDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Content */}
      <aside className="relative z-10 w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden border-r border-[#E9E9EC]">
        {/* Top Dark Navy Drawer Header */}
        <div>
          <div className="bg-[#10232B] text-white p-5 flex items-center justify-between border-b border-[#15191D]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#A6B991] text-[#101010] flex items-center justify-center font-mono font-bold text-lg shadow-inner border border-white/20">
                ±%
              </div>
              <div>
                <h2 className="font-bold text-base tracking-tight text-white">
                  All-in-One Calculator
                </h2>
                <p className="text-xs text-[#C5F4D5] font-medium">
                  Citizen · GST · Cash · FX
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close navigation menu"
              className="w-10 h-10 rounded-lg flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-150px)]">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeScreen === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectScreen(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all ${
                    isActive
                      ? 'bg-[#C5F4D5] text-[#10232B] font-bold shadow-xs'
                      : 'text-[#171717] hover:bg-[#F2FFF7] font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-[#10232B] text-white'
                          : 'bg-[#F2FFF7] text-[#10232B] border border-[#C5F4D5]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm leading-tight truncate flex items-center gap-2">
                        <span>{item.label}</span>
                        {item.id === 'history' && historyCount > 0 && (
                          <span className="text-xs font-mono font-semibold text-[#347BCB]">
                            ({historyCount})
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 truncate mt-0.5 font-normal">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#10232B]' : 'text-neutral-400'
                    }`}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Drawer Footer */}
        <div className="p-4 bg-[#F2FFF7] border-t border-[#E9E9EC] text-xs text-[#10232B]/80 flex items-center justify-between">
          <span>Citizen LCD Series</span>
          <span>Offline Ready</span>
        </div>
      </aside>
    </div>
  );
}
