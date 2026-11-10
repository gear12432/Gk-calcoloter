'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Menu,
  RefreshCw,
  PlusCircle,
  ArrowUpDown,
  Search,
  Star,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  AppSettings,
  POPULAR_CURRENCIES,
  CurrencyInfo,
  loadActiveCurrencies,
  saveActiveCurrencies,
  formatNumber,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface CurrencyConverterScreenProps {
  settings: AppSettings;
  onOpenDrawer: () => void;
}

export default function CurrencyConverterScreen({
  settings,
  onOpenDrawer,
}: CurrencyConverterScreenProps) {
  const [fromCode, setFromCode] = useState<string>('USD');
  const [toCode, setToCode] = useState<string>('INR');
  const [amountStr, setAmountStr] = useState<string>('100');
  const [rates, setRates] = useState<Record<string, number>>({});
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [providerName, setProviderName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCodes, setActiveCodes] = useState<string[]>(() =>
    loadActiveCurrencies()
  );
  const [isAddCurrencyModalOpen, setIsAddCurrencyModalOpen] = useState(false);

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const fetchLiveRates = useCallback(async (baseCurrency: string) => {
    const upper = baseCurrency.toUpperCase();
    try {
      // Direct CORS-enabled live exchange rate API (works on both GitHub Pages static & Node server)
      const directRes = await fetch(
        `https://open.er-api.com/v6/latest/${encodeURIComponent(upper)}`
      );
      if (directRes.ok) {
        const directData = await directRes.json();
        if (directData && directData.rates) {
          setRates(directData.rates);
          setLastUpdated(
            directData.time_last_update_utc
              ? new Date(directData.time_last_update_utc).toISOString()
              : new Date().toISOString()
          );
          setProviderName('ExchangeRate-API Live');
          setErrorMsg(null);
          return;
        }
      }

      // Fallback to Next.js API route
      const res = await fetch(`/api/rates?base=${encodeURIComponent(upper)}`);
      if (!res.ok) {
        throw new Error(`Exchange rate server returned status ${res.status}`);
      }
      const data = await res.json();
      if (data.error || !data.rates) {
        throw new Error(data.error || 'Invalid rate payload');
      }
      setRates(data.rates);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setProviderName(data.provider || 'Live FX Feed');
      setErrorMsg(null);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Unable to reach live exchange-rate server. Please check connection and tap Refresh.'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    const upper = fromCode.toUpperCase();
    fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(upper)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Primary rate endpoint error');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        if (data && data.rates) {
          setRates(data.rates);
          setLastUpdated(
            data.time_last_update_utc
              ? new Date(data.time_last_update_utc).toISOString()
              : new Date().toISOString()
          );
          setProviderName('ExchangeRate-API Live');
          setErrorMsg(null);
        }
      })
      .catch(async () => {
        if (!active) return;
        try {
          const fallback = await fetch(`/api/rates?base=${encodeURIComponent(upper)}`);
          const fbData = await fallback.json();
          if (active && fbData && fbData.rates) {
            setRates(fbData.rates);
            setLastUpdated(fbData.lastUpdated || new Date().toISOString());
            setProviderName(fbData.provider || 'Live FX Feed');
            setErrorMsg(null);
          }
        } catch {
          if (active) {
            setErrorMsg('Unable to reach live exchange-rate server. Tap Refresh to retry.');
          }
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fromCode]);

  const handleSwapCurrencies = () => {
    feedback();
    const prevFrom = fromCode;
    const prevTo = toCode;
    setFromCode(prevTo);
    setToCode(prevFrom);
  };

  const handleToggleCurrencyInList = (code: string) => {
    feedback();
    setActiveCodes((prev) => {
      const next = prev.includes(code)
        ? prev.filter((c) => c !== code)
        : [...prev, code];
      saveActiveCurrencies(next);
      return next;
    });
  };

  const getCurrencyMeta = (code: string): CurrencyInfo => {
    return (
      POPULAR_CURRENCIES.find((c) => c.code === code) || {
        code,
        name: code,
        symbol: code,
        country: code,
        flag: '🌐',
      }
    );
  };

  const fromMeta = getCurrencyMeta(fromCode);
  const toMeta = getCurrencyMeta(toCode);

  const numericAmount = parseFloat(amountStr);
  const validAmount = Number.isFinite(numericAmount) && numericAmount >= 0 ? numericAmount : 0;
  const activeExchangeRate = rates[toCode] ?? 0;
  const convertedValue = validAmount * activeExchangeRate;

  const displayedCurrencies = POPULAR_CURRENCIES.filter((item) => {
    const isSaved = activeCodes.includes(item.code);
    if (!isSaved && !searchQuery.trim()) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.code.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q)
    );
  });

  const formattedTimestamp = lastUpdated
    ? new Date(lastUpdated).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Fetching live timestamp...';

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-gradient-to-b from-[#E9FFF0] via-[#F2FFF7] to-[#B9EFCB] flex flex-col">
      {/* Dark Navy Top Header */}
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
            Currency Converter
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              feedback();
              fetchLiveRates(fromCode);
            }}
            aria-label="Refresh Live Exchange Rates"
            title="Refresh Live Exchange Rates"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCw
              className={`w-5 h-5 text-white ${isLoading ? 'animate-spin text-[#C5F4D5]' : ''}`}
            />
          </button>
          <button
            type="button"
            onClick={() => {
              feedback();
              setIsAddCurrencyModalOpen(true);
            }}
            aria-label="Add or Manage Currencies"
            title="Add or Manage Currencies"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <PlusCircle className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Layout - Full Width & Full Height */}
      <main className="flex-1 w-full px-3 py-3 sm:px-5 sm:py-4 flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start">
        {/* Left / Top Column: Scrollable White Currency List with Individual Currency Cards */}
        <div className="w-full lg:col-span-7 order-2 lg:order-1 mt-4 lg:mt-0 flex flex-col">
          {/* Search Currencies Bar */}
          <div className="bg-white rounded-2xl p-2.5 shadow-sm border border-[#E9E9EC] mb-3 flex items-center gap-2.5">
            <Search className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency code, country, or name (e.g. USD, INR, SAR)..."
              className="w-full text-sm text-[#171717] placeholder:text-neutral-400 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="mb-3 p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-[#D83B29]" />
                <span>{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchLiveRates(fromCode)}
                className="px-3 py-1.5 rounded-lg bg-[#D83B29] text-white font-bold shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Vertically Scrollable White Currency List */}
          <div className="bg-white/80 backdrop-blur-xs rounded-2xl p-2.5 shadow-md border border-[#E9E9EC] max-h-[520px] overflow-y-auto space-y-2">
            <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-[#10232B]">
              <span>
                Popular World Currencies (Base: 1 {fromCode})
              </span>
              <button
                type="button"
                onClick={() => setIsAddCurrencyModalOpen(true)}
                className="text-[#347BCB] hover:underline"
              >
                + Add / Edit List
              </button>
            </div>

            {displayedCurrencies.map((curr) => {
              const unitRate = rates[curr.code];
              const isSelectedTo = curr.code === toCode;
              const isSelectedFrom = curr.code === fromCode;

              return (
                <div
                  key={curr.code}
                  onClick={() => {
                    feedback();
                    if (curr.code !== fromCode) {
                      setToCode(curr.code);
                    }
                  }}
                  className={`cursor-pointer bg-white rounded-xl p-3 shadow-xs border transition-all flex items-center justify-between gap-3 ${
                    isSelectedTo
                      ? 'border-[#347BCB] ring-2 ring-[#347BCB]/20 bg-[#F2FFF7]/60'
                      : isSelectedFrom
                      ? 'border-[#10232B] bg-neutral-50'
                      : 'border-[#E9E9EC] hover:border-[#548DD7]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-2xl leading-none select-none shrink-0"
                      role="img"
                      aria-label={curr.country}
                    >
                      {curr.flag}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#171717]">
                          {curr.code}
                        </span>
                        {isSelectedFrom && (
                          <span className="text-[10px] font-semibold text-[#10232B]">
                            · Source
                          </span>
                        )}
                        {isSelectedTo && (
                          <span className="text-[10px] font-semibold text-[#347BCB]">
                            · Target
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-500 truncate">
                        {curr.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-sm text-[#171717] tabular-nums">
                      {isLoading && !unitRate ? (
                        <span className="text-xs text-neutral-400">Loading...</span>
                      ) : unitRate !== undefined ? (
                        <>
                          1 {fromCode} = {formatNumber(unitRate, settings.numberFormat, 4)}{' '}
                          {curr.code}
                        </>
                      ) : (
                        <span className="text-xs text-neutral-400">--</span>
                      )}
                    </div>
                    {unitRate !== undefined && validAmount > 0 && (
                      <div className="text-xs font-mono font-semibold text-[#347BCB] tabular-nums mt-0.5">
                        {curr.symbol}{' '}
                        {formatNumber(
                          validAmount * unitRate,
                          settings.numberFormat,
                          settings.decimalPlaces
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right / Primary Floating White Conversion Card (Exact 10-step component order) */}
        <div className="w-full lg:col-span-5 order-1 lg:order-2">
          <div className="bg-white rounded-2xl p-5 shadow-xl border border-[#E9E9EC] space-y-3">
            {/* 1. From Currency heading */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 tracking-tight">
                From Currency
              </span>
              <span className="text-xs font-mono font-semibold text-[#347BCB]">
                {fromMeta.code}
              </span>
            </div>

            {/* 2. Source country flag & 3. Source currency name */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F2FA] border border-[#E9E9EC]">
              <div className="flex items-center gap-3 min-w-0">
                {/* 2. Source country flag */}
                <span className="text-3xl leading-none shrink-0" role="img" aria-label={fromMeta.country}>
                  {fromMeta.flag}
                </span>
                {/* 3. Source currency name */}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#171717] truncate">
                    {fromMeta.code} – {fromMeta.name}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {fromMeta.country}
                  </div>
                </div>
              </div>

              <select
                aria-label="Select Source Currency"
                value={fromCode}
                onChange={(e) => {
                  feedback();
                  setFromCode(e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E9E9EC] text-xs font-bold text-[#10232B] focus:outline-none focus:border-[#347BCB]"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Amount input field */}
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Enter Amount ({fromMeta.symbol})
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 font-mono font-bold text-lg text-neutral-500">
                  {fromMeta.symbol}
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  min="0"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F2FFF7] border-2 border-[#C5F4D5] font-mono font-bold text-xl text-[#101010] focus:outline-none focus:border-[#347BCB] tabular-nums"
                />
              </div>
            </div>

            {/* 5. Center swap icon */}
            <div className="relative flex items-center justify-center py-1">
              <div className="w-full border-t border-[#E9E9EC]" />
              <button
                type="button"
                onClick={handleSwapCurrencies}
                aria-label="Swap Source and Destination Currencies"
                className="relative z-10 w-11 h-11 rounded-full bg-[#347BCB] hover:bg-[#548DD7] active:scale-95 text-white shadow-md flex items-center justify-center transition-all"
              >
                <ArrowUpDown className="w-5 h-5" />
              </button>
              <div className="w-full border-t border-[#E9E9EC]" />
            </div>

            {/* 6. To Currency heading */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-500 tracking-tight">
                To Currency
              </span>
              <span className="text-xs font-mono font-semibold text-[#347BCB]">
                {toMeta.code}
              </span>
            </div>

            {/* 7. Destination country flag & 8. Destination currency name */}
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#F7F2FA] border border-[#E9E9EC]">
              <div className="flex items-center gap-3 min-w-0">
                {/* 7. Destination country flag */}
                <span className="text-3xl leading-none shrink-0" role="img" aria-label={toMeta.country}>
                  {toMeta.flag}
                </span>
                {/* 8. Destination currency name */}
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#171717] truncate">
                    {toMeta.code} – {toMeta.name}
                  </div>
                  <div className="text-xs text-neutral-500 truncate">
                    {toMeta.country}
                  </div>
                </div>
              </div>

              <select
                aria-label="Select Destination Currency"
                value={toCode}
                onChange={(e) => {
                  feedback();
                  setToCode(e.target.value);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E9E9EC] text-xs font-bold text-[#10232B] focus:outline-none focus:border-[#347BCB]"
              >
                {POPULAR_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.code}
                  </option>
                ))}
              </select>
            </div>

            {/* 9. Converted amount */}
            <div className="p-4 rounded-xl bg-[#A6B991] text-[#101010] border-2 border-[#8d9f78] shadow-inner">
              <div className="flex items-center justify-between text-xs font-mono font-semibold opacity-80">
                <span>Converted Amount</span>
                <span>
                  1 {fromCode} ={' '}
                  {activeExchangeRate
                    ? formatNumber(activeExchangeRate, settings.numberFormat, 4)
                    : '--'}{' '}
                  {toCode}
                </span>
              </div>
              <div className="font-mono font-bold text-2xl sm:text-3xl mt-1 tabular-nums truncate">
                {isLoading && !activeExchangeRate ? (
                  'Updating...'
                ) : (
                  <>
                    {toMeta.symbol}{' '}
                    {formatNumber(
                      convertedValue,
                      settings.numberFormat,
                      settings.decimalPlaces
                    )}
                  </>
                )}
              </div>
            </div>

            {/* 10. Last Updated timestamp */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-neutral-500">
              <span>Last Updated: {formattedTimestamp}</span>
              {providerName && <span className="font-medium">{providerName}</span>}
            </div>
          </div>
        </div>
      </main>

      {/* Add / Manage Favorite Currencies Modal */}
      {isAddCurrencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E9E9EC] flex flex-col max-h-[82vh]">
            <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-3 mb-3">
              <div>
                <h3 className="font-bold text-base text-[#10232B]">
                  Manage Active Currencies
                </h3>
                <p className="text-xs text-neutral-500">
                  Select currencies to display in your main converter list
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddCurrencyModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {POPULAR_CURRENCIES.map((c) => {
                const isSelected = activeCodes.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => handleToggleCurrencyInList(c.code)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-colors ${
                      isSelected
                        ? 'bg-[#F2FFF7] border-[#C5F4D5] text-[#10232B]'
                        : 'bg-white border-[#E9E9EC] text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{c.flag}</span>
                      <div>
                        <div className="text-sm font-bold">
                          {c.code} – {c.name}
                        </div>
                        <div className="text-xs text-neutral-500">{c.country}</div>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#347BCB] text-white'
                          : 'border border-neutral-300 text-transparent'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-3 mt-3 border-t border-[#E9E9EC] flex justify-end">
              <button
                type="button"
                onClick={() => setIsAddCurrencyModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-[#347BCB] text-white text-xs font-bold hover:bg-[#2866ab]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
