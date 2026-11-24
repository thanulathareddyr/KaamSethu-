import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, ShieldAlert } from 'lucide-react';
import { AREA_HUBS, formatRupees, SKILL_PAY_FLOORS, TRADES } from '../data/kaamnearLocale';
import type { ShiftItem, TradeType } from '../types';

interface PostShiftViewProps {
  shifts: ShiftItem[];
  onCreated: () => void;
  onVouchVerified: () => void;
}

const VALID_TRADES = TRADES.filter((t): t is TradeType => t !== 'All');

export const PostShiftView: React.FC<PostShiftViewProps> = ({
  shifts,
  onCreated,
  onVouchVerified,
}) => {
  const [title, setTitle] = useState('Morning Motor & Starter Wiring');
  const [trade, setTrade] = useState<TradeType>('Electrician');
  const [shopName, setShopName] = useState('Maruthi Electrical Works');
  const [area, setArea] = useState('Mathikere');
  const [grossPay, setGrossPay] = useState<string>('780');
  const [slotsTotal, setSlotsTotal] = useState<string>('1');
  const [shopPhone, setShopPhone] = useState('9845055667');
  const [timing, setTiming] = useState('8:30 AM – 5:30 PM');
  const [notes, setNotes] = useState('Same-evening UPI payout · tea provided');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [stampingId, setStampingId] = useState<number | null>(null);

  const floor = SKILL_PAY_FLOORS[trade];
  const numericPay = Number(grossPay) || 0;
  const isBelowFloor = numericPay > 0 && numericPay < floor;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          trade,
          shopName,
          area,
          grossPay: Number(grossPay),
          slotsTotal: Number(slotsTotal),
          shopPhone,
          timing,
          notes,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setFeedback({
          ok: false,
          text: payload.message || 'Shift rejected by dispatch guardrails.',
        });
        onCreated();
        return;
      }

      setFeedback({ ok: true, text: payload.message });
      onCreated();
    } catch {
      setFeedback({ ok: false, text: 'Network error while posting shift.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTestUnderpayBlock = () => {
    setTrade('Electrician');
    setTitle('Underpaid Wiring Trial');
    setGrossPay('360');
    setFeedback({
      ok: false,
      text: 'Wage set to Rs. 360/day (below Rs. 600 Electrician floor). Submit to verify Gate 2 server rejection.',
    });
  };

  const handleStampPaid = async (shift: ShiftItem) => {
    if (!shift.vouchCode) return;
    setStampingId(shift.id);
    setFeedback(null);
    try {
      const res = await fetch('/api/vouches/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vouchCode: shift.vouchCode,
          workerName: shift.acceptedBy || 'Ramesh K',
        }),
      });
      const payload = await res.json();
      setFeedback({
        ok: Boolean(res.ok && payload.ok),
        text: payload.message || 'Unable to verify payout.',
      });
      onVouchVerified();
    } catch {
      setFeedback({ ok: false, text: 'Network error verifying QR vouch.' });
    } finally {
      setStampingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500">
          Shopkeeper Dispatch <span aria-hidden="true">·</span> Gate 2 Fair-Pay Protection
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Post a Local Shift Without Spam Calls
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl">
          KaamNear pings only the Top 5 nearest qualified workers and locks the listing automatically the moment slots fill.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Dispatch Form */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">New Shift Dispatch</h2>
            <button
              type="button"
              onClick={handleTestUnderpayBlock}
              className="text-xs font-semibold text-[#C2410C] hover:underline whitespace-nowrap"
            >
              Test Gate 2 Floor Block (Rs. 360)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="shop-name" className="block text-xs font-semibold text-slate-700">
                Shop / Workshop Name
              </label>
              <input
                id="shop-name"
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="shift-title" className="block text-xs font-semibold text-slate-700">
                Shift Task Description
              </label>
              <input
                id="shift-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shift-trade" className="block text-xs font-semibold text-slate-700">
                Trade Category
              </label>
              <select
                id="shift-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value as TradeType)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              >
                {VALID_TRADES.map((t) => (
                  <option key={t} value={t}>
                    {t} (Min {formatRupees(SKILL_PAY_FLOORS[t])})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shift-area" className="block text-xs font-semibold text-slate-700">
                Neighborhood Hub
              </label>
              <select
                id="shift-area"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              >
                {AREA_HUBS.map((hub) => (
                  <option key={hub.name} value={hub.name}>
                    {hub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shift-pay" className="block text-xs font-semibold text-slate-700">
                Daily Gross Wage (Rs.)
              </label>
              <input
                id="shift-pay"
                type="number"
                min={100}
                required
                value={grossPay}
                onChange={(e) => setGrossPay(e.target.value)}
                className={`w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums rounded-xl border focus:outline-none ${
                  isBelowFloor
                    ? 'bg-red-50 border-red-300 text-red-900'
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white focus:border-[#1E2B58]'
                }`}
              />
              <p className={`text-xs ${isBelowFloor ? 'text-red-700 font-semibold' : 'text-slate-500'}`}>
                {isBelowFloor
                  ? `Below ${trade} minimum floor (${formatRupees(floor)}/day) — Gate 2 will reject.`
                  : `Gate 2 Fair-Pay Floor for ${trade}: ${formatRupees(floor)}/day`}
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shift-slots" className="block text-xs font-semibold text-slate-700">
                Workers Needed (Slots)
              </label>
              <select
                id="shift-slots"
                value={slotsTotal}
                onChange={(e) => setSlotsTotal(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} worker{n > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shop-phone" className="block text-xs font-semibold text-slate-700">
                Shopkeeper WhatsApp / Phone
              </label>
              <input
                id="shop-phone"
                type="tel"
                required
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="shift-timing" className="block text-xs font-semibold text-slate-700">
                Shift Hours
              </label>
              <input
                id="shift-timing"
                type="text"
                required
                value={timing}
                onChange={(e) => setTiming(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="shift-notes" className="block text-xs font-semibold text-slate-700">
                Payout & Site Notes
              </label>
              <input
                id="shift-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#1E2B58]"
              />
            </div>
          </div>

          {feedback && (
            <div
              className={`rounded-xl px-4 py-3 text-sm flex items-start gap-2.5 border ${
                feedback.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {feedback.ok ? (
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
              ) : (
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-red-700" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] px-5 py-2.5 text-sm font-semibold text-white bg-[#1E2B58] hover:bg-[#162044] disabled:opacity-60 rounded-xl inline-flex items-center justify-center gap-2 transition-colors"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            Ping Top 5 Nearby Workers
          </button>
        </form>

        {/* Right: Active Dispatch & Day-End QR Stamp List */}
        <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Active Shopkeeper Dispatches</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Stamp locked shifts as Paid & Verified to issue the worker&apos;s portable QR vouch.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
              {shifts.length} shifts
            </span>
          </div>

          {shifts.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              No shifts dispatched yet. Post your first shift using the form.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {shifts.map((s) => {
                const canStamp = s.status === 'LOCKED' && Boolean(s.vouchCode);
                return (
                  <div key={s.id} className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500">
                        <span className="font-semibold text-slate-800">{s.trade}</span>
                        <span aria-hidden="true">·</span>
                        <span>{s.area}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">{formatRupees(s.grossPay)}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 truncate">{s.title}</p>
                      <p className="text-xs text-slate-600">
                        {s.shopName}
                        {s.acceptedBy ? ` · Assigned to ${s.acceptedBy}` : ''}
                        {s.vouchCode ? ` · QR ${s.vouchCode}` : ''}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {canStamp ? (
                        <button
                          type="button"
                          disabled={stampingId === s.id}
                          onClick={() => handleStampPaid(s)}
                          className="min-h-[40px] px-3.5 py-2 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl inline-flex items-center gap-1.5 whitespace-nowrap"
                        >
                          {stampingId === s.id && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Mark Paid & Stamp QR
                        </button>
                      ) : (
                        <span
                          className={`text-xs font-semibold inline-flex items-center gap-1 whitespace-nowrap ${
                            s.status === 'COMPLETED'
                              ? 'text-[#1E2B58]'
                              : s.status === 'BLOCKED'
                                ? 'text-red-700'
                                : 'text-emerald-700'
                          }`}
                        >
                          {s.status === 'BLOCKED' && <AlertTriangle className="w-3.5 h-3.5" />}
                          {s.status === 'COMPLETED'
                            ? 'Paid & Verified'
                            : s.status === 'OPEN'
                              ? `Open (${s.slotsFilled}/${s.slotsTotal})`
                              : s.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
