import { useState } from 'react'
import { LogIn, Clock, ShieldCheck, X, Lock, Eye, EyeOff, KeyRound, RefreshCw, Award, CheckCircle, User } from 'lucide-react'
import { LogoIcon } from '../components/Logo'
import './Login.css'

// ── API base URL — change this if your backend runs on a different port ──────
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// ── JWT helpers ───────────────────────────────────────────────────────────────
export function saveToken(token) { localStorage.setItem('jwtToken', token) }
export function getToken() { return localStorage.getItem('jwtToken') }
export function clearToken() { localStorage.removeItem('jwtToken') }

// ── 2FA helpers (client-side OTP simulation) ──────────────────────────────────
function generateOTP() { return String(Math.floor(100000 + Math.random() * 900000)) }
function saveOTP(email, otp, type) {
  const key = `otp_${type}_${email}`
  localStorage.setItem(key, JSON.stringify({ otp, expiresAt: Date.now() + 5 * 60 * 1000 }))
  console.log(`%c[LoanHub OTP] Your ${type} code: ${otp}`, 'background:#667eea;color:white;font-size:16px;padding:6px 12px;border-radius:6px;')
}
function verifyOTP(email, inputOtp, type) {
  try {
    const key = `otp_${type}_${email}`
    const stored = JSON.parse(localStorage.getItem(key) || 'null')
    if (!stored) return 'OTP not found. Please request a new one.'
    if (Date.now() > stored.expiresAt) { localStorage.removeItem(key); return 'OTP has expired. Please request a new one.' }
    if (stored.otp !== inputOtp) return 'Incorrect OTP. Please try again.'
    localStorage.removeItem(key)
    return null
  } catch { return 'Invalid OTP. Please try again.' }
}
function is2FAEnabled(userId) {
  try { return localStorage.getItem(`2fa_enabled_${userId}`) === 'true' } catch { return false }
}
export function toggle2FA(userId, enabled) {
  localStorage.setItem(`2fa_enabled_${userId}`, enabled ? 'true' : 'false')
}
export { is2FAEnabled }

// ── Fixed Admin Credentials ───────────────────────────────────────────────────
const ADMIN_NAME = 'gannamaneni ponish'
const ADMIN_PASSWORD = 'Ponish@2128'
const ADMIN_EMAIL = 'admin@loanhub.com'

// ── Admin Login Modal ─────────────────────────────────────────────────────────
function AdminModal({ onClose, onLogin }) {
  const [loginName, setLoginName] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  const card = { background: 'white', borderRadius: '18px', padding: '36px 32px', width: '100%', maxWidth: '420px', margin: '16px', boxShadow: '0 24px 64px rgba(0,0,0,0.28)', position: 'relative' }
  const grp = { marginBottom: '16px' }
  const lbl = { fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4a5568', display: 'flex', alignItems: 'center' }
  const inp = { width: '100%', padding: '11px 14px', border: '1.5px solid #e2e8f0', borderRadius: '9px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    // Validate fixed credentials client-side
    if (loginName.trim().toLowerCase() !== ADMIN_NAME.toLowerCase()) {
      setError('Admin name does not match.')
      return
    }
    if (loginPassword !== ADMIN_PASSWORD) {
      setError('Incorrect password.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Admin login failed. Ensure backend is running.')
        return
      }
      const { token, user } = data.data
      saveToken(token)
      onClose()
      onLogin(user)
    } catch {
      setError('Cannot connect to server. Make sure the backend is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '21px', fontWeight: '800', color: '#1a202c' }}>Admin Login</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#718096' }}>Secure admin access — authorised personnel only</p>
        </div>
        {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#c53030', marginBottom: '16px' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={grp}>
            <label style={lbl}><User size={13} style={{ marginRight: 5 }} />Admin Name</label>
            <input style={inp} type="text" value={loginName} onChange={e => setLoginName(e.target.value)} placeholder="Enter your admin name" autoFocus />
          </div>
          <div style={grp}>
            <label style={lbl}><Lock size={13} style={{ marginRight: 5 }} />Password</label>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: '42px' }} type={showPwd ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)} placeholder="Enter admin password" />
              <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0 }}>
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: loading ? 0.8 : 1 }}>
            <ShieldCheck size={17} />{loading ? 'Verifying...' : 'Login as Admin'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Forgot Password Modal ─────────────────────────────────────────────────────
function ForgotPasswordModal({ onClose }) {
  const [step, setStep] = useState(1)
  const [fpEmail, setFpEmail] = useState('')
  const [fpOtp, setFpOtp] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  const card = { background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '420px', margin: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }
  const inp = { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

  const startCooldown = () => {
    setResendCooldown(30)
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const handleSendOtp = () => {
    setError(''); setSuccess('')
    if (!fpEmail) { setError('Please enter your email address.'); return }
    const otp = generateOTP()
    saveOTP(fpEmail, otp, 'reset')
    setSuccess('OTP sent! Check the browser console (F12 → Console) for your 6-digit code.')
    setStep(2)
    startCooldown()
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    const otp = generateOTP()
    saveOTP(fpEmail, otp, 'reset')
    setSuccess('New OTP sent! Check the browser console.')
    startCooldown()
  }

  const handleReset = () => {
    setError(''); setSuccess('')
    if (!fpOtp) { setError('Please enter the OTP.'); return }
    if (!newPwd || newPwd.length < 6) { setError('New password must be at least 6 characters.'); return }
    const err = verifyOTP(fpEmail, fpOtp, 'reset')
    if (err) { setError(err); return }
    setSuccess('OTP verified! Please contact admin or use the backend API to update your password.')
    setTimeout(() => onClose(), 2500)
  }

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={card}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <KeyRound size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a202c' }}>Reset Password</h2>
          <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#718096' }}>
            {step === 1 ? 'Enter your email to receive an OTP' : `Enter the OTP sent to ${fpEmail}`}
          </p>
        </div>
        {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#c53030', marginBottom: '16px' }}>{error}</div>}
        {success && <div style={{ background: '#f0fff4', border: '1px solid #9ae6b4', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#276749', marginBottom: '16px' }}>{success}</div>}
        {step === 1 && (
          <>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4a5568' }}>Email Address</label>
              <input style={inp} type="email" value={fpEmail} onChange={e => setFpEmail(e.target.value)} placeholder="Enter your registered email" />
            </div>
            <button onClick={handleSendOtp} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              Send OTP
            </button>
          </>
        )}
        {step === 2 && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4a5568' }}>6-Digit OTP</label>
              <input style={{ ...inp, letterSpacing: '6px', fontSize: '20px', textAlign: 'center', fontWeight: '700' }} type="text" value={fpOtp} onChange={e => setFpOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button onClick={handleResend} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '12px', color: resendCooldown > 0 ? '#a0aec0' : '#667eea', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
                  <RefreshCw size={12} /> {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px', color: '#4a5568' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input style={{ ...inp, paddingRight: '42px' }} type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowPwd(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a0aec0', padding: 0 }}>{showPwd ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
            </div>
            <button onClick={handleReset} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              Verify OTP
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── 2FA OTP Verification Modal ────────────────────────────────────────────────
function TwoFactorModal({ email, onVerify, onCancel }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [resendCooldown, setResendCooldown] = useState(0)

  const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }
  const card = { background: 'white', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '400px', margin: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', position: 'relative' }
  const inp = { width: '100%', padding: '10px 13px', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '24px', outline: 'none', boxSizing: 'border-box', textAlign: 'center', letterSpacing: '8px', fontWeight: '700' }

  const startCooldown = () => {
    setResendCooldown(30)
    const t = setInterval(() => setResendCooldown(c => { if (c <= 1) { clearInterval(t); return 0 } return c - 1 }), 1000)
  }

  const handleResend = () => {
    if (resendCooldown > 0) return
    const newOtp = generateOTP()
    saveOTP(email, newOtp, '2fa')
    startCooldown()
  }

  const handleVerify = () => {
    setError('')
    const err = verifyOTP(email, otp, '2fa')
    if (err) { setError(err); return }
    onVerify()
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <button onClick={onCancel} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#718096' }}><X size={20} /></button>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', background: 'linear-gradient(135deg, #48bb78, #38a169)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <ShieldCheck size={24} color="white" />
          </div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#1a202c' }}>Two-Factor Authentication</h2>
          <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#718096', lineHeight: '1.5' }}>
            A 6-digit OTP has been sent to your registered account.<br />
            <strong>Check the browser console (F12 → Console)</strong> for the code.
          </p>
        </div>
        {error && <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', color: '#c53030', marginBottom: '16px' }}>{error}</div>}
        <input style={inp} type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" maxLength={6} autoFocus />
        <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0 16px' }}>
          <button onClick={handleResend} disabled={resendCooldown > 0} style={{ background: 'none', border: 'none', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer', fontSize: '12px', color: resendCooldown > 0 ? '#a0aec0' : '#667eea', display: 'flex', alignItems: 'center', gap: '4px', padding: 0 }}>
            <RefreshCw size={12} /> {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
          </button>
        </div>
        <button onClick={handleVerify} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #48bb78, #38a169)', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', marginBottom: '10px' }}>
          Verify OTP
        </button>
        <button onClick={onCancel} style={{ width: '100%', padding: '10px', background: 'none', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', color: '#718096' }}>
          Cancel Login
        </button>
      </div>
    </div>
  )
}

// ── Main Login Component ──────────────────────────────────────────────────────
export default function Login({ onLogin, setUsers }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [dob, setDob] = useState('')
  const [role, setRole] = useState('borrower')
  const [panCard, setPanCard] = useState('')
  const [aadhaarCard, setAadhaarCard] = useState('')
  const [annualIncome, setAnnualIncome] = useState('')
  const [education, setEducation] = useState('')
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [pending2FAUser, setPending2FAUser] = useState(null)
  const [showAdminModal, setShowAdminModal] = useState(false)

  // ── LOGIN ────────────────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || 'Invalid email or password.')
        return
      }
      const { token, user } = data.data
      if (is2FAEnabled(user.id)) {
        const otp = generateOTP()
        saveOTP(user.email, otp, '2fa')
        setPending2FAUser({ token, user })
        return
      }
      saveToken(token)
      onLogin(user)
      if (setUsers) setUsers([user])
    } catch {
      setError('Cannot connect to server. Make sure the backend is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  // ── REGISTER ─────────────────────────────────────────────────────────────
  const handleSignUp = async (e) => {
    e.preventDefault()
    setError(''); setSuccess(''); setLoading(true)

    if (!name || !email || !password || !phone || !dob) { setError('Please fill in all required fields'); setLoading(false); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); setLoading(false); return }
    if (!/^\d{10}$/.test(phone)) { setError('Phone number must be exactly 10 digits'); setLoading(false); return }
    if (role === 'admin') { setError('Admin accounts cannot be self-registered.'); setLoading(false); return }
    if (role === 'borrower' || role === 'lender') {
      if (!panCard || !aadhaarCard || !annualIncome) { setError('Please fill in PAN Card, Aadhaar Card and Annual Income'); setLoading(false); return }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard.toUpperCase())) { setError('Invalid PAN card format (e.g. ABCDE1234F)'); setLoading(false); return }
      if (!/^\d{12}$/.test(aadhaarCard)) { setError('Aadhaar card must be exactly 12 digits'); setLoading(false); return }
    }
    if (role === 'analyst') {
      if (!panCard || !aadhaarCard || !education) { setError('Please fill in PAN Card, Aadhaar Card and Education'); setLoading(false); return }
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panCard.toUpperCase())) { setError('Invalid PAN card format (e.g. ABCDE1234F)'); setLoading(false); return }
      if (!/^\d{12}$/.test(aadhaarCard)) { setError('Aadhaar card must be exactly 12 digits'); setLoading(false); return }
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, email, password, phone, dob, role,
          panCard: panCard ? panCard.toUpperCase() : null,
          aadhaarCard: aadhaarCard || null,
          annualIncome: annualIncome || null,
          education: education || null
        })
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.message && data.message.includes('pending')) {
          setSuccess('Your Financial Analyst account request has been submitted! Please wait for admin approval before logging in.')
          setIsSignUp(false); reset()
        } else {
          setError(data.message || 'Registration failed. Please try again.')
        }
        return
      }

      const { token, user } = data.data
      saveToken(token)
      setSuccess('Account created successfully! Logging you in...')
      setTimeout(() => {
        onLogin(user)
        if (setUsers) setUsers([user])
      }, 800)
    } catch {
      setError('Cannot connect to server. Make sure the backend is running on port 8080.')
    } finally {
      setLoading(false)
    }
  }

  const handle2FAVerified = () => {
    if (!pending2FAUser) return
    saveToken(pending2FAUser.token)
    onLogin(pending2FAUser.user)
    if (setUsers) setUsers([pending2FAUser.user])
    setPending2FAUser(null)
  }

  const reset = () => {
    setError(''); setSuccess(''); setEmail(''); setPassword('')
    setName(''); setPhone(''); setDob(''); setRole('borrower')
    setPanCard(''); setAadhaarCard(''); setAnnualIncome(''); setEducation('')
  }

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: '', color: '#e2e8f0' }
    let score = 0
    if (pwd.length >= 6) score++
    if (pwd.length >= 10) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    if (score <= 1) return { score, label: 'Weak', color: '#e53e3e' }
    if (score <= 2) return { score, label: 'Fair', color: '#d69e2e' }
    if (score <= 3) return { score, label: 'Good', color: '#38a169' }
    return { score, label: 'Strong', color: '#1a73e8' }
  }
  const pwdStrength = isSignUp ? getPasswordStrength(password) : null

  return (
    <div className="login-container">
      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      {showAdminModal && <AdminModal onClose={() => setShowAdminModal(false)} onLogin={onLogin} />}
      {pending2FAUser && (
        <TwoFactorModal
          email={pending2FAUser.user.email}
          onVerify={handle2FAVerified}
          onCancel={() => setPending2FAUser(null)}
        />
      )}
      <div className="login-card">
        <div className="login-header">
          <LogoIcon size={52} />
          <h1>LoanHub</h1>
          <p>Financial Loan Management Platform</p>
        </div>

        <form onSubmit={isSignUp ? handleSignUp : handleLogin} className="login-form">
          <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
          {error && <div className="alert alert-error">{error}</div>}
          {success && (
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              {success.includes('pending') && <Clock size={18} style={{ marginTop: '2px', flexShrink: 0 }} />}
              <span>{success}</span>
            </div>
          )}

          {isSignUp && (
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" />
            </div>
          )}

          <div className="form-group">
            <label>Email Address *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" />
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label>Phone Number *</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="10-digit phone number" maxLength={10} />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} max={new Date().toISOString().split('T')[0]} />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password *</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" />
            {isSignUp && password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= pwdStrength.score ? pwdStrength.color : '#e2e8f0', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: pwdStrength.color, fontWeight: '600' }}>{pwdStrength.label} password{pwdStrength.score < 3 ? ' — add uppercase, numbers or symbols' : ''}</div>
              </div>
            )}
            {!isSignUp && (
              <button type="button" onClick={() => setShowForgotPassword(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#667eea', fontSize: '12px', fontWeight: '600', padding: '4px 0 0', display: 'block', textAlign: 'right', width: '100%' }}>
                Forgot Password?
              </button>
            )}
          </div>

          {isSignUp && (
            <>
              <div className="form-group">
                <label>Role *</label>
                <select value={role} onChange={e => { setRole(e.target.value); setPanCard(''); setAadhaarCard(''); setAnnualIncome(''); setEducation('') }}>
                  <option value="borrower">Borrower</option>
                  <option value="lender">Lender</option>
                  <option value="analyst">Financial Analyst (Requires Admin Approval)</option>
                </select>
                {role === 'analyst' && <p style={{ fontSize: '12px', color: '#d69e2e', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> Financial Analyst accounts require admin approval before you can log in.</p>}
              </div>

              {(role === 'borrower' || role === 'lender') && (
                <>
                  <div style={{ margin: '4px 0 12px', padding: '10px 14px', background: '#ebf4ff', borderRadius: '8px', fontSize: '12px', color: '#2b6cb0', fontWeight: '500' }}>
                    KYC details required for {role === 'borrower' ? 'Borrowers' : 'Lenders'}
                  </div>
                  <div className="form-group"><label>PAN Card Number *</label><input type="text" value={panCard} onChange={e => setPanCard(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} /></div>
                  <div className="form-group"><label>Aadhaar Card Number *</label><input type="text" value={aadhaarCard} onChange={e => setAadhaarCard(e.target.value.replace(/\D/g,''))} placeholder="12-digit Aadhaar number" maxLength={12} /></div>
                  <div className="form-group"><label>Annual Income (₹) *</label><input type="number" value={annualIncome} onChange={e => setAnnualIncome(e.target.value)} placeholder="Enter annual income in ₹" min={0} /></div>
                </>
              )}

              {role === 'analyst' && (
                <>
                  <div style={{ margin: '4px 0 12px', padding: '10px 14px', background: '#fefcbf', borderRadius: '8px', fontSize: '12px', color: '#744210', fontWeight: '500' }}>
                    Professional details required for Financial Analysts
                  </div>
                  <div className="form-group"><label>PAN Card Number *</label><input type="text" value={panCard} onChange={e => setPanCard(e.target.value.toUpperCase())} placeholder="e.g. ABCDE1234F" maxLength={10} style={{ textTransform: 'uppercase' }} /></div>
                  <div className="form-group"><label>Aadhaar Card Number *</label><input type="text" value={aadhaarCard} onChange={e => setAadhaarCard(e.target.value.replace(/\D/g,''))} placeholder="12-digit Aadhaar number" maxLength={12} /></div>
                  <div className="form-group">
                    <label>Highest Education *</label>
                    <select value={education} onChange={e => setEducation(e.target.value)}>
                      <option value="">Select education</option>
                      <option value="B.Com">B.Com</option>
                      <option value="BBA">BBA</option>
                      <option value="MBA Finance">MBA Finance</option>
                      <option value="CA (Chartered Accountant)">CA (Chartered Accountant)</option>
                      <option value="CFA (CFA Institute)">CFA (CFA Institute)</option>
                      <option value="M.Com">M.Com</option>
                      <option value="B.Sc Economics">B.Sc Economics</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            <LogIn size={20} />{loading ? (isSignUp ? 'Creating Account...' : 'Logging in...') : (isSignUp ? 'Create Account' : 'Login')}
          </button>
        </form>

        {isSignUp ? (
          <><div className="login-divider">Already have an account?</div><button onClick={() => { reset(); setIsSignUp(false) }} className="btn btn-outline btn-block">Sign In</button></>
        ) : (
          <><div className="login-divider" style={{ marginBottom: '10px' }} /><button onClick={() => { reset(); setIsSignUp(true) }} className="btn btn-outline btn-block">Create Account</button></>
        )}

        {!isSignUp && (
          <button
            onClick={() => setShowAdminModal(true)}
            style={{ marginTop: '12px', width: '100%', padding: '11px 16px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 2px 10px rgba(102,126,234,0.4)', letterSpacing: '0.3px' }}
          >
            <ShieldCheck size={16} /> Admin Login
          </button>
        )}

        <div style={{ marginTop: '20px', padding: '14px', background: '#f7fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '10px' }}>
            {[
              { icon: <Lock size={13} />, label: '256-bit SSL' },
              { icon: <ShieldCheck size={13} />, label: 'RBI Compliant' },
              { icon: <Award size={13} />, label: 'ISO 27001' },
              { icon: <CheckCircle size={13} />, label: 'KYC Verified' },
            ].map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '600', color: 'var(--text-secondary, #4a5568)' }}>
                <span style={{ color: '#1a73e8' }}>{b.icon}</span>{b.label}
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: '10px', color: '#718096', margin: 0, lineHeight: '1.5' }}>
            LoanHub is registered under RBI NBFC guidelines (Reg. No. N-05.01234). Your data is encrypted and protected under IT Act 2000.
          </p>
        </div>
      </div>
    </div>
  )
}
