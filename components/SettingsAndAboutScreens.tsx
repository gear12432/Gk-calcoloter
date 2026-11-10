'use client';

import React, { useState } from 'react';
import {
  Menu,
  Volume2,
  VolumeX,
  RotateCcw,
  Check,
  Calculator,
  Percent,
  Globe,
  History,
  Calendar,
  Banknote,
} from 'lucide-react';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  ScreenId,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface SettingsScreenProps {
  settings: AppSettings;
  onUpdateSettings: (next: AppSettings) => void;
  onClearAllHistory: () => void;
  onOpenDrawer: () => void;
}

export function SettingsScreen({
  settings,
  onUpdateSettings,
  onClearAllHistory,
  onOpenDrawer,
}: SettingsScreenProps) {
  const [savedBanner, setSavedBanner] = useState(false);

  const triggerSaved = () => {
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 1800);
  };

  return (
    <div className="h-full flex-1 min-h-0 w-full overflow-y-auto bg-gradient-to-b from-[#E9FFF0] via-[#F2FFF7] to-[#B9EFCB] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#10232B] text-white h-14 px-4 flex items-center justify-between shadow-md border-b border-[#15191D]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open navigation drawer"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">
            Settings
          </h1>
        </div>
        {savedBanner && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#C5F4D5]">
            <Check className="w-4 h-4" />
            <span>Preferences Saved</span>
          </div>
        )}
      </header>

      <main className="flex-1 w-full p-4 sm:p-6 space-y-4">
        {/* Numbering System & Currency Symbol */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E9E9EC] space-y-4">
          <h2 className="text-base font-bold text-[#10232B] border-b border-[#E9E9EC] pb-2.5">
            Display & Formatting Preferences
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[#171717]">
                Numbering System & Words Format
              </div>
              <div className="text-xs text-neutral-500">
                Choose Indian (Lakh, Crore) or Western (Million, Billion)
              </div>
            </div>
            <div className="flex rounded-xl bg-neutral-100 p-1 border border-[#E9E9EC]">
              <button
                type="button"
                onClick={() => {
                  playKeyFeedback(settings.soundEnabled);
                  onUpdateSettings({ ...settings, numberFormat: 'INDIA' });
                  triggerSaved();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                  settings.numberFormat === 'INDIA'
                    ? 'bg-[#347BCB] text-white'
                    : 'text-neutral-600'
                }`}
              >
                India (1,00,000)
              </button>
              <button
                type="button"
                onClick={() => {
                  playKeyFeedback(settings.soundEnabled);
                  onUpdateSettings({ ...settings, numberFormat: 'WESTERN' });
                  triggerSaved();
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${
                  settings.numberFormat === 'WESTERN'
                    ? 'bg-[#347BCB] text-white'
                    : 'text-neutral-600'
                }`}
              >
                Western (100,000)
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E9E9EC]">
            <div>
              <div className="text-sm font-bold text-[#171717]">
                Default Currency Symbol
              </div>
              <div className="text-xs text-neutral-500">
                Used on GST Calculator, Loan EMI, and History screens
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {['₹', '$', '€', '£', 'د.إ'].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    playKeyFeedback(settings.soundEnabled);
                    onUpdateSettings({ ...settings, currencySymbol: sym });
                    triggerSaved();
                  }}
                  className={`w-10 h-10 rounded-xl font-mono font-bold text-sm border ${
                    settings.currencySymbol === sym
                      ? 'bg-[#10232B] text-white border-[#10232B]'
                      : 'bg-[#F2FFF7] text-[#10232B] border-[#C5F4D5]'
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E9E9EC]">
            <div>
              <div className="text-sm font-bold text-[#171717]">
                Decimal Precision
              </div>
              <div className="text-xs text-neutral-500">
                Maximum decimal places for tax and currency calculations
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {[0, 2, 3, 4].map((dec) => (
                <button
                  key={dec}
                  type="button"
                  onClick={() => {
                    playKeyFeedback(settings.soundEnabled);
                    onUpdateSettings({ ...settings, decimalPlaces: dec });
                    triggerSaved();
                  }}
                  className={`px-3.5 py-2 rounded-xl font-mono font-bold text-xs border ${
                    settings.decimalPlaces === dec
                      ? 'bg-[#347BCB] text-white border-[#347BCB]'
                      : 'bg-neutral-50 text-neutral-700 border-[#E9E9EC]'
                  }`}
                >
                  {dec} Decimals
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* GST Shortcut Presets & Key Sound */}
        <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E9E9EC] space-y-4">
          <h2 className="text-base font-bold text-[#10232B] border-b border-[#E9E9EC] pb-2.5">
            Keypad & Audio Feedback
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#171717]">
                Tactile Key Click Sound & Haptics
              </div>
              <div className="text-xs text-neutral-500">
                Play subtle mechanical Citizen key click on button press
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const nextVal = !settings.soundEnabled;
                onUpdateSettings({ ...settings, soundEnabled: nextVal });
                if (nextVal) playKeyFeedback(true);
                triggerSaved();
              }}
              className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 ${
                settings.soundEnabled
                  ? 'bg-[#C5F4D5] text-[#10232B]'
                  : 'bg-neutral-100 text-neutral-600'
              }`}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-4 h-4" />
                  <span>Enabled</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-[#E9E9EC] flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                onUpdateSettings(DEFAULT_SETTINGS);
                triggerSaved();
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-xs font-bold text-[#10232B] flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restore Default Settings</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClearAllHistory();
                triggerSaved();
              }}
              className="px-4 py-2.5 rounded-xl bg-[#D83B29] hover:bg-[#bf3222] text-xs font-bold text-white"
            >
              Clear Saved History
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

interface AboutScreenProps {
  onOpenDrawer: () => void;
  onSelectScreen: (screen: ScreenId) => void;
}

export function AboutScreen({ onOpenDrawer, onSelectScreen }: AboutScreenProps) {
  const tools = [
    {
      id: 'gst' as ScreenId,
      title: '1. GST Rates Calculator',
      desc: 'Add or remove GST (+5% to +25% or custom slabs), with instant CGST, SGST, and IGST invoice breakdown.',
      icon: Percent,
    },
    {
      id: 'currency' as ScreenId,
      title: '2. Currency Converter',
      desc: 'Live global exchange rates across 20+ world currencies with source/target swap and searchable cards.',
      icon: Globe,
    },
    {
      id: 'citizen' as ScreenId,
      title: '3. Citizen Calculator & Loan EMI',
      desc: 'Classic CT-512N Citizen LCD layout with GT, MU, M+, M-, MR, Step Check, and integrated Loan EMI Calculator.',
      icon: Calculator,
    },
    {
      id: 'history' as ScreenId,
      title: '4. Calculation History',
      desc: 'Persistent local calculation log with multi-select, WhatsApp share, clipboard copy, and CSV export.',
      icon: History,
    },
    {
      id: 'age' as ScreenId,
      title: '5. Age Calculator',
      desc: 'Leap-year accurate chronological age in Years, Months, Days, Next Birthday countdown, and total hours lived.',
      icon: Calendar,
    },
    {
      id: 'banknote' as ScreenId,
      title: '6. Banknote Cash Counter',
      desc: 'Indian denomination tally (₹500 down to ₹1) with instant piece count and India/Western amount in words.',
      icon: Banknote,
    },
  ];

  return (
    <div className="h-full flex-1 min-h-0 w-full overflow-y-auto bg-gradient-to-b from-[#E9FFF0] via-[#F2FFF7] to-[#B9EFCB] flex flex-col">
      <header className="sticky top-0 z-30 bg-[#10232B] text-white h-14 px-4 flex items-center justify-between shadow-md border-b border-[#15191D]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open navigation drawer"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">
            About Application
          </h1>
        </div>
      </header>

      <main className="flex-1 w-full p-4 sm:p-6 space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-[#E9E9EC]">
          <div className="flex items-center gap-4 border-b border-[#E9E9EC] pb-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-[#A6B991] text-[#101010] border-2 border-[#8d9f78] flex items-center justify-center font-mono font-extrabold text-2xl shadow-inner">
              ±%
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[#10232B]">
                All-in-One Citizen & GST Calculator
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Complete Financial, Tax, Commercial & Utility Suite
              </p>
            </div>
          </div>

          <p className="text-sm text-neutral-700 leading-relaxed mb-5">
            Engineered with authentic Citizen LCD aesthetics, tactile 3D charcoal
            keys, and high-precision arithmetic. All six core calculators operate
            seamlessly with persistent local storage.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onSelectScreen(t.id)}
                  className="text-left p-4 rounded-xl bg-[#F2FFF7] hover:bg-[#C5F4D5]/60 border border-[#C5F4D5] transition-colors flex items-start gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#10232B] text-white flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#10232B]">
                      {t.title}
                    </div>
                    <div className="text-xs text-neutral-600 mt-1 leading-snug">
                      {t.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
