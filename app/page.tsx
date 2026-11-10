'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ScreenId,
  HistoryRecord,
  AppSettings,
  DEFAULT_SETTINGS,
  INITIAL_SAMPLE_HISTORY,
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
  const [activeScreen, setActiveScreen] = useState<ScreenId>('gst');
  const [previousScreen, setPreviousScreen] = useState<ScreenId>('gst');
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
    <div className="min-h-screen w-full flex flex-col bg-[#F2FFF7] text-[#171717] relative overflow-x-hidden">
      {/* Left-Side Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        activeScreen={activeScreen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectScreen={handleNavigate}
        historyCount={history.length}
      />

      {/* Screen Content with Smooth Transitions */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeScreen}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="flex-1 flex flex-col w-full"
        >
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
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
