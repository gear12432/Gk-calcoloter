'use client';

import React, { useState } from 'react';
import {
  Menu,
  History,
  Delete,
  CheckCircle2,
  SlidersHorizontal,
  Share2,
  Copy,
  Check,
  X,
} from 'lucide-react';
import {
  AppSettings,
  HistoryRecord,
  formatNumber,
  numberToIndianWords,
  numberToWesternWords,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface GstCalculatorScreenProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onAddHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  onOpenDrawer: () => void;
  onOpenHistory: () => void;
}

interface GstBreakdown {
  originalAmount: number;
  gstRate: number;
  mode: 'EXCLUSIVE' | 'INCLUSIVE';
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  finalAmount: number;
}

export default function GstCalculatorScreen({
  settings,
  onUpdateSettings,
  onAddHistory,
  onOpenDrawer,
  onOpenHistory,
}: GstCalculatorScreenProps) {
  const [displayValue, setDisplayValue] = useState<string>('10000');
  const [expression, setExpression] = useState<string>('10000');
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);

  // Memory & Grand Total
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [stepsList, setStepsList] = useState<string[]>(['10000 + 18% GST = 11,800']);

  // Active GST calculation breakdown (pre-populated with the prompt's ₹10,000 @ 18% example)
  const [gstResult, setGstResult] = useState<GstBreakdown | null>({
    originalAmount: 10000,
    gstRate: 18,
    mode: 'EXCLUSIVE',
    gstAmount: 1800,
    cgstAmount: 900,
    sgstAmount: 900,
    igstAmount: 1800,
    finalAmount: 11800,
  });

  // Modals
  const [isChangeGstOpen, setIsChangeGstOpen] = useState(false);
  const [customRatesInput, setCustomRatesInput] = useState<string[]>(
    settings.gstRates.map(String)
  );
  const [customSingleRate, setCustomSingleRate] = useState<string>('18');
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [checkIndex, setCheckIndex] = useState(0);
  const [copiedToast, setCopiedToast] = useState(false);

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const parseCurrentNumber = (): number => {
    const parsed = parseFloat(displayValue);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const handleDigit = (digit: string) => {
    feedback();
    setGstResult(null);

    if (waitingForOperand) {
      const next = digit === '00' ? '0' : digit;
      setDisplayValue(next);
      setExpression((prev) => (pendingOp ? `${prev} ${next}` : next));
      setWaitingForOperand(false);
    } else {
      if (displayValue === '0') {
        if (digit === '0' || digit === '00') return;
        setDisplayValue(digit);
        setExpression(digit);
      } else {
        if (displayValue.replace('.', '').length >= 14) return;
        const nextVal = displayValue + digit;
        setDisplayValue(nextVal);
        setExpression((prev) =>
          pendingOp && !waitingForOperand ? prev + digit : nextVal
        );
      }
    }
  };

  const handleDecimal = () => {
    feedback();
    setGstResult(null);
    if (waitingForOperand) {
      setDisplayValue('0.');
      setExpression((prev) => `${prev} 0.`);
      setWaitingForOperand(false);
      return;
    }
    if (!displayValue.includes('.')) {
      setDisplayValue(displayValue + '.');
      setExpression((prev) => prev + '.');
    }
  };

  const calculateArithmetic = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? 0 : a / b;
      case 'MU':
        // Citizen Markup: a / (1 - b/100)
        return b === 100 ? 0 : a / (1 - b / 100);
      default:
        return b;
    }
  };

  const handleOperator = (nextOp: string) => {
    feedback();
    setGstResult(null);
    const inputValue = parseCurrentNumber();

    if (storedValue === null) {
      setStoredValue(inputValue);
      setExpression(`${inputValue} ${nextOp}`);
    } else if (pendingOp && !waitingForOperand) {
      const computed = calculateArithmetic(storedValue, inputValue, pendingOp);
      const rounded = Number(computed.toFixed(settings.decimalPlaces));
      setStoredValue(rounded);
      setDisplayValue(String(rounded));
      setExpression(`${rounded} ${nextOp}`);
    } else {
      setExpression(`${storedValue} ${nextOp}`);
    }

    setWaitingForOperand(true);
    setPendingOp(nextOp);
  };

  const handleEquals = () => {
    feedback();
    const inputValue = parseCurrentNumber();
    if (pendingOp && storedValue !== null) {
      const computed = calculateArithmetic(storedValue, inputValue, pendingOp);
      const rounded = Number(computed.toFixed(settings.decimalPlaces));
      const fullExpr = `${storedValue} ${pendingOp} ${inputValue}`;

      setDisplayValue(String(rounded));
      setExpression(`${fullExpr} = ${rounded}`);
      setGrandTotal((prev) => Number((prev + rounded).toFixed(settings.decimalPlaces)));
      setStepsList((prev) => [`${fullExpr} = ${formatNumber(rounded, settings.numberFormat)}`, ...prev]);

      onAddHistory({
        type: 'CITIZEN',
        expression: fullExpr,
        originalAmount: storedValue,
        finalAmount: rounded,
      });

      setStoredValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    }
  };

  const handlePercentKey = () => {
    feedback();
    const current = parseCurrentNumber();
    if (storedValue !== null && pendingOp) {
      const pctVal = (storedValue * current) / 100;
      let result = pctVal;
      if (pendingOp === '+') result = storedValue + pctVal;
      else if (pendingOp === '−') result = storedValue - pctVal;
      else if (pendingOp === '×') result = pctVal;
      else if (pendingOp === '÷') result = current === 0 ? 0 : (storedValue / current) * 100;

      const rounded = Number(result.toFixed(settings.decimalPlaces));
      setDisplayValue(String(rounded));
      setExpression(`${storedValue} ${pendingOp} ${current}% = ${rounded}`);
      setStoredValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    } else {
      const rounded = Number((current / 100).toFixed(4));
      setDisplayValue(String(rounded));
      setExpression(`${current}% = ${rounded}`);
      setWaitingForOperand(true);
    }
  };

  const applyGstRate = (rate: number) => {
    feedback();
    // Base amount is either originalAmount if user is chaining GST buttons, or current number
    const baseVal =
      gstResult && waitingForOperand ? gstResult.originalAmount : parseCurrentNumber();

    if (baseVal <= 0) return;

    const absRate = Math.abs(rate);
    let originalAmount = baseVal;
    let gstAmount = 0;
    let finalAmount = 0;
    let mode: 'EXCLUSIVE' | 'INCLUSIVE' = 'EXCLUSIVE';

    if (rate > 0) {
      // Add GST (Exclusive)
      mode = 'EXCLUSIVE';
      gstAmount = (baseVal * absRate) / 100;
      finalAmount = baseVal + gstAmount;
    } else {
      // Remove GST (Inclusive): Original = Amount / (1 + rate/100)
      mode = 'INCLUSIVE';
      originalAmount = baseVal / (1 + absRate / 100);
      gstAmount = baseVal - originalAmount;
      finalAmount = baseVal;
    }

    const cgstAmount = Number((gstAmount / 2).toFixed(settings.decimalPlaces));
    const sgstAmount = Number((gstAmount / 2).toFixed(settings.decimalPlaces));
    const igstAmount = Number(gstAmount.toFixed(settings.decimalPlaces));
    const cleanOrig = Number(originalAmount.toFixed(settings.decimalPlaces));
    const cleanGst = Number(gstAmount.toFixed(settings.decimalPlaces));
    const cleanFinal = Number(finalAmount.toFixed(settings.decimalPlaces));

    const breakdown: GstBreakdown = {
      originalAmount: cleanOrig,
      gstRate: rate,
      mode,
      gstAmount: cleanGst,
      cgstAmount,
      sgstAmount,
      igstAmount,
      finalAmount: cleanFinal,
    };

    setGstResult(breakdown);
    const displayTarget = rate > 0 ? cleanFinal : cleanOrig;
    setDisplayValue(String(displayTarget));
    const signStr = rate > 0 ? `+${absRate}%` : `-${absRate}%`;
    setExpression(
      `${settings.currencySymbol}${formatNumber(baseVal, settings.numberFormat)} ${signStr} GST`
    );
    setWaitingForOperand(true);
    setGrandTotal((prev) => Number((prev + displayTarget).toFixed(settings.decimalPlaces)));

    const stepSummary = `${formatNumber(baseVal, settings.numberFormat)} (${signStr} GST) → ${formatNumber(displayTarget, settings.numberFormat)}`;
    setStepsList((prev) => [stepSummary, ...prev]);

    onAddHistory({
      type: 'GST',
      expression: `${baseVal} ${signStr} GST`,
      originalAmount: cleanOrig,
      gstRate: rate,
      gstMode: mode,
      gstAmount: cleanGst,
      cgstAmount,
      sgstAmount,
      igstAmount,
      finalAmount: cleanFinal,
    });
  };

  const handleCorrectDelete = () => {
    feedback();
    if (gstResult) {
      setGstResult(null);
      setDisplayValue(String(gstResult.originalAmount));
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) return;
    if (displayValue.length > 1) {
      const next = displayValue.slice(0, -1);
      setDisplayValue(next);
      setExpression(next);
    } else {
      setDisplayValue('0');
      setExpression('0');
    }
  };

  const handleClear = () => {
    feedback();
    setDisplayValue('0');
    setExpression('0');
    setPendingOp(null);
    setStoredValue(null);
    setWaitingForOperand(false);
    setGstResult(null);
  };

  const handleSquareRoot = () => {
    feedback();
    const current = parseCurrentNumber();
    if (current < 0) return;
    const res = Number(Math.sqrt(current).toFixed(settings.decimalPlaces));
    setDisplayValue(String(res));
    setExpression(`√(${current}) = ${res}`);
    setGstResult(null);
    setWaitingForOperand(true);
  };

  const handleGrandTotalRecall = () => {
    feedback();
    setDisplayValue(String(grandTotal));
    setExpression(`GT = ${grandTotal}`);
    setGstResult(null);
    setWaitingForOperand(true);
  };

  const handleMemoryPlus = () => {
    feedback();
    const current = parseCurrentNumber();
    setMemoryValue((prev) => Number((prev + current).toFixed(settings.decimalPlaces)));
    setWaitingForOperand(true);
  };

  const handleMemoryMinus = () => {
    feedback();
    const current = parseCurrentNumber();
    setMemoryValue((prev) => Number((prev - current).toFixed(settings.decimalPlaces)));
    setWaitingForOperand(true);
  };

  const handleMemoryRecall = () => {
    feedback();
    setDisplayValue(String(memoryValue));
    setExpression(`MR = ${memoryValue}`);
    setGstResult(null);
    setWaitingForOperand(true);
  };

  const handleCheckSteps = () => {
    feedback();
    if (stepsList.length === 0) return;
    setCheckIndex(0);
    setIsCheckModalOpen(true);
  };

  const handleSaveCustomGstSlabs = (preset?: [number, number, number, number, number]) => {
    feedback();
    if (preset) {
      setCustomRatesInput(preset.map(String));
      onUpdateSettings({ ...settings, gstRates: preset });
      setIsChangeGstOpen(false);
      return;
    }
    const parsed = customRatesInput.map((v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) && n > 0 && n <= 100 ? n : 5;
    }) as [number, number, number, number, number];
    onUpdateSettings({ ...settings, gstRates: parsed });
    setIsChangeGstOpen(false);
  };

  const handleShareBreakdown = async () => {
    feedback();
    const currentVal = parseCurrentNumber();
    const text = gstResult
      ? `GST Calculation:\nAmount: ${settings.currencySymbol}${formatNumber(
          gstResult.originalAmount,
          settings.numberFormat
        )}\nGST (${gstResult.gstRate > 0 ? '+' : ''}${gstResult.gstRate}%): ${
          settings.currencySymbol
        }${formatNumber(gstResult.gstAmount, settings.numberFormat)}\nCGST (${
          Math.abs(gstResult.gstRate) / 2
        }%): ${settings.currencySymbol}${formatNumber(
          gstResult.cgstAmount,
          settings.numberFormat
        )}\nSGST (${Math.abs(gstResult.gstRate) / 2}%): ${
          settings.currencySymbol
        }${formatNumber(gstResult.sgstAmount, settings.numberFormat)}\nIGST (${Math.abs(
          gstResult.gstRate
        )}%): ${settings.currencySymbol}${formatNumber(
          gstResult.igstAmount,
          settings.numberFormat
        )}\nTotal Amount: ${settings.currencySymbol}${formatNumber(
          gstResult.finalAmount,
          settings.numberFormat
        )}`
      : `Calculated Value: ${settings.currencySymbol}${formatNumber(
          currentVal,
          settings.numberFormat
        )}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'GST Calculation', text });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 2000);
    }
  };

  const numericDisplay = parseCurrentNumber();
  const formattedMainDisplay =
    displayValue.endsWith('.') || (displayValue.includes('.') && displayValue.endsWith('0'))
      ? displayValue
      : formatNumber(numericDisplay, settings.numberFormat, settings.decimalPlaces);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-[#E9FFF0] via-[#F2FFF7] to-[#B9EFCB] flex flex-col justify-between">
      {/* Top Dark Navy Header */}
      <header className="sticky top-0 z-30 bg-[#10232B] text-white h-14 px-4 flex items-center justify-between shadow-md border-b border-[#15191D]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open navigation drawer"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
            GST Calculator
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyGstRate(18)}
            title="Quick 18% GST Slab"
            className="px-2.5 py-1 rounded-md bg-[#347BCB] hover:bg-[#548DD7] text-xs font-bold text-white transition-colors"
          >
            +18% GST
          </button>
          <button
            type="button"
            onClick={handleShareBreakdown}
            aria-label="Share or Copy GST calculation"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {copiedToast ? (
              <Check className="w-5 h-5 text-[#C5F4D5]" />
            ) : (
              <Share2 className="w-5 h-5 text-white" />
            )}
          </button>
          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="View Calculation History"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <History className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content Container - Mobile-First Full Width, Responsive on Desktop */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-2.5 py-2.5 sm:px-4 sm:py-4 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* Left / Primary Calculator Column */}
        <div className="w-full lg:col-span-7 flex flex-col gap-2.5">
          {/* Citizen LCD Green Display Panel */}
          <div className="bg-[#15191D] p-2.5 rounded-2xl shadow-lg border border-[#25252D]">
            <div className="bg-[#A6B991] text-[#101010] rounded-xl p-3.5 shadow-inner border-2 border-[#8d9f78] flex flex-col justify-between min-h-[148px]">
              {/* Top LCD status row */}
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-[#101010]/80 border-b border-[#101010]/15 pb-1">
                <div className="flex items-center gap-2">
                  <span>CITIZEN LCD</span>
                  {memoryValue !== 0 && (
                    <span className="px-1.5 py-0.2 bg-[#101010] text-[#A6B991] rounded-xs font-bold">
                      M: {formatNumber(memoryValue, settings.numberFormat)}
                    </span>
                  )}
                  {grandTotal !== 0 && (
                    <span className="px-1.5 py-0.2 bg-[#101010]/80 text-[#A6B991] rounded-xs">
                      GT: {formatNumber(grandTotal, settings.numberFormat)}
                    </span>
                  )}
                </div>
                <span className="truncate max-w-[180px] text-right">{expression}</span>
              </div>

              {/* Large Digital Calculator Display Value */}
              <div className="my-1.5 text-right overflow-x-auto">
                <div className="font-mono font-bold text-3xl sm:text-4xl tracking-tight text-[#101010] tabular-nums leading-none">
                  {settings.currencySymbol}
                  {formattedMainDisplay}
                </div>
                <div className="text-[11px] font-medium text-[#101010]/75 mt-1 truncate">
                  {settings.numberFormat === 'INDIA'
                    ? numberToIndianWords(numericDisplay)
                    : numberToWesternWords(numericDisplay)}
                </div>
              </div>

              {/* Live GST Breakdown inside the LCD screen */}
              {gstResult ? (
                <div className="mt-1 pt-1.5 border-t border-[#101010]/20 grid grid-cols-4 gap-1 text-[11px] font-mono text-[#101010]">
                  <div className="bg-black/5 rounded-md px-1.5 py-1">
                    <div className="text-[10px] opacity-75">Net Amount</div>
                    <div className="font-bold tabular-nums">
                      {settings.currencySymbol}
                      {formatNumber(gstResult.originalAmount, settings.numberFormat)}
                    </div>
                  </div>
                  <div className="bg-black/5 rounded-md px-1.5 py-1">
                    <div className="text-[10px] opacity-75">
                      CGST ({Math.abs(gstResult.gstRate) / 2}%)
                    </div>
                    <div className="font-bold tabular-nums">
                      {settings.currencySymbol}
                      {formatNumber(gstResult.cgstAmount, settings.numberFormat)}
                    </div>
                  </div>
                  <div className="bg-black/5 rounded-md px-1.5 py-1">
                    <div className="text-[10px] opacity-75">
                      SGST ({Math.abs(gstResult.gstRate) / 2}%)
                    </div>
                    <div className="font-bold tabular-nums">
                      {settings.currencySymbol}
                      {formatNumber(gstResult.sgstAmount, settings.numberFormat)}
                    </div>
                  </div>
                  <div className="bg-black/10 rounded-md px-1.5 py-1">
                    <div className="text-[10px] opacity-80">
                      Total ({gstResult.gstRate > 0 ? `+${gstResult.gstRate}%` : `${gstResult.gstRate}%`})
                    </div>
                    <div className="font-bold tabular-nums">
                      {settings.currencySymbol}
                      {formatNumber(gstResult.finalAmount, settings.numberFormat)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-1 pt-1 border-t border-[#101010]/15 flex items-center justify-between text-[11px] font-mono text-[#101010]/70">
                  <span>Tap +GST% or -GST% below for instant tax split</span>
                  <span>IGST / CGST+SGST</span>
                </div>
              )}
            </div>
          </div>

          {/* Calculator Action Utility Buttons Directly Below the Display */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handleCheckSteps}
              className="h-11 rounded-xl bg-[#347BCB] hover:bg-[#2c6ab0] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_3px_0_#1e4b80] flex items-center justify-center gap-1 transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span>CHECK</span>
            </button>
            <button
              type="button"
              onClick={handleCorrectDelete}
              className="h-11 rounded-xl bg-[#548DD7] hover:bg-[#437bc4] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_3px_0_#2b5791] flex items-center justify-center gap-1 transition-all"
            >
              <Delete className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span>CORRECT</span>
            </button>
            <button
              type="button"
              onClick={() => {
                feedback();
                setCustomRatesInput(settings.gstRates.map(String));
                setIsChangeGstOpen(true);
              }}
              className="h-11 rounded-xl bg-[#347BCB] hover:bg-[#2c6ab0] active:translate-y-0.5 text-white font-bold text-[11px] sm:text-xs shadow-[0_3px_0_#1e4b80] flex items-center justify-center gap-1 px-1 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 shrink-0 hidden sm:inline" />
              <span>CHANGE GST %</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="h-11 rounded-xl bg-[#D83B29] hover:bg-[#bf3222] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_3px_0_#8a2014] flex items-center justify-center transition-all"
            >
              CLEAR (C)
            </button>
          </div>

          {/* Two Horizontal Rows of Large Dark Charcoal 3D-Style GST Shortcut Buttons */}
          <div className="space-y-1.5">
            {/* Row 1: +5%, +10%, +15%, +20%, +25% */}
            <div className="grid grid-cols-5 gap-1.5">
              {settings.gstRates.map((rate) => (
                <button
                  key={`plus-${rate}`}
                  type="button"
                  onClick={() => applyGstRate(rate)}
                  className={`h-11 rounded-xl font-mono font-bold text-sm sm:text-base text-white shadow-[0_3px_0_#0d0f12] active:translate-y-0.5 transition-all ${
                    gstResult?.gstRate === rate
                      ? 'bg-[#347BCB] ring-2 ring-[#10232B]'
                      : 'bg-[#25252D] hover:bg-[#32323d]'
                  }`}
                >
                  +{rate}%
                </button>
              ))}
            </div>

            {/* Row 2: -5%, -10%, -15%, -20%, -25% */}
            <div className="grid grid-cols-5 gap-1.5">
              {settings.gstRates.map((rate) => (
                <button
                  key={`minus-${rate}`}
                  type="button"
                  onClick={() => applyGstRate(-rate)}
                  className={`h-11 rounded-xl font-mono font-bold text-sm sm:text-base text-white shadow-[0_3px_0_#0d0f12] active:translate-y-0.5 transition-all ${
                    gstResult?.gstRate === -rate
                      ? 'bg-[#D83B29] ring-2 ring-[#10232B]'
                      : 'bg-[#25252D] hover:bg-[#32323d]'
                  }`}
                >
                  -{rate}%
                </button>
              ))}
            </div>
          </div>

          {/* Citizen Calculator Keypad */}
          <div className="bg-[#15191D] p-2.5 rounded-2xl shadow-xl border border-[#25252D] space-y-2">
            {/* Memory & GT Row: GT, √X, M+, M-, MR */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleGrandTotalRecall}
                className="h-11 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#C5F4D5] font-bold text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                GT
              </button>
              <button
                type="button"
                onClick={handleSquareRoot}
                className="h-11 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                √X
              </button>
              <button
                type="button"
                onClick={handleMemoryPlus}
                className="h-11 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                M+
              </button>
              <button
                type="button"
                onClick={handleMemoryMinus}
                className="h-11 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                M-
              </button>
              <button
                type="button"
                onClick={handleMemoryRecall}
                className="h-11 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#548DD7] font-bold text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                MR
              </button>
            </div>

            {/* Numeric & Operator Rows */}
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {/* Row 1: 7, 8, 9, ÷, MU */}
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('÷')}
                className={`h-13 sm:h-14 rounded-xl font-mono font-bold text-2xl text-white shadow-[0_4px_0_#1e4b80] active:translate-y-0.5 transition-all ${
                  pendingOp === '÷' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleOperator('MU')}
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                MU
              </button>

              {/* Row 2: 4, 5, 6, ×, % */}
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('×')}
                className={`h-13 sm:h-14 rounded-xl font-mono font-bold text-2xl text-white shadow-[0_4px_0_#1e4b80] active:translate-y-0.5 transition-all ${
                  pendingOp === '×' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                ×
              </button>
              <button
                type="button"
                onClick={handlePercentKey}
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                %
              </button>

              {/* Row 3: 1, 2, 3, −, and custom 18% quick key */}
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('−')}
                className={`h-13 sm:h-14 rounded-xl font-mono font-bold text-2xl text-white shadow-[0_4px_0_#1e4b80] active:translate-y-0.5 transition-all ${
                  pendingOp === '−' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                −
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setMemoryValue(0);
                  setGrandTotal(0);
                }}
                title="Clear Memory & Grand Total"
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#C5F4D5] font-bold text-xs shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                MC
              </button>

              {/* Row 4: 0, 00, ., +, = */}
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('00')}
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                00
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                className="h-13 sm:h-14 rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-2xl shadow-[0_4px_0_#0a0c0e] transition-all"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleOperator('+')}
                className={`h-13 sm:h-14 rounded-xl font-mono font-bold text-2xl text-white shadow-[0_4px_0_#1e4b80] active:translate-y-0.5 transition-all ${
                  pendingOp === '+' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="h-13 sm:h-14 rounded-xl bg-[#E3452E] hover:bg-[#cf3923] active:translate-y-0.5 text-white font-mono font-bold text-2xl shadow-[0_4px_0_#8a2014] transition-all"
              >
                =
              </button>
            </div>
          </div>
        </div>

        {/* Right / Bottom Detailed GST Invoice Breakdown Card */}
        <div className="w-full lg:col-span-5 mt-3 lg:mt-0 space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-md border border-[#E9E9EC]">
            <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-3 mb-3">
              <div>
                <h2 className="text-sm font-bold text-[#10232B]">
                  GST Tax Breakdown Summary
                </h2>
                <p className="text-xs text-neutral-500">
                  {gstResult
                    ? `${
                        gstResult.mode === 'EXCLUSIVE'
                          ? 'Exclusive (+GST Added)'
                          : 'Inclusive (-GST Removed)'
                      } · Rate ${Math.abs(gstResult.gstRate)}%`
                    : 'Select any +GST% or -GST% rate to view full tax split'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleShareBreakdown}
                className="px-3 py-1.5 rounded-lg bg-[#F2FFF7] hover:bg-[#C5F4D5] text-[#10232B] text-xs font-semibold flex items-center gap-1.5 border border-[#C5F4D5] transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedToast ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Breakdown Rows */}
            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#F7F2FA]">
                <span className="text-neutral-700 font-medium">Original Amount (Net)</span>
                <span className="font-mono font-bold text-[#171717] tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(
                    gstResult ? gstResult.originalAmount : numericDisplay,
                    settings.numberFormat
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#F2FFF7]">
                <span className="text-neutral-700 font-medium">
                  CGST ({gstResult ? Math.abs(gstResult.gstRate) / 2 : 9}%)
                </span>
                <span className="font-mono font-semibold text-[#10232B] tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(
                    gstResult ? gstResult.cgstAmount : (numericDisplay * 9) / 100,
                    settings.numberFormat
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-[#F2FFF7]">
                <span className="text-neutral-700 font-medium">
                  SGST ({gstResult ? Math.abs(gstResult.gstRate) / 2 : 9}%)
                </span>
                <span className="font-mono font-semibold text-[#10232B] tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(
                    gstResult ? gstResult.sgstAmount : (numericDisplay * 9) / 100,
                    settings.numberFormat
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-neutral-50 border border-[#E9E9EC]">
                <span className="text-neutral-700 font-medium">
                  IGST / Total GST ({gstResult ? Math.abs(gstResult.gstRate) : 18}%)
                </span>
                <span className="font-mono font-bold text-[#347BCB] tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(
                    gstResult ? gstResult.igstAmount : (numericDisplay * 18) / 100,
                    settings.numberFormat
                  )}
                </span>
              </div>

              <div className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-[#10232B] text-white">
                <span className="font-bold">Total Final Amount</span>
                <span className="font-mono font-bold text-lg text-[#C5F4D5] tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(
                    gstResult ? gstResult.finalAmount : numericDisplay * 1.18,
                    settings.numberFormat
                  )}
                </span>
              </div>
            </div>

            {/* Quick Indian Official GST Slabs Bar */}
            <div className="mt-3 pt-3 border-t border-[#E9E9EC]">
              <div className="text-xs font-semibold text-neutral-500 mb-2">
                Standard Indian GST Slabs (Instant Apply):
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[3, 5, 12, 18, 28].map((slab) => (
                  <button
                    key={slab}
                    type="button"
                    onClick={() => applyGstRate(slab)}
                    className="py-1.5 rounded-lg bg-[#F2FFF7] hover:bg-[#C5F4D5] text-[#10232B] font-mono font-bold text-xs border border-[#C5F4D5] transition-colors"
                  >
                    +{slab}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CHANGE GST % Modal */}
      {isChangeGstOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E9E9EC]">
            <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-3 mb-4">
              <h3 className="font-bold text-base text-[#10232B]">
                Configure GST Percentage Rates
              </h3>
              <button
                type="button"
                onClick={() => setIsChangeGstOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Apply Single Custom Rate Immediately */}
            <div className="mb-4 p-3 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
              <label className="block text-xs font-bold text-[#10232B] mb-1.5">
                Calculate Specific GST % Now
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={customSingleRate}
                  onChange={(e) => setCustomSingleRate(e.target.value)}
                  className="w-24 px-3 py-2 rounded-lg border border-[#E9E9EC] bg-white font-mono font-bold text-sm focus:outline-none focus:border-[#347BCB]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const r = parseFloat(customSingleRate);
                    if (Number.isFinite(r) && r > 0) {
                      applyGstRate(r);
                      setIsChangeGstOpen(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#347BCB] text-white font-bold text-xs hover:bg-[#2866ab]"
                >
                  Add +{customSingleRate || 0}%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = parseFloat(customSingleRate);
                    if (Number.isFinite(r) && r > 0) {
                      applyGstRate(-r);
                      setIsChangeGstOpen(false);
                    }
                  }}
                  className="flex-1 py-2 rounded-lg bg-[#25252D] text-white font-bold text-xs hover:bg-black"
                >
                  Remove -{customSingleRate || 0}%
                </button>
              </div>
            </div>

            {/* Customize the 5 Keypad Shortcut Buttons */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-neutral-700 mb-2">
                Customize 5 Shortcut Button Rates (%)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {customRatesInput.map((val, idx) => (
                  <input
                    key={idx}
                    type="number"
                    step="0.5"
                    value={val}
                    onChange={(e) => {
                      const next = [...customRatesInput];
                      next[idx] = e.target.value;
                      setCustomRatesInput(next);
                    }}
                    className="w-full px-2 py-2 text-center rounded-lg border border-[#E9E9EC] font-mono font-bold text-sm focus:outline-none focus:border-[#347BCB]"
                  />
                ))}
              </div>
            </div>

            {/* Presets */}
            <div className="flex items-center gap-2 mb-5">
              <button
                type="button"
                onClick={() => handleSaveCustomGstSlabs([5, 10, 15, 20, 25])}
                className="flex-1 py-2 px-2 rounded-lg border border-[#E9E9EC] hover:bg-neutral-50 text-xs font-semibold text-neutral-700"
              >
                Default (5, 10, 15, 20, 25%)
              </button>
              <button
                type="button"
                onClick={() => handleSaveCustomGstSlabs([3, 5, 12, 18, 28])}
                className="flex-1 py-2 px-2 rounded-lg border border-[#C5F4D5] bg-[#F2FFF7] hover:bg-[#C5F4D5] text-xs font-semibold text-[#10232B]"
              >
                India GST (3, 5, 12, 18, 28%)
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChangeGstOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCustomGstSlabs()}
                className="px-5 py-2 rounded-xl bg-[#347BCB] text-white text-xs font-bold hover:bg-[#2866ab]"
              >
                Save Shortcuts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHECK Steps Modal */}
      {isCheckModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E9E9EC]">
            <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-3 mb-4">
              <h3 className="font-bold text-base text-[#10232B]">
                Citizen Step Check ({checkIndex + 1} of {stepsList.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsCheckModalOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#A6B991] text-[#101010] rounded-xl p-4 font-mono mb-4 border-2 border-[#8d9f78]">
              <div className="text-xs font-semibold opacity-75">
                STEP {String(checkIndex + 1).padStart(2, '0')}
              </div>
              <div className="text-lg font-bold mt-1">{stepsList[checkIndex]}</div>
            </div>

            <div className="max-h-44 overflow-y-auto space-y-1.5 mb-4 pr-1">
              {stepsList.map((st, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCheckIndex(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg font-mono text-xs flex items-center justify-between ${
                    i === checkIndex
                      ? 'bg-[#10232B] text-white font-bold'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                  }`}
                >
                  <span>#{i + 1}</span>
                  <span className="truncate ml-2">{st}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                disabled={checkIndex <= 0}
                onClick={() => setCheckIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl bg-neutral-100 disabled:opacity-40 text-xs font-bold text-[#10232B]"
              >
                Previous Step
              </button>
              <button
                type="button"
                disabled={checkIndex >= stepsList.length - 1}
                onClick={() =>
                  setCheckIndex((i) => Math.min(stepsList.length - 1, i + 1))
                }
                className="px-4 py-2 rounded-xl bg-[#347BCB] disabled:opacity-40 text-xs font-bold text-white"
              >
                Next Step
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
