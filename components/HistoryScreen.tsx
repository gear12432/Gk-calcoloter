'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Share2,
  MessageCircle,
  Download,
  Copy,
  Check,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  AppSettings,
  HistoryRecord,
  formatNumber,
  playKeyFeedback,
} from '@/lib/calculator-store';

interface HistoryScreenProps {
  settings: AppSettings;
  history: HistoryRecord[];
  onDeleteRecords: (ids: string[]) => void;
  onClearAllHistory: () => void;
  onBack: () => void;
}

export default function HistoryScreen({
  settings,
  history,
  onDeleteRecords,
  onClearAllHistory,
  onBack,
}: HistoryScreenProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const feedback = () => playKeyFeedback(settings.soundEnabled);

  const toggleSelect = (id: string) => {
    feedback();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    feedback();
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map((h) => h.id));
    }
  };

  const formatRecordText = (rec: HistoryRecord): string => {
    const sym = settings.currencySymbol;
    const fmt = (n: number) => formatNumber(n, settings.numberFormat);
    if (rec.type === 'GST' && rec.gstRate !== undefined) {
      const halfRate = Math.abs(rec.gstRate) / 2;
      return [
        `Original Amount: ${sym}${fmt(rec.originalAmount)}`,
        `GST (${rec.gstRate > 0 ? `+${rec.gstRate}%` : `${rec.gstRate}%`}): ${sym}${fmt(rec.gstAmount || 0)}`,
        `CGST (${halfRate}%): ${sym}${fmt(rec.cgstAmount || 0)}`,
        `SGST (${halfRate}%): ${sym}${fmt(rec.sgstAmount || 0)}`,
        `Final Result: ${sym}${fmt(rec.finalAmount)}`,
      ].join('\n');
    }
    return [
      `Calculation: ${rec.expression}`,
      `Original Amount: ${sym}${fmt(rec.originalAmount)}`,
      `Final Result: ${sym}${fmt(rec.finalAmount)}`,
      rec.note ? rec.note : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleCopyRecord = async (rec: HistoryRecord) => {
    feedback();
    const text = formatRecordText(rec);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedId(rec.id);
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleShareText = async (text: string) => {
    feedback();
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Calculation History', text });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      setCopiedId('header-share');
      setTimeout(() => setCopiedId(null), 1800);
    }
  };

  const handleWhatsAppShare = (rec: HistoryRecord) => {
    feedback();
    const text = formatRecordText(rec);
    handleShareText(text);
  };

  const handleHeaderShare = () => {
    const targetRecords =
      selectedIds.length > 0
        ? history.filter((h) => selectedIds.includes(h.id))
        : history;
    if (targetRecords.length === 0) return;
    const combined = targetRecords.map(formatRecordText).join('\n\n---\n\n');
    handleShareText(combined);
  };

  const handleHeaderDelete = () => {
    feedback();
    if (selectedIds.length > 0) {
      onDeleteRecords(selectedIds);
      setSelectedIds([]);
    } else if (history.length > 0) {
      setConfirmClearAll(true);
    }
  };

  const handleExportFile = () => {
    feedback();
    if (history.length === 0) return;
    const headers = [
      'Date',
      'Type',
      'Expression',
      'Original Amount',
      'GST %',
      'GST Amount',
      'CGST Amount',
      'SGST Amount',
      'Final Result',
    ];
    const rows = history.map((h) => [
      new Date(h.timestamp).toLocaleString(),
      h.type,
      `"${h.expression.replace(/"/g, '""')}"`,
      h.originalAmount,
      h.gstRate ?? '',
      h.gstAmount ?? '',
      h.cgstAmount ?? '',
      h.sgstAmount ?? '',
      h.finalAmount,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `calculation_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen w-full bg-[#F2FFF7] flex flex-col">
      {/* Dark Grey-Blue Header: #657780 as required by Section 6 */}
      <header className="sticky top-0 z-30 bg-[#657780] text-white h-14 px-4 flex items-center justify-between shadow-md border-b border-black/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Go Back"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-white">
            History
            {selectedIds.length > 0 && (
              <span className="ml-2 text-xs font-mono bg-white/20 px-2 py-0.5 rounded-md">
                {selectedIds.length} Selected
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleExportFile}
            aria-label="Export History as CSV File"
            title="Export History as CSV File"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <Download className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={handleHeaderDelete}
            aria-label={
              selectedIds.length > 0 ? 'Delete Selected Records' : 'Delete All History'
            }
            title={
              selectedIds.length > 0 ? 'Delete Selected Records' : 'Delete All History'
            }
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            <Trash2 className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={handleHeaderShare}
            aria-label="Share Calculations"
            title="Share Calculations"
            className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-white/15 transition-colors"
          >
            {copiedId === 'header-share' ? (
              <Check className="w-5 h-5 text-[#C5F4D5]" />
            ) : (
              <Share2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </header>

      {/* Sub-toolbar for Select All / Delete Selected */}
      {history.length > 0 && (
        <div className="bg-white border-b border-[#E9E9EC] px-4 py-2.5 flex items-center justify-between max-w-4xl w-full mx-auto">
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-[#10232B] hover:text-[#347BCB]"
          >
            {selectedIds.length === history.length ? (
              <CheckSquare className="w-4 h-4 text-[#347BCB]" />
            ) : (
              <Square className="w-4 h-4 text-neutral-400" />
            )}
            <span>
              {selectedIds.length === history.length
                ? 'Deselect All'
                : `Select All (${history.length} Records)`}
            </span>
          </button>

          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  onDeleteRecords(selectedIds);
                  setSelectedIds([]);
                }}
                className="px-3 py-1 rounded-lg bg-[#D83B29] text-white text-xs font-bold"
              >
                Delete Selected ({selectedIds.length})
              </button>
            )}
            <button
              type="button"
              onClick={handleExportFile}
              className="px-3 py-1 rounded-lg bg-[#F2FFF7] border border-[#C5F4D5] text-[#10232B] text-xs font-bold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete All Banner */}
      {confirmClearAll && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center justify-between max-w-4xl w-full mx-auto">
          <span className="text-xs font-bold text-red-900">
            Delete all {history.length} saved calculation records permanently?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmClearAll(false)}
              className="px-3 py-1 rounded-lg bg-white border border-neutral-300 text-xs font-semibold text-neutral-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                onClearAllHistory();
                setSelectedIds([]);
                setConfirmClearAll(false);
              }}
              className="px-3 py-1 rounded-lg bg-[#D83B29] text-white text-xs font-bold"
            >
              Delete All
            </button>
          </div>
        </div>
      )}

      {/* Main Scrollable List of Calculation History Entries */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-5 space-y-3 overflow-y-auto">
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm border border-[#E9E9EC]">
            <p className="text-base font-bold text-[#10232B]">
              No Calculation History Yet
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Perform calculations in GST Calculator, Citizen Calculator, or Money Cash
              Counter and they will be saved here automatically.
            </p>
          </div>
        ) : (
          history.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const hasGst = item.type === 'GST' && item.gstRate !== undefined;
            const halfRate = hasGst ? Math.abs(item.gstRate!) / 2 : 0;

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl p-3.5 sm:p-4 shadow-sm border transition-all flex items-stretch gap-3 sm:gap-4 ${
                  isSelected
                    ? 'border-[#347BCB] ring-2 ring-[#347BCB]/20'
                    : 'border-[#E9E9EC]'
                }`}
              >
                {/* Left Column: Green WhatsApp Share Icon on top + Selection Checkbox below */}
                <div className="flex flex-col items-center justify-between py-1 pr-2 border-r border-[#E9E9EC] shrink-0">
                  <button
                    type="button"
                    onClick={() => handleWhatsAppShare(item)}
                    aria-label="Share on WhatsApp"
                    title="Share Calculation"
                    className="w-10 h-10 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white shadow-xs flex items-center justify-center transition-transform active:scale-95"
                  >
                    <MessageCircle className="w-5 h-5 fill-white" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleSelect(item.id)}
                    aria-label="Select history record"
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-[#10232B] hover:bg-neutral-100"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-[#347BCB]" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-400" />
                    )}
                  </button>
                </div>

                {/* Right Column: Calculation Breakdown & Final Result */}
                <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
                  {/* Timestamp & Expression Header */}
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="font-semibold text-[#657780]">
                      {item.type} · {item.expression}
                    </span>
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Original Amount & GST Details */}
                  <div className="space-y-1 text-sm text-[#101010]">
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-600">Original Amount:</span>
                      <span className="font-mono font-bold tabular-nums">
                        {settings.currencySymbol}
                        {formatNumber(item.originalAmount, settings.numberFormat)}
                      </span>
                    </div>

                    {hasGst && (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-600">
                            GST ({item.gstRate! > 0 ? `+${item.gstRate}%` : `${item.gstRate}%`}):
                          </span>
                          <span className="font-mono font-semibold tabular-nums">
                            {settings.currencySymbol}
                            {formatNumber(item.gstAmount || 0, settings.numberFormat)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-700">
                          <span>CGST ({halfRate}%):</span>
                          <span className="font-mono font-medium tabular-nums">
                            {settings.currencySymbol}
                            {formatNumber(item.cgstAmount || 0, settings.numberFormat)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-neutral-700">
                          <span>SGST ({halfRate}%):</span>
                          <span className="font-mono font-medium tabular-nums">
                            {settings.currencySymbol}
                            {formatNumber(item.sgstAmount || 0, settings.numberFormat)}
                          </span>
                        </div>
                      </>
                    )}

                    {item.note && (
                      <div className="text-xs text-neutral-600 pt-0.5">{item.note}</div>
                    )}
                  </div>

                  {/* Light-Grey Final Result Background Bar with Share & Copy Icons Beside Final Result */}
                  <div className="bg-neutral-100 rounded-xl px-3 py-2 flex items-center justify-between gap-2 border border-neutral-200/80">
                    <div>
                      <span className="text-[11px] font-semibold text-neutral-500 block">
                        Final Calculated Result
                      </span>
                      <span className="font-mono font-bold text-lg text-[#101010] tabular-nums">
                        = {settings.currencySymbol}
                        {formatNumber(item.finalAmount, settings.numberFormat)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleCopyRecord(item)}
                        aria-label="Copy calculation result"
                        title="Copy calculation result"
                        className="w-9 h-9 rounded-lg bg-white hover:bg-neutral-200 text-[#10232B] border border-neutral-200 flex items-center justify-center transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleShareText(formatRecordText(item))}
                        aria-label="Share calculation result"
                        title="Share calculation result"
                        className="w-9 h-9 rounded-lg bg-white hover:bg-neutral-200 text-[#10232B] border border-neutral-200 flex items-center justify-center transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </main>
    </div>
  );
}
