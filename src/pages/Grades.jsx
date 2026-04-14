import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineAcademicCap, HiOutlineBeaker, HiOutlineSparkles } from 'react-icons/hi2'
import { FaFlask, FaCalculator, FaBook, FaGlobeAmericas, FaMosque, FaAtom, FaLeaf, FaBalanceScale, FaLandmark, FaMoneyBill } from 'react-icons/fa'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'
import './Grades.css'

const API_BASE = API + '/api'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

const iconMap = {
    'math': <FaCalculator />,
    'phys': <FaAtom />,
    'chem': <FaFlask />,
    'bio': <FaLeaf />,
    'eng': <FaGlobeAmericas />,
    'arab': <FaBook />,
    'islam': <FaMosque />,
    'hist': <FaLandmark />,
    'geo': <FaGlobeAmericas />,
    'econ': <FaMoneyBill />,
    'phil': <FaBalanceScale />,
}

const colorClasses = ['color-blue', 'color-pink', 'color-orange', 'color-purple', 'color-green', 'color-teal']

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
    const [grades, setGrades] = useState([])
    const [loading, setLoading] = useState(true)
    const [apiError, setApiError] = useState(false)
    const [selectedBranch, setSelectedBranch] = useState({}) // { [gradeSlug]: 'علمي' | 'أدبي' | 'all' }

    useEffect(() => {
        const cacheKey = 'cached_detailed_grades_list'
        const cached = sessionStorage.getItem(cacheKey)
        if (cached) {
            try {
                const parsed = JSON.parse(cached)
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setGrades(parsed)
                    setLoading(false)
                }
            } catch (e) {}
        }

        const safeFetchJson = (url) =>
            fetch(url)
                .then(res => {
                    if (!res.ok) throw new Error(`HTTP ${res.status}`)
                    const ct = res.headers.get('content-type') || ''
                    if (!ct.includes('application/json')) throw new Error('Not JSON')
                    return res.json()
                })

        safeFetchJson(`${API_BASE}/content/grades/`)
            .then(async (gradesList) => {
                if (!Array.isArray(gradesList)) {
                    setLoading(false)
                    return
                }
                sessionStorage.setItem('cached_basic_grades_list', JSON.stringify(gradesList))
                const detailed = await Promise.all(
                    gradesList.map(g =>
                        safeFetchJson(`${API_BASE}/content/grades/${g.slug}/`)
                            .catch(() => null)
                    )
                )
                const valid = detailed.filter(d => d && !d.error)
                if (valid.length > 0) {
                    setGrades(valid)
                    sessionStorage.setItem(cacheKey, JSON.stringify(valid))
                }
                setLoading(false)
            })
            .catch(() => {
                if (!sessionStorage.getItem('cached_detailed_grades_list')) {
                    setApiError(true)
                }
                setLoading(false)
            })
    }, [])


    const toggleBranch = (slug, branch) => {
        setSelectedBranch(prev => ({ ...prev, [slug]: branch }))
    }

    // Filter subjects by branch if grade has branches
    const getFilteredSubjects = (data) => {
        const branch = selectedBranch[data.slug] || 'all'
        if (!data.subjects) return []
        if (branch === 'all') return data.subjects
        return data.subjects.filter(s => !s.branch || s.branch === branch || s.branch.includes(branch))
    }

    const hasBranches = (data) => {
        if (!data.subjects) return false
        return data.subjects.some(s => s.branch && (s.branch.includes('علمي') || s.branch.includes('أدبي')))
    }

    const buildTeachersLink = (subject, data) => {
        const branch = selectedBranch[data.slug] || 'all'
        const gradeName = data.slug?.includes('sixth') || data.grade_name?.includes('سادس') ? 'السادس'
            : data.slug?.includes('third') || data.grade_name?.includes('ثالث') ? 'الثالث'
            : 'all'
        return `/teachers?subject=${encodeURIComponent(subject.name)}&grade=${gradeName}&branch=${branch}`
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
                grades.map((data) => {
                    const withBranches = hasBranches(data)
                    const currentBranch = selectedBranch[data.slug] || 'all'
                    const filteredSubjects = getFilteredSubjects(data)

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
                                                    <><FaBook /> الفرع الأدبي</>
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
                                                <div className={`s-icon ${subject.icon_class}`}>
                                                    {iconMap[subject.icon_class] || <FaBook />}
                                                </div>
                                                <h4>{subject.name}</h4>
                                                <span className="course-count">{subject.courses_count || 0} دورات متاحة</span>
                                                <Link
                                                    to={buildTeachersLink(subject, data)}
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
            )}
        </div>
    )
}

export default Grades
