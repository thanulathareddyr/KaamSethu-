import React, { useState } from 'react';
import { CheckCircle2, Loader2, Lock, RotateCcw, ShieldAlert } from 'lucide-react';
import { formatRupees } from '../data/kaamnearLocale';
import type { AuditEntry, ShiftsResponse } from '../types';

interface GuardrailAuditViewProps {
  entries: AuditEntry[];
  stats: ShiftsResponse['stats'] | undefined;
  loading: boolean;
  onResetDemo: () => Promise<void>;
}

export const GuardrailAuditView: React.FC<GuardrailAuditViewProps> = ({
  entries,
  stats,
  loading,
  onResetDemo,
}) => {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleReset = async () => {
    setResetting(true);
    setResetMessage(null);
    try {
      await onResetDemo();
      setResetMessage('Demo shifts, guardrails, and QR ledger restored to baseline.');
    } finally {
      setResetting(false);
    }
  };

  const renderDecisionLabel = (decision: AuditEntry['decision']) => {
    if (decision === 'BLOCKED') {
      return (
        <span className="text-xs font-semibold text-red-700 inline-flex items-center gap-1 whitespace-nowrap">
          <ShieldAlert className="w-3.5 h-3.5" />
          BLOCKED
        </span>
      );
    }
    if (decision === 'AUTO-LOCKED') {
      return (
        <span className="text-xs font-semibold text-[#C2410C] inline-flex items-center gap-1 whitespace-nowrap">
          <Lock className="w-3.5 h-3.5" />
          AUTO-LOCKED
        </span>
      );
    }
    if (decision === 'QR VOUCHED') {
      return (
        <span className="text-xs font-semibold text-[#1E2B58] inline-flex items-center gap-1 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5" />
          QR VOUCHED
        </span>
      );
    }
    return (
      <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5" />
        PASS
      </span>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-slate-500">
            Dispatcher Guardrails <span aria-hidden="true">·</span> Fair-Pay &amp; Atomic Lock Ledger
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Guardrail Decision Log
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl">
            Every shift dispatch passes Gate 1 (radius &amp; commute math), Gate 2 (statutory daily wage floor), and Gate 3 (atomic first-accept lock).
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={resetting}
          className="min-h-[44px] px-4 py-2.5 text-sm font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          {resetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
          Reset Demo Shifts
        </button>
      </div>

      {resetMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-3 text-sm">
          {resetMessage}
        </div>
      )}

      {/* Summary KPI Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-5 bg-white border border-slate-200 rounded-2xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs text-slate-500">Open Shifts</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats?.openCount ?? '—'}
          </p>
        </div>
        <div className="p-5 border-l border-slate-200 lg:border-l-0">
          <p className="text-xs text-slate-500">Atomic Locks</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats?.lockedCount ?? '—'}
          </p>
        </div>
        <div className="p-5">
          <p className="text-xs text-slate-500">Spam Calls Blocked</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
            {stats?.spamCallsPrevented ?? '—'}
          </p>
        </div>
        <div className="p-5 border-l border-slate-200 lg:border-l-0">
          <p className="text-xs text-slate-500">Floor Blocks</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-red-700 mt-1">
            {stats?.blockedCount ?? '—'}
          </p>
        </div>
        <div className="p-5 col-span-2 lg:col-span-1">
          <p className="text-xs text-slate-500">QR Vouches</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1E2B58] mt-1">
            {stats?.vouchedCount ?? '—'}
          </p>
        </div>
      </section>

      {/* Audit Log Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Recent Guardrail Evaluations</h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {entries.length} events
          </span>
        </div>

        {loading && entries.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Loading guardrail audit log...</div>
        ) : entries.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No audit events recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-6">Decision</th>
                  <th className="py-3 px-4">Shift &amp; Shop</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">Distance</th>
                  <th className="py-3 px-4 text-right">Net Pay</th>
                  <th className="py-3 px-6">Guardrail Rule Applied</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6">{renderDecisionLabel(entry.decision)}</td>
                    <td className="py-3 px-4 font-medium text-slate-900">{entry.shiftTitle}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{entry.area}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {entry.distanceKm} km
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {formatRupees(entry.netPay)}
                    </td>
                    <td className="py-3 px-6 text-slate-600">{entry.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
