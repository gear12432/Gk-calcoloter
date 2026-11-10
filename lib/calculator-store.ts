export type ScreenId =
  | 'gst'
  | 'currency'
  | 'citizen'
  | 'history'
  | 'age'
  | 'banknote'
  | 'settings'
  | 'about';

export interface HistoryRecord {
  id: string;
  timestamp: string;
  type: 'GST' | 'CITIZEN' | 'CASH' | 'EMI';
  expression: string;
  originalAmount: number;
  gstRate?: number; // e.g. 18 or -18
  gstMode?: 'EXCLUSIVE' | 'INCLUSIVE';
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  finalAmount: number;
  note?: string;
}

export interface AppSettings {
  numberFormat: 'INDIA' | 'WESTERN';
  currencySymbol: string;
  gstRates: [number, number, number, number, number];
  showIgstByDefault: boolean;
  soundEnabled: boolean;
  decimalPlaces: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  numberFormat: 'INDIA',
  currencySymbol: '₹',
  gstRates: [5, 10, 15, 20, 25],
  showIgstByDefault: false,
  soundEnabled: true,
  decimalPlaces: 2,
};

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  country: string;
  flag: string;
}

export const POPULAR_CURRENCIES: CurrencyInfo[] = [
  { code: 'USD', name: 'U.S. Dollar', symbol: '$', country: 'United States', flag: '🇺🇸' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', country: 'India', flag: '🇮🇳' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union', flag: '🇪🇺' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom', flag: '🇬🇧' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', country: 'United Arab Emirates', flag: '🇦🇪' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳', country: 'Bangladesh', flag: '🇧🇩' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', country: 'Pakistan', flag: '🇵🇰' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada', flag: '🇨🇦' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia', flag: '🇦🇺' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan', flag: '🇯🇵' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland', flag: '🇨🇭' },
  { code: 'KRW', name: 'Korean Won', symbol: '₩', country: 'South Korea', flag: '🇰🇷' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك', country: 'Kuwait', flag: '🇰🇼' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', country: 'Singapore', flag: '🇸🇬' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', country: 'Malaysia', flag: '🇲🇾' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China', flag: '🇨🇳' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق', country: 'Qatar', flag: '🇶🇦' },
  { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.', country: 'Oman', flag: '🇴🇲' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب', country: 'Bahrain', flag: '🇧🇭' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: 'रू', country: 'Nepal', flag: '🇳🇵' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿', country: 'Thailand', flag: '🇹🇭' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', country: 'South Africa', flag: '🇿🇦' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', country: 'New Zealand', flag: '🇳🇿' },
];

export const DEFAULT_ACTIVE_CURRENCY_CODES = [
  'USD',
  'INR',
  'EUR',
  'GBP',
  'AED',
  'SAR',
  'BDT',
  'PKR',
  'CAD',
  'AUD',
  'JPY',
  'CHF',
  'KRW',
  'KWD',
];

const HISTORY_STORAGE_KEY = 'all_in_one_calc_history_v1';
const SETTINGS_STORAGE_KEY = 'all_in_one_calc_settings_v1';
const CURRENCIES_STORAGE_KEY = 'all_in_one_calc_currencies_v1';

export const INITIAL_SAMPLE_HISTORY: HistoryRecord[] = [
  {
    id: 'sample-1',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    type: 'GST',
    expression: '10000 + 18% GST',
    originalAmount: 10000,
    gstRate: 18,
    gstMode: 'EXCLUSIVE',
    gstAmount: 1800,
    cgstAmount: 900,
    sgstAmount: 900,
    igstAmount: 1800,
    finalAmount: 11800,
  },
  {
    id: 'sample-2',
    timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    type: 'GST',
    expression: '25000 + 15% GST',
    originalAmount: 25000,
    gstRate: 15,
    gstMode: 'EXCLUSIVE',
    gstAmount: 3750,
    cgstAmount: 1875,
    sgstAmount: 1875,
    igstAmount: 3750,
    finalAmount: 28750,
  },
  {
    id: 'sample-3',
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    type: 'CITIZEN',
    expression: '4500 × 12 + 1250',
    originalAmount: 54000,
    finalAmount: 55250,
  },
];

export function loadHistory(): HistoryRecord[] {
  if (typeof window === 'undefined') return INITIAL_SAMPLE_HISTORY;
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      window.localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(INITIAL_SAMPLE_HISTORY)
      );
      return INITIAL_SAMPLE_HISTORY;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_SAMPLE_HISTORY;
  } catch {
    return INITIAL_SAMPLE_HISTORY;
  }
}

export function saveHistory(records: HistoryRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore
  }
}

export function loadActiveCurrencies(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ACTIVE_CURRENCY_CODES;
  try {
    const raw = window.localStorage.getItem(CURRENCIES_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIVE_CURRENCY_CODES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : DEFAULT_ACTIVE_CURRENCY_CODES;
  } catch {
    return DEFAULT_ACTIVE_CURRENCY_CODES;
  }
}

export function saveActiveCurrencies(codes: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CURRENCIES_STORAGE_KEY, JSON.stringify(codes));
  } catch {
    // Ignore
  }
}

export function formatNumber(
  value: number,
  format: 'INDIA' | 'WESTERN' = 'INDIA',
  maxDecimals = 2
): string {
  if (!Number.isFinite(value)) return '0';
  const locale = format === 'INDIA' ? 'en-IN' : 'en-US';
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxDecimals,
  }).format(value);
}

// Convert number into Indian Numbering Words (Thousand, Lakh, Crore)
const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function convertTwoDigits(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${TENS[ten]}${one ? ' ' + ONES[one] : ''}`;
}

function convertThreeDigits(n: number): string {
  if (n === 0) return '';
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const hPart = hundred > 0 ? `${ONES[hundred]} Hundred` : '';
  const rPart = convertTwoDigits(rest);
  if (hPart && rPart) return `${hPart} ${rPart}`;
  return hPart || rPart;
}

export function numberToIndianWords(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return 'Zero Rupees Only';
  const isNegative = amount < 0;
  const absAmount = Math.floor(Math.abs(amount));
  if (absAmount === 0) return 'Zero Rupees Only';

  const parts: string[] = [];
  let rem = absAmount;

  const arab = Math.floor(rem / 1000000000);
  rem %= 1000000000;
  if (arab > 0) {
    parts.push(`${convertThreeDigits(arab)} Arab`);
  }

  const crore = Math.floor(rem / 10000000);
  rem %= 10000000;
  if (crore > 0) {
    parts.push(`${convertTwoDigits(crore)} Crore`);
  }

  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  if (lakh > 0) {
    parts.push(`${convertTwoDigits(lakh)} Lakh`);
  }

  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  if (thousand > 0) {
    parts.push(`${convertTwoDigits(thousand)} Thousand`);
  }

  if (rem > 0) {
    parts.push(convertThreeDigits(rem));
  }

  return `${isNegative ? 'Minus ' : ''}${parts.join(' ')} Rupees Only`;
}

export function numberToWesternWords(amount: number): string {
  if (!Number.isFinite(amount) || amount === 0) return 'Zero Only';
  const isNegative = amount < 0;
  const absAmount = Math.floor(Math.abs(amount));
  if (absAmount === 0) return 'Zero Only';

  const scales = ['', 'Thousand', 'Million', 'Billion', 'Trillion'];
  const parts: string[] = [];
  let rem = absAmount;
  let scaleIdx = 0;

  while (rem > 0 && scaleIdx < scales.length) {
    const chunk = rem % 1000;
    if (chunk > 0) {
      const chunkWords = convertThreeDigits(chunk);
      const scaleLabel = scales[scaleIdx];
      parts.unshift(scaleLabel ? `${chunkWords} ${scaleLabel}` : chunkWords);
    }
    rem = Math.floor(rem / 1000);
    scaleIdx++;
  }

  return `${isNegative ? 'Minus ' : ''}${parts.join(' ')} Only`;
}

// Tactile audio click generator for realistic calculator buttons
let sharedAudioCtx: AudioContext | null = null;

export function playKeyFeedback(enabled = true) {
  if (!enabled || typeof window === 'undefined') return;
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(8);
    }
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume();
    }
    const osc = sharedAudioCtx.createOscillator();
    const gain = sharedAudioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, sharedAudioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, sharedAudioCtx.currentTime + 0.025);
    gain.gain.setValueAtTime(0.04, sharedAudioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, sharedAudioCtx.currentTime + 0.025);
    osc.connect(gain);
    gain.connect(sharedAudioCtx.destination);
    osc.start();
    osc.stop(sharedAudioCtx.currentTime + 0.028);
  } catch {
    // Ignore audio context restrictions
  }
}
