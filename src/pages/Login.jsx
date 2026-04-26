import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { HiOutlinePhone, HiOutlineLockClosed, HiOutlineArrowLeftOnRectangle } from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './Auth.css'

const Login = () => {
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (!/^\d{11}$/.test(phone)) {
            setErrorMsg('رقم الهاتف لازم يكون 11 رقم بالضبط')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(API + '/api/auth/login/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            })
            const data = await res.json()
            if (!res.ok) {
                setErrorMsg(data.error || 'رقم الهاتف أو كلمة المرور غلط')
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
                        <img src="/new-logo.png" alt="Key Academy" />
                    </div>

                    <h2>تسجيل الدخول</h2>
                    <p className="auth-subtitle">هلا بيك! سجل دخولك حتى تكمل دراستك</p>

                    <form className="auth-form" onSubmit={handleSubmit}>
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

                        {errorMsg && <div style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}

                        <button type="submit" className="btn-primary" disabled={loading}>
                            <HiOutlineArrowLeftOnRectangle />
                            {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
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
