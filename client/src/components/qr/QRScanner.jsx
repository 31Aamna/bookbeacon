import { useEffect, useId, useRef, useState } from 'react';
import { Camera, CameraOff, CircleCheck, CircleX, QrCode, ShieldAlert } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import Button from '../common/Button.jsx';
import StatusBadge from '../common/StatusBadge.jsx';
import { getShelves } from '../../services/locationService.js';

export default function QRScanner({ onVerify, result, busy = false }) {
  const domId = `qr-reader-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const scanner = useRef(null);
  const [cameraState, setCameraState] = useState('idle');
  const [cameraError, setCameraError] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [locations, setLocations] = useState([]);
  const [observedLocationId, setObservedLocationId] = useState('');
  const [locationError, setLocationError] = useState('');

  useEffect(() => { let active = true; getShelves().then((items) => { if (active) setLocations(items); }).catch((error) => { if (active) setLocationError(error.message); }); return () => { active = false; }; }, []);

  const stopCamera = async () => {
    if (!scanner.current) return;
    try { if (scanner.current.isScanning) await scanner.current.stop(); scanner.current.clear(); } catch { /* Scanner may already have stopped after a permission/device change. */ }
    scanner.current = null;
    setCameraActive(false);
    setCameraState('idle');
  };

  const startCamera = async () => {
    setCameraError('');
    setCameraState('starting');
    try {
      const instance = new Html5Qrcode(domId);
      scanner.current = instance;
      await instance.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 220, height: 220 } }, async (decodedText) => {
        setIdentifier(decodedText);
        await onVerify(decodedText, { scanType: 'CAMERA_LABEL_DEMO', observedLocationId: observedLocationId || null });
        await stopCamera();
      }, () => {});
      setCameraActive(true);
      setCameraState('active');
    } catch (error) {
      setCameraError(error?.message?.toLowerCase().includes('permission') ? 'Camera permission was denied. You can still enter a Book ID or QR identifier below.' : 'Camera scanning is unavailable here. Manual Book ID entry is ready to use.');
      setCameraState('error');
      scanner.current = null;
    }
  };

  useEffect(() => () => { if (scanner.current?.isScanning) scanner.current.stop().catch(() => {}); }, []);

  const submit = (event) => { event.preventDefault(); if (identifier.trim()) onVerify(identifier.trim(), { scanType: 'MANUAL_DEMO', observedLocationId: observedLocationId || null }); };
  return <div className="qr-workspace"><div className="qr-camera-card"><div className="qr-camera-card__head"><div><span className="eyebrow">IDENTIFY A COPY</span><h2>Scan a library label</h2></div><span className="qr-state"><i className={cameraActive ? 'is-live' : ''} />{cameraActive ? 'Camera active' : 'Ready to scan'}</span></div><div className={`qr-viewport ${cameraActive ? 'is-active' : ''}`}><div id={domId} className="qr-viewport__reader" /><div className="qr-viewport__overlay" aria-hidden="true"><span /><i /><b /></div>{!cameraActive ? <div className="qr-viewport__placeholder"><span><QrCode size={34} /></span><strong>Place the label inside the frame</strong><small>Or use manual entry below</small></div> : null}</div>{cameraError ? <p className="inline-error" role="status">{cameraError}</p> : null}<div className="button-row"><Button variant={cameraActive ? 'secondary' : 'primary'} icon={cameraActive ? CameraOff : Camera} loading={cameraState === 'starting'} onClick={cameraActive ? stopCamera : startCamera}>{cameraActive ? 'Stop camera' : 'Start camera'}</Button><span className="muted qr-camera-hint">Camera permission may be required.</span></div><p className="qr-disclaimer"><ShieldAlert size={15} />Camera and manual workflows identify a QR value only. This browser demo does not verify that a physical shelf was scanned.</p></div>
    <form className="qr-manual-card" onSubmit={submit}><span className="eyebrow">ALWAYS AVAILABLE</span><h2>Enter a Book ID</h2><p>Use a known demo copy identifier, for example <code>BB-2048</code>.</p><label className="field" htmlFor="qr-identifier"><span>Book ID or QR identifier</span><input id="qr-identifier" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="BB-2048" autoCapitalize="characters" required /></label><label className="field" htmlFor="qr-observed-location"><span>Observed demo shelf <small>Optional · simulation only</small></span><select id="qr-observed-location" value={observedLocationId} onChange={(event) => setObservedLocationId(event.target.value)}><option value="">Identifier lookup only — no location check</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.zoneName} · Section {location.sectionCode} · Shelf {location.shelfCode}</option>)}</select></label>{locationError ? <p className="field-help" role="status">Shelf options could not be loaded: {locationError}</p> : <p className="field-help">Selecting a shelf only demonstrates a location comparison; it is not physical verification.</p>}<Button type="submit" icon={QrCode} loading={busy}>Verify identifier</Button></form>
    {result ? <section className={`qr-result ${result.valid ? result.mismatch ? 'qr-result--warning' : 'qr-result--success' : 'qr-result--error'}`} aria-live="polite"><div className="qr-result__icon">{result.valid ? result.mismatch ? <ShieldAlert size={22} /> : <CircleCheck size={22} /> : <CircleX size={22} />}</div><div className="qr-result__body"><div className="qr-result__heading"><div><span className="eyebrow">{result.valid ? result.mismatch ? 'SIMULATED LOCATION MISMATCH' : 'COPY IDENTIFIER FOUND' : 'NO MATCH'}</span><h3>{result.valid ? result.copy?.book?.title : 'Copy not found'}</h3></div>{result.valid ? <StatusBadge status={result.copy.status.toLowerCase()} /> : null}</div>{result.valid ? <><div className="qr-result__facts"><span><small>Book ID</small><strong>{result.copy.id}</strong></span><span><small>Registered shelf</small><strong>{result.copy.location?.shelfCode || '—'}</strong></span><span><small>Availability</small><strong>{result.copy.status}</strong></span><span><small>Last recorded scan</small><strong>{result.copy.lastScannedAt ? new Date(result.copy.lastScannedAt).toLocaleString() : 'No scan recorded'}</strong></span></div><p>{result.message || 'Identifier lookup is simulated; physical shelf has not been verified.'}</p></> : <p>{result.message || 'Check the identifier and try again.'}</p>}</div></section> : null}
  </div>;
}
