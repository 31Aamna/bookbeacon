import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LibraryBig, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  if (!loading && user) return <LinkRedirect user={user} />;
  const next = location.state?.from?.pathname;
  const fill = (email) => { setIdentifier(email); setPassword('Beacon2026!'); setError(''); };
  const submit = async (event) => {
    event.preventDefault();
    if (!identifier.trim() || !password) { setError('Enter your email or ID and password.'); return; }
    setBusy(true); setError('');
    try { const loggedIn = await login(identifier, password); navigate(next || (loggedIn.role === 'librarian' ? '/librarian/dashboard' : '/student/dashboard'), { replace: true }); }
    catch (issue) { setError(issue.message); }
    finally { setBusy(false); }
  };
  return <main className="auth-page"><Link to="/" className="auth-back"><ArrowLeft size={16} />Back to BookBeacon</Link><div className="auth-card"><div className="auth-brand-icon"><LibraryBig size={22} /></div><span className="eyebrow">YOUR CAMPUS LIBRARY, CONNECTED</span><h1>Good to see you.</h1><p className="auth-card__intro">Sign in to find books, check due dates and follow your library activity.</p><form onSubmit={submit} className="auth-form"><label className="field" htmlFor="login-identifier"><span>Email or student/staff ID</span><input id="login-identifier" autoComplete="username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} placeholder="you@university.edu" required /></label><label className="field" htmlFor="login-password"><span>Password</span><div className="password-input"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><label className="check-field"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} /><span>Keep me signed in on this device</span></label>{error ? <div className="form-error" role="alert">{error}</div> : null}<Button type="submit" loading={busy} className="auth-submit">Sign in <span aria-hidden="true">→</span></Button><div className="auth-divider"><span>DEVELOPMENT DEMO ACCOUNTS</span></div><div className="demo-account-list"><button type="button" onClick={() => fill('student@bookbeacon.demo')}><span><strong>Student demo</strong><small>student@bookbeacon.demo</small></span><span>Fill</span></button><button type="button" onClick={() => fill('librarian@bookbeacon.demo')}><span><strong>Librarian demo</strong><small>librarian@bookbeacon.demo</small></span><span>Fill</span></button></div><p className="demo-password"><ShieldCheck size={14} />Shared demo password: <code>Beacon2026!</code></p><p className="prototype-notice">Demo-only, frontend authentication. Do not use real credentials or sensitive data.</p></form><p className="auth-switch">New to BookBeacon? <Link to="/register">Create an account</Link></p></div><footer className="auth-footer">BOOKBEACON · ENGINEERING LIBRARY</footer></main>;
}

function LinkRedirect({ user }) {
  const destination = user.role === 'librarian' ? '/librarian/dashboard' : '/student/dashboard';
  return <div className="auth-loading"><LibraryBig size={24} /><p>Taking you to your dashboard…</p><Link to={destination}>Continue</Link></div>;
}
