import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { useAuth } from '../contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineBookOpen,
    HiOutlineCheckCircle,
    HiOutlineAcademicCap,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineBars3,
    HiOutlineChartBar,
    HiOutlineClock,
    HiOutlineCurrencyDollar,
    HiOutlineFire,
    HiOutlineNoSymbol,
    HiOutlinePencilSquare,
    HiOutlineArrowRight,
    HiOutlineSquares2X2,
    HiOutlineUser
} from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import AnimatedCounter from '../components/AnimatedCounter'
import TabMyCourses from '../components/DashboardTabs/TabMyCourses'
import TabCompleted from '../components/DashboardTabs/TabCompleted'
import TabCertificates from '../components/DashboardTabs/TabCertificates'
import TabMyNotes from '../components/DashboardTabs/TabMyNotes'
import TabProfile from '../components/DashboardTabs/TabProfile'
import './StudentDashboard.css'



const subjects = ['الكل', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة الانجليزية', 'اللغة العربية', 'اللغة الفرنسية']
const grades = ['الكل', 'السادس العلمي', 'السادس الأدبي', 'السادس العلمي والأدبي', 'الثالث المتوسط']

const StudentDashboard = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTabState] = useState(() => localStorage.getItem('dashboard_tab') || 'my-courses')
    const setActiveTab = (tab) => {
        setActiveTabState(tab);
        localStorage.setItem('dashboard_tab', tab);
    }
    const [sidebarOpen, setSidebarOpen] = useState(false)

    // Browse filters
    const [filterTeacher, setFilterTeacher] = useState('الكل')
    const [filterSubject, setFilterSubject] = useState('الكل')
    const [filterGrade, setFilterGrade] = useState('الكل')

    // Enrollment modal
    const [enrollModal, setEnrollModal] = useState(null)
    const [enrollCode, setEnrollCode] = useState('')
    const [enrollError, setEnrollError] = useState('')
    const [isEnrolling, setIsEnrolling] = useState(false)

    // Real API Data states
    const [allCourses, setAllCourses] = useState([])
    const [allTeachers, setAllTeachers] = useState([])
    const [loadingCourses, setLoadingCourses] = useState(true)

    const { userData, loading: authLoading } = useAuth()

    if (authLoading || !userData) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0f172a', color: 'white', flexDirection: 'column', gap: '20px' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.1)', borderTopColor: '#ec3665', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                <h3 style={{ fontFamily: 'var(--font-ar)', margin: 0 }}>جاري تجهيز لوحتك...</h3>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        )
    }
    const [stats, setStats] = useState({ active_courses: 0, completed_lessons: 0, overall_progress: 0, certificates_count: 0 })
    const [myCourses, setMyCourses] = useState([])
    const [completedCourses, setCompletedCourses] = useState([])
    const [certificates, setCertificates] = useState([])
    const [myNotes, setMyNotes] = useState([])
    const [videoStats, setVideoStats] = useState(null)
    const [fetchedTabs, setFetchedTabs] = useState({})

    // 1. Tab Data Lazy Loading (Only hits APIs when user actually opens the tab)
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || token === 'undefined' || token === 'null') return;
        
        // Skip if this tab has already been fetched
        if (fetchedTabs[activeTab]) return;

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        if (activeTab === 'my-courses') {
            fetch(API + '/api/enrollments/stats/', { headers })
                .then(res => res.json())
                .then(data => setStats(data))
                .catch(console.error);

            fetch(API + '/api/enrollments/my-courses/', { headers })
                .then(res => res.json())
                .then(data => {
                    setMyCourses(data.map(e => ({
                        id: e.course.id,
                        title: e.course.title,
                        desc: e.course.grade,
                        teacher: e.course.teacher_name,
                        teacherInitials: e.course.teacher_initials,
                        teacherAvatar: e.course.teacher_image,
                        progress: e.progress || 0,
                        totalLessons: e.total_lessons || 0,
                        completedLessons: e.completed_lessons || 0,
                        color: e.course.color || 'purple',
                        isActive: e.is_active !== undefined ? e.is_active : true,
                        lastVisit: new Date(e.last_visited).toLocaleDateString('ar-IQ', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                        })
                    })));
                }).catch(console.error);
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

        else if (activeTab === 'completed') {
            fetch(API + '/api/enrollments/completed/', { headers })
                .then(res => res.json())
                .then(data => {
                    setCompletedCourses(data.map(e => ({
                        id: e.course.id,
                        title: e.course.title,
                        teacher: e.course.teacher_name,
                        teacherInitials: e.course.teacher_initials,
                        teacherAvatar: e.course.teacher_image,
                        color: e.course.color || 'purple',
                        date: new Date(e.completed_at || e.enrolled_at).toLocaleDateString('ar-IQ'),
                        lastVisit: 'مكتملة'
                    })));
                }).catch(console.error);
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

        else if (activeTab === 'certificates') {
            fetch(API + '/api/enrollments/certificates/', { headers })
                .then(res => res.json())
                .then(data => {
                    setCertificates(data.map(c => ({
                        id: c.id,
                        title: c.title,
                        issueDate: new Date(c.issue_date).toLocaleDateString('ar-IQ'),
                        file: c.pdf_file
                    })));
                }).catch(console.error);
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

        else if (activeTab === 'my-notes') {
            fetch(API + '/api/interactions/notes/', { headers })
                .then(res => res.json())
                .then(data => setMyNotes(data))
                .catch(console.error);
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

        else if (activeTab === 'profile') {
            fetch(API + '/api/interactions/video-stats/', { headers })
                .then(res => res.json())
                .then(data => setVideoStats(data))
                .catch(console.error);
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

        else if (activeTab === 'browse-courses') {
            fetch(API + '/api/teachers/')
                .then(res => res.json())
                .then(data => setAllTeachers(data))
                .catch(console.error)
                
            setFetchedTabs(prev => ({ ...prev, [activeTab]: true }));
        }

    }, [activeTab, fetchedTabs]);

    useEffect(() => {
        if (activeTab === 'browse-courses') {
            setLoadingCourses(true);
            let url = API + '/api/courses/?limit=20'; // Fetch 20 max to avoid explosion
            if (filterTeacher !== 'الكل') url += `&teacher=${filterTeacher}`;
            if (filterSubject !== 'الكل') url += `&subject=${encodeURIComponent(filterSubject)}`;
            if (filterGrade !== 'الكل') url += `&grade=${encodeURIComponent(filterGrade)}`;
            
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    setAllCourses(data);
                    setLoadingCourses(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoadingCourses(false);
                });
        }
    }, [activeTab, filterTeacher, filterSubject, filterGrade]);

    const navItems = [
        { id: 'my-courses', label: 'دوراتي الحالية', icon: <HiOutlineBookOpen /> },
        { id: 'completed', label: 'مخلصها بنجاح', icon: <HiOutlineCheckCircle /> },
        { id: 'certificates', label: 'شهاداتي', icon: <HiOutlineAcademicCap /> },
        { id: 'my-notes', label: 'ملاحظاتي', icon: <HiOutlinePencilSquare /> },
    ]

    const handleEnroll = async () => {
        if (!enrollCode.trim()) {
            setEnrollError('يرجى إدخال كود التفعيل');
            return;
        }
        if (isEnrolling) return;
        setEnrollError('');
        setIsEnrolling(true);

        try {
            const token = localStorage.getItem('access_token');
            const res = await fetch(API + '/api/enrollments/activate/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: enrollCode })
            });
            const data = await res.json();
            setIsEnrolling(false);

            if (res.ok) {
                alert(data.message || `تم التسجيل في الدورة بنجاح! 🎉`);
                setEnrollModal(null);
                setEnrollCode('');
                // Refresh my courses after enrollment
                window.location.reload();
            } else {
                setEnrollError(data.error || 'رسالة خطأ غير متوقعة');
            }
        } catch (err) {
            setIsEnrolling(false);
            setEnrollError('فشل الاتصال بالخادم');
        }
    }

    const BrowseCourseCard = ({ course, i }) => {
        // Evaluate as enrolled ONLY if it's active in myCourses, or if it's explicitly completed
        const isEnrolled = myCourses.some(c => c.id === course.id && c.isActive !== false) || completedCourses.some(c => c.id === course.id);

        return (
            <motion.div
                className={`dash-course-card premium-card hover-glow ${isEnrolled ? 'enrolled-dimmed' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 100 }}
                style={isEnrolled ? { opacity: 0.85, filter: 'grayscale(60%)', border: '1px solid rgba(16, 185, 129, 0.3)' } : {}}
            >
                <div className={`dash-course-accent accent-${course.color}`} style={{ background: course.color?.startsWith('#') ? course.color : undefined }}></div>

                {isEnrolled && (
                    <div style={{ position: 'absolute', top: '15px', right: '15px', background: '#10B981', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', zIndex: 10, boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' }}>
                        <HiOutlineCheckCircle /> مسجل فيها
                    </div>
                )}

                <div className="dash-course-body" style={{ position: 'relative' }}>
                    <div className="dash-teacher-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                        <div className={`dash-teacher-avatar ta-${course.color} ${course.teacher_image ? 'has-avatar' : ''}`} style={{ marginBottom: '8px', ...(course.color?.startsWith('#') ? { background: course.color, borderColor: course.color, color: 'white' } : {}) }}>
                            {course.teacher_image ? (
                                <img src={course.teacher_image} alt={course.teacher_name} className="teacher-real-avatar" />
                            ) : (
                                course.teacher_initials
                            )}
                            {!isEnrolled && <div className="avatar-glow"></div>}
                        </div>
                        <div className="dash-teacher-meta">
                            <span className="dash-teacher-name" style={{ textAlign: 'center' }}>{course.teacher_name}</span>
                        </div>
                    </div>
                    <h3 style={{ textAlign: 'center' }}>{course.title}</h3>

                    <div className="dash-course-meta-row">
                        <span className="dash-lessons-count"><HiOutlineBookOpen /> {course.lessons_count || 0} درس</span>
                        <span className="dash-price"><HiOutlineCurrencyDollar /> {course.price}</span>
                    </div>

                    {isEnrolled ? (
                        <Link to={`/course/${course.id}`} className={`premium-btn`} style={{ textDecoration: 'none', background: '#f1f5f9', color: '#1e293b', border: '1px solid #cbd5e1' }}>
                            <HiOutlineBookOpen /> كمل دراستك
                        </Link>
                    ) : (
                        <Link to={`/course-preview/${course.id}`} className={`premium-btn exact-btn-${course.color}`} style={{ textDecoration: 'none', ...(course.color?.startsWith('#') ? { background: course.color, borderColor: course.color } : {}) }}>
                            <HiOutlineArrowRight /> شوف تفاصيل الدورة
                        </Link>
                    )}
                </div>
            </motion.div>
        )
    }

    // Ultra Premium Stats Row
    const StatsRow = () => (
        <div className="dash-stats-row">
            <motion.div className="dash-stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <div className="dash-stat-icon icon-orange"><HiOutlineBookOpen /></div>
                <div className="dash-stat-info">
                    <p>دورات تقراها هسة</p>
                    <h3><AnimatedCounter to={stats.active_courses} /> دورات</h3>
                </div>
            </motion.div>
            <motion.div className="dash-stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <div className="dash-stat-icon icon-purple"><HiOutlineFire /></div>
                <div className="dash-stat-info">
                    <p>دروس مخلصها</p>
                    <h3><AnimatedCounter to={stats.completed_lessons} /> درس</h3>
                </div>
            </motion.div>
            <motion.div className="dash-stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div className="dash-stat-icon icon-pink"><HiOutlineChartBar /></div>
                <div className="dash-stat-info">
                    <p>نسبة الإنجاز</p>
                    <h3><AnimatedCounter to={stats.overall_progress} />%</h3>
                </div>
            </motion.div>
            <motion.div className="dash-stat-card glass-panel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <div className="dash-stat-icon icon-green"><HiOutlineAcademicCap /></div>
                <div className="dash-stat-info">
                    <p>الشهادات</p>
                    <h3><AnimatedCounter to={stats.certificates_count} /> شهادة</h3>
                </div>
            </motion.div>
        </div>
    )

    return (
        <div className="dash-page ultra-premium">
            <ParticleBackground />

            {/* Ambient Lighting Orbs */}
            <div className="orb-ambient orb-1"></div>
            <div className="orb-ambient orb-2"></div>
            <div className="orb-ambient orb-3"></div>

            {/* Mobile Header */}
            <header className="dash-mobile-header glass-panel">
                <button className="dash-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
                    <HiOutlineBars3 />
                </button>
                <img src="/new-logo.png" alt="Key Academy" className="dash-mobile-logo" />
            </header>

            {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)}></div>}

            {/* Sidebar */}
            <aside className={`dash-sidebar glass-panel-strong ${sidebarOpen ? 'open' : ''}`}>
                <div className="dash-sidebar-logo">
                    <img src="/new-logo.png" alt="Key Academy" />
                </div>

                <div className="dash-user-card premium-user-card">
                    <div className="dash-user-avatar pulse-glow">{userData?.full_name ? userData.full_name[0] : 'س'}</div>
                    <div className="dash-user-info">
                        <h4>{userData?.full_name || 'جاري التحميل...'}</h4>
                        <span className="premium-grade">{userData?.grade || 'مرحلة غير محددة'} <HiOutlineCheckCircle /></span>
                    </div>
                </div>

                <nav className="dash-nav">
                    {navItems.map(item => (
                        <button key={item.id} className={`dash-nav-btn neon-hover ${activeTab === item.id ? 'active' : ''}`} onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}>
                            <div className="nav-icon-wrapper">{item.icon}</div>
                            <span>{item.label}</span>
                            {activeTab === item.id && <motion.div className="active-indicator" layoutId="active-nav" />}
                        </button>
                    ))}

                    <button className={`dash-nav-btn neon-hover ${activeTab === 'browse-courses' ? 'active' : ''}`} onClick={() => { setActiveTab('browse-courses'); setSidebarOpen(false) }}>
                        <div className="nav-icon-wrapper"><HiOutlineSquares2X2 /></div>
                        <span>اكتشف مواد جديدة</span>
                        {activeTab === 'browse-courses' && <motion.div className="active-indicator" layoutId="active-nav" />}
                    </button>



                    <button className={`dash-nav-btn neon-hover ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setSidebarOpen(false) }}>
                        <div className="nav-icon-wrapper"><HiOutlineUser /></div>
                        <span>الملف الشخصي</span>
                        {activeTab === 'profile' && <motion.div className="active-indicator" layoutId="active-nav" />}
                    </button>
                </nav>

                <div className="dash-sidebar-footer">
                    <button
                        onClick={() => {
                            localStorage.removeItem('access_token');
                            localStorage.removeItem('refresh_token');
                            localStorage.removeItem('user');
                            window.location.href = '/';
                        }}
                        className="dash-logout-btn hover-danger"
                        style={{ width: '100%', border: 'none', cursor: 'pointer' }}
                    >
                        <HiOutlineArrowLeftOnRectangle /> <span>تسجيل الخروج</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dash-main">
                {/* Mute Notification Banner */}
                {userData?.muted_until && new Date(userData.muted_until) > new Date() && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'rgba(239, 68, 68, 0.08)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            borderRadius: '16px',
                            padding: '16px 20px',
                            marginBottom: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            color: '#ef4444'
                        }}
                    >
                        <div style={{ fontSize: '24px', display: 'flex', alignItems: 'center' }}><HiOutlineNoSymbol /></div>
                        <div>
                            <h4 style={{ margin: 0, fontWeight: '800', fontSize: '16px' }}>أنت محظور من التفاعل مؤقتاً 🚫</h4>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'rgba(239, 68, 68, 0.9)', lineHeight: '1.6' }}>
                                حسابك مقيد حالياً من الدردشة والتعليقات حتى تاريخ <b>{new Date(userData.muted_until).toLocaleString('ar-IQ')}</b>.
                                إذا تعتقد أن هناك خطأ أو تريد فك القيد، يرجى التواصل مع مساعد المادة أو إدارة المنصة.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Welcome Banner - Top */}

                {['my-courses', 'completed', 'certificates', 'my-notes', 'profile'].includes(activeTab) && (
                    <motion.div
                        className="welcome-3d-banner"
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, type: 'spring' }}
                        style={{ background: 'var(--gradient-brand)' }}
                    >
                        <div className="banner-glow-bg"></div>
                        <div className="banner-content">
                            <div className="banner-text">
                                <h1>هلا بيك {userData?.full_name ? userData.full_name.split(' ')[0] : 'يا بطل'}! <span className="wave-emoji">👋</span></h1>
                                <p>استمر بتركيزك وكمل دراستك حتى تحقق اللي تريده.</p>
                            </div>
                            <div className="banner-3d-element">
                                <div className="floating-cap"><HiOutlineAcademicCap /></div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ===== MY COURSES ===== */}
                {activeTab === 'my-courses' && (
                    <TabMyCourses myCourses={myCourses} stats={stats} StatsRow={StatsRow} />
                )}

                {/* ===== COMPLETED ===== */}
                {activeTab === 'completed' && (
                    <TabCompleted completedCourses={completedCourses} />
                )}

                {/* ===== CERTIFICATES ===== */}
                {activeTab === 'certificates' && (
                    <TabCertificates certificates={certificates} />
                )}

                {/* ===== MY NOTES ===== */}
                {activeTab === 'my-notes' && (
                    <TabMyNotes myNotes={myNotes} />
                )}

                {/* ===== BROWSE BY TEACHER/SUBJECT ===== */}
                {activeTab === 'browse-courses' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content browse-view">

                        <div className="browse-hero-banner glass-panel">
                            <h2>دور على الدروس اللي تحتاجها 🔭</h2>
                            <p>اختار الأستاذ والمادة اللي تناسبك وفعل كارت التفعيل مالتك</p>

                            <div className="dash-filters premium-filters">
                                <div className="dash-filter-group">
                                    <label>تفلتر حسب الأستاذ</label>
                                    <select className="glass-select" value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)}>
                                        <option value="الكل">كل الأساتذة</option>
                                        {allTeachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                </div>
                                <div className="dash-filter-group">
                                    <label>تفلتر حسب المادة</label>
                                    <select className="glass-select" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                                        {subjects.map(s => <option key={s} value={s}>{s === 'الكل' ? 'كل المواد' : s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="dash-courses-grid mt-4">
                            {allCourses.map((course, i) => (
                                <BrowseCourseCard key={course.id} course={course} i={i} />
                            ))}
                        </div>
                        {allCourses.length === 0 && !loadingCourses && (
                            <div className="dash-no-results glass-panel">
                                <span className="no-res-icon">🔍</span>
                                <p>ما داحصل أي دورة بهذي المواصفات</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ===== PROFILE ===== */}
                {activeTab === 'profile' && (
                    <TabProfile videoStats={videoStats} />
                )}
            </main>

            {/* ===== PREMIUM ENROLLMENT MODAL ===== */}
            <AnimatePresence>
                {enrollModal && (
                    <motion.div className="enroll-modal-overlay glass-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEnrollModal(null)}>
                        <motion.div className="enroll-modal premium-modal" initial={{ opacity: 0, scale: 0.8, rotateX: 20 }} animate={{ opacity: 1, scale: 1, rotateX: 0 }} exit={{ opacity: 0, scale: 0.8, rotateX: -20 }} transition={{ type: 'spring', damping: 20 }} onClick={e => e.stopPropagation()}>
                            <div className="modal-glow-bg"></div>
                            <button className="enroll-modal-close hover-rotate" onClick={() => setEnrollModal(null)}>
                                <HiOutlineXMark />
                            </button>
                            <div className="enroll-modal-icon float-anim">
                                <HiOutlineKey />
                            </div>
                            <h3 className="gradient-text">فعل كارت الاشتراك</h3>

                            <div className="modal-course-card">
                                <p className="enroll-modal-course">{enrollModal.title}</p>
                                <p className="enroll-modal-teacher">مع {enrollModal.teacher}</p>
                                <div className="modal-price-tag">
                                    <span>السعر:</span>
                                    <strong>{enrollModal.price} د.ع</strong>
                                </div>
                            </div>

                            <div className="enroll-code-input ultra-input">
                                <label>اكتب الكود اللي مكتوب بالكارت</label>
                                <div className="code-field-wrapper">
                                    <input type="text" placeholder="XXXX - XXXX - XXXX - XXXX" value={enrollCode} onChange={e => setEnrollCode(e.target.value.trim())} dir="ltr" autoFocus />
                                    <div className="scan-line"></div>
                                </div>
                                <AnimatePresence>
                                    {enrollError && <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="enroll-error pulse-text">{enrollError}</motion.span>}
                                </AnimatePresence>
                            </div>
                            <button className={`dash-btn-primary exact-btn-${enrollModal.color} premium-btn w-full mt-4`} onClick={handleEnroll} style={enrollModal.color?.startsWith('#') ? { background: enrollModal.color, borderColor: enrollModal.color } : {}}>
                                <HiOutlineCheckCircle /> فعل الدورة هسة
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default StudentDashboard
