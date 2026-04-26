import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { FaStar, FaGraduationCap, FaBriefcase, FaTrophy, FaChalkboardTeacher } from 'react-icons/fa'
import { HiOutlineDocumentText, HiOutlineVideoCamera, HiOutlineUserGroup, HiOutlineEnvelope } from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './Teachers.css'




const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const TeacherProfile = () => {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState('cv')
    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`${API}/api/teachers/${id}/`)
            .then(res => res.json())
            .then(data => {
                setTeacher(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [id])

    if (loading) {
        return <div className="page-transition profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>جاري تحميل ملف الأستاذ...</div></div>
    }

    if (!teacher || teacher.error) {
        return <div className="page-transition profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>عذراً، الأستاذ غير موجود</div></div>
    }

    const displayedCourses = teacher.courses && teacher.courses.length > 0 ? teacher.courses.map(c => ({
        id: c.id,
        title: c.title,
        desc: c.description || '',
        lessons: c.lessons_count || 0,
        img: c.hero_image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=60'
    })) : []

    return (
        <div className="page-transition profile-page">
            <section className="profile-hero-bg">
                <ParticleBackground />
            </section>

            <section className="section profile-main-section">
                <div className="container">
                    <div className="profile-split-layout">

                        {/* Sidebar (Right side) */}
                        <aside className="profile-sidebar">
                            <motion.div className={`glass-card teacher-card color-${teacher.color}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ padding: 0, height: 'auto', ...(teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33` } : {}) }}>
                                <div className="tc-image-wrapper" style={{ height: '280px' }}>
                                    {teacher.image ? (
                                        <img src={teacher.image} alt={teacher.name} />
                                    ) : (
                                        <div className="tc-avatar-placeholder">{teacher.initials}</div>
                                    )}
                                </div>
                                <div className="tc-info-wrapper">
                                    <h4 style={{ fontSize: '1.5rem' }}>{teacher.name}</h4>
                                    <div className="tc-subject">{teacher.subject}</div>
                                    <div className="tc-grade">{teacher.grade}</div>
                                    <Link to="/login" className="tc-btn" style={{ width: '100%', textAlign: 'center' }}>سجل بدوراتي</Link>
                                </div>
                            </motion.div>
                        </aside>

                        {/* Main Content (Left side) */}
                        <main className="profile-main-content">
                            <motion.div className="profile-tabs-wrapper" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                                <div className="profile-tabs">
                                    <button className={`profile-tab ${activeTab === 'cv' ? `active color-${teacher.color}` : ''}`} onClick={() => setActiveTab('cv')} style={activeTab === 'cv' && teacher.color?.startsWith('#') ? { background: teacher.color, color: 'white', borderColor: 'transparent' } : {}}>
                                        <HiOutlineDocumentText style={{ marginLeft: '6px', fontSize: '1.2rem' }} /> <span>الملف الشخصي (CV)</span>
                                    </button>
                                    <button className={`profile-tab ${activeTab === 'courses' ? `active color-${teacher.color}` : ''}`} onClick={() => setActiveTab('courses')} style={activeTab === 'courses' && teacher.color?.startsWith('#') ? { background: teacher.color, color: 'white', borderColor: 'transparent' } : {}}>
                                        <FaChalkboardTeacher style={{ marginLeft: '6px', fontSize: '1.2rem' }} /> <span>الدورات</span>
                                    </button>
                                </div>
                            </motion.div>

                            {activeTab === 'cv' && (
                                <motion.div className="cv-container" variants={staggerContainer} initial="hidden" animate="visible">
                                    <motion.div className="glass-card cv-bio mb-4" variants={fadeInUp}>
                                        <h3 className="cv-section-title">منو الأستاذ؟</h3>
                                        <p>{teacher.bio}</p>
                                    </motion.div>



                                    {/* Experience Timeline */}
                                    <motion.div className="cv-section" variants={fadeInUp}>
                                        <h3 className="cv-section-title"><FaBriefcase className="cv-title-icon text-orange" /> خبرته</h3>
                                        <div className="cv-timeline">
                                            {teacher.experience.map((item, i) => (
                                                <div key={i} className="cv-timeline-item">
                                                    <div className={`cv-timeline-dot color-${teacher.color}`} style={teacher.color?.startsWith('#') ? { borderColor: teacher.color } : {}}></div>
                                                    <div className={`glass-card cv-timeline-content color-${teacher.color}`} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', color: 'white' } : {}}>
                                                        <p>{item}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>

                                    {/* Achievements Timeline */}
                                    <motion.div className="cv-section" variants={fadeInUp}>
                                        <h3 className="cv-section-title"><FaTrophy className="cv-title-icon text-pink" /> إنجازاته</h3>
                                        <div className="cv-timeline">
                                            {teacher.achievements.map((item, i) => (
                                                <div key={i} className="cv-timeline-item">
                                                    <div className={`cv-timeline-dot color-${teacher.color}`} style={teacher.color?.startsWith('#') ? { borderColor: teacher.color } : {}}></div>
                                                    <div className={`glass-card cv-timeline-content color-${teacher.color}`} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', color: 'white' } : {}}>
                                                        <p>{item}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            )}

                            {activeTab === 'courses' && (
                                <motion.div className="profile-courses-grid mt-3" variants={staggerContainer} initial="hidden" animate="visible">
                                    {displayedCourses.length > 0 ? displayedCourses.map((course, i) => (
                                        <motion.div key={i} className={`glass-card profile-course-card color-${teacher.color || 'blue'}`} variants={fadeInUp} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33` } : {}}>
                                            <div className="course-card-img">
                                                <img src={course.img} alt={course.title} />
                                                <div className="course-lessons-badge">{course.lessons} درس</div>
                                            </div>
                                            <div className="course-card-content">
                                                <h4>{course.title}</h4>
                                                <p>{course.desc}</p>
                                                <Link to={`/course-preview/${course.id || 1}`} className="btn-primary w-full text-center mt-2" style={{ width: '100%', justifyContent: 'center' }}>شوف التفاصيل الكاملة</Link>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                                            <h3>هذا الأستاذ لم يطرح أي دورات حالياً.</h3>
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </main>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default TeacherProfile
