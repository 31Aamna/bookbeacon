import { LoaderCircle } from 'lucide-react';

export default function Button({ children, variant = 'primary', size = 'md', loading = false, disabled = false, className = '', type = 'button', icon: Icon, ...props }) {
  return (
    <button className={`button button--${variant} button--${size} ${className}`.trim()} type={type} disabled={disabled || loading} {...props}>
      {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children ? <span>{children}</span> : null}
    </button>
  );
}
