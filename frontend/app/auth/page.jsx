'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AuthPage() {
  const cardRef = useRef(null);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpInputs = useMemo(() => Array.from({ length: 6 }), []);

  useEffect(() => {
    gsap.fromTo(
      cardRef.current,
      { y: 24, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' }
    );
  }, []);

  const sendOtp = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Correo inválido.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'No se pudo enviar código');
      setStep('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    const code = otp.join('');
    if (code.length !== 6) {
      setError('Código incompleto.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Código inválido');
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userEmail', email);
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setDigit = (idx, value) => {
    const clean = value.replace(/\D/g, '').slice(0, 1);
    const next = [...otp];
    next[idx] = clean;
    setOtp(next);
  };

  return (
    <main className="auth-shell">
      <section className="auth-glow" />
      <div className="auth-card" ref={cardRef}>
        <div className="auth-brand">
          <span className="brand-mark">✦</span>
          <div>
            <h1>Portal Académico</h1>
            <p>Acceso privado por correo. Sin landing. Sin ruido.</p>
          </div>
        </div>

        {step === 'email' ? (
          <div className="stack">
            <label className="field">
              <span>Correo</span>
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nombre@universidad.edu" />
            </label>
            {error ? <div className="error-box">{error}</div> : null}
            <button className="btn btn-primary" onClick={sendOtp} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar código'}
            </button>
          </div>
        ) : (
          <div className="stack">
            <div className="otp-label">Código enviado a {email}</div>
            <div className="otp-grid">
              {otpInputs.map((_, idx) => (
                <input
                  key={idx}
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[idx]}
                  onChange={(e) => setDigit(idx, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
                      const prev = document.querySelectorAll('.otp-box')[idx - 1];
                      prev?.focus();
                    }
                  }}
                  className="otp-box"
                />
              ))}
            </div>
            {error ? <div className="error-box">{error}</div> : null}
            <button className="btn btn-primary" onClick={verifyOtp} disabled={loading}>
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
            <button className="btn btn-ghost" onClick={() => setStep('email')}>Cambiar correo</button>
          </div>
        )}
      </div>
    </main>
  );
}
