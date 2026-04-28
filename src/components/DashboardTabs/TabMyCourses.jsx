import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
    HiOutlineBookOpen,
    HiOutlineCheckCircle,
    HiOutlineClock,
    HiOutlineNoSymbol
} from 'react-icons/hi2'
import ImageCardSkeleton from '../core/ImageCardSkeleton'
import EmptyState from '../core/EmptyState'

const DISABLE_ENTRY_ANIMATION_IN_DEV = import.meta.env.DEV
const LIGHT_TRANSITION = { duration: 0.22, ease: "easeOut" }

const TabMyCourses = ({ myCourses, stats, StatsRow, isLoading = false }) => {
    const showEmptyState = !isLoading && myCourses.length === 0

    return (
        <motion.div initial={DISABLE_ENTRY_ANIMATION_IN_DEV ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={LIGHT_TRANSITION} className="dash-tab-content">
            <StatsRow stats={stats} />

            <div className="section-header-row">
                <h2 className="dash-section-title">دورات أدرسها هسة <span className="title-badge">مباشر</span></h2>
            </div>

            <div className={`dash-courses-grid ${showEmptyState ? 'dash-courses-grid-single' : ''}`.trim()}>
                {isLoading ? (
                    <ImageCardSkeleton count={6} />
                ) : showEmptyState ? (
                    <EmptyState
                        title="ما عندك دورات حالياً"
                        message="بعدك ما مشترك بأي دورة. اختار مادة من تبويب اكتشف مواد جديدة."
                    />
                ) : (
                    myCourses.map((course, i) => (
                        <motion.div key={course.id} className={`dash-course-card premium-card hover-lift ${!course.isActive ? 'grayscale' : ''}`} initial={DISABLE_ENTRY_ANIMATION_IN_DEV ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={DISABLE_ENTRY_ANIMATION_IN_DEV ? LIGHT_TRANSITION : { ...LIGHT_TRANSITION, delay: Math.min(i * 0.025, 0.18) }} style={!course.isActive ? { filter: 'grayscale(0.6)', opacity: 0.8 } : {}}>
                            <div className="dash-course-body">
                                <div className="dash-teacher-row" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
                                    <div
                                        className={`dash-teacher-avatar ta-${course.color} soft-shadow ${course.hero_image ? 'has-avatar' : ''}`}
                                        style={!course.hero_image && course.color?.startsWith('#') ? { background: course.color, borderColor: course.color, color: 'white' } : {}}
                                    >
                                        {course.hero_image ? (
                                            <img
                                                src={course.hero_image}
                                                alt={course.hero_image}
                                                className="teacher-real-avatar"
                                                width="300"
                                                height="300"
                                            />
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
                                        <motion.div className={`dash-progress-fill fill-${course.color} progress-glow`} initial={DISABLE_ENTRY_ANIMATION_IN_DEV ? false : { width: 0 }} animate={{ width: `${course.progress}%` }} transition={DISABLE_ENTRY_ANIMATION_IN_DEV ? LIGHT_TRANSITION : { duration: 0.45, delay: 0.05, ease: "easeOut" }} style={course.color?.startsWith('#') ? { background: course.color, boxShadow: `0 0 10px ${course.color}` } : {}}></motion.div>
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
                    ))
                )}
            </div>
        </motion.div>
    )
}

export default TabMyCourses
