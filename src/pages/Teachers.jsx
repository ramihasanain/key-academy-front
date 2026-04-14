import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { FaStar } from 'react-icons/fa'
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

const EiffelTowerIcon = () => (
    <svg viewBox="0 0 512 512" fill="currentColor" height="1.1em" width="1.1em" style={{ transform: 'translateY(1px)' }} xmlns="http://www.w3.org/2000/svg">
        <path d="M344.2 384h-44.5c-4.4-23.7-16-46.8-31.2-64h-25c-15.1 17.2-26.7 40.3-31.2 64h-44.5c5.3-35.8 21.6-67.4 46.8-87.1l-14-68.5c-6.8-33.1 3-64.4 20-83.3V44.8c0-15.3 12.4-27.8 27.8-27.8 15.3 0 27.8 12.4 27.8 27.8v100.2c16.9 18.9 26.8 50.2 20 83.3l-14 68.5c25.2 19.7 41.5 51.3 46.8 87.1z M256 182.9c-11.8 0-19.1 16.3-21.7 39.5l10.9 53.6h21.6l10.9-53.6c-2.6-23.2-9.9-39.5-21.7-39.5z M256 22.2c-12.5 0-22.6 10.1-22.6 22.6v94.5c4-3.5 12.6-7.8 22.6-7.8s18.6 4.3 22.6 7.8V44.8c0-12.5-10.1-22.6-22.6-22.6z M381.7 448h-74.8c7.3 20.2 11.2 41.8 11.2 64h44.5c0-43.5 11.1-71.1 19.1-85.5zm-176.6 0h-74.8c7.9 14.4 19.1 42 19.1 85.5h44.5c0-22.2 3.9-43.8 11.2-64zm82.8 0h-63.8c-2.4 21.4-8.8 45.4-29.4 64h122.5c-20.6-18.6-27-42.6-29.3-64z" />
    </svg>
)

const Teachers = () => {
    const [allTeachers, setAllTeachers] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState({ grade: 'all', branch: 'all', subject: 'all' })

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
        { id: 'الأحياء', name: 'الأحياء', icon: <HiOutlineCubeTransparent /> },
        { id: 'اللغة العربية', name: 'العربية', icon: <HiOutlineBookOpen /> },
        { id: 'اللغة الفرنسية', name: 'الفرنسية', icon: <EiffelTowerIcon /> },
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
                                const colors = ['blue', 'pink', 'orange', 'purple', 'green', 'teal'];
                                const assignedColor = colors[i % colors.length];
                                return (
                                <motion.div key={teacher.id} className={`glass-card teacher-page-card color-${assignedColor}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
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
