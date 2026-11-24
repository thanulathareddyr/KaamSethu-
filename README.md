# KaamNear — Voice-First Hyper-Local Job Dispatch (Track 4.3: UnlockED)

KaamNear is a full-stack web application connecting semi-skilled and informal workers with trusted neighborhood shifts inside existing browser speech and WhatsApp workflows.

## 4 Verification & Dispatch Gates

1. **Zero-Resume Voice & Audio Read-Aloud**: 15-second browser speech search (`en-IN`, `kn-IN`, `hi-IN`), 1-tap trade icons, and `SpeechSynthesis` audio read-aloud on every job card.
2. **Net Take-Home Pay + Fair-Pay Floor Guard**: Automatically calculates commute cost (`walk`, `local auto/bus`, `cross-town transit`) via Haversine distance and blocks sub-minimum-wage shift listings at dispatch time.
3. **Atomic Top-5 Slot Lock**: Pings only the 5 nearest workers within radius and atomically locks shifts inside SQLite (`BEGIN IMMEDIATE` transaction) on first acceptance to eliminate post-fill spam calls.
4. **Portable QR Work-Vouch Trust Ledger**: Generates verifiable `"Paid & Verified"` QR receipts post-shift, accumulating toward 10 verified vouches for tool micro-loans and formal income proof.

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Web Speech API (`SpeechRecognition` & `SpeechSynthesis`), QRCode
- **Backend**: Node.js, Express, built-in `node:sqlite` (`DatabaseSync`) with atomic transactions
- **Build & Tooling**: Vite 8, `tsx`

## Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.
