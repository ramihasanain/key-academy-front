import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineChevronRight } from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './Grades.css'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}

const SubjectTeachers = () => {
    const { gradeId, subjectName } = useParams()
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [gradeTitle, setGradeTitle] = useState('')

    useEffect(() => {
        // Fetch grade details to get the proper Arabic title
        const cleanSlug = gradeId.trim().replace(/\s+/g, '-').toLowerCase()
        fetch(`${API}/api/content/grades/${cleanSlug}/`)
            .then(res => res.json())
            .then(data => setGradeTitle(data.title || data.grade_name || gradeId))
            .catch(() => setGradeTitle(gradeId))
    }, [gradeId])

    useEffect(() => {
        setLoading(true)
        const fetchTeachers = () => {
            const cachedT = sessionStorage.getItem('cached_teachers_list')
            const applyFilter = (data) => {
                const filtered = data.filter(t => 
                    // Matches subject name loosely
                    (t.subject && t.subject.includes(subjectName)) &&
                    // Matches grade slug roughly or if not applicable we show all for subject
                    (t.grade && (gradeTitle ? t.grade.includes(gradeTitle.split(' ')[0]) : true))
                )
                setTeachers(filtered)
                setLoading(false)
            }

            if (cachedT) {
                try { applyFilter(JSON.parse(cachedT)) } catch(e) {}
            } else {
                fetch(`${API}/api/teachers/`)
                    .then(res => res.json())
                    .then(data => {
                        applyFilter(data)
                        sessionStorage.setItem('cached_teachers_list', JSON.stringify(data))
                    })
                    .catch(err => {
                        console.error('Error fetching teachers:', err)
                        setLoading(false)
                    })
            }
        }
        
        // Wait a small tick if gradeTitle is still loading to ensure accurate filtering
        if (gradeTitle) {
            fetchTeachers()
        }
    }, [subjectName, gradeTitle])

    return (
        <div className="page-transition">
            <section className="grades-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    
                    <Link to={`/grades/${gradeId}`} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', background: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                        <HiOutlineChevronRight /> رجوع إلى المواد
                    </Link>

                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        أساتذة <span className="gradient-text">{subjectName}</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        أقوى كادر تدريسي لمادة {subjectName} في {gradeTitle}
                    </motion.p>
                </div>
            </section>

            <section className="section grade-section">
                <div className="container">
                    <div className="grade-header">
                        <div className="grade-header-icon" style={{ background: 'var(--blue)' }}><HiOutlineUserGroup /></div>
                        <h2>{teachers.length > 0 ? "اختر الأستاذ" : "الأساتذة"}</h2>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>جاري البحث عن الأساتذة...</div>
                    ) : teachers.length > 0 ? (
                        <div className="subjects-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                            {teachers.map((teacher, i) => (
                                <motion.div key={teacher.id} className={`glass-card subject-card color-${teacher.color || 'blue'}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33`, display: 'flex', flexDirection: 'column', alignItems: 'center' } : { display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    
                                    <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', marginBottom: '15px', border: '3px solid rgba(255,255,255,0.2)', flexShrink: 0, background: 'var(--bg-glass)' }}>
                                        {teacher.image ? (
                                            <img src={teacher.image} alt={teacher.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary)', color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>{teacher.initials}</div>
                                        )}
                                    </div>
                                    
                                    <h4 style={{ margin: '0 0 5px', fontSize: '1.4rem' }}>{teacher.name}</h4>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)', marginBottom: '20px', fontSize: '0.9rem' }}>
                                        <HiOutlineBookOpen /> {teacher.courses_count || 0} دورات متاحة
                                    </div>
                                    
                                    <Link to={`/teachers/${teacher.id}`} className="btn-primary" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>
                                        تصفح دورات الأستاذ
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)', background: 'var(--bg-glass)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <HiOutlineUserGroup style={{ fontSize: '4rem', color: 'var(--primary)', marginBottom: '15px', opacity: 0.5 }} />
                            <h3>لا يوجد أساتذة متاحين حالياً</h3>
                            <p>لم يتم تسجيل أساتذة لمادة {subjectName} في هذا الفرع بعد.</p>
                            <Link to={`/grades/${gradeId}`} className="btn-secondary" style={{ marginTop: '20px' }}>الرجوع للخلف</Link>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}

export default SubjectTeachers
