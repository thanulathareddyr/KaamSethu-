import path from 'path';
import { DatabaseSync } from 'node:sqlite';
import type { AreaHub, AuditEntry, ShiftItem, ShiftStatus, TradeType, VouchRecord } from '../src/types.ts';

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

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function estimateCommute(distanceKm: number): { cost: number; mode: string } {
  if (distanceKm <= 0.8) {
    return { cost: 0, mode: 'Walk (0 min cost)' };
  }
  if (distanceKm <= 3.0) {
    return { cost: 15, mode: 'Local bus / walk' };
  }
  if (distanceKm <= 6.0) {
    return { cost: 45, mode: '2-way bus fare' };
  }
  return { cost: 165, mode: 'Cross-city transit + auto' };
}

const dbPath = path.resolve(process.cwd(), 'kaamnear.db');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    trade TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    area TEXT NOT NULL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    gross_pay INTEGER NOT NULL,
    min_floor INTEGER NOT NULL,
    slots_total INTEGER NOT NULL DEFAULT 1,
    slots_filled INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN',
    shop_phone TEXT NOT NULL,
    timing TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    accepted_by TEXT,
    vouch_code TEXT,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vouches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_id INTEGER NOT NULL,
    vouch_code TEXT NOT NULL UNIQUE,
    worker_name TEXT NOT NULL,
    worker_phone TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    trade TEXT NOT NULL,
    area TEXT NOT NULL,
    amount_paid INTEGER NOT NULL,
    verified_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shift_title TEXT NOT NULL,
    area TEXT NOT NULL,
    distance_km REAL NOT NULL,
    net_pay INTEGER NOT NULL,
    decision TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`);

export function seedInitialData(forceReset = false): void {
  if (forceReset) {
    db.exec('DELETE FROM shifts; DELETE FROM vouches; DELETE FROM audit_log;');
  } else {
    const row = db.prepare('SELECT COUNT(*) as cnt FROM shifts').get() as { cnt: number };
    if (row.cnt > 0) return;
  }

  const now = new Date().toISOString();
  const insertShift = db.prepare(`
    INSERT INTO shifts (title, trade, shop_name, area, lat, lng, gross_pay, min_floor, slots_total, slots_filled, status, shop_phone, timing, notes, accepted_by, vouch_code, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialShifts: Array<[string, TradeType, string, string, number, number, number, number, number, number, ShiftStatus, string, string, string, string | null, string | null]> = [
    [
      '3-Phase Wiring & Panel Check',
      'Electrician',
      'Sri Lakshmi Electricals',
      'Mathikere',
      13.0352,
      77.5618,
      800,
      600,
      2,
      1,
      'OPEN',
      '9845011223',
      '8:30 AM – 5:30 PM',
      'Tea + lunch provided · same-evening UPI or cash payout',
      'Ramesh K',
      null,
    ],
    [
      'PVC Pipe & Motor Pump Repair',
      'Plumber',
      'Kaveri Hardware & Sanitary',
      'Yeshwanthpur',
      13.0268,
      77.5512,
      850,
      600,
      1,
      0,
      'OPEN',
      '9845099881',
      '9:00 AM – 6:00 PM',
      'Tools available at store · urgent morning requirement',
      null,
      null,
    ],
    [
      'CNC Crate & Plywood Framing',
      'Carpenter',
      'Peenya Timber Works',
      'Peenya 2nd Stage',
      13.0294,
      77.5221,
      900,
      600,
      1,
      0,
      'OPEN',
      '9900144556',
      '8:00 AM – 5:00 PM',
      'Warehouse shift inside Peenya Industrial Area',
      null,
      null,
    ],
    [
      'Two-Wheeler Spare Parts Drop',
      'Delivery Rider',
      'Metro Auto Spares',
      'Tumakuru Rd',
      13.0398,
      77.533,
      700,
      550,
      1,
      0,
      'OPEN',
      '9740022334',
      '10:00 AM – 6:30 PM',
      'Fuel allowance Rs. 120 extra · local 4 km radius drops',
      null,
      null,
    ],
    [
      'Garment Overlock Machine Shift',
      'Tailor',
      'Nandi Apparels Unit 2',
      'Peenya 2nd Stage',
      13.0271,
      77.5182,
      650,
      520,
      1,
      1,
      'LOCKED',
      '9886077889',
      '9:00 AM – 6:00 PM',
      'Slot filled & locked atomically in 19 seconds',
      'Manjunath S',
      'KN-QR-8412',
    ],
    [
      'Counter Stocking & Unloading',
      'Shop Helper',
      'Annapoorna Kirana Wholesale',
      'Mathikere',
      13.0319,
      77.5661,
      620,
      450,
      2,
      0,
      'OPEN',
      '9980133445',
      '8:00 AM – 4:30 PM',
      'No heavy lifting above 20 kg · weekly bonus option',
      null,
      null,
    ],
    [
      'Godown Night Packing Shift',
      'Shop Helper',
      'Unverified Depot',
      'Yelahanka',
      13.1007,
      77.5963,
      360,
      450,
      1,
      0,
      'BLOCKED',
      '9000000000',
      '9:00 PM – 6:00 AM',
      'Blocked automatically by Gate 2 Fair-Pay Floor (Rs. 360 < Rs. 450)',
      null,
      null,
    ],
  ];

  for (const s of initialShifts) {
    insertShift.run(...s, now);
  }

  const insertVouch = db.prepare(`
    INSERT INTO vouches (shift_id, vouch_code, worker_name, worker_phone, shop_name, trade, area, amount_paid, verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const seedVouches: Array<[number, string, string, string, string, TradeType, string, number, string]> = [
    [5, 'KN-QR-8412', 'Ramesh K', '9845123456', 'Nandi Apparels Unit 2', 'Tailor', 'Peenya 2nd Stage', 650, '2026-11-23T17:45:00.000Z'],
    [1, 'KN-QR-7731', 'Ramesh K', '9845123456', 'Sri Lakshmi Electricals', 'Electrician', 'Mathikere', 785, '2026-11-22T18:10:00.000Z'],
    [2, 'KN-QR-6904', 'Ramesh K', '9845123456', 'Kaveri Hardware & Sanitary', 'Plumber', 'Yeshwanthpur', 835, '2026-11-21T18:00:00.000Z'],
    [3, 'KN-QR-6120', 'Ramesh K', '9845123456', 'Peenya Timber Works', 'Carpenter', 'Peenya 2nd Stage', 885, '2026-11-20T17:30:00.000Z'],
    [6, 'KN-QR-5508', 'Ramesh K', '9845123456', 'Annapoorna Kirana Wholesale', 'Shop Helper', 'Mathikere', 620, '2026-11-19T16:50:00.000Z'],
    [1, 'KN-QR-4892', 'Ramesh K', '9845123456', 'Bharath Borewell & Motors', 'Electrician', 'Tumakuru Rd', 810, '2026-11-18T18:05:00.000Z'],
    [2, 'KN-QR-4105', 'Ramesh K', '9845123456', 'Surya Pipes & Fittings', 'Plumber', 'Rajajinagar', 790, '2026-11-17T17:40:00.000Z'],
  ];

  for (const v of seedVouches) {
    insertVouch.run(...v);
  }

  const insertAudit = db.prepare(`
    INSERT INTO audit_log (shift_title, area, distance_km, net_pay, decision, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const seedAudits: Array<[string, string, number, number, AuditEntry['decision'], string]> = [
    ['Electrician · Sri Lakshmi Electricals', 'Mathikere', 0.4, 800, 'PASS', 'Passed Gate 1-3: above Rs. 600 floor, 0.4 km walk radius'],
    ['Tailor · Nandi Apparels Unit 2', 'Peenya 2nd Stage', 2.1, 635, 'AUTO-LOCKED', '1st worker accepted slot 1/1; 42 follow-up spam calls blocked'],
    ['Shop Helper · Unverified Depot', 'Yelahanka', 9.2, 195, 'BLOCKED', 'Rejected: Rs. 360 gross is below Rs. 450 Karnataka helper floor'],
    ['Plumber · Kaveri Hardware', 'Yeshwanthpur', 1.6, 835, 'QR VOUCHED', 'Shop verified payout via QR-6904; added to credit ledger'],
  ];

  for (const a of seedAudits) {
    insertAudit.run(...a, now);
  }
}

seedInitialData(false);

interface RawShiftRow {
  id: number;
  title: string;
  trade: TradeType;
  shop_name: string;
  area: string;
  lat: number;
  lng: number;
  gross_pay: number;
  min_floor: number;
  slots_total: number;
  slots_filled: number;
  status: ShiftStatus;
  shop_phone: string;
  timing: string;
  notes: string;
  accepted_by: string | null;
  vouch_code: string | null;
  created_at: string;
}

export function listShifts(params: {
  lat: number;
  lng: number;
  trade?: string;
  q?: string;
  maxKm?: number;
  includeLocked?: boolean;
}): { shifts: ShiftItem[]; stats: { openCount: number; lockedCount: number; blockedCount: number; vouchedCount: number; spamCallsPrevented: number } } {
  const rows = db.prepare('SELECT * FROM shifts ORDER BY id DESC').all() as unknown as RawShiftRow[];

  const enriched: ShiftItem[] = rows.map((r) => {
    const distanceKm = haversineKm(params.lat, params.lng, r.lat, r.lng);
    const commute = estimateCommute(distanceKm);
    const netPay = r.gross_pay - commute.cost;
    return {
      id: r.id,
      title: r.title,
      trade: r.trade,
      shopName: r.shop_name,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      grossPay: r.gross_pay,
      minFloor: r.min_floor,
      slotsTotal: r.slots_total,
      slotsFilled: r.slots_filled,
      status: r.status,
      shopPhone: r.shop_phone,
      timing: r.timing,
      notes: r.notes,
      acceptedBy: r.accepted_by,
      vouchCode: r.vouch_code,
      createdAt: r.created_at,
      distanceKm,
      commuteCost: commute.cost,
      commuteMode: commute.mode,
      netPay,
      inTop5Pool: distanceKm <= 5.0 && r.status !== 'BLOCKED',
    };
  });

  // Sort by netPay descending for open shifts, keeping distance tie-breaker
  enriched.sort((a, b) => {
    if (a.status === 'OPEN' && b.status !== 'OPEN') return -1;
    if (a.status !== 'OPEN' && b.status === 'OPEN') return 1;
    return b.netPay - a.netPay || a.distanceKm - b.distanceKm;
  });

  let filtered = enriched.filter((s) => s.status !== 'BLOCKED');
  if (!params.includeLocked) {
    filtered = filtered.filter((s) => s.status === 'OPEN' || s.status === 'LOCKED' || s.status === 'COMPLETED');
  }
  if (params.trade && params.trade !== 'All') {
    filtered = filtered.filter((s) => s.trade.toLowerCase() === params.trade?.toLowerCase());
  }
  if (params.maxKm && params.maxKm > 0) {
    filtered = filtered.filter((s) => s.distanceKm <= params.maxKm!);
  }
  if (params.q && params.q.trim()) {
    const term = params.q.trim().toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.title.toLowerCase().includes(term) ||
        s.trade.toLowerCase().includes(term) ||
        s.area.toLowerCase().includes(term) ||
        s.shopName.toLowerCase().includes(term)
    );
  }

  const openCount = enriched.filter((s) => s.status === 'OPEN').length;
  const lockedCount = enriched.filter((s) => s.status === 'LOCKED' || s.status === 'COMPLETED').length;
  const blockedCount = enriched.filter((s) => s.status === 'BLOCKED').length;
  const vouchedCount = (db.prepare('SELECT COUNT(*) as cnt FROM vouches').get() as { cnt: number }).cnt;

  return {
    shifts: filtered,
    stats: {
      openCount,
      lockedCount,
      blockedCount,
      vouchedCount,
      spamCallsPrevented: lockedCount * 42,
    },
  };
}

export function createShift(input: {
  title: string;
  trade: TradeType;
  shopName: string;
  area: string;
  grossPay: number;
  slotsTotal: number;
  shopPhone: string;
  timing: string;
  notes: string;
}): { ok: boolean; statusCode: number; message: string; shiftId?: number; blocked?: boolean } {
  const floor = SKILL_PAY_FLOORS[input.trade] ?? 450;
  const hub = AREA_HUBS.find((h) => h.name === input.area) ?? AREA_HUBS[0];
  const now = new Date().toISOString();

  // Slight offset so posted shifts have realistic neighborhood spread
  const jitterLat = hub.lat + ((Math.random() - 0.5) * 0.008);
  const jitterLng = hub.lng + ((Math.random() - 0.5) * 0.008);

  if (input.grossPay < floor) {
    const info = db
      .prepare(
        `INSERT INTO shifts (title, trade, shop_name, area, lat, lng, gross_pay, min_floor, slots_total, slots_filled, status, shop_phone, timing, notes, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'BLOCKED', ?, ?, ?, ?)`
      )
      .run(
        input.title,
        input.trade,
        input.shopName,
        input.area,
        jitterLat,
        jitterLng,
        input.grossPay,
        floor,
        input.slotsTotal,
        input.shopPhone,
        input.timing,
        `Blocked by Gate 2 Fair-Pay Floor (Rs. ${input.grossPay} < Rs. ${floor})`,
        now
      );

    db.prepare(
      `INSERT INTO audit_log (shift_title, area, distance_km, net_pay, decision, reason, created_at)
       VALUES (?, ?, ?, ?, 'BLOCKED', ?, ?)`
    ).run(
      `${input.trade} · ${input.shopName}`,
      input.area,
      1.2,
      input.grossPay - 15,
      `Blocked by Gate 2: Rs. ${input.grossPay} gross is below Rs. ${floor} ${input.trade} floor`,
      now
    );

    return {
      ok: false,
      statusCode: 422,
      blocked: true,
      shiftId: Number(info.lastInsertRowid),
      message: `Gate 2 Fair-Pay Floor blocked this listing: ${input.trade} shifts require at least Rs. ${floor}/day (entered Rs. ${input.grossPay}).`,
    };
  }

  const info = db
    .prepare(
      `INSERT INTO shifts (title, trade, shop_name, area, lat, lng, gross_pay, min_floor, slots_total, slots_filled, status, shop_phone, timing, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'OPEN', ?, ?, ?, ?)`
    )
    .run(
      input.title,
      input.trade,
      input.shopName,
      input.area,
      jitterLat,
      jitterLng,
      input.grossPay,
      floor,
      input.slotsTotal,
      input.shopPhone,
      input.timing,
      input.notes,
      now
    );

  db.prepare(
    `INSERT INTO audit_log (shift_title, area, distance_km, net_pay, decision, reason, created_at)
     VALUES (?, ?, ?, ?, 'PASS', ?, ?)`
  ).run(
    `${input.trade} · ${input.shopName}`,
    input.area,
    1.0,
    input.grossPay - 15,
    `Passed floor (Rs. ${input.grossPay} >= Rs. ${floor}); pinged Top 5 nearest workers`,
    now
  );

  return {
    ok: true,
    statusCode: 201,
    shiftId: Number(info.lastInsertRowid),
    message: `Shift live! Pinging Top 5 nearest ${input.trade}s near ${input.area}. Auto-locks at ${input.slotsTotal}/${input.slotsTotal} accepted.`,
  };
}

export function acceptShiftAtomic(
  shiftId: number,
  workerName: string,
  workerPhone: string,
  workerLat: number,
  workerLng: number
): {
  ok: boolean;
  statusCode: number;
  message: string;
  vouchCode?: string;
  whatsappUrl?: string;
  shift?: RawShiftRow;
} {
  const now = new Date().toISOString();
  db.exec('BEGIN IMMEDIATE');
  try {
    const row = db.prepare('SELECT * FROM shifts WHERE id = ?').get(shiftId) as unknown as RawShiftRow | undefined;
    if (!row) {
      db.exec('ROLLBACK');
      return { ok: false, statusCode: 404, message: 'Shift not found.' };
    }
    if (row.status === 'BLOCKED') {
      db.exec('ROLLBACK');
      return { ok: false, statusCode: 409, message: 'This shift was blocked by the Fair-Pay Floor guardrail.' };
    }
    if (row.status === 'LOCKED' || row.status === 'COMPLETED' || row.slots_filled >= row.slots_total) {
      db.exec('ROLLBACK');
      return {
        ok: false,
        statusCode: 409,
        message: 'Shift already auto-locked by another local worker — zero spam calls sent to the shop.',
      };
    }

    const nextFilled = row.slots_filled + 1;
    const nextStatus: ShiftStatus = nextFilled >= row.slots_total ? 'LOCKED' : 'OPEN';
    const vouchCode = `KN-QR-${Math.floor(1000 + Math.random() * 9000)}`;
    const acceptedLabel = row.accepted_by ? `${row.accepted_by}, ${workerName}` : workerName;

    db.prepare(
      `UPDATE shifts
       SET slots_filled = ?, status = ?, accepted_by = ?, vouch_code = ?
       WHERE id = ?`
    ).run(nextFilled, nextStatus, acceptedLabel, vouchCode, shiftId);

    const dist = haversineKm(workerLat, workerLng, row.lat, row.lng);
    const commute = estimateCommute(dist);
    const netPay = row.gross_pay - commute.cost;

    db.prepare(
      `INSERT INTO audit_log (shift_title, area, distance_km, net_pay, decision, reason, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `${row.trade} · ${row.shop_name}`,
      row.area,
      dist,
      netPay,
      nextStatus === 'LOCKED' ? 'AUTO-LOCKED' : 'PASS',
      nextStatus === 'LOCKED'
        ? `Atomic lock triggered by ${workerName} (${nextFilled}/${row.slots_total}); remaining calls stopped`
        : `Accepted slot ${nextFilled}/${row.slots_total} by ${workerName} (${workerPhone})`,
      now
    );

    db.exec('COMMIT');

    const cleanPhone = row.shop_phone.replace(/\D/g, '');
    const waTarget = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const waText = encodeURIComponent(
      `Namaskara ${row.shop_name}! I accepted your KaamNear ${row.trade} shift (${row.area}, Gross Rs.${row.gross_pay}). Worker: ${workerName} (${workerPhone}). QR Vouch Code: ${vouchCode}.`
    );

    return {
      ok: true,
      statusCode: 200,
      message:
        nextStatus === 'LOCKED'
          ? 'Slot locked atomically! Other callers are paused so the shop gets zero spam.'
          : `Confirmed slot ${nextFilled}/${row.slots_total}!`,
      vouchCode,
      whatsappUrl: `https://wa.me/${waTarget}?text=${waText}`,
      shift: { ...row, slots_filled: nextFilled, status: nextStatus, accepted_by: acceptedLabel, vouch_code: vouchCode },
    };
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function verifyVouch(input: {
  vouchCode: string;
  workerName?: string;
  workerPhone?: string;
}): { ok: boolean; statusCode: number; message: string; vouch?: VouchRecord } {
  const code = input.vouchCode.trim().toUpperCase();
  if (!code) {
    return { ok: false, statusCode: 400, message: 'Enter a valid QR Vouch code.' };
  }

  const existing = db.prepare('SELECT * FROM vouches WHERE vouch_code = ?').get(code) as unknown as
    | {
        id: number;
        shift_id: number;
        vouch_code: string;
        worker_name: string;
        worker_phone: string;
        shop_name: string;
        trade: TradeType;
        area: string;
        amount_paid: number;
        verified_at: string;
      }
    | undefined;

  if (existing) {
    return {
      ok: false,
      statusCode: 409,
      message: `Vouch ${code} is already stamped Paid & Verified in the ledger.`,
    };
  }

  const shift = db.prepare('SELECT * FROM shifts WHERE vouch_code = ?').get(code) as unknown as RawShiftRow | undefined;
  if (!shift) {
    return {
      ok: false,
      statusCode: 404,
      message: `No locked shift matches QR code ${code}. Accept a shift first to mint a vouch code.`,
    };
  }

  const now = new Date().toISOString();
  const workerName = input.workerName?.trim() || shift.accepted_by || 'Ramesh K';
  const workerPhone = input.workerPhone?.trim() || '9845123456';

  const info = db
    .prepare(
      `INSERT INTO vouches (shift_id, vouch_code, worker_name, worker_phone, shop_name, trade, area, amount_paid, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(shift.id, code, workerName, workerPhone, shift.shop_name, shift.trade, shift.area, shift.gross_pay, now);

  db.prepare("UPDATE shifts SET status = 'COMPLETED' WHERE id = ?").run(shift.id);

  db.prepare(
    `INSERT INTO audit_log (shift_title, area, distance_km, net_pay, decision, reason, created_at)
     VALUES (?, ?, ?, ?, 'QR VOUCHED', ?, ?)`
  ).run(
    `${shift.trade} · ${shift.shop_name}`,
    shift.area,
    1.1,
    shift.gross_pay - 15,
    `Paid & Verified Rs. ${shift.gross_pay} via ${code}; credit ledger updated`,
    now
  );

  return {
    ok: true,
    statusCode: 201,
    message: `Paid & Verified! ${code} added to worker QR Trust Ledger.`,
    vouch: {
      id: Number(info.lastInsertRowid),
      shiftId: shift.id,
      vouchCode: code,
      workerName,
      workerPhone,
      shopName: shift.shop_name,
      trade: shift.trade,
      area: shift.area,
      amountPaid: shift.gross_pay,
      verifiedAt: now,
    },
  };
}

export function listVouches(): VouchRecord[] {
  const rows = db.prepare('SELECT * FROM vouches ORDER BY id DESC').all() as unknown as Array<{
    id: number;
    shift_id: number;
    vouch_code: string;
    worker_name: string;
    worker_phone: string;
    shop_name: string;
    trade: TradeType;
    area: string;
    amount_paid: number;
    verified_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    shiftId: r.shift_id,
    vouchCode: r.vouch_code,
    workerName: r.worker_name,
    workerPhone: r.worker_phone,
    shopName: r.shop_name,
    trade: r.trade,
    area: r.area,
    amountPaid: r.amount_paid,
    verifiedAt: r.verified_at,
  }));
}

export function listAuditLog(): AuditEntry[] {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 25').all() as unknown as Array<{
    id: number;
    shift_title: string;
    area: string;
    distance_km: number;
    net_pay: number;
    decision: AuditEntry['decision'];
    reason: string;
    created_at: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    shiftTitle: r.shift_title,
    area: r.area,
    distanceKm: r.distance_km,
    netPay: r.net_pay,
    decision: r.decision,
    reason: r.reason,
    createdAt: r.created_at,
  }));
}
