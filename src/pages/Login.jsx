import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { HiOutlinePhone, HiOutlineLockClosed, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2'
// import { useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import ParticleBackground from '../components/ParticleBackground'
import './Auth.css'

const Login = () => {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [mfaRequired, setMfaRequired] = useState(false)
    const [mfaCode, setMfaCode] = useState('')
    const [userId, setUserId] = useState(null)
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()
    const fieldMessageMap = {
        captcha_token: 'الكابشا مطلوبة',
        password: 'كلمة السر مطلوبة',
        phone: 'رقم الهاتف مطلوب',
    }
    // const { executeRecaptcha } = useGoogleReCaptcha();
    const handleSubmit = async (e) => {
        e.preventDefault()
        // if (!executeRecaptcha) {
        //     alert("Captcha not ready");
        //     return;
        //   }
        // const token = await executeRecaptcha('login');
        setErrorMsg('')

        if (!/^\d{11}$/.test(phone)) {
            setErrorMsg('رقم الهاتف لازم يكون 11 رقم بالضبط')
            return
        }

        setLoading(true)
        try {
            const endpoint = mfaRequired ? '/api/auth/2fa/verify/' : '/api/auth/login/'
            const payload = mfaRequired ? { user_id: userId, code: mfaCode } : { phone, password
                // , captcha_token: token
            }

            const res = await fetch(API + endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                const collectErrors = (value, fieldPath = '') => {
                    if (typeof value === 'string') {
                        const fieldKey = fieldPath.split('.').pop()
                        const customMessage = fieldMessageMap[fieldKey]
                        if (customMessage) return [customMessage]
                        return [fieldPath ? `${fieldPath}: ${value}` : value]
                    }
                    if (Array.isArray(value)) {
                        return value.flatMap((item) => collectErrors(item, fieldPath))
                    }
                    if (value && typeof value === 'object') {
                        return Object.entries(value).flatMap(([key, item]) => {
                            const nextFieldPath = fieldPath ? `${fieldPath}.${key}` : key
                            return collectErrors(item, nextFieldPath)
                        })
                    }
                    return []
                }

                const apiErrors = collectErrors(data)
                const fallbackError = 'تعذر تسجيل الدخول، حاول مرة ثانية'
                setErrorMsg(apiErrors.length ? apiErrors.join(' - ') : fallbackError)
                return
            }

            if (data.mfa_required) {
                setMfaRequired(true)
                setUserId(data.user_id)
                return
            }

            // حفظ التوكنات + بيانات المستخدم
            localStorage.setItem('access_token', data.access)
            localStorage.setItem('refresh_token', data.refresh)
            localStorage.setItem('user', JSON.stringify(data.user))

            const user = data.user
            const pendingRedirect = localStorage.getItem('pending_course_redirect')

            if (pendingRedirect) {
                localStorage.removeItem('pending_course_redirect')
                navigate(pendingRedirect)
            } else {
                // تـوجيه ذكي حسب نـوع الحساب
                if (user.role === 'admin') {
                    navigate('/hq');
                } else if (user.role === 'assistant' || user.is_ta) {
                    navigate('/ta');
                } else if (user.role === 'teacher') {
                    navigate('/teacher');
                } else {
                    navigate('/dashboard');
                }
            }
        } catch (err) {
            setErrorMsg('خطأ بالاتصال بالسيرفر')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <ParticleBackground />
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="glass-card auth-card">
                    <div className="auth-logo">
                        <img src="/new-logo.png" alt="Key Academy" onClick={() => navigate('/')} />
                    </div>

                    <h2>{mfaRequired ? 'التحقق بخطوتين' : 'تسجيل الدخول'}</h2>
                    <p className="auth-subtitle">
                        {mfaRequired ? 'أدخل الكود من تطبيق Google Authenticator' : 'هلا بيك! سجل دخولك حتى تكمل دراستك'}
                    </p>

                    <form className="auth-form" onSubmit={handleSubmit}>
                        {!mfaRequired ? (
                            <>
                                <div className="input-group">
                                    <label>رقم الهاتف</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="tel"
                                            placeholder="07XX XXX XXXX"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                            dir="ltr"
                                        />
                                        <HiOutlinePhone className="input-icon" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>كلمة المرور</label>
                                    <div className="input-wrapper">
                                        <input
                                            type="password"
                                            placeholder="اكتب الرمز السري"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                        <HiOutlineLockClosed className="input-icon" />
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="input-group">
                                <label>رمز التحقق (OTP)</label>
                                <div className="input-wrapper">
                                    <input
                                        type="text"
                                        placeholder="000000"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value)}
                                        required
                                        maxLength={6}
                                        dir="ltr"
                                        style={{ letterSpacing: '0.5em', textAlign: 'center', fontWeight: 'bold' }}
                                        autoFocus
                                    />
                                    <HiOutlineLockClosed className="input-icon" />
                                </div>
                                <button 
                                    type="button" 
                                    onClick={() => setMfaRequired(false)}
                                    style={{ background: 'none', border: 'none', color: '#832a96', fontSize: '0.85rem', cursor: 'pointer', marginTop: '10px', width: '100%', textAlign: 'right', fontWeight: '600' }}
                                >
                                    العودة لتسجيل الدخول
                                </button>
                            </div>
                        )}

                        {errorMsg && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <HiOutlineArrowLeftOnRectangle />
                            {loading ? (mfaRequired ? 'جاري التحقق...' : 'جاري الدخول...') : (mfaRequired ? 'تأكيد الرمز' : 'تسجيل الدخول')}
                        </button>
                    </form>

                    <div className="auth-divider">أو</div>

                    <div className="auth-footer">
                        ما عندك حساب؟{' '}
                        <Link to="/signup">سوي حساب هسة</Link>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

export default Login
