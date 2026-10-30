import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';
import Modal from './Modal.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Please confirm', message, confirmLabel = 'Confirm', danger = false, busy = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <div className="confirm-dialog">
        <span className={`confirm-dialog__icon ${danger ? 'is-danger' : ''}`}><AlertTriangle size={20} /></span>
        <p>{message}</p>
        <div className="button-row">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </Modal>
  );
}
