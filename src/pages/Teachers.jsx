import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { FaStar, FaDna, FaPenNib, FaGlobeEurope } from 'react-icons/fa'
import {
    HiOutlineSquares2X2,
    HiOutlineCalculator,
    HiOutlineBeaker,
    HiOutlineLanguage,
    HiOutlineBookOpen,
    HiOutlineBolt,
    HiOutlineCubeTransparent,
    HiOutlineMap,
    HiOutlineGlobeAlt,
    HiOutlineChevronLeft,
    HiOutlineChevronRight
} from 'react-icons/hi2'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'
import './Teachers.css'

const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } })
}



const Teachers = () => {
    const [searchParams] = useSearchParams()
    const [allTeachers, setAllTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ 
        grade: searchParams.get('grade') || 'all', 
        branch: searchParams.get('branch') || 'all', 
        subject: searchParams.get('subject') || 'all' 
    })

    useEffect(() => {
        const cachedTeachers = sessionStorage.getItem('cached_teachers_list');
        if (cachedTeachers) {
            try { 
                setAllTeachers(JSON.parse(cachedTeachers));
                setLoading(false); // Instant load!
            } catch(e) {}
        }

        fetch(API + '/api/teachers/')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch')
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setAllTeachers(data);
                    setLoading(false);
                    sessionStorage.setItem('cached_teachers_list', JSON.stringify(data));
                }
            })
            .catch(err => {
                console.error('Error fetching teachers:', err);
                if (!sessionStorage.getItem('cached_teachers_list')) setLoading(false);
            })
    }, [])

    const filtered = allTeachers.filter(t => {
        if (filter.grade !== 'all' && !t.grade.includes(filter.grade)) return false
        if (filter.branch !== 'all' && t.branch && !t.branch.includes(filter.branch)) return false
        if (filter.subject !== 'all' && t.subject && !t.subject.includes(filter.subject)) return false
        return true
    })

    const scrollContainerRef = useRef(null)

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            // RTL scroll direction mapping: 'left' goes towards negative scrollLeft (visual left)
            const scrollAmount = direction === 'left' ? -250 : 250
            scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
        }
    }

    const subjectsList = [
        { id: 'all', name: 'الكل', icon: <HiOutlineSquares2X2 /> },
        { id: 'الرياضيات', name: 'الرياضيات', icon: <HiOutlineCalculator /> },
        { id: 'الفيزياء', name: 'الفيزياء', icon: <HiOutlineBolt /> },
        { id: 'الكيمياء', name: 'الكيمياء', icon: <HiOutlineBeaker /> },
        { id: 'اللغة الانجليزية', name: 'الانجليزية', icon: <HiOutlineLanguage /> },
        { id: 'الأحياء', name: 'الأحياء', icon: <FaDna /> },
        { id: 'اللغة العربية', name: 'العربية', icon: <FaPenNib /> },
        { id: 'اللغة الفرنسية', name: 'الفرنسية', icon: <FaGlobeEurope /> },
    ];

    return (
        <div className="page-transition">
            <section className="teachers-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="gradient-text">الأساتذة</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        وفرنالك نخبة أساتذة العراق بمكان واحد
                    </motion.p>
                </div>
            </section>

            <section className="section teachers-page-section">
                <div className="container">

                    <div className="subjects-filter-wrapper">
                        <button className="scroll-arrow right-arrow" onClick={() => scroll('right')}>
                            <HiOutlineChevronRight />
                        </button>

                        <div className="subjects-filter-container" ref={scrollContainerRef}>
                            {subjectsList.map((sub, i) => (
                                <motion.button
                                    key={sub.id}
                                    className={`subject-filter-btn ${filter.subject === sub.id ? 'active' : ''}`}
                                    onClick={() => setFilter(f => ({ ...f, subject: sub.id }))}
                                    variants={fadeInUp} initial="hidden" animate="visible" custom={i}
                                >
                                    <span className="s-icon">{sub.icon}</span>
                                    <span className="s-text">{sub.name}</span>
                                </motion.button>
                            ))}
                        </div>

                        <button className="scroll-arrow left-arrow" onClick={() => scroll('left')}>
                            <HiOutlineChevronLeft />
                        </button>
                    </div>

                    <div className="teachers-layout">
                        <aside className="glass-card teachers-filter color-blue">
                            <div className="filter-group">
                                <h4>الصف</h4>
                                {[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'السادس', label: 'السادس الإعدادي' },
                                    { value: 'الثالث', label: 'الثالث المتوسط' },
                                ].map(opt => (
                                    <label key={opt.value}>
                                        <input type="radio" name="grade" checked={filter.grade === opt.value} onChange={() => setFilter(f => ({ ...f, grade: opt.value }))} />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                            <div className="filter-group">
                                <h4>الفرع</h4>
                                {[
                                    { value: 'all', label: 'الكل' },
                                    { value: 'علمي', label: 'العلمي' },
                                    { value: 'أدبي', label: 'الأدبي' },
                                ].map(opt => (
                                    <label key={opt.value}>
                                        <input type="radio" name="branch" checked={filter.branch === opt.value} onChange={() => setFilter(f => ({ ...f, branch: opt.value }))} />
                                        {opt.label}
                                    </label>
                                ))}
                            </div>
                        </aside>

                        <div className="teachers-grid">
                            {loading ? (
                                <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>جاري تحميل قائمة الأساتذة...</div>
                            ) : filtered.length > 0 ? filtered.map((teacher, i) => {
                                const fallbackColors = ['blue', 'pink', 'orange', 'purple', 'green', 'teal'];
                                const colorValue = teacher.color || fallbackColors[i % fallbackColors.length];
                                
                                return (
                                <motion.div key={teacher.id} className={`glass-card teacher-page-card color-${colorValue}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} style={colorValue?.startsWith('#') ? { background: colorValue, borderColor: 'transparent', boxShadow: `0 10px 30px ${colorValue}33` } : {}}>
                                    <div className="teacher-avatar">
                                        {teacher.image ? (
                                            <img src={teacher.image} alt={teacher.name} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div className="teacher-avatar-placeholder" style={{ borderRadius: 0 }}>{teacher.initials || 'أ'}</div>
                                        )}
                                    </div>
                                    <div className="teacher-info">
                                        <h4>{teacher.name}</h4>
                                        <div className="t-subject">{teacher.subject}</div>
                                        <div className="t-grade" style={{ marginBottom: '20px' }}>{teacher.grade}</div>
                                        <Link to={`/teachers/${teacher.id}`} className="btn-primary" style={{ marginTop: 'auto' }}>شوف ملف الأستاذ</Link>
                                    </div>
                                </motion.div>
                            )}) : (
                                <div style={{ gridColumn: '1 / -1', padding: '100px 0', textAlign: 'center', color: 'var(--text-muted)' }}>لا يتوفر أساتذة لهذا التصنيف حالياً.</div>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Teachers
