import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineAcademicCap,
    HiOutlineBeaker,
    HiOutlineSparkles,
    HiOutlineCalculator,
    HiOutlineBolt,
    HiOutlineLanguage,
    HiOutlineCubeTransparent,
    HiOutlineBookOpen,
    HiOutlineGlobeAlt,
    HiOutlineMapPin,
    HiOutlineBanknotes,
    HiOutlineScale,
    HiOutlineHeart,
    HiOutlineCommandLine,
} from 'react-icons/hi2'
import { FaMosque, FaDna, FaPenNib } from 'react-icons/fa'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'
import './Grades.css'

const API_BASE = API + '/api'
const pendingGradeRequests = new Map()

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

const ClearEiffelTowerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" height="1.2em" width="1.2em" style={{ transform: 'translateY(2px)' }}>
        <path d="M12 2v2" />
        <path d="M10 4h4" />
        <path d="M11 4L10 10" />
        <path d="M13 4L14 10" />
        <path d="M9 10h6" />
        <path d="M10 10L8 16" />
        <path d="M14 10L16 16" />
        <path d="M7 16h10" />
        <path d="M8 16L5 22" />
        <path d="M16 16L19 22" />
        <path d="M8 22c0-3.5 1.5-5 4-5s4 1.5 4 5" />
    </svg>
)

// Map by icon_class OR subject name (name takes priority if icon_class empty)
const iconByClass = {
    'math':  <HiOutlineCalculator />,
    'phys':  <HiOutlineBolt />,
    'chem':  <HiOutlineBeaker />,
    'bio':   <FaDna />,
    'eng':   <HiOutlineLanguage />,
    'arab':  <FaPenNib />,
    'islam': <FaMosque />,
    'hist':  <HiOutlineMapPin />,
    'geo':   <HiOutlineGlobeAlt />,
    'econ':  <HiOutlineBanknotes />,
    'phil':  <HiOutlineScale />,
    'french': <ClearEiffelTowerIcon />,
    'socio': <HiOutlineHeart />,
    'comp':  <HiOutlineCommandLine />,
}

const iconByName = {
    'الرياضيات':          <HiOutlineCalculator />,
    'الفيزياء':           <HiOutlineBolt />,
    'الكيمياء':           <HiOutlineBeaker />,
    'الأحياء':            <FaDna />,
    'علم الأحياء':        <FaDna />,
    'اللغة الانجليزية':   <HiOutlineLanguage />,
    'اللغة الإنجليزية':   <HiOutlineLanguage />,
    'اللغة العربية':      <FaPenNib />,
    'التربية الإسلامية':  <FaMosque />,
    'الإسلامية':          <FaMosque />,
    'التاريخ':            <HiOutlineMapPin />,
    'الجغرافية':          <HiOutlineGlobeAlt />,
    'الاقتصاد':           <HiOutlineBanknotes />,
    'الفلسفة':            <HiOutlineScale />,
    'اللغة الفرنسية':     <ClearEiffelTowerIcon />,
    'الفرنسية':           <ClearEiffelTowerIcon />,
    'علم الاجتماع':       <HiOutlineHeart />,
    'الحاسوب':            <HiOutlineCommandLine />,
}

const getSubjectIcon = (subject) => {
    if (subject.icon_class && iconByClass[subject.icon_class]) {
        return iconByClass[subject.icon_class]
    }
    return iconByName[subject.name] || <HiOutlineBookOpen />
}

const colorClasses = ['color-blue', 'color-pink', 'color-orange', 'color-purple', 'color-green', 'color-teal']


const safeFetchJson = (url) =>
    pendingGradeRequests.get(url) ||
    (() => {
        const request = fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const ct = res.headers.get('content-type') || ''
                if (!ct.includes('application/json')) throw new Error('Not JSON')
                return res.json()
            })
            .finally(() => {
                pendingGradeRequests.delete(url)
            })
        pendingGradeRequests.set(url, request)
        return request
    })()

const getSlugFromRoute = (routeGradeId) => {
    if (!routeGradeId) return null
    const lowered = routeGradeId.toLowerCase()
    if (lowered === 'grade-6' || lowered.includes('sixth')) return 'grade-6'
    if (lowered === 'grade-3' || lowered.includes('third')) return 'grade-3'
    return lowered.startsWith('grade-') ? lowered : null
}

const subjectInBranch = (subject, branchName) => {
    if (!branchName || branchName === 'all') return true

    if (subject.branch) {
        return subject.branch === branchName || subject.branch.includes(branchName)
    }

    if (Array.isArray(subject.branches)) {
        return subject.branches.some(b => b?.name === branchName || b?.name?.includes(branchName))
    }

    return true
}

// Detect branch from a grade's subjects or branch field
const getBranches = (data) => {
    const branches = new Set()
    if (data.branch) {
        // if a grade itself has a branch label
        branches.add(data.branch)
    }
    if (Array.isArray(data.subjects)) {
        data.subjects.forEach(s => {
            if (s.branch) branches.add(s.branch)
        })
    }
    return [...branches]
}

const Grades = () => {
    const { gradeId } = useParams()
    const [grades, setGrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState({}) // { [gradeSlug]: 'علمي' | 'أدبي' | 'all' }

    useEffect(() => {
        const selectedSlug = getSlugFromRoute(gradeId)

        setLoading(true)
        setApiError(false)

        const fetchData = selectedSlug
            ? safeFetchJson(`${API_BASE}/content/grades/${selectedSlug}/`)
                .then((gradeData) => [gradeData])
            : safeFetchJson(`${API_BASE}/content/grades/`)
                .then(async (gradesList) => {
                    if (!Array.isArray(gradesList)) return []
                    const detailed = await Promise.all(
                        gradesList.map(g =>
                            safeFetchJson(`${API_BASE}/content/grades/${g.slug}/`).catch(() => null)
                        )
                    )
                    return detailed.filter(d => d && !d.error)
                })

        fetchData
            .then((valid) => {
                if (valid.length > 0) {
                    setGrades(valid)
                } else {
                    setGrades([])
                }
                setLoading(false)
            })
            .catch(() => {
                setApiError(true)
                setLoading(false)
            })
    }, [gradeId])


    const toggleBranch = (slug, branch) => {
        setSelectedBranch(prev => ({ ...prev, [slug]: branch }))
    }

    const hasBranches = (data) => {
        if (!Array.isArray(data.subjects)) return false
        return data.subjects.some((s) => {
            if (s.branch) {
                return s.branch.includes('علمي') || s.branch.includes('أدبي')
            }
            return Array.isArray(s.branches) && s.branches.some(b => b?.name?.includes('علمي') || b?.name?.includes('أدبي'))
        })
    }

    return (
        <div className="page-transition">
            <section className="grades-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="gradient-text">الصفوف</span> الدراسية
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        اختار صفك والفرع المناسب حتى تبدي رحلتك الدراسية
                    </motion.p>
                </div>
            </section>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    جاري تحميل الصفوف...
                </div>
            ) : apiError && grades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
                    <p>تعذّر الاتصال بالخادم، يرجى المحاولة مجدداً لاحقاً.</p>
                </div>
            ) : grades.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                    لا تتوفر صفوف حالياً.
                </div>
            ) : (
                (() => {
                    const gradesToRender = grades.filter(data => {
                        if (!gradeId) return true
                        const expectedSlug = getSlugFromRoute(gradeId)
                        return expectedSlug ? data.slug === expectedSlug : data.slug === gradeId
                    });

                    if (gradesToRender.length === 0) {
                        return (
                            <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                                لا يتوفر صف يطابق الرابط.
                            </div>
                        );
                    }

                    return gradesToRender.map((data) => {
                        const withBranches = hasBranches(data)
                        const routeBranch = gradeId?.includes('scientific') ? 'علمي' : gradeId?.includes('literary') ? 'أدبي' : null;
                        const currentBranch = selectedBranch[data.slug] || routeBranch || 'all'
                        const filteredSubjects = data.subjects ? data.subjects.filter(s => {
                            return subjectInBranch(s, currentBranch)
                        }) : [];

                        const getTeachersLink = (subject) => {
                            const gradeName = data.slug?.includes('sixth') || data.grade_name?.includes('سادس') ? 'السادس'
                                : data.slug?.includes('third') || data.grade_name?.includes('ثالث') ? 'الثالث'
                                : 'all'
                            return `/teachers?subject=${encodeURIComponent(subject.name)}&grade=${gradeName}&branch=${currentBranch}`
                        };

                        return (
                            <section key={data.slug} className="section grade-section">
                            <div className="container">
                                <div className="grade-header">
                                    <div className="grade-header-icon"><HiOutlineAcademicCap /></div>
                                    <h2>{data.grade_name || data.title}</h2>
                                </div>

                                {/* Branch Tabs */}
                                {withBranches && (
                                    <div className="branch-tabs">
                                        {['all', 'علمي', 'أدبي'].map(b => (
                                            <motion.button
                                                key={b}
                                                className={`branch-tab-btn ${currentBranch === b ? 'active' : ''}`}
                                                onClick={() => toggleBranch(data.slug, b)}
                                                whileHover={{ scale: 1.04 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {b === 'all' ? (
                                                    <><HiOutlineSparkles /> الكل</>
                                                ) : b === 'علمي' ? (
                                                    <><HiOutlineBeaker /> الفرع العلمي</>
                                                ) : (
                                                    <><HiOutlineBookOpen /> الفرع الأدبي</>
                                                )}
                                            </motion.button>
                                        ))}
                                    </div>
                                )}

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={`${data.slug}-${currentBranch}`}
                                        className="subjects-grid"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {filteredSubjects.length > 0 ? filteredSubjects.map((subject, i) => (
                                            <motion.div
                                                key={subject.id || i}
                                                className={`glass-card subject-card ${colorClasses[i % 6]}`}
                                                variants={fadeInUp}
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                custom={i}
                                            >
                                                <div className="s-icon">
                                                    {getSubjectIcon(subject)}
                                                </div>
                                                <h4>{subject.name}</h4>
                                                <span className="course-count">{subject.courses_count || 0} دورات متاحة</span>
                                                <Link
                                                    to={getTeachersLink(subject)}
                                                    className="btn-primary"
                                                >
                                                    شوف الأساتذة
                                                </Link>
                                            </motion.div>
                                        )) : (
                                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                                                لا توجد مواد لهذا الفرع حالياً.
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </section>
                    )
                })
            })()
            )}
        </div>
    )
}

export default Grades
