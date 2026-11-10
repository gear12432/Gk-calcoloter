'use client';

import React, { useState } from 'react';
import {
  Menu,
  RefreshCw,
  Share2,
  MoreVertical,
  Copy,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import {
  AppSettings,
  HistoryRecord,
  formatNumber,
  numberToIndianWords,
  numberToWesternWords,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface BanknoteCounterScreenProps {
  settings: AppSettings;
  onAddHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  onOpenDrawer: () => void;
  onOpenHistory: () => void;
}

const INDIAN_DENOMINATIONS = [500, 200, 100, 50, 20, 10, 5, 2, 1] as const;

export default function BanknoteCounterScreen({
  settings,
  onAddHistory,
  onOpenDrawer,
  onOpenHistory,
}: BanknoteCounterScreenProps) {
  const [formatMode, setFormatMode] = useState<'INDIA' | 'WESTERN'>(
    settings.numberFormat
  );
  // Pre-populated with the exact prompt example: ₹500 × 10 = ₹5,000, ₹200 × 5 = ₹1,000, ₹100 × 10 = ₹1,000
  const [quantities, setQuantities] = useState<Record<number, string>>({
    500: '10',
    200: '5',
    100: '10',
    50: '',
    20: '',
    10: '',
    5: '',
    2: '',
    1: '',
  });

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleQuantityChange = (denom: number, val: string) => {
    // Allow empty string or non-negative integer digits
    if (val === '') {
      setQuantities((prev) => ({ ...prev, [denom]: '' }));
      return;
    }
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length <= 7) {
      setQuantities((prev) => ({ ...prev, [denom]: cleaned }));
    }
  };

  // Instant summary calculations
  let notesTotalCount = 0;
  let grandTotalCash = 0;
  const activeLines: string[] = [];

  for (const denom of INDIAN_DENOMINATIONS) {
    const rawQty = parseInt(quantities[denom] || '0', 10);
    const qty = Number.isFinite(rawQty) && rawQty > 0 ? rawQty : 0;
    const rowTotal = denom * qty;
    notesTotalCount += qty;
    grandTotalCash += rowTotal;
    if (qty > 0) {
      activeLines.push(
        `₹${denom} × ${qty} = ₹${formatNumber(rowTotal, formatMode, 0)}`
      );
    }
  }

  const amountInWords =
    formatMode === 'INDIA'
      ? numberToIndianWords(grandTotalCash)
      : numberToWesternWords(grandTotalCash);

  const handleReset = () => {
    feedback();
    const empty: Record<number, string> = {};
    for (const d of INDIAN_DENOMINATIONS) {
      empty[d] = '';
    }
    setQuantities(empty);
    showToast('All denomination counts reset');
  };

  const buildShareReport = (): string => {
    return [
      'Money Cash Counter Summary:',
      ...activeLines,
      `Notes Total: ${formatNumber(notesTotalCount, formatMode, 0)} Pcs`,
      `Grand Total: ₹${formatNumber(grandTotalCash, formatMode, 0)}`,
      `In Words: ${amountInWords}`,
    ].join('\n');
  };

  const handleCopyTotal = async () => {
    feedback();
    const report = buildShareReport();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(report);
      showToast('Cash summary copied to clipboard');
    }
  };

  const handleShareResult = async () => {
    feedback();
    const report = buildShareReport();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Money Cash Counter', text: report });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopyTotal();
  };

  const handleSaveCalculation = () => {
    feedback();
    if (grandTotalCash <= 0) {
      showToast('Enter at least one note quantity to save');
      return;
    }
    onAddHistory({
      type: 'CASH',
      expression: activeLines.join(', ') || 'Cash Count',
      originalAmount: notesTotalCount,
      finalAmount: grandTotalCash,
      note: `${notesTotalCount} Notes · ${amountInWords}`,
    });
    showToast('Saved to Calculation History');
  };

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
            Money Cash Counter
          </h1>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={handleReset}
            aria-label="Reset Counter"
            title="Reset Counter"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RefreshCw className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={handleShareResult}
            aria-label="Share Cash Summary"
            title="Share Cash Summary"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={() => setIsOptionsMenuOpen((prev) => !prev)}
            aria-label="Additional Options"
            title="Additional Options"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>

          {isOptionsMenuOpen && (
            <div className="absolute right-0 top-12 w-52 bg-white text-[#171717] rounded-xl shadow-2xl border border-[#E9E9EC] py-1.5 z-40">
              <button
                type="button"
                onClick={() => {
                  setIsOptionsMenuOpen(false);
                  handleSaveCalculation();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#F2FFF7] text-[#10232B]"
              >
                Save to History
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOptionsMenuOpen(false);
                  onOpenHistory();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#F2FFF7] text-[#10232B]"
              >
                View Saved History
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOptionsMenuOpen(false);
                  handleCopyTotal();
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[#F2FFF7] text-neutral-700 border-t border-[#E9E9EC]"
              >
                Copy Cash Report
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#10232B] text-white px-4 py-2.5 rounded-xl shadow-xl border border-[#C5F4D5]/30 flex items-center gap-2 text-xs font-bold">
          <Check className="w-4 h-4 text-[#C5F4D5]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 py-3.5 sm:px-5 sm:py-5 space-y-4">
        {/* TOP LARGE PREMIUM WHITE SUMMARY CARD */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xl border border-[#E9E9EC] space-y-3.5">
          {/* Format Selector Row: India (Thousand, Lakh, Crore) vs Western (Thousand, Million, Billion) */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E9E9EC] pb-3">
            <div>
              <span className="text-xs font-bold text-[#10232B] block">
                Cash Denomination Summary
              </span>
              <span className="text-[11px] text-neutral-500">
                {formatMode === 'INDIA'
                  ? 'India Format: Thousand, Lakh, Crore'
                  : 'Western Format: Thousand, Million, Billion'}
              </span>
            </div>

            <div className="flex items-center rounded-xl bg-neutral-100 p-1 border border-[#E9E9EC]">
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setFormatMode('INDIA');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  formatMode === 'INDIA'
                    ? 'bg-[#347BCB] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-[#10232B]'
                }`}
              >
                India
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setFormatMode('WESTERN');
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  formatMode === 'WESTERN'
                    ? 'bg-[#347BCB] text-white shadow-xs'
                    : 'text-neutral-600 hover:text-[#10232B]'
                }`}
              >
                Western
              </button>
            </div>
          </div>

          {/* Notes Total & Grand Total Boxes */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-4 p-3.5 rounded-xl bg-[#F7F2FA] border border-[#E9E9EC] flex flex-col justify-between">
              <span className="text-xs font-bold text-neutral-500">
                Notes Total
              </span>
              <div className="font-mono font-extrabold text-2xl sm:text-3xl text-[#10232B] mt-1 tabular-nums">
                {formatNumber(notesTotalCount, formatMode, 0)}{' '}
                <span className="text-sm font-semibold text-neutral-500">Pcs</span>
              </div>
            </div>

            <div className="sm:col-span-8 p-3.5 rounded-xl bg-[#A6B991] text-[#101010] border-2 border-[#8d9f78] shadow-inner flex flex-col justify-between">
              <span className="text-xs font-mono font-bold uppercase opacity-75">
                Grand Total
              </span>
              <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#101010] mt-1 tabular-nums truncate">
                ₹{formatNumber(grandTotalCash, formatMode, 0)}
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="p-3 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
            <div className="text-[11px] font-bold text-[#347BCB] uppercase tracking-wider">
              Amount in Words ({formatMode === 'INDIA' ? 'Indian System' : 'Western System'})
            </div>
            <div className="text-sm sm:text-base font-bold text-[#10232B] mt-0.5">
              {amountInWords}
            </div>
          </div>
        </div>

        {/* BANKNOTE INPUT SECTION */}
        <div className="bg-white rounded-2xl shadow-lg border border-[#E9E9EC] overflow-hidden">
          {/* White Rounded Table Header with Three Columns: Notes | Pcs | Total */}
          <div className="grid grid-cols-12 items-center bg-[#10232B] text-white px-4 py-3 text-xs sm:text-sm font-bold">
            <div className="col-span-4">Notes</div>
            <div className="col-span-4 text-center">Pcs</div>
            <div className="col-span-4 text-right">Total</div>
          </div>

          {/* Individual Denomination Rows */}
          <div className="divide-y divide-[#E9E9EC]">
            {INDIAN_DENOMINATIONS.map((denom) => {
              const qtyStr = quantities[denom] || '';
              const qtyNum = parseInt(qtyStr || '0', 10);
              const validQty = Number.isFinite(qtyNum) && qtyNum > 0 ? qtyNum : 0;
              const rowTotal = denom * validQty;

              return (
                <div
                  key={denom}
                  className={`grid grid-cols-12 items-center px-3 sm:px-4 py-2.5 gap-2 transition-colors ${
                    validQty > 0 ? 'bg-[#F2FFF7]/70' : 'bg-white'
                  }`}
                >
                  {/* Left: Denomination Value */}
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-16 sm:w-20 py-1.5 rounded-lg bg-[#25252D] text-white font-mono font-bold text-sm sm:text-base shadow-xs">
                      ₹{denom}
                    </span>
                    <span className="text-neutral-400 font-mono font-bold text-sm">
                      ×
                    </span>
                  </div>

                  {/* Middle: Editable Quantity Input */}
                  <div className="col-span-4 flex items-center justify-center">
                    <input
                      type="number"
                      inputMode="numeric"
                      min="0"
                      value={qtyStr}
                      onChange={(e) => handleQuantityChange(denom, e.target.value)}
                      placeholder="0"
                      aria-label={`Quantity of ₹${denom} notes`}
                      className="w-24 sm:w-28 px-3 py-2 text-center rounded-xl bg-[#F7F2FA] border border-[#E9E9EC] font-mono font-bold text-base text-[#171717] focus:outline-none focus:border-[#347BCB] focus:bg-white tabular-nums"
                    />
                  </div>

                  {/* Right: Automatically Calculated Total */}
                  <div className="col-span-4 text-right font-mono font-bold text-sm sm:text-base text-[#171717] tabular-nums">
                    = ₹{formatNumber(rowTotal, formatMode, 0)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Action Buttons: Reset | Share Result | Copy Total | Save Calculation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-3 rounded-xl bg-[#D83B29] hover:bg-[#bf3222] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            type="button"
            onClick={handleShareResult}
            className="py-3 px-3 rounded-xl bg-[#347BCB] hover:bg-[#2a67ad] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Share2 className="w-4 h-4" />
            <span>Share Result</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTotal}
            className="py-3 px-3 rounded-xl bg-[#548DD7] hover:bg-[#437bc4] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Total</span>
          </button>

          <button
            type="button"
            onClick={handleSaveCalculation}
            className="py-3 px-3 rounded-xl bg-[#10232B] hover:bg-[#1c3946] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Save className="w-4 h-4 text-[#C5F4D5]" />
            <span>Save Calculation</span>
          </button>
        </div>
      </main>
    </div>
  );
}
