import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineBookOpen,
    HiOutlineCheckCircle,
    HiOutlineAcademicCap,
    HiOutlineUser,
    HiOutlineUserGroup,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineSquares2X2,
    HiOutlineChevronDown,
    HiOutlineBars3,
    HiOutlineXMark,
    HiOutlineClock,
    HiOutlineCurrencyDollar,
    HiOutlineKey,
    HiOutlineFire,
    HiOutlineChartBar,
    HiOutlineArrowRight,
    HiOutlineBeaker,
    HiOutlineNoSymbol,
    HiOutlinePencilSquare
} from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import AnimatedCounter from '../components/AnimatedCounter'
import './StudentDashboard.css'



const subjects = ['الكل', 'الرياضيات', 'الفيزياء', 'الكيمياء', 'الأحياء', 'اللغة الانجليزية', 'اللغة العربية', 'اللغة الفرنسية']
const grades = ['الكل', 'السادس العلمي', 'السادس الأدبي', 'السادس العلمي والأدبي', 'الثالث المتوسط']

const StudentDashboard = () => {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('my-courses')
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

    const [userData, setUserData] = useState({ full_name: '', username: '', phone: '', grade: '' })
    const [stats, setStats] = useState({ active_courses: 0, completed_lessons: 0, overall_progress: 0, certificates_count: 0 })
    const [myCourses, setMyCourses] = useState([])
    const [completedCourses, setCompletedCourses] = useState([])
    const [certificates, setCertificates] = useState([])
    const [myNotes, setMyNotes] = useState([])
    const [videoStats, setVideoStats] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || token === 'undefined' || token === 'null') {
            navigate('/login');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        // Fetch User Profile
        fetch(API + '/api/auth/me/', { headers })
            .then(res => {
                if (res.status === 401) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                if (data.role && data.role !== 'student') {
                    if (data.role === 'admin') navigate('/hq');
                    else if (data.role === 'assistant') navigate('/ta');
                } else {
                    setUserData(data);
                }
            })
            .catch(() => {
                localStorage.removeItem('access_token');
                navigate('/login');
            });

        // Fetch Dashboard Stats
        fetch(API + '/api/enrollments/stats/', { headers })
            .then(res => res.json())
            .then(data => setStats(data))
            .catch(console.error);

        // Fetch Enrollments Data
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
            
        // Fetch Video Stats
        fetch(API + '/api/interactions/video-stats/', { headers })
            .then(res => res.json())
            .then(data => setVideoStats(data))
            .catch(console.error);

        fetch(API + '/api/interactions/notes/', { headers })
            .then(res => res.json())
            .then(data => setMyNotes(data))
            .catch(console.error);

        // Fetch browse courses and teachers
        fetch(API + '/api/courses/')
            .then(res => res.json())
            .then(data => {
                setAllCourses(data)
                setLoadingCourses(false)
            })
            .catch(err => {
                console.error(err)
                setLoadingCourses(false)
            })

        fetch(API + '/api/teachers/')
            .then(res => res.json())
            .then(data => setAllTeachers(data))
            .catch(console.error)
    }, [navigate])

    const navItems = [
        { id: 'my-courses', label: 'دوراتي الحالية', icon: <HiOutlineBookOpen /> },
        { id: 'completed', label: 'مخلصها بنجاح', icon: <HiOutlineCheckCircle /> },
        { id: 'certificates', label: 'شهاداتي', icon: <HiOutlineAcademicCap /> },
        { id: 'my-notes', label: 'ملاحظاتي', icon: <HiOutlinePencilSquare /> },
    ]

    const getFilteredCourses = () => {
        return allCourses.filter(c => {
            if (filterTeacher !== 'الكل' && c.teacher_name !== filterTeacher) return false
            if (filterGrade !== 'الكل' && c.grade !== filterGrade && c.grade !== undefined && !c.grade.includes(filterGrade)) return false
            if (filterSubject !== 'الكل' && c.subject !== filterSubject) return false
            return true
        })
    }

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
                    <div className="dash-user-avatar pulse-glow">{userData.full_name ? userData.full_name[0] : 'س'}</div>
                    <div className="dash-user-info">
                        <h4>{userData.full_name || 'ساري العمل...'}</h4>
                        <span className="premium-grade">{userData.grade || 'مرحلة غير محددة'} <HiOutlineCheckCircle /></span>
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
                {userData.muted_until && new Date(userData.muted_until) > new Date() && (
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
                                <h1>هلا بيك {userData.full_name ? userData.full_name.split(' ')[0] : 'نورتنا'}!</h1>
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
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
                        <StatsRow />

                        <div className="section-header-row">
                            <h2 className="dash-section-title">دورات أدرسها هسة <span className="title-badge">مباشر</span></h2>
                        </div>

                        <div className="dash-courses-grid">
                            {myCourses.map((course, i) => (
                                <motion.div key={course.id} className={`dash-course-card premium-card hover-lift ${!course.isActive ? 'grayscale' : ''}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={!course.isActive ? { filter: 'grayscale(0.6)', opacity: 0.8 } : {}}>
                                    <div className={`dash-course-accent accent-${course.color} glow-accent`} style={{ background: course.color?.startsWith('#') ? course.color : undefined, ...(course.color?.startsWith('#') ? { boxShadow: `0 2px 15px ${course.color}` } : {}) }}></div>
                                    <div className="dash-course-body">
                                        <div className="dash-teacher-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                                            <div className={`dash-teacher-avatar ta-${course.color} soft-shadow ${course.teacherAvatar ? 'has-avatar' : ''}`} style={course.color?.startsWith('#') ? { background: course.color, borderColor: course.color, color: 'white' } : {}}>
                                                {course.teacherAvatar ? (
                                                    <img src={course.teacherAvatar} alt={course.teacher} className="teacher-real-avatar" />
                                                ) : (
                                                    course.teacherInitials
                                                )}
                                                <div className="avatar-anim-ring"></div>
                                            </div>
                                            <div className="dash-teacher-meta">
                                                <span className="dash-teacher-name">{course.teacher}</span>
                                                <span className="dash-last-visit"><HiOutlineClock /> آخر زيارة: {course.lastVisit}</span>
                                            </div>
                                        </div>

                                        <h3 className="course-title-glow">{course.title}</h3>

                                        <div className="dash-progress premium-progress">
                                            <div className="dash-progress-header">
                                                <span className="dash-progress-label">نسبة اللي مخلصه</span>
                                                <span className={`dash-progress-pct text-${course.color}`} style={course.color?.startsWith('#') ? { color: course.color } : {}}>{course.progress}%</span>
                                            </div>
                                            <div className="dash-progress-track inner-shadow">
                                                <motion.div className={`dash-progress-fill fill-${course.color} progress-glow`} initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }} style={course.color?.startsWith('#') ? { background: course.color, boxShadow: `0 0 10px ${course.color}` } : {}}></motion.div>
                                            </div>
                                            <span className="dash-progress-lessons"><HiOutlineCheckCircle /> {course.completedLessons} من {course.totalLessons} درس</span>
                                        </div>

                                        {course.isActive ? (
                                            <Link to={`/course/${course.id}`} className={`dash-btn-primary exact-btn-${course.color} premium-btn`} style={course.color?.startsWith('#') ? { background: course.color, borderColor: course.color } : {}}>
                                                <HiOutlineBookOpen /> كمل دراستك
                                            </Link>
                                        ) : (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '12px', borderRadius: '12px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                <HiOutlineNoSymbol style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '4px', fontSize: '1.2rem' }} />
                                                تم إلغاء تفعيل اشتراكك
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ===== COMPLETED ===== */}
                {activeTab === 'completed' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
                        <div className="section-header-row">
                            <h2 className="dash-section-title">دورات مخلصها <span className="title-badge badge-green">بطل</span></h2>
                        </div>
                        <div className="dash-courses-grid">
                            {completedCourses.map((course, i) => (
                                <motion.div key={course.id} className="dash-course-card premium-card completed-card hover-lift" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                    <div className={`dash-course-accent accent-${course.color} glow-accent`} style={{ background: course.color?.startsWith('#') ? course.color : undefined, ...(course.color?.startsWith('#') ? { boxShadow: `0 2px 15px ${course.color}` } : {}) }}></div>
                                    <div className="dash-course-body">
                                        <div className="dash-teacher-row">
                                            <div className={`dash-teacher-avatar ta-${course.color} grayscale ${course.teacherAvatar ? 'has-avatar' : ''}`} style={course.color?.startsWith('#') ? { background: course.color, borderColor: course.color, color: 'white' } : {}}>
                                                {course.teacherAvatar ? (
                                                    <img src={course.teacherAvatar} alt={course.teacher} className="teacher-real-avatar" />
                                                ) : course.teacherInitials}
                                            </div>
                                            <div className="dash-teacher-meta">
                                                <span className="dash-teacher-name">{course.teacher}</span>
                                                <span className="dash-last-visit"><HiOutlineClock /> كملت بيوم: {course.lastVisit}</span>
                                            </div>
                                        </div>
                                        <div className="dash-completed-badge premium-badge-success"><HiOutlineCheckCircle /> كملت الدورة 100% عاشت ايدك</div>
                                        <h3 className="course-title-glow">{course.title}</h3>

                                        <button className="dash-btn-secondary premium-btn mt-4">
                                            راجع الدورة من جديد
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ===== CERTIFICATES ===== */}
                {activeTab === 'certificates' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
                        <div className="section-header-row">
                            <h2 className="dash-section-title">شهاداتك اللي أخذتها 🎓</h2>
                        </div>
                        <div className="dash-courses-grid">
                            {certificates.map((cert, i) => (
                                <motion.div key={cert.id} className="dash-cert-card glass-panel premium-cert hover-lift-rotate" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}>
                                    <div className="cert-backdrop-glow"></div>
                                    <div className="dash-cert-icon floating-icon">🏆</div>
                                    <h3>{cert.title}</h3>
                                    <p className="cert-date">تاريخ الإصدار: {cert.issueDate}</p>
                                    <button className="dash-btn-primary premium-btn gold-btn">نزلها واطبعها</button>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* ===== MY NOTES ===== */}
                {activeTab === 'my-notes' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
                        <div className="section-header-row">
                            <h2 className="dash-section-title">ملاحظاتي السابقة 📝</h2>
                        </div>
                        <div className="dash-courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                            {myNotes.length === 0 ? (
                                <div className="dash-no-results glass-panel" style={{ gridColumn: '1 / -1' }}>
                                    <p>ماكو أي ملاحظات مسجلة للحين.</p>
                                </div>
                            ) : (
                                myNotes.map((note, i) => (
                                    <motion.div key={note.id} className="dash-course-card glass-panel premium-card hover-lift" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: 'var(--primary)', borderRadius: '0 12px 12px 0' }}></div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><HiOutlineClock style={{ display: 'inline', marginBottom: '-2px' }} /> {new Date(note.created_at).toLocaleDateString('ar-IQ')}</span>
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {note.course_title && <span style={{ fontSize: '0.75rem', background: 'rgba(236, 54, 101, 0.1)', color: 'var(--pink)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.course_title}</span>}
                                                {note.module_title && <span style={{ fontSize: '0.75rem', background: 'rgba(253, 186, 1, 0.1)', color: 'var(--orange)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.module_title}</span>}
                                                {note.lesson_title && <span style={{ fontSize: '0.75rem', background: 'rgba(131, 42, 150, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.lesson_title}</span>}
                                            </div>
                                        </div>
                                        <p style={{ margin: 0, lineHeight: '1.6', color: 'var(--text-main)', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }}>{note.content}</p>
                                        {note.lesson_id && (
                                            <Link to={`/lesson/${note.lesson_id}`} className="dash-btn-secondary premium-btn" style={{ marginTop: 'auto', textAlign: 'center', padding: '10px' }}>
                                                رجوع للدرس
                                            </Link>
                                        )}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
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
                                        {allTeachers.map(t => <option key={t.id} value={t.name}>{t.name} - {t.subject}</option>)}
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
                            {getFilteredCourses().map((course, i) => (
                                <BrowseCourseCard key={course.id} course={course} i={i} />
                            ))}
                        </div>
                        {getFilteredCourses().length === 0 && (
                            <div className="dash-no-results glass-panel">
                                <span className="no-res-icon">🔍</span>
                                <p>ما داحصل أي دورة بهذي المواصفات</p>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* ===== PROFILE ===== */}
                {activeTab === 'profile' && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
                        <div className="section-header-row">
                            <h2 className="dash-section-title">إعدادات حسابك ⚙️</h2>
                        </div>
                        <div className="dash-profile-card glass-panel premium-profile">
                            <div className="profile-header-bg"></div>
                            <div className="dash-profile-avatar-lg pulse-glow-strong">
                                {userData.full_name ? userData.full_name[0] : 'س'}
                                <div className="cam-btn"><HiOutlineUser /></div>
                            </div>

                            {/* Read-only notice */}
                            <div style={{
                                background: 'rgba(251, 191, 36, 0.08)',
                                border: '1.5px solid rgba(251, 191, 36, 0.3)',
                                borderRadius: '16px',
                                padding: '16px 20px',
                                marginBottom: '24px',
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '14px',
                                color: '#fbbf24'
                            }}>
                                <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🔒</span>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
                                        لا يمكنك تعديل بياناتك بشكل مباشر
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(251, 191, 36, 0.85)', lineHeight: 1.7 }}>
                                        لتعديل أي معلومة في حسابك، يرجى التواصل مع إدارة المنصة عبر صفحة التواصل أو التلغرام.
                                    </p>
                                </div>
                            </div>

                            <div className="dash-profile-form">
                                <div className="input-row-half">
                                    <div className="dash-input-group glass-input flex-1">
                                        <label>الاسم الكامل</label>
                                        <input type="text" value={userData.full_name || ''} disabled className="disabled-glass" readOnly />
                                    </div>
                                    <div className="dash-input-group glass-input flex-1">
                                        <label>اليوزرنيم (المعرف)</label>
                                        <input type="text" value={userData.username || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                                    </div>
                                </div>
                                <div className="dash-input-group glass-input">
                                    <label>رقم التليفون الأساسي</label>
                                    <input type="tel" value={userData.phone || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                                </div>
                                <div className="dash-input-group glass-input">
                                    <label>المسار الدراسي</label>
                                    <input type="text" value={userData.grade || ''} disabled className="disabled-glass" readOnly />
                                </div>


                            </div>
                        </div>

                        
                        {/* Video Stats Section */}
                        <div className="section-header-row mt-6 pt-6" style={{borderTop: '1px solid rgba(255,255,255,0.1)'}}>
                            <h2 className="dash-section-title">إحصائيات تفاعلات وأسئلة الفيديو 📊</h2>
                        </div>
                        {videoStats && (
                            <div className="dash-profile-card glass-panel premium-profile video-stats-card" style={{marginTop: '20px'}}>
                                <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap'}}>
                                     <div className="hq-stat-card" style={{padding: '20px', borderRadius: '15px', textAlign: 'center', minWidth: '150px', flex: 1, background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)'}}>
                                         <h3 style={{fontSize: '2rem', color: '#38bdf8', margin: '0 0 5px 0', fontWeight: 'bold'}}>{videoStats.total_lessons_watched}</h3>
                                         <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #666)'}}>دروس تم التفاعل مع أسئلتها</p>
                                     </div>
                                     <div className="hq-stat-card" style={{padding: '20px', borderRadius: '15px', textAlign: 'center', minWidth: '150px', flex: 1, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)'}}>
                                         <h3 style={{fontSize: '2rem', color: '#10b981', margin: '0 0 5px 0', fontWeight: 'bold'}}>{videoStats.overall_correct_percentage}%</h3>
                                         <p style={{margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #666)'}}>معدل الإجابات الصحيحة الكلي</p>
                                     </div>
                                </div>
                                <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                                {videoStats.lesson_stats.map((ls, idx) => (
                                    <div key={idx} className="hq-card glass-panel" style={{padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(0,0,0,0.05))'}}>
                                        <h4 style={{fontSize: '1.1rem', color: 'var(--text-primary, #333)', marginBottom: '10px', fontWeight: 'bold'}}>{ls.lesson_title}</h4>
                                        <div style={{display: 'flex', gap: '15px', fontSize: '0.9rem', color: 'var(--text-muted, #666)', paddingBottom: '10px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.05))', marginBottom: '15px', flexWrap: 'wrap'}}>
                                            <span style={{background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#0284c7'}}>المشاهدات: <strong>{ls.total_views}</strong></span>
                                            <span style={{background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#059669'}}>صحيحة: <strong>{ls.correct_answers} / {ls.total_answers}</strong></span>
                                            <span style={{background: (ls.total_answers ? (ls.correct_answers/ls.total_answers >= 0.5 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(0,0,0,0.05)'), padding: '4px 10px', borderRadius: '6px', color: (ls.total_answers ? (ls.correct_answers/ls.total_answers >= 0.5 ? '#059669' : '#dc2626') : 'inherit')}}>
                                                الدقة: <strong>{ls.total_answers ? Math.round((ls.correct_answers/ls.total_answers)*100) : 0}%</strong>
                                            </span>
                                        </div>
                                        <h5 style={{color: 'var(--text-primary, #444)', fontSize: '0.9rem', marginBottom: '10px', fontWeight: '600'}}>آخر جلسات المشاهدة والإجابات:</h5>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
                                            {ls.sessions.map((sess, sidx) => (
                                                <div key={sidx} style={{background: 'var(--bg-secondary, rgba(0,0,0,0.02))', padding: '10px 15px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary, #555)', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', border: '1px solid var(--border-color, rgba(0,0,0,0.02))'}}>
                                                    <span style={{fontWeight: '500'}}>🕒 {new Date(sess.created_at).toLocaleString('ar-IQ')}</span>
                                                    <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                                        <span style={{color: 'var(--text-muted, #777)'}}>الإجابات:</span>
                                                        {sess.answers.map((ans, aidx) => (
                                                            <span key={aidx} style={{padding: '2px 8px', borderRadius: '4px', background: ans.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${ans.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: ans.is_correct ? '#059669' : '#dc2626'}}>
                                                                س{ans.quiz_index + 1}: {ans.is_correct ? '✅' : '❌'}
                                                            </span>
                                                        ))}
                                                        {sess.answers.length === 0 && <span style={{opacity: 0.6, fontStyle: 'italic'}}>انتهت المشاهدة بلا إجابات</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {videoStats.lesson_stats.length === 0 && (
                                    <div style={{textAlign: 'center', padding: '40px 20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px dashed rgba(56, 189, 248, 0.3)'}}>
                                        <p style={{color: '#0284c7', margin: 0, fontSize: '1rem', fontWeight: '500'}}>
                                            لم تقم بمشاهدة أي دروس توفر أسئلة تفاعلية ضمن الفيديو حتى الآن.
                                        </p>
                                        <p style={{color: 'var(--text-muted, #666)', fontSize: '0.85rem', marginTop: '10px'}}>
                                            الإحصائيات الخاصة بك ستظهر هنا فور تفاعلك مع الدروس عبر تطبيق سطح المكتب.
                                        </p>
                                    </div>
                                )}
                                </div>
                            </div>
                        )}
                    </motion.div>
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
