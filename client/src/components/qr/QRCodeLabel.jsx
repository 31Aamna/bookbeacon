import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Printer, QrCode } from 'lucide-react';
import Button from '../common/Button.jsx';

export default function QRCodeLabel({ copy, book }) {
  const [image, setImage] = useState(''); const [error, setError] = useState('');
  useEffect(() => { let active = true; setError(''); QRCode.toDataURL(copy.qrCode || copy.id, { width: 240, margin: 1, color: { dark: '#103b4a', light: '#ffffff' }, errorCorrectionLevel: 'M' }).then((url) => { if (active) setImage(url); }).catch((issue) => { if (active) setError(issue.message); }); return () => { active = false; }; }, [copy.id, copy.qrCode]);
  const print = () => window.print();
  return <div className="qr-label-wrap"><div className="qr-label" id="qr-print-label">{image ? <img src={image} alt={`Demonstration QR code for copy ${copy.id}`} /> : <div className="qr-label__placeholder"><QrCode size={72} /></div>}<span className="eyebrow">BOOKBEACON · COPY LABEL</span><strong>{copy.id}</strong><small>{book?.title || 'Library copy'}</small><span className="qr-label__footer">IDENTIFIER ONLY · DEMO ASSET</span></div>{error ? <p className="field-error">Could not generate QR preview: {error}</p> : null}<div className="qr-label-note">This demonstration QR encodes only <code>{copy.qrCode || copy.id}</code>. It does not include title details or personal data.</div><Button variant="secondary" icon={Printer} onClick={print} disabled={!image}>Print label</Button></div>;
}
