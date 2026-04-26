import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineShieldCheck, HiOutlineKey, HiOutlineClipboard, HiOutlineArrowPath, HiOutlineCheckBadge } from 'react-icons/hi2'
import { API } from '../../config'
import ParticleBackground from '../../components/ParticleBackground'
import '../Auth.css'

const TwoFactorSetup = () => {
    const [setupData, setSetupData] = useState(null)
    const [code, setCode] = useState('')
    const [loading, setLoading] = useState(true)
    const [activating, setActivating] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        fetchSetupData()
    }, [])

    const fetchSetupData = async () => {
        setLoading(true)
        setError('')
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(API + '/api/auth/2fa/setup/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await res.json()
            if (res.ok) {
                setSetupData(data)
            } else {
                setError(data.error || 'فشل تحميل بيانات الإعداد')
            }
        } catch (err) {
            setError('خطأ في الاتصال بالسيرفر')
        } finally {
            setLoading(false)
        }
    }

    const handleActivate = async (e) => {
        e.preventDefault()
        if (code.length !== 6) return

        setActivating(true)
        setError('')
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(API + '/api/auth/2fa/activate/', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            })
            const data = await res.json()
            if (res.ok) {
                setSuccess(true)
                // Update local user data
                const user = JSON.parse(localStorage.getItem('user'))
                user.mfa_enabled = true
                localStorage.setItem('user', JSON.stringify(user))
                
                setTimeout(() => {
                    window.location.href = '/hq'
                }, 2000)
            } else {
                setError(data.error || 'الكود غير صحيح')
            }
        } catch (err) {
            setError('خطأ في الاتصال بالسيرفر')
        } finally {
            setActivating(false)
        }
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        alert('تم نسخ المفتاح بنجاح')
    }

    if (loading) {
        return (
            <div className="auth-page">
                <ParticleBackground />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
                    <div className="loading-spinner-dash"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <ParticleBackground />
            <motion.div
                className="auth-container"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ maxWidth: '850px' }}
            >
                <div className="glass-card auth-card" style={{ padding: '48px', textAlign: 'right' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <div style={{ display: 'inline-flex', padding: '16px', borderRadius: '20px', background: 'rgba(131, 42, 150, 0.1)', color: 'var(--purple)', marginBottom: '20px' }}>
                            <HiOutlineShieldCheck size={48} />
                        </div>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>إعداد التحقق بخطوتين (2FA)</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>اربط حسابك مع تطبيق Google Authenticator لزيادة الأمان</p>
                    </div>

                    {success ? (
                        <div className="success-animation">
                            <div className="success-icon">
                                <HiOutlineCheckBadge />
                            </div>
                            <h3>تم التفعيل بنجاح!</h3>
                            <p>جاري تحويلك للوحة التحكم الآن..</p>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'window.innerWidth > 768 ? "1fr 1fr" : "1fr"', gap: '40px' }} className="setup-grid">
                            <style>{`
                                .setup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
                                @media (max-width: 768px) { .setup-grid { grid-template-columns: 1fr; } }
                                .step-badge { width: 32px; height: 32px; border-radius: 50%; background: var(--purple); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: bold; }
                                .qr-container { background: white; padding: 20px; border-radius: 24px; border: 2px dashed var(--border-glass); display: flex; flex-direction: column; align-items: center; margin: 20px 0; }
                                .secret-box { display: flex; align-items: center; gap: 10px; background: var(--bg-secondary); padding: 12px; border-radius: 12px; border: 1px solid var(--border-glass); margin-top: 15px; }
                                .error-box { color: #ef4444; background: rgba(239,68,68,0.08); padding: 12px; border-radius: 12px; font-size: 0.9rem; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; border: 1px solid rgba(239,68,68,0.15); }
                            `}</style>

                            {/* Step 1: QR Code */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <span className="step-badge">1</span>
                                    <h3 style={{ fontWeight: '800', fontSize: '1.2rem' }}>مسح الرمز (QR Code)</h3>
                                </div>
                                <div className="qr-container">
                                    {setupData?.qr_code ? (
                                        <img src={setupData.qr_code} alt="MFA QR" style={{ width: '200px', height: '200px' }} />
                                    ) : (
                                        <div style={{ height: '200px', display: 'flex', alignItems: 'center', color: 'var(--text-muted)' }}>فشل تحميل الرمز</div>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                                    <p>• افتح تطبيق Google Authenticator على هاتفك.</p>
                                    <p>• اختر "مسح رمز الاستجابة السريعة" وقم بمسح الصورة.</p>
                                </div>
                                <div className="secret-box">
                                    <code style={{ fontSize: '0.85rem', fontFamily: 'monospace', flex: 1, color: 'var(--text-primary)' }}>{setupData?.secret}</code>
                                    <button onClick={() => copyToClipboard(setupData?.secret)} style={{ background: 'none', border: 'none', color: 'var(--purple)', cursor: 'pointer', padding: '5px' }}>
                                        <HiOutlineClipboard size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Step 2: Verification */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <span className="step-badge">2</span>
                                    <h3 style={{ fontWeight: '800', fontSize: '1.2rem' }}>تفعيل الربط</h3>
                                </div>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '25px' }}>
                                    بعد مسح الرمز، سيظهر لك كود مكون من 6 أرقام. أدخل الكود الحالي هنا لتأكيد التفعيل:
                                </p>
                                
                                <form onSubmit={handleActivate} className="auth-form">
                                    <div className="input-group">
                                        <label>رمز التحقق الحالي</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="0 0 0  0 0 0"
                                                value={code}
                                                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                                maxLength={6}
                                                style={{ textAlign: 'center', letterSpacing: '0.6em', fontWeight: '800', fontSize: '1.5rem', fontFamily: 'Inter, sans-serif' }}
                                                required
                                                autoFocus
                                            />
                                            <HiOutlineKey className="input-icon" />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="error-box">
                                            <HiOutlineArrowPath className="animate-spin" /> {error}
                                        </div>
                                    )}

                                    <button type="submit" className="auth-submit-btn btn-primary" disabled={activating || code.length !== 6}>
                                        {activating ? 'جاري التفعيل...' : 'تأكيد وتفعيل الخاصية'}
                                    </button>

                                    <button 
                                        type="button" 
                                        onClick={fetchSetupData}
                                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '10px' }}
                                    >
                                        <HiOutlineArrowPath /> إعادة توليد رمز جديد
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default TwoFactorSetup
