import { useState } from 'react';
import { QrCode, ShieldCheck } from 'lucide-react';
import QRScanner from '../components/qr/QRScanner.jsx';
import { verifyScan } from '../services/qrService.js';
import { useApp } from '../hooks/useApp.js';
import { PageHeading } from '../components/common/States.jsx';

export default function QRScannerPage() {
  const [result, setResult] = useState(null); const [busy, setBusy] = useState(false);
  const { refresh, notify } = useApp();
  const verify = async (identifier, options) => {
    setBusy(true); setResult(null);
    try { const response = await verifyScan(identifier, options); setResult(response); refresh(); if (response.valid) notify(response.mismatch ? 'Simulated mismatch recorded for librarian review.' : 'Copy identifier found. Shelf not physically verified.', response.mismatch ? 'info' : 'success'); else notify(response.message, 'error'); return response; }
    catch (error) { const failure = { valid: false, message: error.message || 'Could not verify that identifier.' }; setResult(failure); notify(failure.message, 'error'); return failure; }
    finally { setBusy(false); }
  };
  return <div className="scanner-page"><PageHeading eyebrow="COPY IDENTIFICATION" title="Scan a book’s QR code." description="Identify a physical copy and view its registered shelf and availability. Camera access is optional—manual lookup is always here." /><div className="scanner-callout"><span><ShieldCheck size={18} /></span><p><strong>Honest by design</strong>This frontend can read a QR identifier, but it cannot verify a physical shelf without trusted location data from the future backend/hardware workflow.</p></div><QRScanner onVerify={verify} result={result} busy={busy} /><div className="scanner-page__foot"><QrCode size={15} /><span>Try a sample identifier: BB-2048 (available) or BB-2050 (issued).</span></div></div>;
}
