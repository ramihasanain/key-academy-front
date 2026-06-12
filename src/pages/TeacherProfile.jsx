import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { FaBriefcase, FaTrophy, FaChalkboardTeacher } from 'react-icons/fa'
import { HiOutlineDocumentText } from 'react-icons/hi2'
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

const teacherRequestCache = new Map()

const getTeacherProfile = async (id) => {
    if (!id) return null

    if (!teacherRequestCache.has(id)) {
        const request = fetch(`https://key-academy-cloud.fra1.digitaloceanspaces.com/landing-data/teachers/details/${id}.json`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to load teacher profile')
                return res.json()
            })
            .catch((error) => {
                teacherRequestCache.delete(id)
                throw error
            })
        teacherRequestCache.set(id, request)
    }

    return teacherRequestCache.get(id)
}

const TeacherProfile = ({ readOnlyParent = false }) => {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState('cv')
    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)
    const [imageErrored, setImageErrored] = useState(false)
    const [coursesList, setCoursesList] = useState([])
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [coursesFetched, setCoursesFetched] = useState(false)

    useEffect(() => {
        if (activeTab === 'courses' && !coursesFetched && !loadingCourses) {
            setLoadingCourses(true)
            fetch('https://key-academy-cloud.fra1.digitaloceanspaces.com/landing-data/courses/list.json')
                .then(res => res.json())
                .then(data => {
                    setCoursesList(data)
                    setCoursesFetched(true)
                    setLoadingCourses(false)
                })
                .catch(err => {
                    console.error('Failed to fetch courses list', err)
                    setCoursesFetched(true)
                    setLoadingCourses(false)
                })
        }
    }, [activeTab, coursesFetched, loadingCourses])

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        setImageErrored(false)
        getTeacherProfile(id)
            .then(data => {
                if (!cancelled) {
                    setTeacher(data)
                    setLoading(false)
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    setLoading(false)
                }
            })

        return () => {
            cancelled = true
        }
    }, [id])

    if (loading) {
        return <div className="page-transition profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>جاري تحميل ملف الأستاذ...</div></div>
    }

    if (!teacher || teacher.error) {
        return <div className="page-transition profile-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><div style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>عذراً، الأستاذ غير موجود</div></div>
    }

    const filteredCourses = coursesList.filter(c => String(c.teacher_id) === String(id))

    let displayedCourses = []
    if (coursesFetched && filteredCourses.length > 0) {
        displayedCourses = filteredCourses.map(c => ({
            id: c.id,
            title: c.title,
            desc: c.subject + ' - ' + c.grade || '',
            lessons: c.lessons_count || 0,
            price: c.price,
            img: c.hero_image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=60'
        }))
    } else if (!coursesFetched && teacher.courses && teacher.courses.length > 0) {
        displayedCourses = teacher.courses.map(c => ({
            id: c.id,
            title: c.title,
            desc: c.description || '',
            lessons: c.lessons_count || 0,
            price: c.price,
            img: c.hero_image || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&auto=format&fit=crop&q=60'
        }))
    }

    return (
        <div className="page-transition profile-page">
            <Helmet>
                <title>الأستاذ {teacher.name} | منصة كي التعليمية</title>
                <meta name="description" content={teacher.subtitle || `أقوى الشروحات مع الأستاذ ${teacher.name} في منصة كي التعليمية`} />
                <meta property="og:title" content={`الأستاذ ${teacher.name} | منصة كي التعليمية`} />
                <meta property="og:description" content={teacher.subtitle || `أقوى الشروحات مع الأستاذ ${teacher.name} في منصة كي التعليمية`} />
                {teacher.image && <meta property="og:image" content={teacher.image} />}
            </Helmet>
            <section className="profile-hero-bg">
                <ParticleBackground />
            </section>

            <section className="section profile-main-section">
                <div className="container">
                    <div className="profile-split-layout">

                        {/* Sidebar (Right side) */}
                        <aside className="profile-sidebar">
                            <motion.div className={`glass-card teacher-card profile-sidebar-card color-${teacher.color}`} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ padding: 0, height: 'auto', ...(teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33` } : {}) }}>
                                <div className="tc-image-wrapper" style={{ height: '330px' }}>
                                    {teacher.image && !imageErrored ? (
                                        <img src={teacher.image} alt={teacher.name} onError={() => setImageErrored(true)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div className="tc-avatar-placeholder">{teacher.initials}</div>
                                    )}
                                </div>
                                <div className="tc-info-wrapper">
                                    <h4 style={{ fontSize: '1.5rem' }}>{teacher.name}</h4>
                                    <div className="tc-subject" style={{ color: 'white' }}>{teacher.subject}</div>
                                    <div className="tc-grade">{teacher.grade}</div>
                                    {!readOnlyParent && (
                                        <Link to="/login" className="tc-btn profile-enroll-btn">سجل بدوراتي</Link>
                                    )}
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
                                    {loadingCourses ? (
                                        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', gridColumn: '1 / -1' }}>
                                            <div style={{ fontSize: '1.2rem' }}>جاري تحميل الدورات...</div>
                                        </div>
                                    ) : displayedCourses.length > 0 ? displayedCourses.map((course, i) => (
                                        <motion.div key={i} className={`glass-card profile-course-card color-${teacher.color || 'blue'}`} variants={fadeInUp} style={teacher.color?.startsWith('#') ? { background: teacher.color, borderColor: 'transparent', boxShadow: `0 10px 30px ${teacher.color}33` } : {}}>
                                            <div className="course-card-img">
                                                <img src={course.img} alt={course.title} />
                                                <div className="course-lessons-badge">{course.lessons} درس</div>
                                                {course.price != null && course.price !== '' && (
                                                    <div className="course-price-badge">{course.price} د.ع</div>
                                                )}
                                            </div>
                                            <div className="course-card-content">
                                                <h4>{course.title}</h4>
                                                <p>{course.desc}</p>
                                                {!readOnlyParent && (
                                                    <Link to={`/course-preview/${course.slug || course.id}`} className="btn-primary w-full text-center mt-2" style={{ width: '100%', justifyContent: 'center' }}>شوف التفاصيل الكاملة</Link>
                                                )}
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
