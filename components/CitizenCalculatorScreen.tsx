'use client';

import React, { useState } from 'react';
import {
  Menu,
  History,
  MoreVertical,
  Delete,
  CheckCircle2,
  Landmark,
  Calculator,
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

interface CitizenCalculatorScreenProps {
  settings: AppSettings;
  onAddHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  onOpenDrawer: () => void;
  onOpenHistory: () => void;
}

export default function CitizenCalculatorScreen({
  settings,
  onAddHistory,
  onOpenDrawer,
  onOpenHistory,
}: CitizenCalculatorScreenProps) {
  const [mode, setMode] = useState<'CITIZEN' | 'EMI'>('CITIZEN');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  // Citizen Calculator State
  const [displayValue, setDisplayValue] = useState<string>('0');
  const [expression, setExpression] = useState<string>('0');
  const [pendingOp, setPendingOp] = useState<string | null>(null);
  const [storedValue, setStoredValue] = useState<number | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState<boolean>(false);
  const [memoryValue, setMemoryValue] = useState<number>(0);
  const [grandTotal, setGrandTotal] = useState<number>(0);
  const [stepsList, setStepsList] = useState<string[]>([]);
  const [isCheckOpen, setIsCheckOpen] = useState<boolean>(false);
  const [checkIndex, setCheckIndex] = useState<number>(0);

  // Loan EMI Calculator State
  const [loanAmount, setLoanAmount] = useState<string>('500000');
  const [interestRate, setInterestRate] = useState<string>('8.5');
  const [loanTenure, setLoanTenure] = useState<string>('5');
  const [tenureUnit, setTenureUnit] = useState<'YEARS' | 'MONTHS'>('YEARS');
  const [emiCalculated, setEmiCalculated] = useState<{
    monthlyEmi: number;
    principal: number;
    totalInterest: number;
    totalPayment: number;
    months: number;
  }>({
    monthlyEmi: 10258.27,
    principal: 500000,
    totalInterest: 115495.98,
    totalPayment: 615495.98,
    months: 60,
  });

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const parseCurrent = (): number => {
    const n = parseFloat(displayValue);
    return Number.isFinite(n) ? n : 0;
  };

  const handleDigit = (digit: string) => {
    feedback();
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

  const compute = (a: number, b: number, op: string): number => {
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
        return b === 100 ? 0 : a / (1 - b / 100);
      default:
        return b;
    }
  };

  const handleOperator = (nextOp: string) => {
    feedback();
    const current = parseCurrent();
    if (storedValue === null) {
      setStoredValue(current);
      setExpression(`${current} ${nextOp}`);
    } else if (pendingOp && !waitingForOperand) {
      const result = Number(
        compute(storedValue, current, pendingOp).toFixed(settings.decimalPlaces)
      );
      setStoredValue(result);
      setDisplayValue(String(result));
      setExpression(`${result} ${nextOp}`);
    } else {
      setExpression(`${storedValue} ${nextOp}`);
    }
    setPendingOp(nextOp);
    setWaitingForOperand(true);
  };

  const handleEquals = () => {
    feedback();
    const current = parseCurrent();
    if (pendingOp && storedValue !== null) {
      const result = Number(
        compute(storedValue, current, pendingOp).toFixed(settings.decimalPlaces)
      );
      const exprStr = `${storedValue} ${pendingOp} ${current}`;
      setDisplayValue(String(result));
      setExpression(`${exprStr} = ${result}`);
      setGrandTotal((prev) => Number((prev + result).toFixed(settings.decimalPlaces)));
      setStepsList((prev) => [
        `${exprStr} = ${formatNumber(result, settings.numberFormat)}`,
        ...prev,
      ]);

      onAddHistory({
        type: 'CITIZEN',
        expression: exprStr,
        originalAmount: storedValue,
        finalAmount: result,
      });

      setStoredValue(null);
      setPendingOp(null);
      setWaitingForOperand(true);
    }
  };

  const handlePercent = () => {
    feedback();
    const current = parseCurrent();
    if (storedValue !== null && pendingOp) {
      const pct = (storedValue * current) / 100;
      let res = pct;
      if (pendingOp === '+') res = storedValue + pct;
      else if (pendingOp === '−') res = storedValue - pct;
      else if (pendingOp === '×') res = pct;
      else if (pendingOp === '÷') res = current === 0 ? 0 : (storedValue / current) * 100;

      const rounded = Number(res.toFixed(settings.decimalPlaces));
      const exprStr = `${storedValue} ${pendingOp} ${current}%`;
      setDisplayValue(String(rounded));
      setExpression(`${exprStr} = ${rounded}`);
      setGrandTotal((prev) => Number((prev + rounded).toFixed(settings.decimalPlaces)));
      setStepsList((prev) => [
        `${exprStr} = ${formatNumber(rounded, settings.numberFormat)}`,
        ...prev,
      ]);

      onAddHistory({
        type: 'CITIZEN',
        expression: exprStr,
        originalAmount: storedValue,
        finalAmount: rounded,
      });

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

  const handleSquareRoot = () => {
    feedback();
    const current = parseCurrent();
    if (current < 0) return;
    const res = Number(Math.sqrt(current).toFixed(settings.decimalPlaces));
    setDisplayValue(String(res));
    setExpression(`√(${current}) = ${res}`);
    setStepsList((prev) => [`√(${current}) = ${res}`, ...prev]);
    setWaitingForOperand(true);
  };

  const handleCorrectDelete = () => {
    feedback();
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

  const handleClearAll = () => {
    feedback();
    setDisplayValue('0');
    setExpression('0');
    setPendingOp(null);
    setStoredValue(null);
    setWaitingForOperand(false);
  };

  const handleCalculateEmi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    feedback();
    const P = parseFloat(loanAmount);
    const annualRate = parseFloat(interestRate);
    const tenureVal = parseFloat(loanTenure);

    if (!Number.isFinite(P) || P <= 0 || !Number.isFinite(tenureVal) || tenureVal <= 0) {
      return;
    }

    const n = tenureUnit === 'YEARS' ? Math.round(tenureVal * 12) : Math.round(tenureVal);
    const r = Number.isFinite(annualRate) && annualRate > 0 ? annualRate / 12 / 100 : 0;

    let emi = 0;
    if (r === 0) {
      emi = P / n;
    } else {
      const factor = Math.pow(1 + r, n);
      emi = (P * r * factor) / (factor - 1);
    }

    const totalPayment = emi * n;
    const totalInterest = totalPayment - P;

    const summary = {
      monthlyEmi: Number(emi.toFixed(2)),
      principal: Number(P.toFixed(2)),
      totalInterest: Number(totalInterest.toFixed(2)),
      totalPayment: Number(totalPayment.toFixed(2)),
      months: n,
    };

    setEmiCalculated(summary);

    onAddHistory({
      type: 'EMI',
      expression: `Loan ${settings.currencySymbol}${formatNumber(P, settings.numberFormat)} @ ${annualRate}% (${n} mo)`,
      originalAmount: summary.principal,
      finalAmount: summary.monthlyEmi,
      note: `Total Payment: ${settings.currencySymbol}${formatNumber(summary.totalPayment, settings.numberFormat)}`,
    });
  };

  const numericDisplay = parseCurrent();
  const formattedDisplay =
    displayValue.endsWith('.') || (displayValue.includes('.') && displayValue.endsWith('0'))
      ? displayValue
      : formatNumber(numericDisplay, settings.numberFormat, settings.decimalPlaces);

  return (
    <div className="h-[100dvh] w-full bg-[#15191D] flex flex-col overflow-hidden select-none">
      {/* Dark Navy Top Header - Flush, Compact, Zero Gap */}
      <header className="shrink-0 bg-[#10232B] text-white h-12 px-2.5 flex items-center justify-between border-b border-[#25252D]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open navigation drawer"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
            Citizen Calculator
          </h1>
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            type="button"
            onClick={() => {
              feedback();
              setMode((m) => (m === 'CITIZEN' ? 'EMI' : 'CITIZEN'));
            }}
            className="px-2.5 py-1 rounded-lg bg-[#347BCB] hover:bg-[#548DD7] text-xs font-bold text-white flex items-center gap-1 transition-colors"
          >
            {mode === 'CITIZEN' ? (
              <>
                <Landmark className="w-3.5 h-3.5" />
                <span>Loan EMI</span>
              </>
            ) : (
              <>
                <Calculator className="w-3.5 h-3.5" />
                <span>Citizen Keypad</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            aria-label="Calculation History"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <History className="w-5 h-5 text-white" />
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Calculator Options Menu"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-white" />
          </button>

          {/* Three-dot Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-11 w-52 bg-white text-[#171717] rounded-xl shadow-2xl border border-[#E9E9EC] py-1.5 z-40">
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setMode('EMI');
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#F2FFF7] flex items-center gap-2.5 text-[#10232B]"
              >
                <Landmark className="w-4 h-4 text-[#347BCB]" />
                <span>Loan EMI Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setMode('CITIZEN');
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-bold hover:bg-[#F2FFF7] flex items-center gap-2.5 text-[#10232B]"
              >
                <Calculator className="w-4 h-4 text-[#347BCB]" />
                <span>Citizen Calculator</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  setMemoryValue(0);
                  setGrandTotal(0);
                }}
                className="w-full px-4 py-2.5 text-left text-xs font-medium hover:bg-[#F2FFF7] text-neutral-700 border-t border-[#E9E9EC]"
              >
                Reset Memory (MC) & GT
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content: Full-Screen Fixed Non-Scrolling Keyboard Background (#15191D) */}
      {mode === 'CITIZEN' ? (
        <main className="flex-1 w-full bg-[#15191D] flex flex-col justify-between p-1.5 gap-1.5 overflow-hidden min-h-0">
          {/* Large Rectangular Green Citizen LCD Display - Taller Box & Larger Font Size */}
          <div className="shrink-0 bg-[#A6B991] text-[#101010] rounded-xl px-4 py-3 shadow-inner border-2 border-[#8d9f78] flex flex-col justify-between h-[25dvh] min-h-[158px] max-h-[210px]">
            <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-bold text-[#101010]/85 border-b border-[#101010]/20 pb-1.5">
              <div className="flex items-center gap-2">
                <span>CT-512N CITIZEN</span>
                {memoryValue !== 0 && (
                  <span className="px-1.5 py-0.5 bg-[#101010] text-[#A6B991] rounded-xs">
                    M: {formatNumber(memoryValue, settings.numberFormat)}
                  </span>
                )}
                <span className="px-1.5 py-0.5 bg-[#101010]/15 text-[#101010] rounded-xs">
                  GT: {formatNumber(grandTotal, settings.numberFormat)}
                </span>
              </div>
              <span className="truncate max-w-[220px] text-sm sm:text-base font-extrabold text-[#101010]">
                {expression}
              </span>
            </div>

            <div className="my-auto py-1 text-right overflow-hidden">
              <div className="font-mono font-extrabold text-5xl sm:text-6xl text-[#101010] tracking-tight tabular-nums leading-none truncate">
                {formattedDisplay}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs sm:text-sm font-mono font-semibold text-[#101010]/80 border-t border-[#101010]/20 pt-1.5">
              <span className="truncate">
                {settings.numberFormat === 'INDIA'
                  ? numberToIndianWords(numericDisplay)
                  : numberToWesternWords(numericDisplay)}
              </span>
              <span className="shrink-0 ml-2 font-bold">
                STEPS: {String(stepsList.length).padStart(2, '0')}
              </span>
            </div>
          </div>

          {/* Citizen 6-Row Professional Keypad - Compact 3-button row + 5 flex-1 rows */}
          <div className="flex-1 flex flex-col gap-1.5 min-h-0">
            {/* First utility row: CHECK | CORRECT / DELETE | CLEAR (Compact height as requested) */}
            <div className="h-10 sm:h-11 shrink-0 grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  feedback();
                  if (stepsList.length > 0) {
                    setCheckIndex(0);
                    setIsCheckOpen(true);
                  }
                }}
                className="h-full w-full rounded-xl bg-[#347BCB] hover:bg-[#2b69b0] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_2px_0_#1b4677] flex items-center justify-center gap-1.5 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>CHECK</span>
              </button>
              <button
                type="button"
                onClick={handleCorrectDelete}
                className="h-full w-full rounded-xl bg-[#548DD7] hover:bg-[#427bc4] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_2px_0_#2b5791] flex items-center justify-center gap-1 transition-all"
              >
                <Delete className="w-3.5 h-3.5 shrink-0" />
                <span>CORRECT / DELETE</span>
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="h-full w-full rounded-xl bg-[#D83B29] hover:bg-[#c03221] active:translate-y-0.5 text-white font-bold text-xs sm:text-sm shadow-[0_2px_0_#801e13] flex items-center justify-center transition-all"
              >
                CLEAR
              </button>
            </div>

            {/* Second row: GT | √X | M+ | M- | MR */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setDisplayValue(String(grandTotal));
                  setExpression(`GT = ${grandTotal}`);
                  setWaitingForOperand(true);
                }}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#C5F4D5] font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                GT
              </button>
              <button
                type="button"
                onClick={handleSquareRoot}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                √X
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setMemoryValue((m) =>
                    Number((m + parseCurrent()).toFixed(settings.decimalPlaces))
                  );
                  setWaitingForOperand(true);
                }}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                M+
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setMemoryValue((m) =>
                    Number((m - parseCurrent()).toFixed(settings.decimalPlaces))
                  );
                  setWaitingForOperand(true);
                }}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                M-
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback();
                  setDisplayValue(String(memoryValue));
                  setExpression(`MR = ${memoryValue}`);
                  setWaitingForOperand(true);
                }}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#548DD7] font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                MR
              </button>
            </div>

            {/* Third row: 7 | 8 | 9 | ÷ | MU */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('÷')}
                className={`h-full w-full rounded-xl font-mono font-bold text-2xl sm:text-3xl text-white shadow-[0_3px_0_#1b4677] active:translate-y-0.5 transition-all ${
                  pendingOp === '÷' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                ÷
              </button>
              <button
                type="button"
                onClick={() => handleOperator('MU')}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-bold text-sm sm:text-base shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                MU
              </button>
            </div>

            {/* Fourth row: 4 | 5 | 6 | × | % */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('×')}
                className={`h-full w-full rounded-xl font-mono font-bold text-2xl sm:text-3xl text-white shadow-[0_3px_0_#1b4677] active:translate-y-0.5 transition-all ${
                  pendingOp === '×' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                ×
              </button>
              <button
                type="button"
                onClick={handlePercent}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                %
              </button>
            </div>

            {/* Fifth row: 1 | 2 | 3 | − | MC */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('−')}
                className={`h-full w-full rounded-xl font-mono font-bold text-2xl sm:text-3xl text-white shadow-[0_3px_0_#1b4677] active:translate-y-0.5 transition-all ${
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
                }}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-[#C5F4D5] font-bold text-xs sm:text-sm shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                MC
              </button>
            </div>

            {/* Sixth row: 0 | 00 | . | + | = */}
            <div className="flex-1 grid grid-cols-5 gap-1.5 min-h-0">
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => handleDigit('00')}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-xl sm:text-2xl shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                00
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                className="h-full w-full rounded-xl bg-[#25252D] hover:bg-[#32323d] active:translate-y-0.5 text-white font-mono font-bold text-2xl sm:text-3xl shadow-[0_3px_0_#0a0c0e] transition-all"
              >
                .
              </button>
              <button
                type="button"
                onClick={() => handleOperator('+')}
                className={`h-full w-full rounded-xl font-mono font-bold text-2xl sm:text-3xl text-white shadow-[0_3px_0_#1b4677] active:translate-y-0.5 transition-all ${
                  pendingOp === '+' ? 'bg-[#548DD7]' : 'bg-[#347BCB] hover:bg-[#4389d8]'
                }`}
              >
                +
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="h-full w-full rounded-xl bg-[#E3452E] hover:bg-[#cc3822] active:translate-y-0.5 text-white font-mono font-bold text-2xl sm:text-3xl shadow-[0_3px_0_#821f11] transition-all"
              >
                =
              </button>
            </div>
          </div>
        </main>
      ) : (
        /* LOAN EMI CALCULATOR SCREEN */
        <main className="flex-1 w-full bg-[#15191D] p-3 overflow-y-auto flex items-center justify-center">
          <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <form
              onSubmit={handleCalculateEmi}
              className="md:col-span-6 bg-white rounded-2xl p-4 shadow-lg border border-[#E9E9EC] space-y-3"
            >
              <div className="border-b border-[#E9E9EC] pb-2">
                <h3 className="font-bold text-base text-[#10232B]">
                  Loan EMI Calculator
                </h3>
                <p className="text-xs text-neutral-500">
                  Calculate Monthly EMI, Total Interest & Repayment
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Loan Amount ({settings.currencySymbol})
                </label>
                <input
                  type="number"
                  step="any"
                  min="1"
                  required
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5] font-mono font-bold text-base text-[#101010] focus:outline-none focus:border-[#347BCB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Annual Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5] font-mono font-bold text-base text-[#101010] focus:outline-none focus:border-[#347BCB]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Loan Tenure
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={loanTenure}
                    onChange={(e) => setLoanTenure(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5] font-mono font-bold text-base text-[#101010] focus:outline-none focus:border-[#347BCB]"
                  />
                  <div className="flex rounded-xl bg-neutral-100 p-1 border border-[#E9E9EC]">
                    <button
                      type="button"
                      onClick={() => setTenureUnit('YEARS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        tenureUnit === 'YEARS'
                          ? 'bg-[#10232B] text-white'
                          : 'text-neutral-600'
                      }`}
                    >
                      Years
                    </button>
                    <button
                      type="button"
                      onClick={() => setTenureUnit('MONTHS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        tenureUnit === 'MONTHS'
                          ? 'bg-[#10232B] text-white'
                          : 'text-neutral-600'
                      }`}
                    >
                      Months
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#347BCB] hover:bg-[#2b69b0] active:translate-y-0.5 text-white font-bold text-sm shadow-md transition-all"
              >
                Calculate EMI
              </button>
            </form>

            {/* Professional Loan Repayment Summary Card */}
            <div className="md:col-span-6 bg-white rounded-2xl p-4 shadow-lg border border-[#E9E9EC] space-y-3">
              <div className="bg-[#A6B991] text-[#101010] rounded-xl p-3.5 border-2 border-[#8d9f78] shadow-inner">
                <div className="text-xs font-mono font-bold uppercase opacity-75">
                  Monthly Loan EMI ({emiCalculated.months} Months)
                </div>
                <div className="font-mono font-bold text-3xl mt-1 tabular-nums">
                  {settings.currencySymbol}
                  {formatNumber(emiCalculated.monthlyEmi, settings.numberFormat)}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F2FA]">
                  <span className="text-neutral-600 font-medium">Principal Amount</span>
                  <span className="font-mono font-bold text-[#171717] tabular-nums">
                    {settings.currencySymbol}
                    {formatNumber(emiCalculated.principal, settings.numberFormat)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#F2FFF7]">
                  <span className="text-neutral-600 font-medium">Total Interest Payable</span>
                  <span className="font-mono font-bold text-[#D83B29] tabular-nums">
                    {settings.currencySymbol}
                    {formatNumber(emiCalculated.totalInterest, settings.numberFormat)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#10232B] text-white">
                  <span className="font-bold">Total Payment</span>
                  <span className="font-mono font-bold text-base text-[#C5F4D5] tabular-nums">
                    {settings.currencySymbol}
                    {formatNumber(emiCalculated.totalPayment, settings.numberFormat)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* CHECK Steps Modal */}
      {isCheckOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E9E9EC]">
            <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-3 mb-4">
              <h3 className="font-bold text-base text-[#10232B]">
                Calculation Steps ({checkIndex + 1} / {stepsList.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsCheckOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-500 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-[#A6B991] text-[#101010] rounded-xl p-4 font-mono font-bold text-lg mb-4 border-2 border-[#8d9f78]">
              {stepsList[checkIndex]}
            </div>
            <div className="flex justify-between">
              <button
                type="button"
                disabled={checkIndex <= 0}
                onClick={() => setCheckIndex((i) => Math.max(0, i - 1))}
                className="px-4 py-2 rounded-xl bg-neutral-100 disabled:opacity-40 text-xs font-bold text-[#10232B]"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={checkIndex >= stepsList.length - 1}
                onClick={() =>
                  setCheckIndex((i) => Math.min(stepsList.length - 1, i + 1))
                }
                className="px-4 py-2 rounded-xl bg-[#347BCB] disabled:opacity-40 text-xs font-bold text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
