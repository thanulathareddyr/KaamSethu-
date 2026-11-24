import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Download, PlusCircle, QrCode, ShieldCheck } from 'lucide-react';
import { FindWorkView } from './components/FindWorkView';
import { GuardrailAuditView } from './components/GuardrailAuditView';
import { PostShiftView } from './components/PostShiftView';
import { TrustLedgerView } from './components/TrustLedgerView';
import type { AppTab, AuditEntry, LangCode, ShiftsResponse, TradeType, VouchRecord } from './types';

const NAV_ITEMS: Array<{ id: AppTab; label: string; mobileLabel: string }> = [
  { id: 'find', label: 'Find Work', mobileLabel: 'Find Work' },
  { id: 'post', label: 'Post Shift', mobileLabel: 'Post Shift' },
  { id: 'ledger', label: 'Trust Ledger', mobileLabel: 'Ledger' },
  { id: 'audit', label: 'Guardrail Log', mobileLabel: 'Guardrails' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('find');
  const [lang, setLang] = useState<LangCode>('en-IN');
  const [selectedArea, setSelectedArea] = useState('Mathikere');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tradeFilter, setTradeFilter] = useState<'All' | TradeType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxKm, setMaxKm] = useState<number>(15);

  const [shiftsData, setShiftsData] = useState<ShiftsResponse | null>(null);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [shiftsError, setShiftsError] = useState<string | null>(null);

  const [vouches, setVouches] = useState<VouchRecord[]>([]);
  const [vouchesLoading, setVouchesLoading] = useState(true);

  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const params = new URLSearchParams({
        area: selectedArea,
        trade: tradeFilter,
        q: searchQuery,
        maxKm: String(maxKm),
      });
      if (coords) {
        params.set('lat', String(coords.lat));
        params.set('lng', String(coords.lng));
      }
      const res = await fetch(`/api/shifts?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load neighborhood shifts');
      const json: ShiftsResponse = await res.json();
      setShiftsData(json);
    } catch (err) {
      setShiftsError(err instanceof Error ? err.message : 'Unable to load shifts');
    } finally {
      setShiftsLoading(false);
    }
  }, [selectedArea, coords, tradeFilter, searchQuery, maxKm]);

  const fetchVouches = useCallback(async () => {
    setVouchesLoading(true);
    try {
      const res = await fetch('/api/vouches');
      if (res.ok) {
        const json = await res.json();
        setVouches(json.vouches ?? []);
      }
    } finally {
      setVouchesLoading(false);
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true);
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const json = await res.json();
        setAuditEntries(json.entries ?? []);
      }
    } finally {
      setAuditLoading(false);
    }
  }, []);

  const refreshAll = useCallback(() => {
    void fetchShifts();
    void fetchVouches();
    void fetchAudit();
  }, [fetchShifts, fetchVouches, fetchAudit]);

  useEffect(() => {
    void fetchShifts();
  }, [fetchShifts]);

  useEffect(() => {
    void fetchVouches();
    void fetchAudit();
  }, [fetchVouches, fetchAudit]);

  const handleResetDemo = async () => {
    const res = await fetch('/api/reset-demo', { method: 'POST' });
    if (res.ok) {
      refreshAll();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8FA] text-slate-900">
      {/* Top Bar Contract: strictly 3 zones separated by gap-8 */}
      <header className="md:sticky md:top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => setActiveTab('find')}
          className="text-xl font-extrabold tracking-tight text-[#1E2B58] whitespace-nowrap shrink-0 text-left"
        >
          KaamNear
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                  isActive
                    ? 'text-[#1E2B58] border-[#C2410C] font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="shrink-0">
          <a
            href="/api/export-zip"
            download="kaamnear-web.zip"
            className="min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#1E2B58] hover:bg-[#162044] rounded-xl inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            Download ZIP
          </a>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-24 md:pb-12">
        {activeTab === 'find' && (
          <FindWorkView
            lang={lang}
            onLangChange={setLang}
            selectedArea={selectedArea}
            onAreaChange={setSelectedArea}
            coords={coords}
            onCoordsChange={setCoords}
            tradeFilter={tradeFilter}
            onTradeFilterChange={setTradeFilter}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            maxKm={maxKm}
            onMaxKmChange={setMaxKm}
            data={shiftsData}
            loading={shiftsLoading}
            error={shiftsError}
            onRefresh={refreshAll}
            onGoToLedger={() => setActiveTab('ledger')}
          />
        )}

        {activeTab === 'post' && (
          <PostShiftView
            shifts={shiftsData?.shifts ?? []}
            onCreated={refreshAll}
            onVouchVerified={refreshAll}
          />
        )}

        {activeTab === 'ledger' && (
          <TrustLedgerView
            vouches={vouches}
            loading={vouchesLoading}
            onRefresh={refreshAll}
          />
        )}

        {activeTab === 'audit' && (
          <GuardrailAuditView
            entries={auditEntries}
            stats={shiftsData?.stats}
            loading={auditLoading}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Quiet Desktop Footer */}
      <footer className="hidden md:block border-t border-slate-200 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-500">
          <span>KaamNear · Hyper-local voice-first dispatch with fair-pay guardrails</span>
          <a href="/api/export-zip" download="kaamnear-web.zip" className="font-medium text-[#1E2B58] hover:underline">
            Export GitHub Source (.zip)
          </a>
        </div>
      </footer>

      {/* Mobile Bottom Thumb Tab Bar (< 15% mobile height) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur border-t border-slate-200 grid grid-cols-4 items-center px-1"
      >
        <button
          type="button"
          onClick={() => setActiveTab('find')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            activeTab === 'find' ? 'text-[#C2410C] font-semibold' : 'text-slate-600'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span>Find Work</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('post')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            activeTab === 'post' ? 'text-[#C2410C] font-semibold' : 'text-slate-600'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span>Post Shift</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ledger')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            activeTab === 'ledger' ? 'text-[#C2410C] font-semibold' : 'text-slate-600'
          }`}
        >
          <QrCode className="w-5 h-5" />
          <span>Ledger</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            activeTab === 'audit' ? 'text-[#C2410C] font-semibold' : 'text-slate-600'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>Guardrails</span>
        </button>
      </nav>
    </div>
  );
}
