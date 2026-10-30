import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, onClose, title, description, children, size = 'md' }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  const returnFocusRef = useRef(null);

  useEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    document.body.classList.add('modal-open');
    const dialog = dialogRef.current;
    const focusable = () => [...(dialog?.querySelectorAll(FOCUSABLE) || [])].filter((item) => item.getClientRects().length > 0);
    const first = focusable()[0];
    (first || dialog)?.focus();

    const handleKey = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current?.();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === firstItem || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && (document.activeElement === lastItem || !dialog?.contains(document.activeElement))) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.classList.remove('modal-open');
      const returnTarget = returnFocusRef.current;
      if (returnTarget?.isConnected && typeof returnTarget.focus === 'function') returnTarget.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeRef.current?.(); }}>
      <section ref={dialogRef} className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" aria-describedby={description ? 'modal-description' : undefined} tabIndex="-1">
        <header className="modal__header">
          <div><h2 id="modal-title">{title}</h2>{description ? <p id="modal-description">{description}</p> : null}</div>
          <button className="icon-button" type="button" aria-label="Close dialog" onClick={() => closeRef.current?.()}><X size={18} /></button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  );
}
