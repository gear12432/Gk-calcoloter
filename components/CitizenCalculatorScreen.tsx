'use client';

import React, { useState, useMemo } from 'react';
import {
  Menu,
  Clock,
  Ruler,
  Calculator,
  Delete,
} from 'lucide-react';
import {
  AppSettings,
  HistoryRecord,
  formatNumber,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface CitizenCalculatorScreenProps {
  settings: AppSettings;
  history: HistoryRecord[];
  onAddHistory: (record: Omit<HistoryRecord, 'id' | 'timestamp'>) => void;
  onClearHistory?: () => void;
  onOpenDrawer: () => void;
  onOpenHistory: () => void;
}

type UnitCategory = 'LENGTH' | 'WEIGHT' | 'TEMP' | 'AREA' | 'DATA';

const UNIT_DEFINITIONS: Record<
  UnitCategory,
  { label: string; units: { code: string; name: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }
> = {
  LENGTH: {
    label: 'Length',
    units: [
      { code: 'm', name: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
      { code: 'km', name: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { code: 'cm', name: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { code: 'mm', name: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { code: 'in', name: 'Inches (in)', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
      { code: 'ft', name: 'Feet (ft)', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
      { code: 'mi', name: 'Miles (mi)', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
    ],
  },
  WEIGHT: {
    label: 'Mass / Weight',
    units: [
      { code: 'kg', name: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
      { code: 'g', name: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { code: 'lb', name: 'Pounds (lb)', toBase: (v) => v * 0.45359237, fromBase: (v) => v / 0.45359237 },
      { code: 'oz', name: 'Ounces (oz)', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
      { code: 'ton', name: 'Metric Tons (t)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
    ],
  },
  TEMP: {
    label: 'Temperature',
    units: [
      { code: 'C', name: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      { code: 'F', name: 'Fahrenheit (°F)', toBase: (v) => ((v - 32) * 5) / 9, fromBase: (v) => (v * 9) / 5 + 32 },
      { code: 'K', name: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  AREA: {
    label: 'Area',
    units: [
      { code: 'sqm', name: 'Square Meters (m²)', toBase: (v) => v, fromBase: (v) => v },
      { code: 'sqft', name: 'Square Feet (ft²)', toBase: (v) => v * 0.092903, fromBase: (v) => v / 0.092903 },
      { code: 'acre', name: 'Acres (ac)', toBase: (v) => v * 4046.856, fromBase: (v) => v / 4046.856 },
      { code: 'ha', name: 'Hectares (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
    ],
  },
  DATA: {
    label: 'Data',
    units: [
      { code: 'MB', name: 'Megabytes (MB)', toBase: (v) => v, fromBase: (v) => v },
      { code: 'GB', name: 'Gigabytes (GB)', toBase: (v) => v * 1024, fromBase: (v) => v / 1024 },
      { code: 'TB', name: 'Terabytes (TB)', toBase: (v) => v * 1048576, fromBase: (v) => v / 1048576 },
      { code: 'KB', name: 'Kilobytes (KB)', toBase: (v) => v / 1024, fromBase: (v) => v * 1024 },
    ],
  },
};

// Safe mathematical expression evaluator supporting (), +, −, ×, ÷, %, √, ^, π, e, sin, cos, tan, log, ln
function evaluateMathExpression(rawExpr: string, isDeg = true): string {
  if (!rawExpr || !rawExpr.trim()) return '';
  try {
    let expr = rawExpr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/π/g, `(${Math.PI})`)
      .replace(/e/g, `(${Math.E})`);

    // Trim trailing operators before evaluating live preview
    expr = expr.replace(/[+\-*/^.(]+$/, '');
    if (!expr) return '';

    // Auto-close any unclosed parentheses for live preview
    const openCount = (expr.match(/\(/g) || []).length;
    const closeCount = (expr.match(/\)/g) || []).length;
    if (openCount > closeCount) {
      expr += ')'.repeat(openCount - closeCount);
    }

    // Handle percentage: e.g. 200+10% -> 200+(200*10/100) or 50% -> (50/100)
    expr = expr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // Handle square root √(x) or √x
    expr = expr.replace(/√\(/g, 'Math.sqrt(');
    expr = expr.replace(/√(\d+(?:\.\d+)?)/g, 'Math.sqrt($1)');

    // Handle scientific functions
    const trigFactor = isDeg ? `(Math.PI/180)*` : '';
    expr = expr.replace(/sin\(/g, `Math.sin(${trigFactor}`);
    expr = expr.replace(/cos\(/g, `Math.cos(${trigFactor}`);
    expr = expr.replace(/tan\(/g, `Math.tan(${trigFactor}`);
    expr = expr.replace(/ln\(/g, 'Math.log(');
    expr = expr.replace(/log\(/g, 'Math.log10(');
    expr = expr.replace(/\^/g, '**');

    // Validate only safe math tokens remain
    const sanitized = expr.replace(
      /Math\.(sqrt|sin|cos|tan|log10|log|PI)|[0-9+\-*/().\s]/g,
      ''
    );
    if (sanitized.length > 0) return '';

    const result = Function(`"use strict"; return (${expr});`)();
    if (typeof result !== 'number' || !Number.isFinite(result)) return '';

    // Format up to 10 decimal places without trailing float noise (e.g., 57.6666666667)
    if (Number.isInteger(result)) return String(result);
    const fixed = Number(result.toPrecision(12));
    const decimalParts = String(fixed).split('.');
    if (decimalParts[1] && decimalParts[1].length > 10) {
      return result.toFixed(10).replace(/0+$/, '').replace(/\.$/, '');
    }
    return String(fixed);
  } catch {
    return '';
  }
}

export default function CitizenCalculatorScreen({
  settings,
  history = [],
  onAddHistory,
  onClearHistory,
  onOpenDrawer,
  onOpenHistory,
}: CitizenCalculatorScreenProps) {
  // Default expression matches the uploaded reference screenshot: 692÷12 -> 57.6666666667
  const [expression, setExpression] = useState<string>('692÷12');
  const [showInlineHistory, setShowInlineHistory] = useState<boolean>(false);
  const [showUnitConverter, setShowUnitConverter] = useState<boolean>(false);
  const [showScientific, setShowScientific] = useState<boolean>(false);
  const [isDegree, setIsDegree] = useState<boolean>(true);

  // Unit converter state
  const [unitCat, setUnitCat] = useState<UnitCategory>('LENGTH');
  const [fromUnitIdx, setFromUnitIdx] = useState<number>(0);
  const [toUnitIdx, setToUnitIdx] = useState<number>(1);
  const [unitInputVal, setUnitInputVal] = useState<string>('1');

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const livePreview = useMemo(
    () => evaluateMathExpression(expression, isDegree),
    [expression, isDegree]
  );

  const isOperatorChar = (ch: string) =>
    ['+', '−', '×', '÷', '%', '^'].includes(ch);

  const handleDigit = (digit: string) => {
    feedback();
    setExpression((prev) => {
      if (prev === '0') return digit;
      if (prev.length >= 28) return prev;
      // If previous character is `)` or `%`, insert `×` automatically
      const last = prev.slice(-1);
      if (last === ')' || last === '%') return `${prev}×${digit}`;
      return prev + digit;
    });
  };

  const handleOperator = (op: string) => {
    feedback();
    setExpression((prev) => {
      if (!prev) return op === '−' ? '−' : '';
      const last = prev.slice(-1);
      if (last === '(' && op !== '−') return prev;
      if (['+', '−', '×', '÷', '^'].includes(last)) {
        return prev.slice(0, -1) + op;
      }
      return prev + op;
    });
  };

  const handleDecimal = () => {
    feedback();
    setExpression((prev) => {
      if (!prev) return '0.';
      // Check current number segment after last operator
      const parts = prev.split(/[+−×÷()%^]/);
      const currentSegment = parts[parts.length - 1] || '';
      if (currentSegment.includes('.')) return prev;
      const last = prev.slice(-1);
      if (!/[0-9]/.test(last)) return `${prev}0.`;
      return `${prev}.`;
    });
  };

  const handleParentheses = () => {
    feedback();
    setExpression((prev) => {
      if (!prev) return '(';
      const openCount = (prev.match(/\(/g) || []).length;
      const closeCount = (prev.match(/\)/g) || []).length;
      const last = prev.slice(-1);
      if (
        openCount > closeCount &&
        (/[0-9)%πe]/.test(last))
      ) {
        return `${prev})`;
      }
      if (/[0-9)%πe]/.test(last)) {
        return `${prev}×(`;
      }
      return `${prev}(`;
    });
  };

  const handlePlusMinus = () => {
    feedback();
    setExpression((prev) => {
      if (!prev) return '(−';
      if (prev.startsWith('(−') && prev.endsWith(')')) {
        return prev.slice(2, -1);
      }
      if (prev.startsWith('(−')) {
        return prev.slice(2);
      }
      // Toggle sign of last number token
      const match = prev.match(/(\(−\d+(?:\.\d+)?\)|\d+(?:\.\d+)?)$/);
      if (match && match.index !== undefined) {
        const token = match[0];
        const prefix = prev.slice(0, match.index);
        if (token.startsWith('(−')) {
          const inner = token.slice(2, token.endsWith(')') ? -1 : undefined);
          return prefix + inner;
        }
        return `${prefix}(−${token}`;
      }
      return `(−${prev}`;
    });
  };

  const handlePercent = () => {
    feedback();
    setExpression((prev) => {
      if (!prev) return '';
      const last = prev.slice(-1);
      if (/[0-9)]/.test(last)) return `${prev}%`;
      return prev;
    });
  };

  const handleClear = () => {
    feedback();
    setExpression('');
  };

  const handleBackspace = () => {
    feedback();
    setExpression((prev) => {
      if (!prev) return '';
      // Remove full function token if ends with `sin(`, `cos(`, `tan(`, `log(`, `ln(`
      const fnMatch = prev.match(/(sin\(|cos\(|tan\(|log\(|ln\(|√\()$/);
      if (fnMatch) {
        return prev.slice(0, -fnMatch[0].length);
      }
      return prev.slice(0, -1);
    });
  };

  const handleScientificToken = (token: string) => {
    feedback();
    setExpression((prev) => {
      const last = prev.slice(-1);
      const needsMultiply = /[0-9)%πe]/.test(last);
      if (token === 'x²') {
        return needsMultiply ? `${prev}^2` : prev;
      }
      if (token === 'xʸ') {
        return needsMultiply ? `${prev}^` : prev;
      }
      return needsMultiply ? `${prev}×${token}` : `${prev}${token}`;
    });
  };

  const handleEquals = () => {
    feedback();
    const evaluated = evaluateMathExpression(expression, isDegree);
    if (!evaluated) return;

    const numResult = parseFloat(evaluated);
    const firstNumberMatch = expression.match(/\d+(?:\.\d+)?/);
    const origNum = firstNumberMatch ? parseFloat(firstNumberMatch[0]) : numResult;

    onAddHistory({
      type: 'CITIZEN',
      expression: expression,
      originalAmount: Number.isFinite(origNum) ? origNum : 0,
      finalAmount: Number.isFinite(numResult) ? numResult : 0,
    });

    setExpression(evaluated);
  };

  // Render expression with green operators (`#3A8918`) and dark charcoal digits (`#333333`)
  const renderColoredExpression = () => {
    if (!expression) return null;
    return expression.split('').map((ch, idx) => {
      const isOp = isOperatorChar(ch) || ch === '(' || ch === ')';
      return (
        <span
          key={idx}
          className={isOp ? 'text-[#3A8918] font-normal' : 'text-[#333333]'}
        >
          {ch}
        </span>
      );
    });
  };

  // Unit conversion calculation
  const currentCategory = UNIT_DEFINITIONS[unitCat];
  const fromUnit = currentCategory.units[fromUnitIdx] || currentCategory.units[0];
  const toUnit = currentCategory.units[toUnitIdx] || currentCategory.units[1] || currentCategory.units[0];
  const convertedUnitValue = useMemo(() => {
    const val = parseFloat(unitInputVal);
    if (!Number.isFinite(val)) return '0';
    const inBase = fromUnit.toBase(val);
    const out = toUnit.fromBase(inBase);
    return Number(out.toPrecision(8)).toString();
  }, [unitInputVal, fromUnit, toUnit]);

  return (
    <div className="h-[100dvh] w-full bg-[#FAFBF9] text-[#2C2C2C] flex flex-col justify-between overflow-hidden select-none">
      {/* Top Display Area (Matches Reference Screenshot) */}
      <div className="relative flex-1 min-h-0 flex flex-col justify-between px-5 pt-3 pb-2">
        {/* Top Row: Subtle Menu Trigger to switch calculators */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Open All Calculators Menu"
            className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-[#757575] hover:bg-black/5 active:scale-95 transition-all"
          >
            <Menu className="w-6 h-6" />
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            className="text-xs font-medium text-[#757575] hover:text-[#3A8918] px-2 py-1 rounded-md transition-colors"
          >
            All Tools & History
          </button>
        </div>

        {/* Right-Aligned Expression Input with Green Vertical Cursor Bar */}
        <div className="my-auto flex items-center justify-end overflow-x-auto py-2">
          <div className="flex items-center justify-end text-right text-4xl sm:text-5xl font-normal tracking-tight leading-tight break-all">
            {renderColoredExpression()}
            <span
              className="inline-block w-[2.5px] h-10 sm:h-12 bg-[#3A8918] ml-0.5 animate-pulse shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Live Preview Result Row (Grey text right-aligned at bottom of display) */}
        <div className="min-h-[40px] flex items-center justify-end text-right">
          <span className="text-2xl sm:text-3xl font-normal text-[#858585] tabular-nums truncate">
            {livePreview}
          </span>
        </div>
      </div>

      {/* Middle 4-Icon Toolbar Row + Thin Horizontal Divider (Exact Match to Screenshot) */}
      <div className="shrink-0 px-6">
        <div className="flex items-center justify-between py-2.5">
          {/* Left 3 Utility Icons: Clock (History) | Ruler (Unit Converter) | Scientific (√π e=) */}
          <div className="flex items-center gap-8 sm:gap-10">
            <button
              type="button"
              onClick={() => {
                feedback();
                setShowInlineHistory((v) => !v);
                setShowUnitConverter(false);
              }}
              aria-label="Toggle Calculation History"
              className={`p-1.5 rounded-full transition-colors ${
                showInlineHistory
                  ? 'text-[#3A8918] bg-[#3A8918]/10'
                  : 'text-[#757575] hover:text-[#2C2C2C]'
              }`}
            >
              <Clock className="w-6 h-6 stroke-[1.75]" />
            </button>

            <button
              type="button"
              onClick={() => {
                feedback();
                setShowUnitConverter((v) => !v);
                setShowInlineHistory(false);
              }}
              aria-label="Unit Converter"
              className={`p-1.5 rounded-full transition-colors ${
                showUnitConverter
                  ? 'text-[#3A8918] bg-[#3A8918]/10'
                  : 'text-[#757575] hover:text-[#2C2C2C]'
              }`}
            >
              <Ruler className="w-6 h-6 stroke-[1.75]" />
            </button>

            <button
              type="button"
              onClick={() => {
                feedback();
                setShowScientific((v) => !v);
                setShowUnitConverter(false);
                setShowInlineHistory(false);
              }}
              aria-label="Scientific Calculator Mode"
              className={`p-1.5 rounded-full transition-colors ${
                showScientific
                  ? 'text-[#3A8918] bg-[#3A8918]/10'
                  : 'text-[#757575] hover:text-[#2C2C2C]'
              }`}
            >
              <Calculator className="w-6 h-6 stroke-[1.75]" />
            </button>
          </div>

          {/* Right Icon: Green Backspace Icon */}
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete last digit"
            className="p-1.5 rounded-full text-[#3A8918] hover:bg-[#3A8918]/10 active:scale-90 transition-all"
          >
            <Delete className="w-7 h-7 stroke-[1.9]" />
          </button>
        </div>

        {/* Thin Horizontal Divider Line */}
        <div className="border-b border-[#E6E8E5] w-full" />
      </div>

      {/* Bottom Keypad / Inline History / Unit Converter Section */}
      <div className="h-[62dvh] w-full px-4 pt-3 pb-4 flex flex-col justify-between overflow-hidden">
        {showInlineHistory ? (
          /* Inline History Panel when Clock icon is active */
          <div className="h-full flex flex-col justify-between bg-white rounded-2xl p-4 border border-[#E6E8E5]">
            <div className="flex items-center justify-between border-b border-[#E6E8E5] pb-2 mb-2">
              <span className="text-sm font-bold text-[#333333]">
                Recent Calculations
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenHistory}
                  className="text-xs font-semibold text-[#3A8918] hover:underline"
                >
                  Full History Screen
                </button>
                <button
                  type="button"
                  onClick={() => setShowInlineHistory(false)}
                  className="px-2.5 py-1 rounded-lg bg-[#EAECE9] text-xs font-semibold text-[#333333]"
                >
                  Keypad
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {history.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#858585]">
                  No calculation history yet
                </div>
              ) : (
                history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => {
                      setExpression(String(h.finalAmount));
                      setShowInlineHistory(false);
                    }}
                    className="w-full text-right p-2.5 rounded-xl hover:bg-[#F4F5F3] transition-colors border-b border-[#F4F5F3]"
                  >
                    <div className="text-sm text-[#757575]">{h.expression}</div>
                    <div className="text-xl font-semibold text-[#3A8918]">
                      = {formatNumber(h.finalAmount, settings.numberFormat)}
                    </div>
                  </button>
                ))
              )}
            </div>

            {history.length > 0 && onClearHistory && (
              <button
                type="button"
                onClick={onClearHistory}
                className="mt-2 w-full py-2.5 rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] text-sm font-semibold text-[#333333] transition-colors"
              >
                Clear history
              </button>
            )}
          </div>
        ) : showUnitConverter ? (
          /* Built-in Unit Converter when Ruler icon is active */
          <div className="h-full flex flex-col justify-between bg-white rounded-2xl p-4 border border-[#E6E8E5] space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {(Object.keys(UNIT_DEFINITIONS) as UnitCategory[]).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setUnitCat(cat);
                      setFromUnitIdx(0);
                      setToUnitIdx(1);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${
                      unitCat === cat
                        ? 'bg-[#429619] text-white'
                        : 'bg-[#F4F5F3] text-[#555555]'
                    }`}
                  >
                    {UNIT_DEFINITIONS[cat].label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowUnitConverter(false)}
                className="px-3 py-1 rounded-full bg-[#EAECE9] text-xs font-semibold text-[#333333] shrink-0 ml-2"
              >
                Keypad
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#F4F5F3] space-y-2">
                <select
                  value={fromUnitIdx}
                  onChange={(e) => setFromUnitIdx(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-semibold text-[#333333] focus:outline-none"
                >
                  {currentCategory.units.map((u, i) => (
                    <option key={u.code} value={i}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={unitInputVal}
                  onChange={(e) => setUnitInputVal(e.target.value)}
                  className="w-full bg-white px-3 py-2 rounded-xl text-2xl font-semibold text-[#2C2C2C] border border-[#E6E8E5] focus:outline-none focus:border-[#429619]"
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-[#F4F5F3] space-y-2">
                <select
                  value={toUnitIdx}
                  onChange={(e) => setToUnitIdx(Number(e.target.value))}
                  className="w-full bg-transparent text-sm font-semibold text-[#333333] focus:outline-none"
                >
                  {currentCategory.units.map((u, i) => (
                    <option key={u.code} value={i}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="w-full bg-white px-3 py-2 rounded-xl text-2xl font-semibold text-[#3A8918] border border-[#E6E8E5] truncate">
                  {convertedUnitValue}
                </div>
              </div>
            </div>

            {/* Quick numeric keypad for unit input */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              {['7', '8', '9', 'C', '4', '5', '6', '⌫', '1', '2', '3', '.', '0', '00'].map(
                (k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      feedback();
                      if (k === 'C') setUnitInputVal('');
                      else if (k === '⌫') setUnitInputVal((v) => v.slice(0, -1));
                      else setUnitInputVal((v) => (v === '0' ? k : v + k));
                    }}
                    className="py-2.5 rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] text-base font-medium text-[#2C2C2C]"
                  >
                    {k}
                  </button>
                )
              )}
            </div>
          </div>
        ) : (
          /* Standard & Scientific Circular Button Grid (Exact Match to Screenshot) */
          <div className="h-full flex flex-col gap-2.5 min-h-0">
            {/* Optional Scientific Row when √π e= icon is toggled */}
            {showScientific && (
              <div className="grid grid-cols-6 gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDegree((d) => !d)}
                  className="py-2 rounded-full bg-[#EAECE9] text-xs font-semibold text-[#3A8918]"
                >
                  {isDegree ? 'DEG' : 'RAD'}
                </button>
                {['sin(', 'cos(', 'tan(', 'ln(', 'log(', '√(', 'x²', 'xʸ', 'π', 'e'].map(
                  (tok) => (
                    <button
                      key={tok}
                      type="button"
                      onClick={() => handleScientificToken(tok)}
                      className="py-2 rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] text-xs font-medium text-[#2C2C2C]"
                    >
                      {tok.replace('(', '')}
                    </button>
                  )
                )}
              </div>
            )}

            {/* 5x4 Circular Button Keypad Matching Uploaded Screenshot */}
            <div className="flex-1 grid grid-cols-4 grid-rows-5 gap-3 sm:gap-3.5 min-h-0">
              {/* Row 1: C | () | % | ÷ */}
              <button
                type="button"
                onClick={handleClear}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#D93829] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
              >
                C
              </button>
              <button
                type="button"
                onClick={handleParentheses}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
              >
                ()
              </button>
              <button
                type="button"
                onClick={handlePercent}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
              >
                %
              </button>
              <button
                type="button"
                onClick={() => handleOperator('÷')}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-3xl sm:text-4xl font-normal flex items-center justify-center transition-all"
              >
                ÷
              </button>

              {/* Row 2: 7 | 8 | 9 | × */}
              {['7', '8', '9'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('×')}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-3xl sm:text-4xl font-normal flex items-center justify-center transition-all"
              >
                ×
              </button>

              {/* Row 3: 4 | 5 | 6 | − */}
              {['4', '5', '6'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('−')}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-3xl sm:text-4xl font-normal flex items-center justify-center transition-all"
              >
                −
              </button>

              {/* Row 4: 1 | 2 | 3 | + */}
              {['1', '2', '3'].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleDigit(n)}
                  className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleOperator('+')}
                className="h-full w-full rounded-full bg-[#EAECE9] hover:bg-[#dfe2de] active:scale-95 text-[#3A8918] text-3xl sm:text-4xl font-normal flex items-center justify-center transition-all"
              >
                +
              </button>

              {/* Row 5: +/- | 0 | . | = */}
              <button
                type="button"
                onClick={handlePlusMinus}
                className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-xl sm:text-2xl font-normal flex items-center justify-center transition-all"
              >
                +/−
              </button>
              <button
                type="button"
                onClick={() => handleDigit('0')}
                className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-2xl sm:text-3xl font-normal flex items-center justify-center transition-all"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDecimal}
                className="h-full w-full rounded-full bg-[#F4F5F3] hover:bg-[#EAECE9] active:scale-95 text-[#2C2C2C] text-3xl sm:text-4xl font-normal flex items-center justify-center transition-all"
              >
                .
              </button>
              <button
                type="button"
                onClick={handleEquals}
                className="h-full w-full rounded-full bg-[#429619] hover:bg-[#388214] active:scale-95 text-white text-3xl sm:text-4xl font-normal flex items-center justify-center shadow-sm transition-all"
              >
                =
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
