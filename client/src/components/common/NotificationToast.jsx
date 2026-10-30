import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';

const ICONS = { success: CheckCircle2, error: CircleAlert, info: Info };

export default function NotificationToast({ toasts = [], dismiss }) {
  return <div className="toast-region" aria-live="polite" aria-relevant="additions text">{toasts.map((toast) => {
    const Icon = ICONS[toast.type] || Info;
    return <div className={`toast toast--${toast.type}`} key={toast.id} role={toast.type === 'error' ? 'alert' : 'status'}><Icon size={18} /><p>{toast.message}</p><button className="icon-button" aria-label="Dismiss notification" onClick={() => dismiss(toast.id)}><X size={16} /></button></div>;
  })}</div>;
}
