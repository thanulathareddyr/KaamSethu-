import React, { useState } from 'react';
import { CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import vouchBadgeImg from '../assets/images/kaamnear_hero_vouch_badge_1795454356881.jpg';
import { formatRupees } from '../data/kaamnearLocale';
import type { VouchRecord } from '../types';
import { QrCodeBox } from './QrCodeBox';

interface TrustLedgerViewProps {
  vouches: VouchRecord[];
  loading: boolean;
  onRefresh: () => void;
}

export const TrustLedgerView: React.FC<TrustLedgerViewProps> = ({
  vouches,
  loading,
  onRefresh,
}) => {
  const [badgeImgFailed, setBadgeImgFailed] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const totalEarned = vouches.reduce((sum, v) => sum + v.amountPaid, 0);
  const creditGoal = 10;
  const progressPct = Math.min(100, Math.round((vouches.length / creditGoal) * 100));
  const unlockedCredit = vouches.length >= creditGoal;

  const qrPayload = `KAAMNEAR:WORKER:RAMESH-K:VOUCHES:${vouches.length}:EARNED:${totalEarned}`;

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    setVerifying(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/vouches/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vouchCode: codeInput.trim() }),
      });
      const payload = await res.json();
      setFeedback({
        ok: Boolean(res.ok && payload.ok),
        text: payload.message || 'Verification failed.',
      });
      if (res.ok && payload.ok) {
        setCodeInput('');
        onRefresh();
      }
    } catch {
      setFeedback({ ok: false, text: 'Network error while verifying vouch code.' });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">
          Portable Proof of Work <span aria-hidden="true">·</span> Informal-to-Formal Bridge
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Worker QR Trust Ledger
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          Every cash or UPI shift verified by a neighborhood shopkeeper stamps a tamper-evident QR vouch toward bank micro-credit and e-Shram income verification.
        </p>
      </div>

      {/* Top 2-column Ledger Identity + QR Card */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs text-slate-500">Verified Worker Profile</p>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Ramesh K <span aria-hidden="true">·</span> <span className="font-mono text-base font-medium text-slate-600">+91 98451 23456</span>
                </h2>
              </div>
              <span
                className={`text-xs font-semibold inline-flex items-center gap-1.5 ${
                  unlockedCredit ? 'text-emerald-700' : 'text-[#1E2B58]'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {unlockedCredit ? 'Micro-Credit Ready (10/10)' : `${vouches.length} / ${creditGoal} Vouches Toward Credit`}
              </span>
            </div>

            {/* Progress toward 10/10 Micro-Credit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                <span>Formal Micro-Credit &amp; e-Shram Income Proof Unlock</span>
                <span className="font-mono tabular-nums">
                  {vouches.length} / {creditGoal} ({progressPct}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    unlockedCredit ? 'bg-emerald-600' : 'bg-[#1E2B58]'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">
                {unlockedCredit
                  ? '10 verified shifts completed. Worker QR ledger qualifies for Rs. 15,000 working-capital micro-loan.'
                  : `${creditGoal - vouches.length} more verified shopkeeper payouts needed to unlock formal credit proof.`}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <p className="text-xs text-slate-500">Verified Shifts</p>
                <p className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
                  {vouches.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Verified Earnings</p>
                <p className="text-xl font-bold font-mono tabular-nums text-[#15803D] mt-0.5">
                  {formatRupees(totalEarned)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <p className="text-xs text-slate-500">Primary Cluster</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">Mathikere – Peenya</p>
              </div>
            </div>
          </div>

          {/* Verify Code Form */}
          <form onSubmit={handleVerifySubmit} className="pt-4 border-t border-slate-100 space-y-3">
            <label htmlFor="verify-vouch-input" className="block text-xs font-semibold text-slate-700">
              Stamp a Locked Shift Vouch Code (e.g. KN-QR-XXXX from Find Work)
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                id="verify-vouch-input"
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter KN-QR-XXXX"
                className="flex-1 min-h-[44px] px-3.5 py-2 text-sm font-mono uppercase bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
              <button
                type="submit"
                disabled={verifying || !codeInput.trim()}
                className="min-h-[44px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1E2B58] hover:bg-[#162044] disabled:opacity-50 rounded-xl inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0"
              >
                {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                Stamp Paid &amp; Verified
              </button>
            </div>
            {feedback && (
              <div
                className={`rounded-xl px-4 py-2.5 text-xs flex items-center gap-2 border ${
                  feedback.ok
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                {feedback.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <ShieldAlert className="w-4 h-4 shrink-0" />}
                <span>{feedback.text}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right: Scannable Portable QR Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between">
          <div className="relative h-36 bg-slate-900 overflow-hidden">
            {!badgeImgFailed ? (
              <img
                src={vouchBadgeImg}
                alt="Portable QR work vouch verification badge"
                referrerPolicy="no-referrer"
                onError={() => setBadgeImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-[#1E2B58] to-slate-800 flex items-center justify-center text-white text-sm font-semibold">
                Portable QR Work-Vouch Credential
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent flex items-end p-4 text-white">
              <p className="text-xs font-semibold">Scan with any NBFC / Bank / MSME verifier</p>
            </div>
          </div>

          <div className="p-6 flex flex-col items-center text-center gap-3 flex-1 justify-center">
            <QrCodeBox value={qrPayload} size={156} label="Worker Portable Trust Ledger QR" />
            <p className="text-xs font-mono tabular-nums text-slate-600 break-all max-w-xs">
              {qrPayload}
            </p>
          </div>
        </div>
      </section>

      {/* Verified Payout History Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900">Verified Shift Payout History</h2>
          <span className="text-xs font-mono tabular-nums text-slate-500">
            {vouches.length} records
          </span>
        </div>

        {loading && vouches.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">Loading verified payout records...</div>
        ) : vouches.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No verified QR vouches yet. Accept a shift and stamp it paid to mint the first record.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-6">Vouch Code</th>
                  <th className="py-3 px-4">Shopkeeper</th>
                  <th className="py-3 px-4">Trade</th>
                  <th className="py-3 px-4">Area</th>
                  <th className="py-3 px-4 text-right">Verified Payout</th>
                  <th className="py-3 px-6 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {vouches.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-6 font-mono tabular-nums font-semibold text-slate-900 whitespace-nowrap">
                      {v.vouchCode}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{v.shopName}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{v.trade}</td>
                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{v.area}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-[#15803D] whitespace-nowrap">
                      {formatRupees(v.amountPaid)}
                    </td>
                    <td className="py-3 px-6 text-right whitespace-nowrap">
                      <span className="text-xs font-semibold text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Paid &amp; Verified
                      </span>
                    </td>
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
