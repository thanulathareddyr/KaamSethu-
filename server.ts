import express from 'express';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import {
  acceptShiftAtomic,
  AREA_HUBS,
  createShift,
  listAuditLog,
  listShifts,
  listVouches,
  seedInitialData,
  SKILL_PAY_FLOORS,
  verifyVouch,
} from './server/db.ts';
import type { TradeType } from './src/types.ts';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes
app.get('/api/shifts', (req, res) => {
  try {
    const areaName = String(req.query.area || 'Mathikere');
    const hub = AREA_HUBS.find((h) => h.name === areaName) ?? AREA_HUBS[0];
    const lat = req.query.lat ? Number(req.query.lat) : hub.lat;
    const lng = req.query.lng ? Number(req.query.lng) : hub.lng;
    const trade = req.query.trade ? String(req.query.trade) : 'All';
    const q = req.query.q ? String(req.query.q) : '';
    const maxKm = req.query.maxKm ? Number(req.query.maxKm) : 10;

    const data = listShifts({
      lat: Number.isFinite(lat) ? lat : hub.lat,
      lng: Number.isFinite(lng) ? lng : hub.lng,
      trade,
      q,
      maxKm: Number.isFinite(maxKm) ? maxKm : 10,
      includeLocked: true,
    });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load shifts' });
  }
});

app.post('/api/shifts', (req, res) => {
  try {
    const body = req.body ?? {};
    const title = String(body.title || '').trim();
    const trade = String(body.trade || 'Electrician') as TradeType;
    const shopName = String(body.shopName || '').trim();
    const area = String(body.area || 'Mathikere').trim();
    const grossPay = Number(body.grossPay);
    const slotsTotal = Math.max(1, Math.min(5, Number(body.slotsTotal) || 1));
    const shopPhone = String(body.shopPhone || '').replace(/\D/g, '');
    const timing = String(body.timing || '9:00 AM – 6:00 PM').trim();
    const notes = String(body.notes || '').trim();

    if (!title || !shopName || shopPhone.length < 10 || !Number.isFinite(grossPay) || grossPay <= 0) {
      res.status(400).json({
        ok: false,
        message: 'Please provide shift title, shop name, valid 10-digit phone number, and daily wage.',
      });
      return;
    }
    if (!(trade in SKILL_PAY_FLOORS)) {
      res.status(400).json({ ok: false, message: 'Unsupported trade category.' });
      return;
    }

    const result = createShift({
      title,
      trade,
      shopName,
      area,
      grossPay,
      slotsTotal,
      shopPhone,
      timing,
      notes,
    });
    res.status(result.statusCode).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : 'Failed to post shift' });
  }
});

app.post('/api/shifts/:id/accept', (req, res) => {
  try {
    const shiftId = Number(req.params.id);
    if (!Number.isInteger(shiftId) || shiftId <= 0) {
      res.status(400).json({ ok: false, message: 'Invalid shift ID.' });
      return;
    }

    const body = req.body ?? {};
    const workerName = String(body.workerName || 'Ramesh K').trim();
    const workerPhone = String(body.workerPhone || '9845123456').trim();
    const areaName = String(body.area || 'Mathikere');
    const hub = AREA_HUBS.find((h) => h.name === areaName) ?? AREA_HUBS[0];
    const lat = body.lat ? Number(body.lat) : hub.lat;
    const lng = body.lng ? Number(body.lng) : hub.lng;

    const result = acceptShiftAtomic(
      shiftId,
      workerName,
      workerPhone,
      Number.isFinite(lat) ? lat : hub.lat,
      Number.isFinite(lng) ? lng : hub.lng
    );
    res.status(result.statusCode).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : 'Failed to lock shift' });
  }
});

app.get('/api/vouches', (_req, res) => {
  try {
    res.json({ vouches: listVouches() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load vouches' });
  }
});

app.post('/api/vouches/verify', (req, res) => {
  try {
    const body = req.body ?? {};
    const result = verifyVouch({
      vouchCode: String(body.vouchCode || ''),
      workerName: body.workerName ? String(body.workerName) : undefined,
      workerPhone: body.workerPhone ? String(body.workerPhone) : undefined,
    });
    res.status(result.statusCode).json(result);
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : 'Failed to verify vouch' });
  }
});

app.get('/api/audit', (_req, res) => {
  try {
    res.json({ entries: listAuditLog() });
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to load guardrail log' });
  }
});

app.post('/api/reset-demo', (_req, res) => {
  try {
    seedInitialData(true);
    res.json({ ok: true, message: 'Demo shifts, guardrails, and QR ledger reset cleanly.' });
  } catch (err) {
    res.status(500).json({ ok: false, message: err instanceof Error ? err.message : 'Failed to reset demo' });
  }
});

app.get('/api/export-zip', async (_req, res) => {
  try {
    const rootDir = process.cwd();
    const zip = new JSZip();
    const excludedDirs = new Set(['node_modules', 'dist', '.git', '.aistudio', 'workspace']);
    const excludedFiles = new Set(['bun.lock', 'kaamnear.db', 'kaamnear.db-shm', 'kaamnear.db-wal']);

    const addDirectoryToZip = (dirPath: string, zipFolder: JSZip) => {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith('.env') && entry.name !== '.env.example') continue;
        if (entry.isDirectory()) {
          if (excludedDirs.has(entry.name)) continue;
          const nextFolder = zipFolder.folder(entry.name);
          if (nextFolder) {
            addDirectoryToZip(path.join(dirPath, entry.name), nextFolder);
          }
        } else if (entry.isFile()) {
          if (excludedFiles.has(entry.name) || entry.name.endsWith('.pdf') || entry.name.endsWith('.db')) continue;
          const content = fs.readFileSync(path.join(dirPath, entry.name));
          zipFolder.file(entry.name, content);
        }
      }
    };

    addDirectoryToZip(rootDir, zip);
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="kaamnear-web.zip"');
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to build zip archive' });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`KaamNear server listening on http://localhost:${PORT}`);
  });
}

startServer();
