import { useState, useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineArrowRight,
    HiOutlinePlayCircle,
    HiOutlineCheckCircle,
    HiOutlineLockClosed,
    HiOutlineDocumentText,
    HiOutlineChevronDown,
    HiOutlineArrowDownTray,
    HiOutlineDocumentDuplicate,
    HiOutlineFolderOpen,
    HiOutlineClock,
    HiOutlineBeaker,
    HiOutlineClipboardDocumentCheck,
    HiOutlineXMark,
    HiOutlineDocumentArrowDown
} from 'react-icons/hi2'
import { VirtualLabsData } from '../data/VirtualLabsData'
import './CourseViewer.css'

const CourseViewer = () => {
    const { courseId } = useParams()
    const [courseData, setCourseData] = useState(null)
    const [loading, setLoading] = useState(true)

    const [activeTab, setActiveTab] = useState('lessons') // 'lessons', 'documents', 'ministerial'
    const [expandedModule, setExpandedModule] = useState(null)
    const [expandedDocModule, setExpandedDocModule] = useState(null)
    const [scrolled, setScrolled] = useState(false)
    const [showLoginPrompt, setShowLoginPrompt] = useState(false)
    const [viewedDoc, setViewedDoc] = useState(null) // State for Secure PDF Viewer

    useEffect(() => {
        // Fetch real data from backend
        fetch(`${API}/api/courses/${courseId || 1}/`)
            .then(res => res.json())
            .then(data => {
                setCourseData(data)

                // Set default expanded modules based on the fetched data
                if (data.modules && data.modules.length > 0) {
                    setExpandedModule(data.modules[0].id)
                    setExpandedDocModule(data.modules[0].id)
                }
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [courseId])

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navigate = useNavigate()

    const toggleModule = (id) => {
        setExpandedModule(expandedModule === id ? null : id)
    }

    const toggleDocModule = (id) => {
        setExpandedDocModule(expandedDocModule === id ? null : id)
    }

    const handleLessonClick = (lesson) => {
        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            navigate('/login')
            return
        }
        if (!lesson.isLocked) {
            navigate(`/lesson/${lesson.id}?course=${courseId}`)
        } else {
            alert(`هذا الدرس مقفول هسة، لازم تكمل الدروس اللي قبله بالبداية.`)
        }
    }

    const handleViewDoc = (e, url, name) => {
        if (e) e.stopPropagation()
        if (url) {
            setViewedDoc({ url, name })
        } else {
            alert(`سيتم إضافة ${name} قريباً ⏳`)
        }
    }

    if (loading || !courseData) {
        return <div className="cv-master-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}><h2 style={{ color: 'white' }}>جاري تحضير غرفتك الدراسية...</h2></div>
    }

    return (
        <div className="cv-master-page">
            {/* Animated Mesh Background */}
            <div className="cv-mesh-bg">
                <div className="mesh-blob mesh-blob-1"></div>
                <div className="mesh-blob mesh-blob-2"></div>
                <div className="mesh-blob mesh-blob-3"></div>
                <div className="mesh-blob mesh-blob-4"></div>
            </div>

            {/* Smart Navbar */}
            <nav className={`cv-top-nav ${scrolled ? 'scrolled-nav' : ''}`}>
                <div className="cv-nav-container">
                    <Link to="/dashboard" className="cv-back-link">
                        <div className="cv-back-icon-circle"><HiOutlineArrowRight /></div>
                        <span>غرفتك الدراسية</span>
                    </Link>
                    <div className="cv-nav-logo">
                        <img src="/new-logo.png" alt="Key Academy" />
                    </div>
                    {/* Placeholder for symmetry */}
                    <div className="cv-nav-spacer"></div>
                </div>
            </nav>

            <main className="cv-content-wrapper">

                {/* 🌟 ULTRA PREMIUM HERO SECTION 🌟 */}
                <section className="cv-hero-section">
                    <div className="cv-hero-glass-card">
                        <div className="cv-hero-image-container">
                            <img src={courseData.hero_image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb'} alt={courseData.title} className="cv-hero-img" />
                            <div className="cv-hero-img-overlay"></div>
                            <div className="cv-hero-badge">دورة مميزة 🌟</div>
                        </div>

                        <div className="cv-hero-info">
                            <div className="cv-teacher-pill">
                                <img src={courseData.teacher?.image || "https://i.pravatar.cc/150?img=11"} alt={courseData.teacher?.name} className="cv-teacher-avatar-small" />
                                <span>شرح الأستاذ <strong>{courseData.teacher?.name || courseData.teacher}</strong></span>
                            </div>

                            <h1 className="cv-hero-main-title">{courseData.title}</h1>

                            <div className="cv-hero-stats">
                                <div className="cv-stat-item">
                                    <HiOutlineDocumentText className="stat-icon" />
                                    <div className="stat-texts">
                                        <span className="stat-val">{courseData.modules?.length || 0}</span>
                                        <span className="stat-lbl">وحدات دراسية</span>
                                    </div>
                                </div>
                                <div className="cv-stat-item">
                                    <HiOutlinePlayCircle className="stat-icon text-pink" />
                                    <div className="stat-texts">
                                        <span className="stat-val">{courseData.lessons_count || 0}</span>
                                        <span className="stat-lbl">درس فيديو</span>
                                    </div>
                                </div>
                                <div className="cv-stat-item progress-stat">
                                    <div className="cv-circular-progress" style={{ background: `conic-gradient(var(--purple) ${courseData.progress ?? 0}%, #e2e8f0 0)` }}>
                                        <div className="cv-circular-inner">{courseData.progress ?? 0}%</div>
                                    </div>
                                    <span className="stat-lbl">اللي مخلصه</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 🌟 FLOATING SEGMENTED TABS 🌟 */}
                <div className="cv-floating-tabs-container">
                    <div className="cv-segmented-control">
                        {[
                            { id: 'lessons', label: 'المنهج والدروس', icon: <HiOutlinePlayCircle /> },
                            { id: 'documents', label: 'ملازم وملخصات', icon: <HiOutlineDocumentText /> },
                            { id: 'ministerial', label: 'أسئلة وزارية', icon: <HiOutlineDocumentDuplicate /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`cv-segment-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <span className="seg-icon">{tab.icon}</span>
                                <span className="seg-label">{tab.label}</span>
                                {activeTab === tab.id && <motion.div layoutId="seg-indicator" className="seg-indicator" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 🌟 CONTENT AREA 🌟 */}
                <div className="cv-dynamic-content">
                    <AnimatePresence mode="wait">

                        {/* 1. TIMELINE SYLLABUS (المنهج والوحدات) */}
                        {activeTab === 'lessons' && (
                            <motion.div
                                key="lessons-tab"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.4, type: 'spring' }}
                                className="cv-timeline-container"
                            >
                                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                                    <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', marginBottom: '10px' }}>منهج الدورة</h2>
                                    <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 600 }}>هذي كل الوحدات والمحاضرات اللي راح ناخذها بالدورة.</p>
                                </div>

                                {courseData.modules?.map((mod, index) => (
                                    <div key={mod.id} style={{ background: 'white', borderRadius: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.04)', overflow: 'hidden', marginBottom: '30px' }}>
                                        {/* Module Header */}
                                        {mod.cover_image ? (
                                            <div style={{ position: 'relative', width: '100%', height: '220px' }}>
                                                <img src={mod.cover_image} alt={mod.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
                                                <div style={{ position: 'absolute', bottom: '20px', right: '30px', left: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                                    <div>
                                                        <h3 style={{ color: 'white', fontSize: '1.8rem', fontWeight: 900, marginBottom: '8px', textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>{mod.title}</h3>
                                                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '1.05rem', fontWeight: 700 }}>{mod.lessons?.length || 0} دروس • {mod.duration || 'غير محدد'}</span>
                                                    </div>
                                                    {mod.weekly_exam && (
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/student/exam/${mod.weekly_exam.id}`); }}
                                                            style={{ padding: '8px 16px', background: 'rgba(255, 193, 7, 0.9)', color: '#000', borderRadius: '12px', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255, 193, 7, 0.3)' }}
                                                        >
                                                            <HiOutlineClipboardDocumentCheck style={{ fontSize: '1.2rem' }} /> الامتحان الأسبوعي
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <div style={{ padding: '30px', textAlign: 'center', borderBottom: '1px solid rgba(0,0,0,0.04)', position: 'relative' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                                    <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#0f172a', margin: '4px 0' }}>{mod.title}</h3>
                                                    <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 700 }}>{mod.lessons?.length || 0} دروس • {mod.duration || 'غير محدد'}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Lessons List */}
                                        <div style={{ padding: '15px 30px' }}>
                                            {mod.lessons?.map(lesson => {
                                                const isComp = lesson.is_completed;
                                                return (
                                                    <div
                                                        key={lesson.id}
                                                        className="cv-new-lesson-row hover-lift-subtle"
                                                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', margin: '15px 0', background: 'rgba(255,255,255,1)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', cursor: 'pointer', transition: 'all 0.3s' }}
                                                        onClick={() => handleLessonClick({ ...lesson, isLocked: false })}
                                                    >
                                                        {/* Right Icon Block / Image */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexGrow: 1 }}>
                                                            {lesson.cover_image ? (
                                                                <div style={{ position: 'relative', width: '160px', height: '90px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                                                                    <img src={lesson.cover_image} alt={lesson.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    {lesson.type === 'video' && (
                                                                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                                                                            <HiOutlinePlayCircle style={{ fontSize: '2.5rem', color: 'white', dropShadow: '0 2px 5px rgba(0,0,0,0.5)' }} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div style={{ width: '120px', height: '80px', borderRadius: '12px', background: 'rgba(131, 42, 150, 0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'var(--purple)', fontSize: '2rem', flexShrink: 0 }}>
                                                                    {lesson.type === 'video' ? <HiOutlinePlayCircle /> : <HiOutlineDocumentText />}
                                                                </div>
                                                            )}

                                                            {/* Center Info */}
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
                                                                <h4 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', margin: '0' }}>{lesson.title}</h4>
                                                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', background: 'rgba(131, 42, 150, 0.08)', color: 'var(--purple)', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800 }}>
                                                                    <HiOutlineClock style={{ fontSize: '1.1rem' }} /> {lesson.duration || (lesson.type === 'video' ? '30:00' : 'مستند')}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Left Action */}
                                                        <div style={{ flexShrink: 0, marginRight: '20px' }}>
                                                            <button style={{ padding: '12px 24px', borderRadius: '30px', background: isComp ? '#10B981' : '#1d4ed8', color: 'white', border: 'none', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', boxShadow: isComp ? '0 8px 20px rgba(16, 185, 129, 0.3)' : '0 8px 25px rgba(29, 78, 216, 0.3)', transition: 'all 0.3s', whiteSpace: 'nowrap' }}>
                                                                {isComp ? 'مكتمل' : 'تشغيل الدرس'} {isComp ? <HiOutlineCheckCircle style={{ fontSize: '1.4rem' }} /> : <HiOutlinePlayCircle style={{ fontSize: '1.4rem' }} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {/* 2. DOCUMENTS SECTIONS */}
                        {activeTab === 'documents' && (
                            <motion.div
                                key="documents-tab"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="cv-super-glass cv-huge-padding cv-docs-view"
                            >
                                <div className="cv-docs-top-banner">
                                    <div className="cv-docs-banner-text">
                                        <h2>ملازم ومستندات الدورة</h2>
                                        <p>تكدر تتصفح وتقرأ كل الملازم والملخصات مباشرة من داخل المنصة وبدون تحميل.</p>
                                    </div>
                                    <button className="cv-btn-massive-gradient" onClick={(e) => handleViewDoc(e, null, 'ملازم المادة كاملة')}>
                                        <HiOutlineDocumentText className="massive-icon" />
                                        <span>تصفح كل الملازم</span>
                                    </button>
                                </div>

                                <div className="cv-docs-hierarchy">
                                    {courseData.modules?.map(mod => {
                                        const isExpanded = expandedDocModule === mod.id;
                                        return (
                                            <div key={`doc-${mod.id}`} className="cv-doc-folder">
                                                <div className="cv-folder-header" onClick={() => toggleDocModule(mod.id)}>
                                                    <div className="cv-folder-title">
                                                        <div className="cv-folder-icon"><HiOutlineFolderOpen /></div>
                                                        <h3>{mod.title}</h3>
                                                    </div>
                                                    <div className="cv-folder-right">
                                                        <button className="cv-btn-sleek" onClick={(e) => handleViewDoc(e, null, `ملزمة ${mod.title}`)}>
                                                            عرض ملزمة الوحدة
                                                        </button>
                                                        <HiOutlineChevronDown className={`cv-chev-icon ${isExpanded ? 'rotated' : ''}`} />
                                                    </div>
                                                </div>

                                                <AnimatePresence>
                                                    {isExpanded && (
                                                        <motion.div className="cv-folder-contents" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                                            {mod.lessons?.map(lesson => (
                                                                <div key={`doc-l-${lesson.id}`} className="cv-file-row">
                                                                    <div className="cv-file-info">
                                                                        <div className="cv-file-icon"><HiOutlineDocumentArrowDown /></div>
                                                                        <div className="cv-file-texts">
                                                                            <h4>{lesson.title}</h4>
                                                                            <span>ملف PDF • الحجم: {lesson.doc_size || '1.5MB'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <button className="cv-btn-download-circle" title="عرض الملف" onClick={(e) => handleViewDoc(e, lesson.doc_file, lesson.title)}>
                                                                        <HiOutlineDocumentText />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}

                        {/* 3. MINISTERIAL QUESTIONS */}
                        {activeTab === 'ministerial' && (
                            <motion.div
                                key="ministerial-tab"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="cv-min-grid"
                            >
                                {courseData.ministerial_docs && courseData.ministerial_docs.length > 0 ? (
                                    courseData.ministerial_docs.map((doc, idx) => (
                                        <motion.div
                                            key={doc.id || idx}
                                            className="cv-min-card-premium cv-super-glass"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <div className="cv-min-card-top">
                                                <img src="https://cdn-icons-png.flaticon.com/512/3143/3143460.png" alt="PDF" className="cv-pdf-icon" />
                                                <span className="cv-min-size">{doc.size || '3.5 MB'}</span>
                                            </div>
                                            <h3 className="cv-min-title">{doc.title}</h3>
                                            <p className="cv-min-desc">أسئلة وزارية كاملة وية الأجوبة النموذجية مالتها بصيغة {doc.doc_type || 'PDF'}.</p>

                                            <button className="cv-btn-min-download" onClick={(e) => handleViewDoc(e, doc.file, doc.title)}>
                                                <HiOutlineDocumentText /> تصفح الأسئلة
                                            </button>
                                        </motion.div>
                                    ))
                                ) : (
                                    <p style={{ color: 'white', textAlign: 'center', width: '100%', gridColumn: '1 / -1' }}>لا توجد ملفات وزارية متاحة حالياً.</p>
                                )}
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>

            {/* Premium Login Prompt Modal */}
            <AnimatePresence>
                {showLoginPrompt && (
                    <motion.div
                        style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLoginPrompt(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 30 }}
                            transition={{ type: 'spring', damping: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ maxWidth: '420px', width: '90%', textAlign: 'center', padding: '2.5rem 2rem', background: 'rgba(30,30,50,0.95)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🔐</div>
                            <h3 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '0.5rem' }}>سجل دخولك أول!</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                                لازم يكون عندك حساب بالمنصة حتى تكدر تدخل الدروس وتستفاد من كل المحتوى التعليمي والمختبرات التفاعلية.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <Link to="/login" style={{ display: 'block', padding: '12px 24px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', color: '#fff', borderRadius: '12px', textDecoration: 'none', fontWeight: 'bold', fontSize: '1rem' }}>
                                    تسجيل الدخول
                                </Link>
                                <button onClick={() => setShowLoginPrompt(false)} style={{ padding: '12px 24px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: '0.9rem' }}>
                                    بعدين
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Secure PDF Viewer Modal */}
            <AnimatePresence>
                {viewedDoc && (
                    <motion.div
                        style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setViewedDoc(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            onClick={e => e.stopPropagation()}
                            style={{ width: '95%', height: '95%', maxWidth: '1200px', background: '#fff', borderRadius: '20px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                        >
                            <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <HiOutlineDocumentText size={22} style={{ color: 'var(--purple-light)' }} />
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{viewedDoc.name || 'مستند الدورة'}</h3>
                                </div>
                                <button onClick={() => setViewedDoc(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '50%', transition: 'background 0.3s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                                    <HiOutlineXMark size={24} />
                                </button>
                            </div>
                            <div style={{ flex: 1, position: 'relative', backgroundColor: '#e2e8f0' }} onContextMenu={(e) => e.preventDefault()}>
                                <iframe 
                                    src={`${viewedDoc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                    style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                    title={viewedDoc.name}
                                />
                                {/* Security Overlay to prevent right-click interactions where possible */}
                                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }}></div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CourseViewer
