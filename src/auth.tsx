import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, Plane, ShieldCheck, UserRound } from 'lucide-react';
import { signIn, signUp } from '../lib/auth';
import { getCurrentProfile } from '../lib/database';
import { isDatabaseConfigured } from '../lib/supabase';
import './auth.css';

function destination(role?: string) {
  const requested = new URLSearchParams(location.search).get('next');
  if (requested?.startsWith('/')) return requested;
  return role === 'admin' ? '/admin/' : role === 'seller' ? '/panel/' : '/';
}

function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isDatabaseConfigured) return;
    getCurrentProfile().then((profile) => { if (profile) location.replace(destination(profile.role)); }).catch(() => undefined);
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    const form = new FormData(event.currentTarget);
    try {
      if (mode === 'login') {
        await signIn(String(form.get('email')), String(form.get('password')));
        const profile = await getCurrentProfile();
        location.replace(destination(profile?.role));
      } else {
        const result = await signUp(String(form.get('email')), String(form.get('password')), String(form.get('fullName')));
        if (result.session) location.replace('/');
        else setMessage('Tasdiqlash havolasi emailingizga yuborildi.');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Amal bajarilmadi.');
    } finally { setBusy(false); }
  }

  return <main className="auth-page"><section className="auth-brand-panel"><a href="/"><span><Plane /></span>go2trip</a><div><p>ISHONCHLI SAYOHAT PLATFORMASI</p><h1>Keyingi safaringiz shu yerdan boshlanadi.</h1><span>Tur paketlarini toping, solishtiring va xavfsiz bron qiling.</span></div><ul><li><ShieldCheck /> Himoyalangan hisob va to‘lovlar</li><li><UserRound /> Tekshirilgan sellerlar</li></ul></section><section className="auth-form-panel"><div className="auth-box"><a className="mobile-auth-logo" href="/"><Plane /> go2trip</a><p className="auth-kicker">GO2TRIP HISOBI</p><h2>{mode === 'login' ? 'Xush kelibsiz!' : 'Yangi hisob oching'}</h2><span>{mode === 'login' ? 'Davom etish uchun hisobingizga kiring.' : 'Bir necha soniyada ro‘yxatdan o‘ting.'}</span>{!isDatabaseConfigured && <div className="auth-error">Database ulanishi sozlanmagan.</div>}{error && <div className="auth-error">{error}</div>}{message && <div className="auth-success">{message}</div>}<form onSubmit={submit}>{mode === 'register' && <label>Ism va familiya<div><UserRound /><input name="fullName" required placeholder="Ismingiz" autoComplete="name" /></div></label>}<label>Email manzil<div><Mail /><input name="email" type="email" required placeholder="siz@email.com" autoComplete="email" /></div></label><label>Parol<div><LockKeyhole /><input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} placeholder="Kamida 8 ta belgi" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff /> : <Eye />}</button></div></label><button className="auth-submit" disabled={busy || !isDatabaseConfigured}>{busy ? 'Kutilmoqda...' : mode === 'login' ? <>Kirish <ArrowRight /></> : <>Ro‘yxatdan o‘tish <ArrowRight /></>}</button></form><p className="auth-switch">{mode === 'login' ? 'Hisobingiz yo‘qmi?' : 'Hisobingiz bormi?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>{mode === 'login' ? 'Ro‘yxatdan o‘tish' : 'Kirish'}</button></p></div></section></main>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><AuthPage /></React.StrictMode>);
