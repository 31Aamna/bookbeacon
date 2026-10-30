import { useState } from 'react';
import { ArrowLeft, Eye, EyeOff, LibraryBig } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/common/Button.jsx';
import { useAuth } from '../hooks/useAuth.js';

const EMPTY = { fullName: '', email: '', identifier: '', department: '', password: '', confirmPassword: '', acceptTerms: false };

export default function RegisterPage() {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const change = (key, value) => { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); setFormError(''); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setErrors({}); setFormError('');
    try { const user = await register(values); navigate(user.role === 'librarian' ? '/librarian/dashboard' : '/student/dashboard', { replace: true }); }
    catch (error) { setErrors(error.fieldErrors || {}); setFormError(error.fieldErrors ? '' : error.message); }
    finally { setBusy(false); }
  };
  return <main className="auth-page auth-page--register"><Link to="/" className="auth-back"><ArrowLeft size={16} />Back to BookBeacon</Link><div className="auth-card auth-card--wide"><div className="auth-brand-icon"><LibraryBig size={22} /></div><span className="eyebrow">A CLEARER WAY THROUGH THE STACKS</span><h1>Create your account.</h1><p className="auth-card__intro">Set up a student demo profile to explore your library experience.</p><form onSubmit={submit} className="auth-form register-form"><div className="field-grid"><label className="field" htmlFor="reg-name"><span>Full name</span><input id="reg-name" autoComplete="name" value={values.fullName} onChange={(event) => change('fullName', event.target.value)} required />{errors.fullName ? <small className="field-error">{errors.fullName}</small> : null}</label><label className="field" htmlFor="reg-email"><span>Email address</span><input id="reg-email" type="email" autoComplete="email" value={values.email} onChange={(event) => change('email', event.target.value)} required />{errors.email ? <small className="field-error">{errors.email}</small> : null}</label><label className="field" htmlFor="reg-id"><span>Student or staff ID</span><input id="reg-id" value={values.identifier} onChange={(event) => change('identifier', event.target.value)} required />{errors.identifier ? <small className="field-error">{errors.identifier}</small> : null}</label><label className="field" htmlFor="reg-department"><span>Department</span><input id="reg-department" value={values.department} onChange={(event) => change('department', event.target.value)} required />{errors.department ? <small className="field-error">{errors.department}</small> : null}</label></div><label className="field" htmlFor="reg-password"><span>Password <small>8 characters minimum</small></span><div className="password-input"><input id="reg-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.password} onChange={(event) => change('password', event.target.value)} required minLength={8} /><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.password ? <small className="field-error">{errors.password}</small> : null}</label><label className="field" htmlFor="reg-confirm"><span>Confirm password</span><input id="reg-confirm" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={values.confirmPassword} onChange={(event) => change('confirmPassword', event.target.value)} required />{errors.confirmPassword ? <small className="field-error">{errors.confirmPassword}</small> : null}</label><label className="check-field"><input type="checkbox" checked={values.acceptTerms} onChange={(event) => change('acceptTerms', event.target.checked)} /><span>I understand this is a frontend demonstration account and not a production library account.</span></label>{errors.acceptTerms ? <small className="field-error">{errors.acceptTerms}</small> : null}{formError ? <div className="form-error" role="alert">{formError}</div> : null}<Button type="submit" loading={busy} className="auth-submit">Create demo account <span aria-hidden="true">→</span></Button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p></div><footer className="auth-footer">BOOKBEACON · FRONTEND DEMONSTRATION</footer></main>;
}
