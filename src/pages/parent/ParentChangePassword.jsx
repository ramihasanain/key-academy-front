import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { motion } from 'framer-motion'
import { HiOutlineLockClosed, HiOutlineKey } from 'react-icons/hi2'
import ParticleBackground from '../../components/ParticleBackground'
import { ParentProtectedRoute } from '../../components/ParentProtectedRoute'
import '../Auth.css'

const ParentChangePasswordForm = () => {
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (newPassword.length < 6) {
            setErrorMsg('كلمة المرور لازم تكون 6 أحرف على الأقل')
            return
        }
        if (newPassword !== confirmPassword) {
            setErrorMsg('كلمة المرور غير متطابقة')
            return
        }

        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(`${API}/api/v1/parent/auth/change-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }),
            })
            const data = await res.json()

            if (!res.ok) {
                const err = data.confirm_password?.[0] || data.error || 'تعذر تغيير كلمة المرور'
                setErrorMsg(err)
                return
            }

            const userStr = localStorage.getItem('user')
            if (userStr) {
                const user = JSON.parse(userStr)
                user.must_change_password = false
                localStorage.setItem('user', JSON.stringify(user))
            }

            const user = JSON.parse(localStorage.getItem('user') || '{}')
            if ((user.children || []).length > 1) {
                navigate('/parent/select-student')
            } else if (user.children?.[0]) {
                localStorage.setItem('parent_selected_student', JSON.stringify(user.children[0]))
                navigate('/parent/features')
            } else {
                navigate('/parent/features')
            }
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
            >
                <div className="auth-header" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', fontSize: '1.8rem', color: '#fff',
                    }}>
                        <HiOutlineKey />
                    </div>
                    <h1>تغيير كلمة المرور</h1>
                    <p>هذا أول دخول لك — لازم تختار كلمة مرور جديدة</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {errorMsg && <div className="auth-error">{errorMsg}</div>}

                    <div className="auth-input-group">
                        <HiOutlineLockClosed />
                        <input
                            type="password"
                            placeholder="كلمة المرور الجديدة"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-input-group">
                        <HiOutlineLockClosed />
                        <input
                            type="password"
                            placeholder="تأكيد كلمة المرور"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? 'جاري الحفظ...' : 'حفظ ومتابعة'}
                    </button>
                </form>
            </motion.div>
        </div>
    )
}

const ParentChangePassword = () => (
    <ParentProtectedRoute skipPasswordCheck skipStudentCheck>
        <ParentChangePasswordForm />
    </ParentProtectedRoute>
)

export default ParentChangePassword
