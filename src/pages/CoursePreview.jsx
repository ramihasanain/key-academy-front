import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineArrowRight,
    HiOutlinePlayCircle,
    HiOutlineLockClosed,
    HiOutlineClock,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineSparkles,
    HiOutlineCreditCard,
    HiOutlineUserGroup,
    HiStar
} from 'react-icons/hi2'
import './CoursePreview.css'

const CoursePreview = () => {
    const { courseId } = useParams()
    const navigate = useNavigate()
    const [scrolled, setScrolled] = useState(false)
    const [code, setCode] = useState('')
    const [isActivating, setIsActivating] = useState(false)
    const [course, setCourse] = useState(null)
    const [loading, setLoading] = useState(true)

    // Load pending code if the user was just redirected back from login
    useEffect(() => {
        const savedCode = localStorage.getItem('pending_course_code')
        if (savedCode) {
            setCode(savedCode)
            localStorage.removeItem('pending_course_code') // clear after consuming
        }
    }, [])
    // Generic Custom Popup State
    const [popup, setPopup] = useState({ show: false, type: 'error', title: '', message: '', actionText: 'حسناً', actionFn: null })

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 80)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        fetch(`${API}/api/courses/${courseId}/preview/`)
            .then(res => res.json())
            .then(data => {
                setCourse(data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [courseId])

    if (loading || !course) {
        return <div className="preview-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>جاري تحميل الدورة...</div>
    }



    const handleActivate = async (e) => {
        e.preventDefault()
        if (isActivating) return;

        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            localStorage.setItem('pending_course_code', code)
            localStorage.setItem('pending_course_redirect', `/course-preview/${courseId}`)
            setPopup({
                show: true,
                type: 'auth',
                title: 'خطوة واحدة بس!',
                message: 'لازم تسجل دخولك أول أو تسوي حساب جديد حتى تكدر تفعل كارت الاشتراك وتبدي ويانا 💎',
                actionText: 'تسجيل الدخول',
                actionFn: () => navigate('/login')
            })
            return
        }

        if (!code || code.length < 5) {
            setPopup({
                show: true,
                type: 'error',
                title: 'انتبه!',
                message: 'رجاءً اكتب كارت الاشتراك بشكل صحيح (على الأقل 5 أرقام).',
                actionText: 'حسناً',
                actionFn: () => setPopup({ ...popup, show: false })
            })
            return
        }
        setIsActivating(true)
        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(API + '/api/enrollments/activate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code, course_id: courseId })
            });
            let data;
            try {
                data = await res.json();
            } catch (pErr) {
                // Server returned non-JSON (like 500 HTML or empty response)
            }
            setIsActivating(false);

            if (res.ok) {
                setPopup({
                    show: true,
                    type: 'success',
                    title: 'مبروك الدورة!',
                    message: (data && data.message) ? data.message : `تفعلت الدورة بنجاح. هسة تكدر تشوف كل الدروس والمحتوى المغلق بكل حرية! 🎉`,
                    actionText: 'يلا نبدي',
                    actionFn: () => navigate('/dashboard')
                });
                setCode('');
            } else {
                setPopup({
                    show: true,
                    type: 'error',
                    title: 'حدث خطأ',
                    message: (data && data.error) ? data.error : 'حدثت مشكلة أثناء تفعيل الكود، يرجى التأكد من الكود والمحاولة مرة أخرى.',
                    actionText: 'حسناً',
                    actionFn: () => setPopup({ ...popup, show: false })
                });
            }
        } catch (err) {
            setIsActivating(false);
            setPopup({
                show: true,
                type: 'error',
                title: 'خطأ في الاتصال',
                message: 'حدثت مشكلة أثناء الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
                actionText: 'حسناً',
                actionFn: () => setPopup({ ...popup, show: false })
            });
        }
    }

    const playFreeLesson = (lessonId) => {
        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            navigate('/login')
            return
        }
        // Navigate to the real Lesson Viewer but with a '?preview=true' query string
        navigate(`/lesson/${lessonId}?preview=true&course=${courseId}`)
    }

    const cardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
    }

    const tokenForAuthCheck = localStorage.getItem('access_token');
    const isAuthenticated = tokenForAuthCheck && tokenForAuthCheck !== 'undefined' && tokenForAuthCheck !== 'null' && tokenForAuthCheck.trim() !== '';

    return (
        <div className="preview-page">
            {/* Ambient Backgrounds */}
            <div className="preview-mesh">
                <div className={`preview-blob blob-${course.color}-1`}></div>
                <div className={`preview-blob blob-${course.color}-2`}></div>
            </div>

            {/* Smart Navbar */}
            <nav className={`preview-nav ${scrolled ? 'nav-scrolled' : ''}`}>
                <div className="preview-nav-inner">
                    {isAuthenticated ? (
                        <Link to="/dashboard" className="preview-back-btn">
                            <HiOutlineArrowRight />
                            <span>ارجع لغرفتك الدراسية</span>
                        </Link>
                    ) : (
                        <Link to={`/teachers/${course?.teacher}`} className="preview-back-btn">
                            <HiOutlineArrowRight />
                            <span>ارجع لصفحة الأستاذ</span>
                        </Link>
                    )}
                    <div className="preview-nav-title">
                        {scrolled && <motion.h3 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>{course.title}</motion.h3>}
                    </div>
                </div>
            </nav>

            <div className="preview-container">
                {/* Main Content Column */}
                <div className="preview-main-col">

                    {/* Immersive Cinematic Hero Section */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="preview-hero-immersive" style={{ position: 'relative', borderRadius: '32px', overflow: 'hidden', marginBottom: '40px', minHeight: '450px', display: 'flex', alignItems: 'flex-end', padding: '40px', boxShadow: '0 30px 60px rgba(0,0,0,0.15)' }}>
                        {course.hero_image ? (
                            <img src={course.hero_image} alt={course.title} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
                        ) : (
                            <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, var(--${course.color || 'primary'}), #000)`, zIndex: 0 }}></div>
                        )}
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 40%, rgba(15, 23, 42, 0) 100%)', zIndex: 1 }}></div>

                        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '25px', width: '100%' }}>
                            <h1 style={{ color: 'white', fontSize: 'clamp(2rem, 4vw, 3.5rem)', fontWeight: 900, margin: 0, textShadow: '0 4px 25px rgba(0,0,0,0.6)', lineHeight: 1.2 }}>{course.title}</h1>
                            
                            {/* Stylish Glassmorphism Teacher Card */}
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '15px', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(20px)', padding: '10px 30px 10px 10px', borderRadius: '50px', border: '1px solid rgba(255, 255, 255, 0.3)', alignSelf: 'flex-start', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '50%', overflow: 'hidden', border: '3px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.3)' }}>
                                    <img src={course.teacher_image || 'https://via.placeholder.com/150'} alt={course.teacher_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', paddingRight: '5px' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>مقدمة بواسطة</span>
                                    <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{course.teacher_name}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* About Section */}
                    <div className="preview-section fade-in-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="section-title">شنو راح تتعلم بهذي الدورة؟</h2>
                        <p className="preview-about-text">{course.description}</p>
                    </div>

                    {/* Curriculum Section (Free vs Locked Blurred) */}
                    <div className="preview-section fade-in-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="section-title">منهج الدورة</h2>
                        <p className="section-subtitle">هذي كل الوحدات والمحاضرات اللي راح ناخذها بالدورة.</p>

                        <div className="preview-modules-list">
                            {course.modules?.map((mod, mIdx) => (
                                <div key={mod.id} className="preview-module-card" style={{ overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '24px', background: 'white' }}>

                                    {/* Massive Module Banner */}
                                    {mod.cover_image && (
                                        <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                                            <img src={mod.cover_image} alt={mod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                                            <div style={{ position: 'absolute', bottom: '20px', right: '30px', left: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                <div>
                                                    <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{mod.title}</h3>
                                                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', fontWeight: 700 }}>{mod.lessons?.length} دروس • {mod.duration}</span>
                                                </div>
                                                {mod.is_free ? (
                                                    <div style={{ background: '#10B981', color: 'white', padding: '6px 16px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' }}>🎁 وحدة مجانية</div>
                                                ) : (
                                                    <div style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', color: 'white', padding: '6px 16px', borderRadius: '30px', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}><HiOutlineLockClosed /> تحوي محتوى مقفول</div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {!mod.cover_image && (
                                        <div className="p-mod-header">
                                            <div className="p-mod-title-area">
                                                {mod.is_free ? (
                                                    <div className="mod-free-badge">وحدة مجانية 🎁</div>
                                                ) : (
                                                    <div className="mod-locked-badge"><HiOutlineLockClosed /> تحوي محتوى مقفول</div>
                                                )}
                                                <h3>{mod.title}</h3>
                                                <span className="mod-duration">{mod.duration}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Lessons Container */}
                                    <div className="p-mod-lessons" style={{ padding: '10px 20px' }}>
                                        {mod.lessons?.map(lesson => (
                                            <div key={lesson.id} className="p-lesson-row" style={{ opacity: lesson.is_locked ? 0.75 : 1, padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.05)', backgroundColor: lesson.is_locked ? '#fafafa' : 'transparent', borderRadius: '16px', marginBottom: '10px' }}>
                                                <div className="p-lesson-info" style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
                                                    {lesson.cover_image ? (
                                                        <div style={{ position: 'relative', width: '160px', height: '90px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                                            <img src={lesson.cover_image} alt={lesson.title} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: lesson.is_locked ? 'grayscale(80%) blur(1px)' : 'none' }} />
                                                            {lesson.type === 'video' && !lesson.is_locked && (
                                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                                    <HiOutlinePlayCircle style={{ fontSize: '2.5rem', color: 'white', dropShadow: '0 2px 5px rgba(0,0,0,0.5)' }} />
                                                                </div>
                                                            )}
                                                            {lesson.is_locked && (
                                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.4)', color: 'white' }}>
                                                                    <HiOutlineLockClosed style={{ fontSize: '2rem' }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '160px', height: '90px', flexShrink: 0, borderRadius: '12px', background: '#f0f4f8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--purple)', fontSize: '2rem' }}>
                                                            {lesson.type === 'video' ? <HiOutlinePlayCircle /> : <HiOutlineDocumentText />}
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '5px' }}>
                                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>{lesson.title}</h4>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                            <span className="ls-time" style={{ background: lesson.is_locked ? 'rgba(0,0,0,0.05)' : 'rgba(131, 42, 150, 0.1)', color: lesson.is_locked ? 'var(--text-muted)' : 'var(--purple)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <HiOutlineClock /> {lesson.duration || lesson.doc_size}
                                                            </span>
                                                            {lesson.is_locked && (
                                                                <span style={{ color: '#ff4b4b', fontSize: '0.9rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <HiOutlineLockClosed /> غير متاح
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="p-lesson-action" style={{ flexShrink: 0 }}>
                                                    {!lesson.is_locked && lesson.type === 'video' ? (
                                                        <button className="ls-play-btn" onClick={() => playFreeLesson(lesson.id)} style={{ padding: '12px 24px', fontSize: '1.05rem', background: 'var(--primary)', color: 'white', borderRadius: '30px', boxShadow: '0 8px 20px rgba(131, 42, 150, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', border: 'none', cursor: 'pointer' }}>
                                                            <HiOutlinePlayCircle style={{ fontSize: '1.4rem' }} /> مشاهدة الآن
                                                        </button>
                                                    ) : (
                                                        lesson.is_locked && <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><HiOutlineLockClosed /></div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Sidebar Column: Light Premium Activation Card */}
                <div className="preview-sidebar-col">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className={`light-glass-card theme-${course.color}`}
                    >
                        <div className="light-card-header">
                            <div className="lc-teacher-info">
                                <img src={course.teacher_image || 'https://via.placeholder.com/150'} alt={course.teacher_name || 'Teacher'} className="lc-teacher-img" />
                                <div>
                                    <span className="lc-badge">دورة مميزة</span>
                                    <h3>{course.title}</h3>
                                </div>
                            </div>
                            <div className="lc-price-pill">
                                {course.price}
                            </div>
                        </div>

                        <div className="lc-divider"></div>

                        <form onSubmit={handleActivate} className="lc-activation-form">
                            <label className="lc-form-label">عندك كارت اشتراك؟</label>
                            <div className="lc-input-wrap">
                                <HiOutlineCreditCard className="lc-input-icon" />
                                <input
                                    type="text"
                                    placeholder="اكتب كارت الاشتراك المكون من 14 رقم..."
                                    value={code}
                                    onChange={e => setCode(e.target.value.trim())}
                                    disabled={isActivating}
                                    className="lc-input"
                                    maxLength={30}
                                />
                            </div>

                            <button
                                type="submit"
                                className="lc-submit-btn"
                                disabled={isActivating}
                                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', border: 'none', boxShadow: '0 8px 25px rgba(131, 42, 150, 0.4)' }}
                            >
                                {isActivating ? 'دا نتأكد...' : <><HiOutlineSparkles /> فعل الدورة وابدي هسة</>}
                            </button>
                        </form>

                        <div className="lc-features">
                            <div className="lcf-item"><HiOutlineCheckCircle /> تكدر تشوف الدروس بأي وقت وبدون حدود</div>
                            <div className="lcf-item"><HiOutlineCheckCircle /> اختبارات الذكاء الاصطناعي لكل درس</div>
                            <div className="lcf-item"><HiOutlineCheckCircle /> مساعد key للذكاء الاصطناعي</div>
                            <div className="lcf-item"><HiOutlineCheckCircle /> سلايدات لكل درس</div>
                            <div className="lcf-item"><HiOutlineCheckCircle /> والكثير من المزايا الاخرى</div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Unified In-Page Popup Modal */}
            <AnimatePresence>
                {popup.show && (
                    <motion.div
                        className="enroll-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => popup.type !== 'success' && setPopup({ ...popup, show: false })}
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.6)', backdropFilter: 'blur(12px)' }}
                    >
                        <motion.div
                            className="enroll-modal premium-modal"
                            initial={{ opacity: 0, scale: 0.8, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 30 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '420px', width: '90%', textAlign: 'center', padding: '2.5rem', background: '#ffffff', borderRadius: '24px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', border: '1px solid rgba(0,0,0,0.05)', position: 'relative' }}
                        >
                            <div className="modal-glow-bg"></div>
                            <div className="enroll-modal-icon float-anim" style={{ fontSize: '3rem', color: popup.type === 'error' ? '#FF4b4b' : popup.type === 'success' ? '#10B981' : 'var(--primary)', marginBottom: '1rem' }}>
                                {popup.type === 'error' ? <HiOutlineLockClosed /> : popup.type === 'success' ? <HiOutlineCheckCircle /> : <HiOutlineSparkles />}
                            </div>
                            <h3 className="gradient-text" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{popup.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                                {popup.message}
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <button
                                    onClick={popup.actionFn}
                                    className={`dash-btn-primary premium-btn w-full text-center`}
                                    style={{ border: 'none', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: 'white', cursor: 'pointer' }}
                                >
                                    {popup.actionText}
                                </button>
                                {popup.type !== 'success' && (
                                    <button className="dash-btn-secondary premium-btn w-full" onClick={() => setPopup({ ...popup, show: false })}>
                                        إلغاء
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CoursePreview
