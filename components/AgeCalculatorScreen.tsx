'use client';

import React, { useState, useRef } from 'react';
import {
  Menu,
  Share2,
  Calendar,
  RotateCcw,
  Check,
  Cake,
  Clock,
} from 'lucide-react';
import {
  AppSettings,
  formatNumber,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface AgeCalculatorScreenProps {
  settings: AppSettings;
  onOpenDrawer: () => void;
}

interface AgeSummary {
  years: number;
  months: number;
  days: number;
  nextBirthdayMonths: number;
  nextBirthdayDays: number;
  nextBirthdayDateStr: string;
  nextBirthdayWeekday: string;
  totalMonths: number;
  totalWeeks: number;
  totalDays: number;
  totalHours: number;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function computeExactAge(birthDay: number, birthMonth: number, birthYear: number): AgeSummary | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dob = new Date(birthYear, birthMonth - 1, birthDay);

  // Verify valid calendar date (e.g. prevent Feb 30 rollover)
  if (
    dob.getFullYear() !== birthYear ||
    dob.getMonth() !== birthMonth - 1 ||
    dob.getDate() !== birthDay ||
    dob > today
  ) {
    return null;
  }

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();
  let days = today.getDate() - dob.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month of `today`
    const prevMonthLastDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      0
    ).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  // Next Birthday Calculation (handles Feb 29 leap year births accurately)
  let nextBdayYear = today.getFullYear();
  const createBdayForYear = (yr: number) => {
    if (birthMonth === 2 && birthDay === 29) {
      const isLeap = (yr % 4 === 0 && yr % 100 !== 0) || yr % 400 === 0;
      return new Date(yr, 1, isLeap ? 29 : 28);
    }
    return new Date(yr, birthMonth - 1, birthDay);
  };

  let nextBday = createBdayForYear(nextBdayYear);
  if (nextBday < today) {
    nextBdayYear += 1;
    nextBday = createBdayForYear(nextBdayYear);
  }

  let nbMonths = nextBday.getMonth() - today.getMonth();
  let nbDays = nextBday.getDate() - today.getDate();

  if (nbDays < 0) {
    nbMonths -= 1;
    const daysInCurrMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).getDate();
    nbDays += daysInCurrMonth;
  }
  if (nbMonths < 0) {
    nbMonths += 12;
  }

  const diffMs = today.getTime() - dob.getTime();
  const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = totalDays * 24;
  const totalMonths = years * 12 + months;

  const nextBirthdayDateStr = `${String(nextBday.getDate()).padStart(2, '0')} ${
    MONTHS_SHORT[nextBday.getMonth()]
  } ${nextBday.getFullYear()}`;
  const nextBirthdayWeekday = WEEKDAYS[nextBday.getDay()];

  return {
    years,
    months,
    days,
    nextBirthdayMonths: nbMonths,
    nextBirthdayDays: nbDays,
    nextBirthdayDateStr,
    nextBirthdayWeekday,
    totalMonths,
    totalWeeks,
    totalDays,
    totalHours,
  };
}

export default function AgeCalculatorScreen({
  settings,
  onOpenDrawer,
}: AgeCalculatorScreenProps) {
  const [dayStr, setDayStr] = useState<string>('15');
  const [monthStr, setMonthStr] = useState<string>('08');
  const [yearStr, setYearStr] = useState<string>('1998');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToast, setCopiedToast] = useState<boolean>(false);

  const [ageResult, setAgeResult] = useState<AgeSummary | null>(() =>
    computeExactAge(15, 8, 1998)
  );

  const datePickerRef = useRef<HTMLInputElement | null>(null);

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const handleCalculateAge = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    feedback();

    const d = parseInt(dayStr, 10);
    const m = parseInt(monthStr, 10);
    const y = parseInt(yearStr, 10);

    if (
      !Number.isFinite(d) ||
      !Number.isFinite(m) ||
      !Number.isFinite(y) ||
      d < 1 ||
      d > 31 ||
      m < 1 ||
      m > 12 ||
      y < 1900
    ) {
      setErrorMsg('Please enter a valid calendar birth date (DD / MM / YYYY).');
      return;
    }

    const res = computeExactAge(d, m, y);
    if (!res) {
      setErrorMsg(
        'Invalid calendar date or date is in the future. Please check Day, Month, and Year.'
      );
      return;
    }

    setErrorMsg(null);
    setAgeResult(res);
  };

  const handleResetDate = () => {
    feedback();
    setDayStr('01');
    setMonthStr('01');
    setYearStr('2000');
    setErrorMsg(null);
    setAgeResult(computeExactAge(1, 1, 2000));
  };

  const handleNativeDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map((v) => parseInt(v, 10));
    if (y && m && d) {
      setDayStr(String(d).padStart(2, '0'));
      setMonthStr(String(m).padStart(2, '0'));
      setYearStr(String(y));
      const computed = computeExactAge(d, m, y);
      if (computed) {
        setErrorMsg(null);
        setAgeResult(computed);
      }
    }
  };

  const handleShareAge = async () => {
    feedback();
    if (!ageResult) return;
    const text = `My Exact Age:\n${ageResult.years} Years, ${ageResult.months} Months, ${ageResult.days} Days\nNext Birthday in: ${ageResult.nextBirthdayMonths} Months, ${ageResult.nextBirthdayDays} Days (${ageResult.nextBirthdayDateStr}, ${ageResult.nextBirthdayWeekday})\nTotal Days Lived: ${formatNumber(ageResult.totalDays, settings.numberFormat)}`;

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Age Calculator Result', text });
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
            Age Calculator
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleResetDate}
            aria-label="Reset Birth Date"
            title="Reset Date"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={handleShareAge}
            aria-label="Share Age Result"
            title="Share Age Result"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            {copiedToast ? (
              <Check className="w-5 h-5 text-[#C5F4D5]" />
            ) : (
              <Share2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 py-4 sm:px-5 sm:py-6 space-y-4">
        {/* Large Bold Centered Heading: Age Calculator */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#10232B] tracking-tight">
            Age Calculator
          </h2>
        </div>

        {/* White Rounded Input Card: Enter Birth Date */}
        <form
          onSubmit={handleCalculateAge}
          className="bg-white rounded-2xl p-5 shadow-lg border border-[#E9E9EC] space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#171717]">
              Enter Birth Date
            </h3>

            {/* Calendar Picker Icon Trigger */}
            <div className="relative">
              <input
                ref={datePickerRef}
                type="date"
                onChange={handleNativeDateChange}
                className="sr-only"
                aria-label="Pick birth date from calendar"
              />
              <button
                type="button"
                onClick={() => {
                  feedback();
                  if (datePickerRef.current) {
                    if (typeof datePickerRef.current.showPicker === 'function') {
                      datePickerRef.current.showPicker();
                    } else {
                      datePickerRef.current.focus();
                      datePickerRef.current.click();
                    }
                  }
                }}
                className="px-3 py-1.5 rounded-xl bg-[#F2FFF7] hover:bg-[#C5F4D5] text-[#10232B] border border-[#C5F4D5] text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Calendar className="w-4 h-4 text-[#347BCB]" />
                <span>Calendar Picker</span>
              </button>
            </div>
          </div>

          {/* Day | Month | Year Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Day (DD)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={31}
                value={dayStr}
                onChange={(e) => setDayStr(e.target.value)}
                placeholder="DD"
                className="w-full px-3 py-3 text-center rounded-xl bg-[#F7F2FA] border border-[#E9E9EC] font-mono font-bold text-lg text-[#171717] focus:outline-none focus:border-[#347BCB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Month (MM)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                max={12}
                value={monthStr}
                onChange={(e) => setMonthStr(e.target.value)}
                placeholder="MM"
                className="w-full px-3 py-3 text-center rounded-xl bg-[#F7F2FA] border border-[#E9E9EC] font-mono font-bold text-lg text-[#171717] focus:outline-none focus:border-[#347BCB]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-500 mb-1">
                Year (YYYY)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={1900}
                max={2100}
                value={yearStr}
                onChange={(e) => setYearStr(e.target.value)}
                placeholder="YYYY"
                className="w-full px-3 py-3 text-center rounded-xl bg-[#F7F2FA] border border-[#E9E9EC] font-mono font-bold text-lg text-[#171717] focus:outline-none focus:border-[#347BCB]"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-[#D83B29]">
              {errorMsg}
            </div>
          )}

          {/* Prominent Calculate Age Button */}
          <div className="flex items-center gap-2.5">
            <button
              type="submit"
              className="flex-1 py-3.5 rounded-xl bg-[#347BCB] hover:bg-[#2a67ad] active:translate-y-0.5 text-white font-bold text-sm shadow-md transition-all"
            >
              Calculate Age
            </button>
            <button
              type="button"
              onClick={handleResetDate}
              className="px-4 py-3.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-[#171717] font-bold text-xs transition-colors"
            >
              Reset
            </button>
          </div>
        </form>

        {/* AGE RESULT CARD */}
        {ageResult && (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-xl border border-[#E9E9EC]">
              <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-2.5 mb-4">
                <h3 className="text-base font-bold text-[#10232B]">Age</h3>
                <span className="text-xs text-neutral-500">
                  Exact Chronological Age
                </span>
              </div>

              {/* Three Equal-Width Columns: Years | Months | Days */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
                  <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#10232B] tabular-nums">
                    {ageResult.years}
                  </div>
                  <div className="text-xs font-bold text-neutral-600 mt-1">
                    Years
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
                  <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#347BCB] tabular-nums">
                    {ageResult.months}
                  </div>
                  <div className="text-xs font-bold text-neutral-600 mt-1">
                    Months
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
                  <div className="font-mono font-extrabold text-3xl sm:text-4xl text-[#10232B] tabular-nums">
                    {ageResult.days}
                  </div>
                  <div className="text-xs font-bold text-neutral-600 mt-1">
                    Days
                  </div>
                </div>
              </div>
            </div>

            {/* YOUR NEXT BIRTHDAY IN CARD */}
            <div className="bg-white rounded-2xl p-5 shadow-lg border border-[#E9E9EC]">
              <div className="flex items-center justify-between border-b border-[#E9E9EC] pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <Cake className="w-5 h-5 text-[#E3452E]" />
                  <h3 className="text-base font-bold text-[#10232B]">
                    Your Next Birthday In
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#347BCB]">
                  {ageResult.nextBirthdayWeekday}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 rounded-xl bg-[#F7F2FA] border border-[#E9E9EC]">
                  <div className="font-mono font-bold text-2xl text-[#171717] tabular-nums">
                    {ageResult.nextBirthdayMonths}
                  </div>
                  <div className="text-xs font-semibold text-neutral-500 mt-0.5">
                    Remaining Months
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F7F2FA] border border-[#E9E9EC]">
                  <div className="font-mono font-bold text-2xl text-[#347BCB] tabular-nums">
                    {ageResult.nextBirthdayDays}
                  </div>
                  <div className="text-xs font-semibold text-neutral-500 mt-0.5">
                    Remaining Days
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
                  <div className="font-mono font-bold text-sm sm:text-base text-[#10232B]">
                    {ageResult.nextBirthdayDateStr}
                  </div>
                  <div className="text-xs font-semibold text-neutral-500 mt-1">
                    Next Birthday Date
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#F2FFF7] border border-[#C5F4D5]">
                  <div className="font-bold text-sm sm:text-base text-[#10232B]">
                    {ageResult.nextBirthdayWeekday}
                  </div>
                  <div className="text-xs font-semibold text-neutral-500 mt-1">
                    Day of the Week
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Exact Life Statistics Card */}
            <div className="bg-white rounded-2xl p-5 shadow-md border border-[#E9E9EC]">
              <div className="flex items-center gap-2 border-b border-[#E9E9EC] pb-2.5 mb-3">
                <Clock className="w-4 h-4 text-[#347BCB]" />
                <h3 className="text-sm font-bold text-[#10232B]">
                  Detailed Life Milestones Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-sm">
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#E9E9EC]">
                  <div className="text-xs text-neutral-500">Total Months</div>
                  <div className="font-mono font-bold text-base text-[#171717] mt-0.5 tabular-nums">
                    {formatNumber(ageResult.totalMonths, settings.numberFormat)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#E9E9EC]">
                  <div className="text-xs text-neutral-500">Total Weeks</div>
                  <div className="font-mono font-bold text-base text-[#171717] mt-0.5 tabular-nums">
                    {formatNumber(ageResult.totalWeeks, settings.numberFormat)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#E9E9EC]">
                  <div className="text-xs text-neutral-500">Total Days</div>
                  <div className="font-mono font-bold text-base text-[#347BCB] mt-0.5 tabular-nums">
                    {formatNumber(ageResult.totalDays, settings.numberFormat)}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-neutral-50 border border-[#E9E9EC]">
                  <div className="text-xs text-neutral-500">Total Hours</div>
                  <div className="font-mono font-bold text-base text-[#171717] mt-0.5 tabular-nums">
                    {formatNumber(ageResult.totalHours, settings.numberFormat)}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
