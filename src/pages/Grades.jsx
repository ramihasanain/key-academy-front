import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { HiOutlineAcademicCap, HiOutlineUserGroup } from 'react-icons/hi2'
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
    const [branchTeachers, setBranchTeachers] = useState([])
    const [loading, setLoading] = useState(true)

    // Load Teachers based on Grade
    useEffect(() => {
        if (gradeDetail && gradeDetail.title) {
            const cachedT = sessionStorage.getItem('cached_teachers_list')
            const doFilter = (allT) => {
                const filtered = allT.filter(t => t.grade && t.grade.includes(gradeDetail.title))
                setBranchTeachers(filtered)
            }
            if (cachedT) {
                try { doFilter(JSON.parse(cachedT)) } catch(e) {}
            } else {
                fetch(`${API}/api/teachers/`)
                    .then(r => r.json())
                    .then(data => {
                        doFilter(data)
                        sessionStorage.setItem('cached_teachers_list', JSON.stringify(data))
                    }).catch(e => console.error('Teachers load error:', e))
            }
        }
    }, [gradeDetail])

    useEffect(() => {
        setLoading(true)
        if (gradeId) {
            // تنظيف المعرف لاستبدال المسافات بالشرطات (لحماية الـ API من مسافات الروابط الخاطئة)
            const cleanSlug = gradeId.trim().replace(/\s+/g, '-').toLowerCase();
            // جلب تفاصيل صف معين مع المواد
            fetch(`${API_BASE}/content/grades/${cleanSlug}/`)
                .then(res => res.json())
                .then(data => {
                    setGradeDetail(data)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        } else {
            // جلب كل الصفوف ثم تفاصيل كل واحد
            fetch(`${API_BASE}/content/grades/`)
                .then(res => res.json())
                .then(async (gradesList) => {
                    // جلب تفاصيل كل صف مع المواد
                    const detailed = await Promise.all(
                        gradesList.map(g =>
                            fetch(`${API_BASE}/content/grades/${g.slug}/`)
                                .then(r => r.json())
                        )
                    )
                    setGrades(detailed)
                    setLoading(false)
                })
                .catch(() => setLoading(false))
        }
    }, [gradeId])

    // عرض صف واحد مع المواد
    if (gradeId && gradeDetail) {
        if (gradeDetail.detail || !gradeDetail.title) {
            return (
                <div className="page-transition">
                    <section className="grades-hero">
                        <ParticleBackground />
                        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                                <span className="gradient-text">عذراً</span>
                            </motion.h1>
                            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                                لم يتم العثور على هذا الصف! يرجى التأكد من الرابط الصحيح.
                            </motion.p>
                            <Link to="/grades" className="btn-primary" style={{ marginTop: '20px' }}>الرجوع للأساسيات</Link>
                        </div>
                    </section>
                </div>
            )
        }

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
                                        <Link to="/login" className="btn-primary">سجل بالدورة</Link>
                                    </motion.div>
                                ))}
                            </div>
                        )}

                        {/* Teachers for this Branch */}
                        {!loading && branchTeachers.length > 0 && (
                            <motion.div initial="hidden" whileInView="visible" variants={fadeInUp} viewport={{ once: true }} style={{ marginTop: '60px' }}>
                                <div className="grade-header">
                                    <div className="grade-header-icon" style={{ background: 'var(--purple)', color: 'white', borderColor: 'var(--purple)' }}><HiOutlineUserGroup /></div>
                                    <h2>أساتذة {gradeDetail.title}</h2>
                                </div>
                                <div className="subjects-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                    {branchTeachers.map((teacher, i) => (
                                        <motion.div key={teacher.id} className={`glass-card subject-card color-${teacher.color || 'blue'}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33`, display: 'flex', flexDirection: 'column', alignItems: 'center' } : { display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                            <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', marginBottom: '15px', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0 }}>
                                                {teacher.image ? (
                                                    <img src={teacher.image} alt={teacher.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontSize: '1.8rem', fontWeight: 'bold' }}>{teacher.initials}</div>
                                                )}
                                            </div>
                                            <h4 style={{ margin: '0 0 5px', fontSize: '1.3rem' }}>{teacher.name}</h4>
                                            <span style={{ color: 'var(--text-muted)', marginBottom: '20px' }}>{teacher.subject}</span>
                                            <Link to={`/teachers/${teacher.id}`} className="btn-primary" style={{ width: '100%' }}>شوف ملف الأستاذ</Link>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
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
                                        <Link to="/login" className="btn-primary">سجل بالدورة</Link>
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
