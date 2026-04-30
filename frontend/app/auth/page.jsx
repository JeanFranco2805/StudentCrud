'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function AuthPage() {
  const containerRef = useRef(null);
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpInputs = useMemo(() => Array.from({ length: 6 }), []);

  useEffect(() => {
    gsap.fromTo(
      containerRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.5, ease: 'power3.out' }
    );
  }, []);

  const sendOtp = async () => {
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
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
      if (!res.ok) throw new Error(data.detail || 'Unable to process request.');
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
      setError('Please complete the verification code.');
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
      if (!res.ok) throw new Error(data.detail || 'Invalid verification code.');
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
    <div className="auth-wrapper">
      <div className="auth-container" ref={containerRef}>
        <div className="auth-header">
          <h1>University</h1>
          <p>Academic Management System</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} strokeWidth={1.5} />
            {error}
          </div>
        )}

        {step === 'email' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="input-wrapper" style={{ textAlign: 'left' }}>
              <label>Email Address</label>
              <input 
                className="luxury-input" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="name@university.edu" 
                autoComplete="email"
              />
            </div>
            
            <button className="btn-primary" onClick={sendOtp} disabled={loading}>
              {loading ? 'Processing...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <p style={{ color: 'var(--fg-muted)', fontSize: '0.9rem' }}>
              Verification code sent to<br/><strong>{email}</strong>
            </p>
            
            <div className="otp-container">
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
            
            <button className="btn-primary" onClick={verifyOtp} disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
            <button className="btn-secondary" onClick={() => setStep('email')}>
              Return
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
