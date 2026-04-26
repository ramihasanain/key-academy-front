import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlinePhone,
    HiOutlineLockClosed,
    HiOutlineUser,
    HiOutlineRocketLaunch,
    HiOutlineCheck,
    HiOutlineEye,
    HiOutlineEyeSlash,
    HiOutlineIdentification,
    HiOutlineMapPin,
    HiOutlineAcademicCap,
    HiOutlineBookOpen
} from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './Auth.css'

const Signup = () => {
    const [step, setStep] = useState(1)

    // Form fields
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [username, setUsername] = useState('')
    const [phone, setPhone] = useState('')
    const [parentPhone, setParentPhone] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [city, setCity] = useState('بغداد')
    const [grade, setGrade] = useState('الصف السادس الإعدادي')
    const [branch, setBranch] = useState('الفرع العلمي')

    // UI state
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [citiesList, setCitiesList] = useState([])
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')

    // OTP
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const otpRefs = useRef([])
    const navigate = useNavigate()

    // جلب المدن من الباك إند
    useEffect(() => {
        fetch(API + '/api/content/cities/')
            .then(res => res.json())
            .then(data => setCitiesList(data))
            .catch(() => {
                // fallback إذا الباك إند مو شغال
                setCitiesList([
                    { id: 1, name: 'بغداد' },
                    { id: 2, name: 'البصرة' },
                    { id: 3, name: 'الموصل' },
                    { id: 4, name: 'أربيل' },
                    { id: 5, name: 'النجف' },
                    { id: 6, name: 'كربلاء' },
                    { id: 7, name: 'الأنبار' },
                ])
            })
    }, [])

    const handleSignup = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        // Phone validation — must be exactly 11 digits
        if (!/^\d{11}$/.test(phone)) {
            setErrorMsg("رقم الهاتف لازم يكون 11 رقم بالضبط (مثل: 07901234567)")
            return
        }
        if (parentPhone && !/^\d{11}$/.test(parentPhone)) {
            setErrorMsg("رقم ولي الأمر لازم يكون 11 رقم بالضبط")
            return
        }
        if (password !== confirmPassword) {
            setErrorMsg("الرمز السري مديتطابق، أرجع تأكد منه")
            return
        }

        setLoading(true)
        try {
            const res = await fetch(API + '/api/auth/signup/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    username,
                    first_name: firstName,
                    last_name: lastName,
                    parent_phone: parentPhone,
                    city,
                    grade,
                    branch: grade === 'الثالث المتوسط' ? '' : branch,
                    password,
                    confirm_password: confirmPassword,
                }),
            })
            const data = await res.json()
            if (!res.ok) {
                // عرض أول خطأ موجود
                const firstError = Object.values(data)[0]
                setErrorMsg(Array.isArray(firstError) ? firstError[0] : firstError)
                return
            }
            // --- OTP BYPASS TEMP ---
            if (data.access) {
                localStorage.setItem('access_token', data.access)
                localStorage.setItem('refresh_token', data.refresh)
                localStorage.setItem('user', JSON.stringify(data.user))
                setStep(3)
                setTimeout(() => {
                    navigate('/dashboard')
                }, 3000)
                return
            }
            // -----------------------

            // نجاح — انتقل لخطوة الـ OTP
            setStep(2)
        } catch (err) {
            setErrorMsg('خطأ بالاتصال بالسيرفر، تأكد الباك إند شغال')
        } finally {
            setLoading(false)
        }
    }

    const handleOtpChange = (index, value) => {
        if (value.length > 1) value = value[value.length - 1]
        if (!/^\d*$/.test(value)) return

        const newOtp = [...otp]
        newOtp[index] = value
        setOtp(newOtp)

        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus()
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus()
        }
    }

    const handleVerify = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        const otpCode = otp.join('')
        if (otpCode.length !== 6) {
            setErrorMsg('اكتب الكود كامل (6 أرقام)')
            return
        }

        setLoading(true)
        try {
            const res = await fetch(API + '/api/auth/verify-otp/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, otp: otpCode }),
            })
            const data = await res.json()
            if (!res.ok) {
                setErrorMsg(data.error || 'رمز التأكيد غلط')
                return
            }
            // حفظ التوكنات + بيانات المستخدم
            localStorage.setItem('access_token', data.access)
            localStorage.setItem('refresh_token', data.refresh)
            localStorage.setItem('user', JSON.stringify(data.user))

            setStep(3)
            setTimeout(() => {
                navigate('/dashboard')
            }, 3000)
        } catch (err) {
            setErrorMsg('خطأ بالاتصال بالسيرفر')
        } finally {
            setLoading(false)
        }
    }

    const slideVariants = {
        enter: { opacity: 0, x: -30 },
        center: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 30 }
    }

    return (
        <div className="auth-page">
            <ParticleBackground />

            {/* Decorative Orbs */}
            <div className="auth-orb auth-orb-1"></div>
            <div className="auth-orb auth-orb-2"></div>

            <motion.div
                className="auth-container signup-container"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <div className="glass-card auth-card">
                    <div className="auth-logo">
                        <img src="/new-logo.png" alt="Key Academy" />
                    </div>

                    <div className="signup-steps">
                        <div className={`step-dot ${step >= 1 ? (step > 1 ? 'completed' : 'active') : ''}`}></div>
                        <div className={`step-dot ${step >= 2 ? (step > 2 ? 'completed' : 'active') : ''}`}></div>
                        <div className={`step-dot ${step >= 3 ? 'active' : ''}`}></div>
                    </div>

                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                                <h2>إنشاء حساب جديد</h2>
                                <p className="auth-subtitle">انضم لعائلة Key Academy وابدي ويانا رحلة التفوق</p>

                                <form className="auth-form" onSubmit={handleSignup}>

                                    {/* Name Row */}
                                    <div className="input-row">
                                        <div className="input-group">
                                            <label>الاسم الأول</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="أحمد"
                                                    value={firstName}
                                                    onChange={(e) => setFirstName(e.target.value)}
                                                    required
                                                />
                                                <HiOutlineUser className="input-icon" />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label>الاسم الأخير</label>
                                            <div className="input-wrapper">
                                                <input
                                                    type="text"
                                                    placeholder="محمد"
                                                    value={lastName}
                                                    onChange={(e) => setLastName(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Username */}
                                    <div className="input-group">
                                        <label>معرف المستخدم</label>
                                        <div className="input-wrapper">
                                            <input
                                                type="text"
                                                placeholder="ahmed_123"
                                                value={username}
                                                onChange={(e) => setUsername(e.target.value)}
                                                required
                                                dir="ltr"
                                            />
                                            <HiOutlineIdentification className="input-icon" />
                                        </div>
                                    </div>

                                    {/* Phone */}
                                    <div className="input-group">
                                        <label>رقم الهاتف</label>
                                        <div className="phone-wrapper">
                                            <div className="phone-prefix">+964</div>
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

                                    {/* Parent Phone */}
                                    <div className="input-group">
                                        <label>رقم ولي الأمر</label>
                                        <div className="phone-wrapper">
                                            <div className="phone-prefix">+964</div>
                                            <input
                                                type="tel"
                                                placeholder="07XX XXX XXXX"
                                                value={parentPhone}
                                                onChange={(e) => setParentPhone(e.target.value)}
                                                required
                                                dir="ltr"
                                            />
                                            <HiOutlinePhone className="input-icon" />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div className="input-group">
                                        <label>كلمة المرور</label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                dir="ltr"
                                            />
                                            <HiOutlineLockClosed className="input-icon" />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="input-group">
                                        <label>تأكيد كلمة المرور</label>
                                        <div className="input-wrapper">
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required
                                                dir="ltr"
                                            />
                                            <HiOutlineLockClosed className="input-icon" />
                                            <button
                                                type="button"
                                                className="password-toggle"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <HiOutlineEyeSlash /> : <HiOutlineEye />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* City Dropdown */}
                                    <div className="input-group">
                                        <label>المدينة</label>
                                        <div className="input-wrapper">
                                            <select
                                                value={city}
                                                onChange={(e) => setCity(e.target.value)}
                                                required
                                            >
                                                {citiesList.map(c => (
                                                    <option key={c.id} value={c.name}>{c.name}</option>
                                                ))}
                                            </select>
                                            <HiOutlineMapPin className="input-icon select-icon" />
                                        </div>
                                    </div>

                                    {/* Grade & Branch */}
                                    <div className="input-group">
                                        <label>المرحلة الدراسية</label>
                                        <div className="input-wrapper">
                                            <select
                                                value={grade}
                                                onChange={(e) => setGrade(e.target.value)}
                                                required
                                            >
                                                <option value="الصف السادس الإعدادي">الصف السادس الإعدادي</option>
                                                <option value="الثالث المتوسط">الثالث المتوسط</option>
                                            </select>
                                            <HiOutlineAcademicCap className="input-icon select-icon" />
                                        </div>
                                    </div>

                                    {grade !== 'الثالث المتوسط' && (
                                        <div className="input-group">
                                            <label>المسار الدراسي</label>
                                            <div className="input-wrapper">
                                                <select
                                                    value={branch}
                                                    onChange={(e) => setBranch(e.target.value)}
                                                    required
                                                >
                                                    <option value="الفرع العلمي">الفرع العلمي</option>
                                                    <option value="الفرع الأدبي">الفرع الأدبي</option>
                                                </select>
                                                <HiOutlineBookOpen className="input-icon select-icon" />
                                            </div>
                                        </div>
                                    )}

                                    {errorMsg && <div className="auth-error" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}

                                    <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                                        <HiOutlineRocketLaunch />
                                        {loading ? 'جاري التسجيل...' : 'التالي - كود التأكيد'}
                                    </button>
                                </form>

                                <div className="auth-divider">أو</div>
                                <div className="auth-footer">
                                    عندك حساب اصلاً؟{' '}
                                    <Link to="/login">سجل دخول من هنا</Link>
                                </div>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                                <h2>كود التأكيد</h2>
                                <p className="auth-subtitle">اكتب الكود اللي دزيناه لرقم {phone || 'تليفونك'}</p>

                                <form onSubmit={handleVerify}>
                                    <div className="otp-container">
                                        {otp.map((digit, i) => (
                                            <input
                                                key={i}
                                                ref={el => otpRefs.current[i] = el}
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={1}
                                                className={`otp-input ${digit ? 'filled' : ''}`}
                                                value={digit}
                                                onChange={(e) => handleOtpChange(i, e.target.value)}
                                                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                                autoFocus={i === 0}
                                            />
                                        ))}
                                    </div>

                                    {errorMsg && <div className="auth-error" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '12px', fontSize: '0.9rem', textAlign: 'center' }}>{errorMsg}</div>}

                                    <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                                        {loading ? 'جاري التأكيد...' : 'تأكيد الرمز'}
                                    </button>

                                    <div className="otp-timer">
                                        ما وصلك الكود؟{' '}
                                        <button type="button" className="otp-resend">دزوه مرة ثانية</button>
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                                <div className="success-animation">
                                    <motion.div
                                        className="success-icon"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                                    >
                                        <HiOutlineCheck />
                                    </motion.div>
                                    <motion.h3 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                        هلا بيك، {firstName}! 🎉
                                    </motion.h3>
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                                        حسابك صار جاهز. ثواني وندخلك لغرفتك الدراسية...
                                    </motion.p>
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
                                        <div className="loading-spinner-dash"></div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    )
}

export default Signup
