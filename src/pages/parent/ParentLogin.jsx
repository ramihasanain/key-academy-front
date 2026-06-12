import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { motion } from 'framer-motion'
import { HiOutlinePhone, HiOutlineLockClosed, HiOutlineUserGroup } from 'react-icons/hi2'
import ParticleBackground from '../../components/ParticleBackground'
import '../Auth.css'

const ParentLogin = () => {
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
            const res = await fetch(`${API}/api/v1/parent/auth/login/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, password }),
            })
            const data = await res.json()

            if (!res.ok) {
                setErrorMsg(data.error || 'تعذر تسجيل الدخول')
                return
            }

            localStorage.setItem('access_token', data.access)
            localStorage.setItem('refresh_token', data.refresh)
            localStorage.setItem('user', JSON.stringify(data.user))
            localStorage.removeItem('parent_selected_student')

            const user = data.user
            if (user.must_change_password) {
                navigate('/parent/change-password')
                return
            }

            if ((user.children || []).length > 1) {
                navigate('/parent/select-student')
                return
            }

            if (user.children?.[0]) {
                localStorage.setItem('parent_selected_student', JSON.stringify(user.children[0]))
            }
            navigate('/parent/features')
        } catch {
            setErrorMsg('خطأ بالاتصال بالسيرفر')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-orb auth-orb-1" />
            <div className="auth-orb auth-orb-2" />
            <ParticleBackground />

            <motion.div
                className="auth-card glass-panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
            >
                <div className="auth-header" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', fontSize: '1.8rem', color: '#fff',
                    }}>
                        <HiOutlineUserGroup />
                    </div>
                    <h1>بوابة أولياء الأمور</h1>
                    <p>تابع أداء ابنك/ابنتك الدراسي — للويب فقط</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {errorMsg && <div className="auth-error">{errorMsg}</div>}

                    <div className="auth-input-group">
                        <HiOutlinePhone />
                        <input
                            type="tel"
                            placeholder="رقم هاتف ولي الأمر (11 رقم)"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                            dir="ltr"
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <HiOutlineLockClosed />
                        <input
                            type="password"
                            placeholder="كلمة المرور"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'جاري الدخول...' : 'دخول'}
                    </button>
                </form>

                <p className="auth-footer-text" style={{ marginTop: '20px', textAlign: 'center' }}>
                    طالب؟ <Link to="/login">دخول الطلاب</Link>
                </p>
            </motion.div>
        </div>
    )
}

export default ParentLogin
