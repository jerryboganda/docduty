import { useState, useCallback } from 'react';
import { ShieldCheck, Plus, Lock, Key, ArrowRight, MonitorSmartphone, Stethoscope, Building2, ShieldAlert, Phone, UserPlus, User, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { getHostSurface, getRolePath, getRoleSurface, getSurfaceOrigin, shouldUseDedicatedHosts } from '../lib/runtimeHost';

/*
 * HIGH-DENSITY LOGIN REDESIGN
 * ──────────────────────────────────────────────────────────
 * Height budget (desktop, login mode):
 *   Logo row              32px
 *   gap                    8px
 *   Title + subtitle      40px
 *   gap                   12px
 *   Security badge        28px
 *   gap                   12px
 *   Phone field (label+input) 62px
 *   gap                   10px
 *   Password field        62px
 *   gap                   14px
 *   Role selector row     42px
 *   gap                   10px
 *   Sign-in button        42px
 *   gap                   12px
 *   Register link         20px
 *   gap                    8px
 *   Device notice          32px
 *   gap                    8px
 *   Footer row            20px
 *   ─────────────────────────
 *   TOTAL                ~444px  (fits 768px with ~160px headroom per side)
 *
 * Key density wins:
 *   - 3 role buttons → 1 inline segmented selector (saves ~130px)
 *   - gap-6→gap-2/3, py-10→py-4, input h-12→h-[42px]
 *   - Device notice collapsed to single line
 *   - "Ops" divider eliminated
 *   - Password show/hide toggle added (accessibility)
 *   - Loading spinner replaces text swap
 */

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, register } = useAuth();
  const toast = useToast();
  const hostSurface = getHostSurface();
  const useDedicatedHosts = shouldUseDedicatedHosts();
  const requestedMode = searchParams.get('mode') === 'register' ? 'register' : 'login';
  const requestedRoleParam = searchParams.get('role');
  const requestedRole = requestedRoleParam === 'doctor' || requestedRoleParam === 'platform_admin' || requestedRoleParam === 'facility_admin'
    ? requestedRoleParam
    : requestedRoleParam === 'facility'
      ? 'facility_admin'
      : requestedRoleParam === 'admin'
        ? 'platform_admin'
        : null;
  const [mode, setMode] = useState<'login' | 'register'>(requestedMode);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const initialRole = requestedRole || (hostSurface === 'admin' ? 'platform_admin' : 'facility_admin');
  const [selectedRole, setSelectedRole] = useState<'facility_admin' | 'doctor' | 'platform_admin'>(initialRole);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const roles = [
    { value: 'facility_admin' as const, label: 'Facility', icon: Building2, accent: 'text-primary' },
    { value: 'doctor' as const, label: 'Doctor', icon: Stethoscope, accent: 'text-emerald-600' },
    { value: 'platform_admin' as const, label: 'Admin', icon: ShieldAlert, accent: 'text-indigo-500' },
  ];
  const allowedRoles = roles.filter(({ value }) => {
    if (hostSurface === 'admin') return value === 'platform_admin';
    if (hostSurface === 'portal') return value !== 'platform_admin';
    return true;
  });

  const handleSubmit = useCallback(async () => {
    if (mode === 'login') {
      if (!phone || !password) { setError('Phone and password are required'); return; }
      setError(''); setIsSubmitting(true);
      try {
        const result = await login(phone, password);
        if (result.success) {
          const actualRole = result.role || selectedRole;
          const targetSurface = getRoleSurface(actualRole);
          const targetPath = getRolePath(actualRole);
          if (useDedicatedHosts && hostSurface !== 'generic' && targetSurface !== hostSurface) {
            setError(targetSurface === 'admin'
              ? 'Platform admins must sign in on admin.docduty.com.pk.'
              : 'Doctors and facilities must sign in on portal.docduty.com.pk.');
            return;
          }
          if (useDedicatedHosts && hostSurface === 'generic') {
            window.location.assign(`${getSurfaceOrigin(targetSurface)}${targetPath}`);
            return;
          }
          navigate(targetPath);
        } else { setError(result.error || 'Login failed'); }
      } catch { setError('An unexpected error occurred'); }
      setIsSubmitting(false);
    } else {
      if (!phone || !password || !fullName) { setError('All fields are required'); return; }
      if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
      setError(''); setIsSubmitting(true);
      try {
        const result = await register(phone, password, selectedRole, fullName);
        if (result.success) {
          const targetSurface = getRoleSurface(selectedRole);
          const targetPath = getRolePath(selectedRole);
          if (useDedicatedHosts && hostSurface !== 'generic' && targetSurface !== hostSurface) {
            setError(targetSurface === 'admin'
              ? 'Platform admins must register on admin.docduty.com.pk.'
              : 'Doctors and facilities must register on portal.docduty.com.pk.');
            return;
          }
          if (useDedicatedHosts && hostSurface === 'generic') {
            window.location.assign(`${getSurfaceOrigin(targetSurface)}${targetPath}`);
            return;
          }
          navigate(targetPath);
        } else { setError(result.error || 'Registration failed'); }
      } catch { setError('An unexpected error occurred'); }
      setIsSubmitting(false);
    }
  }, [mode, phone, password, fullName, selectedRole, login, register, navigate]);

  /* ── Shared input classes ── */
  const inputCls = 'w-full h-[42px] rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/40 focus:border-primary pl-10 pr-4 transition-all duration-150 outline-none';

  return (
    <div className="flex h-dvh w-full overflow-hidden font-display bg-background-light text-slate-900 antialiased">
      {/* ────── LEFT HERO PANEL (desktop only) ────── */}
      <div className="hidden lg:flex w-[52%] relative flex-col justify-end p-10 overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDrlVgbwd4lt6IdKFgIZboUeqvaTLhWLFn7hQJvUvqbOJqLG-zuKmXUJC0lHy2luhexgKS1JQLnb871sklVs0YToSGUg-CDy0U-jMzUtqdyHZzDNxqCe5YXjMrp1oGIpaLsyeweRUQ3yveVMmFs6k_Gy21sEsH0p2KStHcjQIDTvFDYx-dyFzHoCobHz01AZF7WyxLgtnF61LT7vvEYzFc55D2N9BM9JG_nafE7z4DFJXT0PlXG3K1-dQXZhylOGq7IDraV0CU0lPU")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 text-white max-w-lg">
          <span className="inline-flex items-center justify-center p-1.5 bg-white/20 backdrop-blur-md rounded-lg mb-3 border border-white/10">
            <ShieldCheck className="text-white w-5 h-5" />
          </span>
          <h1 className="text-3xl font-black leading-tight tracking-[-0.02em] mb-3">
            Secure staffing solutions for top-tier facilities.
          </h1>
          <blockquote className="border-l-[3px] border-primary pl-3">
            <p className="text-[15px] leading-snug text-slate-200 italic">
              "DocDuty has transformed how we manage our on-call schedules, ensuring 100% coverage even during peak flu seasons."
            </p>
            <footer className="text-xs font-medium text-white/80 mt-1">— Dr. Emily Chen, Chief of Medicine</footer>
          </blockquote>
        </div>
      </div>

      {/* ────── RIGHT LOGIN PANEL ────── */}
      <div className="flex flex-1 flex-col justify-center items-center px-5 sm:px-10 lg:px-14 bg-background-light">
        <div className="w-full max-w-[400px] flex flex-col">

          {/* Logo row */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
              <Plus className="text-white w-4 h-4" strokeWidth={3} />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">DocDuty</span>
          </div>

          {/* Title + subtitle */}
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 leading-tight">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5 leading-snug">
            {mode === 'login'
              ? 'Manage shifts and bookings securely.'
              : 'Register as a doctor or facility.'}
          </p>

          {/* Security badge — inline, compact */}
          <div className="inline-flex items-center gap-1.5 mt-3 mb-3">
            <Lock className="w-3.5 h-3.5 text-green-600" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-green-700">Secure Session</span>
          </div>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-[13px] mb-3 leading-snug">
              {error}
            </div>
          )}

          {/* ── Form ── */}
          <div className="flex flex-col gap-2.5">

            {/* Register-only: full name */}
            {mode === 'register' && (
              <label className="flex flex-col gap-1">
                <span className="text-[13px] font-medium text-slate-700">Full Name</span>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input className={inputCls} placeholder="Dr. Ali Ahmed" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
              </label>
            )}

            {/* Phone */}
            <label className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-slate-700">Phone Number</span>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input className={inputCls} placeholder="03001234567" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </label>

            {/* Password */}
            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-slate-700">Password</span>
                {mode === 'login' && (
                  <button type="button" onClick={() => toast.info('Password reset is not yet available. Contact support for assistance.')} className="text-[11px] font-medium text-primary hover:text-primary/80 transition-colors cursor-pointer">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  className={`${inputCls} !pr-10`}
                  placeholder="••••••••"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </label>

            {/* ── Role selector (segmented control) ── */}
            <div className="flex flex-col gap-1  mt-1">
              <span className="text-[13px] font-medium text-slate-700">
                {mode === 'login' ? 'Sign in as' : 'Account type'}
              </span>
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
                {allowedRoles.map(({ value, label, icon: Icon, accent }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelectedRole(value)}
                    className={`flex items-center justify-center gap-1.5 h-[34px] rounded-md text-[12px] font-semibold transition-all cursor-pointer
                      ${selectedRole === value
                        ? 'bg-white shadow-sm text-slate-900 ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                      }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${selectedRole === value ? accent : ''}`} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Primary CTA ── */}
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-[42px] mt-1.5 bg-primary hover:bg-primary/90 active:bg-primary/80 text-white text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 outline-none"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? (
                    <>
                      {roles.find(r => r.value === selectedRole)?.icon && (() => { const I = roles.find(r => r.value === selectedRole)!.icon; return <I className="w-4 h-4" />; })()}
                      <span>Sign in as {roles.find(r => r.value === selectedRole)?.label}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Toggle login / register */}
          <p className="text-center text-[13px] text-slate-500 mt-3">
            {mode === 'login' ? (
              <>No account?{' '}<button onClick={() => { setMode('register'); setError(''); }} className="text-primary font-semibold hover:underline cursor-pointer">Register</button></>
            ) : (
              <>Have an account?{' '}<button onClick={() => { setMode('login'); setError(''); }} className="text-primary font-semibold hover:underline cursor-pointer">Sign in</button></>
            )}
          </p>

          {/* Device binding — single compact line */}
          <div className="flex items-center gap-2 mt-3 px-2.5 py-1.5 rounded-md bg-blue-50/80 border border-blue-100">
            <MonitorSmartphone className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <p className="text-[11px] leading-tight text-blue-600">
              <span className="font-semibold">Device binding:</span> This device is registered on login for security.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400">
            <Link to="/contact" className="hover:text-primary transition-colors">Need help?</Link>
            <div className="flex gap-3">
              <Link to="/legal/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/legal/terms" className="hover:text-primary transition-colors">Terms</Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
