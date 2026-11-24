import React, { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Phone,
  Search,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import chowkHeroImg from '../assets/images/kaamnear_chowk_panorama_1795454358759.jpg';
import {
  AREA_HUBS,
  formatRupees,
  formatShiftSpeechText,
  LOCALE_COPY,
  parseVoiceTranscript,
  TRADES,
} from '../data/kaamnearLocale';
import type { LangCode, ShiftItem, ShiftsResponse, TradeType } from '../types';
import { QrCodeBox } from './QrCodeBox';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

interface AcceptConfirmation {
  shiftTitle: string;
  shopName: string;
  shopPhone: string;
  area: string;
  grossPay: number;
  netPay: number;
  vouchCode: string;
  whatsappUrl: string;
  message: string;
}

interface FindWorkViewProps {
  lang: LangCode;
  onLangChange: (lang: LangCode) => void;
  selectedArea: string;
  onAreaChange: (area: string) => void;
  coords: { lat: number; lng: number } | null;
  onCoordsChange: (coords: { lat: number; lng: number } | null) => void;
  tradeFilter: 'All' | TradeType;
  onTradeFilterChange: (trade: 'All' | TradeType) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  maxKm: number;
  onMaxKmChange: (km: number) => void;
  data: ShiftsResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  onGoToLedger: () => void;
}

export const FindWorkView: React.FC<FindWorkViewProps> = ({
  lang,
  onLangChange,
  selectedArea,
  onAreaChange,
  coords,
  onCoordsChange,
  tradeFilter,
  onTradeFilterChange,
  searchQuery,
  onSearchQueryChange,
  maxKm,
  onMaxKmChange,
  data,
  loading,
  error,
  onRefresh,
  onGoToLedger,
}) => {
  const copy = LOCALE_COPY[lang];
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNote, setVoiceNote] = useState<string>('');
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [workerName, setWorkerName] = useState('Ramesh K');
  const [workerPhone, setWorkerPhone] = useState('9845123456');
  const [acceptingId, setAcceptingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<AcceptConfirmation | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const applyTranscript = (transcript: string) => {
    const parsed = parseVoiceTranscript(transcript);
    if (parsed.trade) onTradeFilterChange(parsed.trade);
    if (parsed.area) {
      onCoordsChange(null);
      onAreaChange(parsed.area);
    }
    onSearchQueryChange(parsed.query);
    setVoiceNote(`Heard "${transcript}"`);
  };

  const handleVoiceSearch = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const RecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setVoiceNote('Browser mic unavailable here — applied sample query "Electrician Mathikere".');
      applyTranscript('Electrician Mathikere');
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.lang = lang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const transcript = event.results[0]?.[0]?.transcript || '';
        if (transcript) applyTranscript(transcript);
        setListening(false);
      };
      recognition.onerror = () => {
        setListening(false);
        setVoiceNote('Mic permission declined or noisy — type or click a quick voice prompt below.');
      };
      recognition.onend = () => {
        setListening(false);
      };
      recognitionRef.current = recognition;
      setListening(true);
      setVoiceNote('Speak your trade and neighborhood...');
      recognition.start();
    } catch {
      setListening(false);
      setVoiceNote('Unable to start microphone; use text search or quick trade filters.');
    }
  };

  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setVoiceNote('GPS unavailable in this browser; using selected neighborhood hub.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCoordsChange({
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
        });
        setVoiceNote('Live GPS coordinates applied to distance and commute math.');
      },
      () => {
        setVoiceNote('Location access denied — keeping selected neighborhood hub.');
      },
      { timeout: 6000 }
    );
  };

  const handleSpeakShift = (shift: ShiftItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (speakingId === shift.id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(formatShiftSpeechText(shift, lang));
    utterance.lang = lang;
    utterance.rate = 0.96;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(shift.id);
    window.speechSynthesis.speak(utterance);
  };

  const handleAcceptShift = async (shift: ShiftItem) => {
    setAcceptingId(shift.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/shifts/${shift.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerName: workerName.trim() || 'Ramesh K',
          workerPhone: workerPhone.trim() || '9845123456',
          area: selectedArea,
          lat: coords?.lat,
          lng: coords?.lng,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        setActionError(payload.message || 'Unable to lock this shift.');
        onRefresh();
        return;
      }

      setConfirmation({
        shiftTitle: shift.title,
        shopName: shift.shopName,
        shopPhone: shift.shopPhone,
        area: shift.area,
        grossPay: shift.grossPay,
        netPay: shift.netPay,
        vouchCode: payload.vouchCode,
        whatsappUrl: payload.whatsappUrl,
        message: payload.message,
      });
      onRefresh();
    } catch {
      setActionError('Network error while locking shift. Please retry.');
    } finally {
      setAcceptingId(null);
    }
  };

  const shifts = data?.shifts ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-8">
      {/* Split Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs font-medium text-slate-500">
                {selectedArea} Dispatch <span aria-hidden="true">·</span> Net Pay Verified
              </p>

              {/* Language Switcher */}
              <div className="inline-flex items-center p-1 bg-slate-100 rounded-lg" role="group" aria-label="Language">
                {(['en-IN', 'kn-IN', 'hi-IN'] as LangCode[]).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onLangChange(code)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                      lang === code
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {LOCALE_COPY[code].label}
                  </button>
                ))}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-slate-900 leading-[1.15] max-w-2xl">
              {copy.heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              {copy.heroSubtitle}
            </p>
          </div>

          {/* Voice + Search Bar */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchQueryChange(e.target.value)}
                  placeholder={copy.voicePromptPlaceholder}
                  className="w-full min-h-[44px] pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#1E2B58]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => onSearchQueryChange('')}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleVoiceSearch}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 ${
                  listening
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-[#C2410C] text-white hover:bg-[#9A3412]'
                }`}
              >
                {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {listening ? copy.listeningButton : copy.speakButton}
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
              <span>{voiceNote || copy.sampleVoiceHint}</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => applyTranscript('Electrician Mathikere')}
                  className="font-medium text-[#1E2B58] hover:underline whitespace-nowrap"
                >
                  Sample: Electrician Mathikere
                </button>
                <button
                  type="button"
                  onClick={() => applyTranscript('Plumber Yeshwanthpur')}
                  className="font-medium text-[#1E2B58] hover:underline whitespace-nowrap"
                >
                  Sample: Plumber Yeshwanthpur
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Hero Visual */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 min-h-[240px]">
          {!heroImgFailed ? (
            <img
              src={chowkHeroImg}
              alt="Skilled neighborhood tradespeople and local shopkeepers at an Indian market chowk"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgFailed(true)}
              className="w-full h-full object-cover aspect-video lg:aspect-auto"
            />
          ) : (
            <div className="w-full h-full min-h-[240px] bg-gradient-to-br from-[#1E2B58] via-slate-800 to-slate-900 flex flex-col items-center justify-center p-6 text-center text-white">
              <MapPin className="w-9 h-9 text-amber-400 mb-3" />
              <p className="text-base font-semibold">Hyper-Local Neighborhood Dispatch</p>
              <p className="text-xs text-slate-300 mt-1">Mathikere · Peenya · Yeshwanthpur</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-5 text-white">
            <p className="text-xs font-medium text-amber-300">Zero Broker Fee · Top-5 Radius Pool</p>
            <p className="text-sm font-semibold mt-0.5">
              Average slot lock in 19 seconds with verified daily wage protection.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column Summary Metrics Row */}
      <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-2xl divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Open Local Shifts</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats ? stats.openCount : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Within active neighborhood</p>
        </div>
        <div className="p-5 border-l border-slate-200 lg:border-l-0">
          <p className="text-xs font-medium text-slate-500">Atomic Slot Locks</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {stats ? stats.lockedCount : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Filled without double-booking</p>
        </div>
        <div className="p-5">
          <p className="text-xs font-medium text-slate-500">Spam Calls Prevented</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#15803D] mt-1">
            {stats ? stats.spamCallsPrevented : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Extra callers paused on lock</p>
        </div>
        <div className="p-5 border-l border-slate-200 lg:border-l-0">
          <p className="text-xs font-medium text-slate-500">Verified QR Vouches</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-[#1E2B58] mt-1">
            {stats ? stats.vouchedCount : '—'}
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Backed by completed payouts</p>
        </div>
      </section>

      {/* Post-Accept Confirmation Banner / QR Vouch Card */}
      {confirmation && (
        <section className="bg-white border border-emerald-300 rounded-2xl p-6 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-emerald-700 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Shift Confirmed & Locked</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                {confirmation.shiftTitle} at {confirmation.shopName}
              </h2>
              <p className="text-sm text-slate-600">{confirmation.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmation(null)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-4 flex items-center gap-4">
              <QrCodeBox value={confirmation.vouchCode} size={132} label={`QR Vouch ${confirmation.vouchCode}`} />
              <div className="space-y-1">
                <p className="text-xs text-slate-500">QR Work-Vouch Code</p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900">
                  {confirmation.vouchCode}
                </p>
                <p className="text-xs text-slate-600">
                  Show to shopkeeper at day-end payout to stamp your Trust Ledger.
                </p>
              </div>
            </div>

            <div className="md:col-span-4 grid grid-cols-2 gap-4 py-2 md:py-0">
              <div>
                <p className="text-xs text-slate-500">Area</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{confirmation.area}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Net Take-Home</p>
                <p className="text-sm font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
                  {formatRupees(confirmation.netPay)}
                </p>
              </div>
            </div>

            <div className="md:col-span-4 flex flex-wrap gap-3 md:justify-end">
              <a
                href={confirmation.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                Confirm on WhatsApp
              </a>
              <a
                href={`tel:${confirmation.shopPhone}`}
                className="min-h-[44px] px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4" />
                Call Shop
              </a>
              <button
                type="button"
                onClick={onGoToLedger}
                className="min-h-[44px] px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-800 text-sm font-medium rounded-xl whitespace-nowrap shrink-0"
              >
                Open Trust Ledger
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Location, Worker Details & Trade Filter Bar */}
      <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-3 space-y-1.5">
            <label htmlFor="worker-area" className="block text-xs font-semibold text-slate-700">
              Your Neighborhood Hub
            </label>
            <select
              id="worker-area"
              value={selectedArea}
              onChange={(e) => {
                onCoordsChange(null);
                onAreaChange(e.target.value);
              }}
              className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#1E2B58]"
            >
              {AREA_HUBS.map((hub) => (
                <option key={hub.name} value={hub.name}>
                  {hub.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleUseGps}
              className="w-full min-h-[44px] px-3 py-2 text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 rounded-xl inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5 text-[#1E2B58]" />
              {coords ? 'GPS Active' : 'Use My GPS'}
            </button>
          </div>

          <div className="md:col-span-3 space-y-1.5">
            <span className="block text-xs font-semibold text-slate-700">Distance Pool</span>
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => onMaxKmChange(5)}
                className={`min-h-[36px] px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  maxKm === 5 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.top5Label}
              </button>
              <button
                type="button"
                onClick={() => onMaxKmChange(15)}
                className={`min-h-[36px] px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  maxKm === 15 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {copy.allAreasLabel}
              </button>
            </div>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="worker-name" className="block text-xs font-semibold text-slate-700">
              Worker Name
            </label>
            <input
              id="worker-name"
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#1E2B58]"
            />
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label htmlFor="worker-phone" className="block text-xs font-semibold text-slate-700">
              Worker Phone
            </label>
            <input
              id="worker-phone"
              type="tel"
              value={workerPhone}
              onChange={(e) => setWorkerPhone(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 text-sm font-mono tabular-nums bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#1E2B58]"
            />
          </div>
        </div>

        {/* Trade Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-2 border-t border-slate-100">
          {TRADES.map((trade) => (
            <button
              key={trade}
              type="button"
              onClick={() => onTradeFilterChange(trade)}
              className={`min-h-[40px] px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                tradeFilter === trade
                  ? 'bg-[#1E2B58] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {trade}
            </button>
          ))}
        </div>
      </section>

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm flex items-center justify-between gap-4">
          <span>{actionError}</span>
          <button type="button" onClick={() => setActionError(null)} className="text-xs font-semibold underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Shifts Grid */}
      {loading && !data ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white border border-slate-200 rounded-2xl p-5 h-72 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
          <p className="text-sm font-semibold text-red-700">{error}</p>
          <button
            type="button"
            onClick={onRefresh}
            className="min-h-[44px] px-4 py-2 text-sm font-semibold bg-[#1E2B58] text-white rounded-xl"
          >
            Retry Loading Shifts
          </button>
        </div>
      ) : shifts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
          <h2 className="text-lg font-bold text-slate-900">No shifts match this radius or trade</h2>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Expand distance to 15 km or reset the trade filter to view all verified local shifts.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onTradeFilterChange('All');
                onMaxKmChange(15);
                onSearchQueryChange('');
              }}
              className="min-h-[44px] px-5 py-2.5 text-sm font-semibold bg-[#1E2B58] text-white rounded-xl"
            >
              Show All Nearby Shifts
            </button>
          </div>
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {shifts.map((shift) => {
            const isLocked = shift.status === 'LOCKED' || shift.status === 'COMPLETED';
            const slotsLeft = Math.max(0, shift.slotsTotal - shift.slotsFilled);
            const isSpeaking = speakingId === shift.id;

            return (
              <article
                key={shift.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-5"
              >
                <div className="space-y-3">
                  {/* Unboxed 1-line metadata */}
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="truncate">
                      <span className="font-semibold text-slate-800">{shift.trade}</span>
                      <span aria-hidden="true"> · </span>
                      <span>{shift.area}</span>
                    </span>
                    <span className="font-mono tabular-nums whitespace-nowrap shrink-0">
                      {shift.distanceKm} km
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-snug">{shift.title}</h3>
                    <p className="text-sm text-slate-600 mt-0.5">
                      {shift.shopName} <span aria-hidden="true">·</span> {shift.timing}
                    </p>
                  </div>

                  {/* Pay Math via Hairline Dividers (No nested cards) */}
                  <div className="border-t border-b border-slate-100 py-3 space-y-1.5 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Gross Daily Wage</span>
                      <span className="font-mono tabular-nums">{formatRupees(shift.grossPay)}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Commute ({shift.commuteMode})</span>
                      <span className="font-mono tabular-nums text-slate-700">
                        {shift.commuteCost === 0 ? 'Rs. 0' : `- Rs. ${shift.commuteCost}`}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 font-semibold">
                      <span className="text-slate-900">Net Take-Home Pay</span>
                      <span className="font-mono tabular-nums text-base text-[#15803D]">
                        {formatRupees(shift.netPay)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{shift.notes}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={`font-semibold ${
                        shift.status === 'COMPLETED'
                          ? 'text-[#1E2B58]'
                          : isLocked
                            ? 'text-slate-600'
                            : 'text-[#15803D]'
                      }`}
                    >
                      {shift.status === 'COMPLETED'
                        ? 'Paid & QR Verified'
                        : isLocked
                          ? 'Locked · Zero Spam Calls'
                          : `${slotsLeft} of ${shift.slotsTotal} slot${shift.slotsTotal > 1 ? 's' : ''} open`}
                    </span>
                    <span className="font-mono tabular-nums text-slate-500">
                      Floor {formatRupees(shift.minFloor)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => handleSpeakShift(shift)}
                      aria-label={`${copy.listenButton} to ${shift.title}`}
                      className="min-h-[44px] px-3.5 py-2 text-xs font-semibold border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      {isSpeaking ? <VolumeX className="w-4 h-4 text-[#C2410C]" /> : <Volume2 className="w-4 h-4" />}
                      {isSpeaking ? 'Stop' : copy.listenButton}
                    </button>

                    <button
                      type="button"
                      disabled={isLocked || acceptingId === shift.id}
                      onClick={() => handleAcceptShift(shift)}
                      className={`flex-1 min-h-[44px] px-4 py-2 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap ${
                        isLocked
                          ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                          : 'bg-[#1E2B58] text-white hover:bg-[#162044]'
                      }`}
                    >
                      {acceptingId === shift.id && <Loader2 className="w-4 h-4 animate-spin" />}
                      {isLocked ? 'Slot Locked' : copy.acceptButton}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
};
