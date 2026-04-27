import { motion } from 'framer-motion'
import { HiOutlineClock, HiOutlineCheckCircle } from 'react-icons/hi2'
import EmptyState from '../core/EmptyState'

const TabCompleted = ({ completedCourses }) => {
    const hasCompletedCourses = Array.isArray(completedCourses) && completedCourses.length > 0

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
            <div className="section-header-row">
                <h2 className="dash-section-title">دورات مخلصها <span className="title-badge badge-green">بطل</span></h2>
            </div>
            {hasCompletedCourses ? (
                <div className="dash-courses-grid">
                    {completedCourses.map((course, i) => (
                        <motion.div key={course.id} className="dash-course-card premium-card completed-card hover-lift" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                            <div className={`dash-course-accent accent-${course.color} glow-accent`} style={{ background: course.color?.startsWith('#') ? course.color : undefined, ...(course.color?.startsWith('#') ? { boxShadow: `0 2px 15px ${course.color}` } : {}) }}></div>
                            <div className="dash-course-body">
                                <div className="dash-teacher-row">
                                    <div className={`dash-teacher-avatar ta-${course.color} grayscale ${course.teacherAvatar ? 'has-avatar' : ''}`} style={course.color?.startsWith('#') ? { background: course.color, borderColor: course.color, color: 'white' } : {}}>
                                        {course.teacherAvatar ? (
                                            <img src={course.teacherAvatar} alt={course.teacher} className="teacher-real-avatar" />
                                        ) : course.teacherInitials}
                                    </div>
                                    <div className="dash-teacher-meta">
                                        <span className="dash-teacher-name">{course.teacher}</span>
                                        <span className="dash-last-visit"><HiOutlineClock /> كملت بيوم: {course.lastVisit}</span>
                                    </div>
                                </div>
                                <div className="dash-completed-badge premium-badge-success"><HiOutlineCheckCircle /> كملت الدورة 100% عاشت ايدك</div>
                                <h3 className="course-title-glow">{course.title}</h3>

                                <button className="dash-btn-secondary premium-btn mt-4">
                                    راجع الدورة من جديد
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="ما عندك دورات مكتملة بعد"
                    message="هسه ماكو كورسات مكتملة بهالتبويب. كمّل دراسة دوراتك الحالية وراح تشوفها هنا مباشرة."
                />
            )}
        </motion.div>
    )
}

export default TabCompleted
