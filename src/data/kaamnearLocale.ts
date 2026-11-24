import type { AreaHub, LangCode, ShiftItem, TradeType } from '../types';

export const AREA_HUBS: AreaHub[] = [
  { name: 'Mathikere', lat: 13.0334, lng: 77.564 },
  { name: 'Peenya 2nd Stage', lat: 13.0285, lng: 77.5197 },
  { name: 'Yeshwanthpur', lat: 13.025, lng: 77.549 },
  { name: 'Tumakuru Rd', lat: 13.0405, lng: 77.5305 },
  { name: 'Rajajinagar', lat: 12.9982, lng: 77.553 },
  { name: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
];

export const SKILL_PAY_FLOORS: Record<TradeType, number> = {
  Electrician: 600,
  Plumber: 600,
  Carpenter: 600,
  'Delivery Rider': 550,
  Tailor: 520,
  'Shop Helper': 450,
};

export const TRADES: Array<'All' | TradeType> = [
  'All',
  'Electrician',
  'Plumber',
  'Carpenter',
  'Tailor',
  'Delivery Rider',
  'Shop Helper',
];

export interface LocaleStrings {
  label: string;
  heroTitle: string;
  heroSubtitle: string;
  voicePromptPlaceholder: string;
  speakButton: string;
  listeningButton: string;
  sampleVoiceHint: string;
  acceptButton: string;
  listenButton: string;
  top5Label: string;
  allAreasLabel: string;
}

export const LOCALE_COPY: Record<LangCode, LocaleStrings> = {
  'en-IN': {
    label: 'English',
    heroTitle: 'Daily shifts within walking radius, ranked by real take-home pay.',
    heroSubtitle:
      'Speak your trade or neighborhood to hear open local shifts, see exact bus/walk deductions before accepting, and lock a slot atomically with a verified QR work-vouch.',
    voicePromptPlaceholder: 'Say or type: "Electrician Mathikere" or "Plumber Yeshwanthpur"',
    speakButton: 'Voice Search',
    listeningButton: 'Listening...',
    sampleVoiceHint: 'Try saying: Electrician Mathikere',
    acceptButton: 'Accept & Lock Shift',
    listenButton: 'Listen',
    top5Label: 'Within 5 km',
    allAreasLabel: 'Up to 15 km',
  },
  'kn-IN': {
    label: 'ಕನ್ನಡ',
    heroTitle: 'ನಿಮ್ಮ ಹತ್ತಿರದ ದಿನಗೂಲಿ ಕೆಲಸ, ನಿಜವಾದ ಕೈಗೆ ಸಿಗುವ ಹಣದೊಂದಿಗೆ.',
    heroSubtitle:
      'ನಿಮ್ಮ ಕೆಲಸ ಮತ್ತು ಪ್ರದೇಶವನ್ನು ಹೇಳಿ — ಪ್ರಯಾಣ ವೆಚ್ಚ ಕಳೆದ ನಂತರ ಸಿಗುವ ನಿವ್ವಳ ಹಣವನ್ನು ನೋಡಿ, ಒಂದೇ ಟ್ಯಾಪ್‌ನಲ್ಲಿ ಶಿಫ್ಟ್ ಲಾಕ್ ಮಾಡಿ.',
    voicePromptPlaceholder: 'ಹೇಳಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್ ಮತ್ತಿಕೆರೆ" / Electrician Mathikere',
    speakButton: 'ಧ್ವನಿ ಹುಡುಕಾಟ',
    listeningButton: 'ಕೇಳುತ್ತಿದೆ...',
    sampleVoiceHint: 'ಉದಾ: Electrician Mathikere',
    acceptButton: 'ಒಪ್ಪಿ & ಲಾಕ್ ಮಾಡಿ',
    listenButton: 'ಕೇಳಿ',
    top5Label: '5 ಕಿ.ಮೀ ಒಳಗೆ',
    allAreasLabel: '15 ಕಿ.ಮೀ ವರೆಗೆ',
  },
  'hi-IN': {
    label: 'हिन्दी',
    heroTitle: 'आपके पास के रोज़गार शिफ्ट, सही टेक-होम कमाई के साथ।',
    heroSubtitle:
      'अपना काम और इलाका बोलें — आने-जाने का खर्च काटकर असली कमाई देखें, और एक टैप में शिफ्ट लॉक करें।',
    voicePromptPlaceholder: 'बोलें या लिखें: "बिजली मिस्त्री मथिकेरे" / Electrician Mathikere',
    speakButton: 'वॉइस खोज',
    listeningButton: 'सुन रहा है...',
    sampleVoiceHint: 'उदाहरण: Electrician Mathikere',
    acceptButton: 'शिफ्ट लॉक करें',
    listenButton: 'सुनें',
    top5Label: '5 किमी के अंदर',
    allAreasLabel: '15 किमी तक',
  },
};

const TRADE_KEYWORDS: Array<{ trade: TradeType; words: string[] }> = [
  { trade: 'Electrician', words: ['electrician', 'wiring', 'wire', 'electrical', 'ಬಿಜಲಿ', 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್', 'बिजली', 'इलेक्ट्रीशियन'] },
  { trade: 'Plumber', words: ['plumber', 'pipe', 'pump', 'motor', 'ಪೈಪ್', 'ಪ್ಲಂಬರ್', 'प्लंबर', 'पाइप', 'नल'] },
  { trade: 'Carpenter', words: ['carpenter', 'wood', 'plywood', 'timber', 'ಬಡಗಿ', 'ಕಾರ್ಪೆಂಟರ್', 'बढ़ई', 'कारपेंटर', 'लकड़ी'] },
  { trade: 'Tailor', words: ['tailor', 'garment', 'stitch', 'overlock', 'ದರ್ಜಿ', 'ಟೈಲರ್', 'दरजी', 'सिलाई', 'टेलर'] },
  { trade: 'Delivery Rider', words: ['delivery', 'rider', 'bike', 'parcel', 'ಡೆಲಿವರಿ', 'डिलीवरी', 'राइडर'] },
  { trade: 'Shop Helper', words: ['helper', 'kirana', 'packing', 'stock', 'shop', 'ಹೆಲ್ಪರ್', 'हेल्पर', 'दुकान'] },
];

const AREA_KEYWORDS: Array<{ area: string; words: string[] }> = [
  { area: 'Mathikere', words: ['mathikere', 'ಮತ್ತಿಕೆರೆ', 'मथिकेरे'] },
  { area: 'Peenya 2nd Stage', words: ['peenya', 'ಪೀಣ್ಯ', 'पीन्या'] },
  { area: 'Yeshwanthpur', words: ['yeshwanthpur', 'yeshwantpur', 'ಯಶವಂತಪುರ', 'यशवंतपुर'] },
  { area: 'Tumakuru Rd', words: ['tumakuru', 'tumkur', 'ತುಮಕೂರು', 'तुमकुर'] },
  { area: 'Rajajinagar', words: ['rajajinagar', 'ರಾಜಾಜಿನಗರ', 'राजाजीनगर'] },
  { area: 'Yelahanka', words: ['yelahanka', 'ಯಲಹಂಕ', 'येलहंका'] },
];

export function parseVoiceTranscript(transcript: string): {
  trade?: TradeType;
  area?: string;
  query: string;
} {
  const normalized = transcript.trim().toLowerCase();
  let matchedTrade: TradeType | undefined;
  let matchedArea: string | undefined;

  for (const entry of TRADE_KEYWORDS) {
    if (entry.words.some((w) => normalized.includes(w))) {
      matchedTrade = entry.trade;
      break;
    }
  }

  for (const entry of AREA_KEYWORDS) {
    if (entry.words.some((w) => normalized.includes(w))) {
      matchedArea = entry.area;
      break;
    }
  }

  return {
    trade: matchedTrade,
    area: matchedArea,
    query: matchedTrade || matchedArea ? '' : transcript.trim(),
  };
}

export function formatShiftSpeechText(shift: ShiftItem, lang: LangCode): string {
  if (lang === 'kn-IN') {
    return `${shift.trade} ಕೆಲಸ, ${shift.shopName}, ${shift.area}. ದೂರ ${shift.distanceKm} ಕಿಲೋಮೀಟರ್. ದಿನಗೂಲಿ ${shift.grossPay} ರೂಪಾಯಿ, ಪ್ರಯಾಣ ವೆಚ್ಚ ${shift.commuteCost} ರೂಪಾಯಿ, ಕೈಗೆ ಸಿಗುವ ನಿವ್ವಳ ಹಣ ${shift.netPay} ರೂಪಾಯಿ.`;
  }
  if (lang === 'hi-IN') {
    return `${shift.trade} काम, ${shift.shopName}, ${shift.area} में। दूरी ${shift.distanceKm} किलोमीटर। कुल मजदूरी ${shift.grossPay} रुपये, आने-जाने का खर्च ${shift.commuteCost} रुपये, शुद्ध कमाई ${shift.netPay} रुपये।`;
  }
  return `${shift.trade} shift at ${shift.shopName} in ${shift.area}. Distance ${shift.distanceKm} kilometers. Gross pay ${shift.grossPay} rupees, commute cost ${shift.commuteCost} rupees, net take-home pay ${shift.netPay} rupees.`;
}

export function formatRupees(value: number): string {
  return `Rs. ${value.toLocaleString('en-IN')}`;
}
