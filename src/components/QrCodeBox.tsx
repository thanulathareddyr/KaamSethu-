import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode } from 'lucide-react';

interface QrCodeBoxProps {
  value: string;
  size?: number;
  label?: string;
}

export const QrCodeBox: React.FC<QrCodeBoxProps> = ({ value, size = 148, label }) => {
  const [dataUrl, setDataUrl] = useState<string>('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setFailed(false);
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) setDataUrl(url);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, [value, size]);

  if (failed || !dataUrl) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex flex-col items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 p-3 text-center"
      >
        <QrCode className="w-8 h-8 mb-1.5 text-slate-400" />
        <span className="text-[11px] font-mono tabular-nums break-all">{value}</span>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center">
      <img
        src={dataUrl}
        alt={label || `QR Vouch code ${value}`}
        width={size}
        height={size}
        referrerPolicy="no-referrer"
        className="rounded-lg border border-slate-200 bg-white p-1.5"
      />
    </div>
  );
};
