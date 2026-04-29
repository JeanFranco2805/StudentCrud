import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function sendOtp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (error) return setError(error.message)
    setSent(true)
    setStep('otp')
  }

  async function verifyOtp(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    setLoading(false)
    if (error) setError('Código inválido o expirado. Intenta de nuevo.')
  }

  return (
    <div className="login-root">
      <div className="login-left">
        <div className="login-left-grid" aria-hidden="true">
          {Array.from({ length: 120 }).map((_, i) => (
            <div key={i} className="grid-cell" style={{ animationDelay: `${(i * 0.05) % 3}s` }} />
          ))}
        </div>
        <div className="login-left-content">
          <div className="login-brand-mark">L</div>
          <h1 className="login-headline">Gestión<br />Académica<br />Precisa.</h1>
          <p className="login-sub">Control total sobre tu registro de estudiantes.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-header">
            <span className="login-form-tag">Acceso seguro</span>
            <h2>{step === 'email' ? 'Iniciar sesión' : 'Verificar código'}</h2>
            <p className="login-form-desc">
              {step === 'email'
                ? 'Te enviaremos un código de 6 dígitos a tu correo.'
                : `Ingresa el código enviado a ${email}`}
            </p>
          </div>

          {error && <div className="form-error">{error}</div>}

          {step === 'email' ? (
            <form onSubmit={sendOtp} className="login-form">
              <div className="field-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="usuario@correo.com"
                  required
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? <span className="btn-spinner" /> : 'Enviar código'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="login-form">
              <div className="field-group">
                <label htmlFor="otp">Código OTP</label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  required
                  autoFocus
                  className="otp-input"
                  maxLength={6}
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading || otp.length < 6}>
                {loading ? <span className="btn-spinner" /> : 'Verificar'}
              </button>
              <button type="button" className="btn-ghost" onClick={() => { setStep('email'); setOtp(''); setError('') }}>
                Volver
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
