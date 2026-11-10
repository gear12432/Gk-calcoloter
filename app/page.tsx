'use client';

import React, { useState } from 'react';
import {
  ScreenId,
  HistoryRecord,
  AppSettings,
  loadHistory,
  saveHistory,
  loadSettings,
  saveSettings,
} from '@/lib/calculator-store';
import NavigationDrawer from '@/components/NavigationDrawer';
import GstCalculatorScreen from '@/components/GstCalculatorScreen';
import CurrencyConverterScreen from '@/components/CurrencyConverterScreen';
import CitizenCalculatorScreen from '@/components/CitizenCalculatorScreen';
import HistoryScreen from '@/components/HistoryScreen';
import AgeCalculatorScreen from '@/components/AgeCalculatorScreen';
import BanknoteCounterScreen from '@/components/BanknoteCounterScreen';
import {
  SettingsScreen,
  AboutScreen,
} from '@/components/SettingsAndAboutScreens';

export default function AllInOneCalculatorApp() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('citizen');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('citizen');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [history, setHistory] = useState<HistoryRecord[]>(() => loadHistory());

  const handleNavigate = (nextScreen: ScreenId) => {
    if (nextScreen !== activeScreen) {
      setPreviousScreen(activeScreen);
      setActiveScreen(nextScreen);
    }
    setIsDrawerOpen(false);
  };

  const handleUpdateSettings = (nextSettings: AppSettings) => {
    setSettings(nextSettings);
    saveSettings(nextSettings);
  };

  const handleAddHistory = (
    record: Omit<HistoryRecord, 'id' | 'timestamp'>
  ) => {
    const newEntry: HistoryRecord = {
      ...record,
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => {
      const updated = [newEntry, ...prev];
      saveHistory(updated);
      return updated;
    });
  };

  const handleDeleteHistoryRecords = (idsToDelete: string[]) => {
    setHistory((prev) => {
      const updated = prev.filter((item) => !idsToDelete.includes(item.id));
      saveHistory(updated);
      return updated;
    });
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    saveHistory([]);
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col bg-[#15191D] text-[#171717] relative overflow-hidden">
      {/* Left-Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        activeScreen={activeScreen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectScreen={handleNavigate}
        historyCount={history.length}
      />

      {/* Active Screen Container */}
      <div className="flex-1 flex flex-col w-full h-full overflow-hidden">
        {activeScreen === 'gst' && (
          <GstCalculatorScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onAddHistory={handleAddHistory}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenHistory={() => handleNavigate('history')}
          />
        )}

        {activeScreen === 'currency' && (
          <CurrencyConverterScreen
            settings={settings}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {activeScreen === 'citizen' && (
          <CitizenCalculatorScreen
            settings={settings}
            onAddHistory={handleAddHistory}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenHistory={() => handleNavigate('history')}
          />
        )}

        {activeScreen === 'history' && (
          <HistoryScreen
            settings={settings}
            history={history}
            onDeleteRecords={handleDeleteHistoryRecords}
            onClearAllHistory={handleClearAllHistory}
            onBack={() =>
              handleNavigate(
                previousScreen === 'history' ? 'gst' : previousScreen
              )
            }
          />
        )}

        {activeScreen === 'age' && (
          <AgeCalculatorScreen
            settings={settings}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {activeScreen === 'banknote' && (
          <BanknoteCounterScreen
            settings={settings}
            onAddHistory={handleAddHistory}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenHistory={() => handleNavigate('history')}
          />
        )}

        {activeScreen === 'settings' && (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onClearAllHistory={handleClearAllHistory}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        )}

        {activeScreen === 'about' && (
          <AboutScreen
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onSelectScreen={handleNavigate}
          />
        )}
      </div>
    </div>
  );
}
