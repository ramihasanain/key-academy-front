import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { HiOutlineAcademicCap } from 'react-icons/hi2'
import { FaFlask, FaCalculator, FaBook, FaGlobeAmericas, FaMosque, FaAtom, FaLeaf, FaBalanceScale, FaLandmark, FaMoneyBill } from 'react-icons/fa'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'
import './Grades.css'

const API_BASE = API + '/api'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

// ربط أيقونة لكل مادة بناءً على icon_class
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

const Grades = () => {
    const { gradeId } = useParams()
    const [grades, setGrades] = useState([])
    const [gradeDetail, setGradeDetail] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (gradeId) {
            setLoading(true)
            // جلب تفاصيل صف معين مع المواد
            const cacheKey = `cached_grade_detail_${gradeId}`
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
                try {
                    setGradeDetail(JSON.parse(cached))
                    setLoading(false)
                } catch (e) {}
            }

            fetch(`${API_BASE}/content/grades/${gradeId}/`)
                .then(res => res.json())
                .then(data => {
                    setGradeDetail(data)
                    sessionStorage.setItem(cacheKey, JSON.stringify(data))
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        } else {
            // جلب كل الصفوف ثم تفاصيل كل واحد
            const cacheKey = 'cached_detailed_grades_list'
            const cached = sessionStorage.getItem(cacheKey)
            if (cached) {
                try {
                    setGrades(JSON.parse(cached))
                    setLoading(false)
                } catch (e) {}
            } else {
                setLoading(true)
            }

            fetch(`${API_BASE}/content/grades/`)
                .then(res => res.json())
                .then(async (gradesList) => {
                    // Cache the basic list for use in Navbar and Home
                    sessionStorage.setItem('cached_basic_grades_list', JSON.stringify(gradesList))
                    
                    // جلب تفاصيل كل صف مع المواد
                    const detailed = await Promise.all(
                        gradesList.map(g =>
                            fetch(`${API_BASE}/content/grades/${g.slug}/`)
                                .then(r => r.json())
                        )
                    )
                    setGrades(detailed)
                    sessionStorage.setItem(cacheKey, JSON.stringify(detailed))
                    setLoading(false)
                })
                .catch(() => {
                    if (!cached) setLoading(false)
                })
        }
    }, [gradeId])

    // عرض صف واحد مع المواد
    if (gradeId && gradeDetail) {
        return (
            <div className="page-transition">
                <section className="grades-hero">
                    <ParticleBackground />
                    <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                        <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                            <span className="gradient-text">{gradeDetail.grade_name}</span>
                        </motion.h1>
                        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                            {gradeDetail.branch} - اختار المادة وابدي ويانا درب التفوق
                        </motion.p>
                    </div>
                </section>

                <section className="section grade-section">
                    <div className="container">
                        <div className="grade-header">
                            <div className="grade-header-icon"><HiOutlineAcademicCap /></div>
                            <h2>{gradeDetail.title}</h2>
                        </div>
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>جاري التحميل...</div>
                        ) : (
                            <div className="subjects-grid">
                                {(gradeDetail.subjects || []).map((subject, i) => (
                                    <motion.div key={subject.id || i} className={`glass-card subject-card ${colorClasses[i % 6]}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                        <div className={`s-icon ${subject.icon_class}`}>{iconMap[subject.icon_class] || <FaBook />}</div>
                                        <h4>{subject.name}</h4>
                                        <span className="course-count">{subject.courses_count} دورات متاحة</span>
                                        <Link to={`/teachers?subject=${encodeURIComponent(subject.name)}&grade=${gradeId && gradeId.includes('sixth') ? 'السادس' : (gradeId && gradeId.includes('third') ? 'الثالث' : 'all')}&branch=${gradeId && gradeId.includes('scientific') ? 'علمي' : (gradeId && gradeId.includes('literary') ? 'أدبي' : 'all')}`} className="btn-primary">شوف الأساتذة</Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>
            </div>
        )
    }

    // عرض كل الصفوف
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
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-muted)', fontSize: '1.1rem' }}>جاري تحميل الصفوف...</div>
            ) : (
                grades.map((data) => (
                    <section key={data.slug} className="section grade-section">
                        <div className="container">
                            <div className="grade-header">
                                <div className="grade-header-icon"><HiOutlineAcademicCap /></div>
                                <h2>{data.title}</h2>
                            </div>
                            <div className="subjects-grid">
                                {(data.subjects || []).map((subject, i) => (
                                    <motion.div key={subject.id || i} className={`glass-card subject-card ${colorClasses[i % 6]}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                        <div className={`s-icon ${subject.icon_class}`}>{iconMap[subject.icon_class] || <FaBook />}</div>
                                        <h4>{subject.name}</h4>
                                        <span className="course-count">{subject.courses_count} دورات متاحة</span>
                                        <Link to={`/teachers?subject=${encodeURIComponent(subject.name)}&grade=${data.slug && data.slug.includes('sixth') ? 'السادس' : (data.slug && data.slug.includes('third') ? 'الثالث' : 'all')}&branch=${data.slug && data.slug.includes('scientific') ? 'علمي' : (data.slug && data.slug.includes('literary') ? 'أدبي' : 'all')}`} className="btn-primary">شوف الأساتذة</Link>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </section>
                ))
            )}
        </div>
    )
}

export default Grades
