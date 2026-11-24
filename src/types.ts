export type LangCode = 'en-IN' | 'kn-IN' | 'hi-IN';

export type TradeType =
  | 'Electrician'
  | 'Plumber'
  | 'Carpenter'
  | 'Tailor'
  | 'Delivery Rider'
  | 'Shop Helper';

export type ShiftStatus = 'OPEN' | 'LOCKED' | 'BLOCKED' | 'COMPLETED';

export type AppTab = 'find' | 'post' | 'ledger' | 'audit';

export interface AreaHub {
  name: string;
  lat: number;
  lng: number;
}

export interface ShiftItem {
  id: number;
  title: string;
  trade: TradeType;
  shopName: string;
  area: string;
  lat: number;
  lng: number;
  grossPay: number;
  minFloor: number;
  slotsTotal: number;
  slotsFilled: number;
  status: ShiftStatus;
  shopPhone: string;
  timing: string;
  notes: string;
  acceptedBy: string | null;
  vouchCode: string | null;
  createdAt: string;
  // Computed per worker origin query
  distanceKm: number;
  commuteCost: number;
  commuteMode: string;
  netPay: number;
  inTop5Pool: boolean;
}

export interface VouchRecord {
  id: number;
  shiftId: number;
  vouchCode: string;
  workerName: string;
  workerPhone: string;
  shopName: string;
  trade: TradeType;
  area: string;
  amountPaid: number;
  verifiedAt: string;
}

export interface AuditEntry {
  id: number;
  shiftTitle: string;
  area: string;
  distanceKm: number;
  netPay: number;
  decision: 'PASS' | 'AUTO-LOCKED' | 'BLOCKED' | 'QR VOUCHED';
  reason: string;
  createdAt: string;
}

export interface ShiftsResponse {
  shifts: ShiftItem[];
  stats: {
    openCount: number;
    lockedCount: number;
    blockedCount: number;
    vouchedCount: number;
    spamCallsPrevented: number;
  };
}
