import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronLeft, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2'
import { API } from '../../config'
import { getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import EmptyState from '../../components/core/EmptyState'

const hasLessonActivity = (lesson) => {
    const ai = lesson.ai_quiz
    const video = lesson.video_quiz
    const hasAi = ai && !ai.feature_disabled && (ai.latest_attempt || ai.attempts_count > 0)
    const hasVideo = video && video.total_answers > 0
    return hasAi || hasVideo
}

const LessonEvaluationCard = ({ lesson }) => {
    const [expanded, setExpanded] = useState(false)
    const ai = lesson.ai_quiz
    const video = lesson.video_quiz
    const hasAi = ai && !ai.feature_disabled && ai.latest_attempt
    const hasVideo = video && video.total_answers > 0
    const active = hasLessonActivity(lesson)

    return (
        <div className="hq-card glass-panel" style={{
            padding: '14px 16px', borderRadius: '12px',
            border: `1px solid ${active ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255,255,255,0.08)'}`,
            opacity: active ? 1 : 0.75,
        }}>
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '12px', background: 'none', border: 'none',
                    cursor: 'pointer', padding: 0, textAlign: 'right', color: 'inherit',
                }}
            >
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', margin: '0 0 6px', fontWeight: 'bold' }}>{lesson.lesson_title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem' }}>
                        {hasAi && (
                            <span style={{ background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px', color: '#34d399' }}>
                                اختبار AI: <strong>{ai.best_percentage ?? ai.latest_attempt.percentage}%</strong>
                            </span>
                        )}
                        {hasVideo && (
                            <span style={{ background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: '6px', color: '#38bdf8' }}>
                                أسئلة الفيديو: <strong>{video.correct_answers}/{video.total_answers}</strong>
                            </span>
                        )}
                        {!active && <span style={{ color: '#94a3b8' }}>لا يوجد تقييم بعد</span>}
                    </div>
                </div>
                {active && (expanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />)}
            </button>
        </div>
    )
}

const CourseEvaluationDetail = ({ course, onBack }) => {
    const modulesMap = new Map()
    ;(course.lessons || []).forEach(lesson => {
        const key = lesson.module_id
        if (!modulesMap.has(key)) {
            modulesMap.set(key, { module_id: key, module_title: lesson.module_title || 'وحدة', lessons: [] })
        }
        modulesMap.get(key).lessons.push(lesson)
    })
    const modules = Array.from(modulesMap.values())
    const exams = Array.isArray(course.weekly_exams) ? course.weekly_exams.filter(e => e?.exam_id) : []
    const summary = course.summary || {}

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button type="button" onClick={onBack} style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '16px',
                background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.25)',
                color: '#38bdf8', padding: '8px 14px', borderRadius: '10px', cursor: 'pointer', fontWeight: 600,
            }}>
                <HiOutlineChevronLeft /> رجوع للدورات
            </button>

            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 'bold' }}>{course.course_title}</h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#34d399' }}>{summary.ai_quiz_avg_percentage ?? 0}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>معدل اختبارات AI</div>
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{summary.video_quiz_correct_percentage ?? 0}%</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>دقة أسئلة الفيديو</div>
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{summary.weekly_exams_graded ?? 0}/{summary.weekly_exams_total ?? 0}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>امتحانات مصحّحة</div>
                </div>
            </div>

            {exams.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 'bold' }}>الامتحانات الأسبوعية</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exams.map(ex => (
                            <div key={ex.exam_id} style={{ padding: '12px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <span style={{ fontWeight: 600 }}>{ex.module_title || ex.title}</span>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {ex.is_graded
                                        ? <strong style={{ color: '#34d399' }}>{ex.grade} / {ex.total_mark}</strong>
                                        : <span style={{ color: '#94a3b8' }}>بانتظار التصحيح</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modules.map(mod => (
                <div key={mod.module_id} style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 'bold' }}>{mod.module_title}</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {mod.lessons.map(lesson => (
                            <LessonEvaluationCard key={lesson.lesson_id} lesson={lesson} />
                        ))}
                    </div>
                </div>
            ))}
        </motion.div>
    )
}

const ParentPerformance = () => {
    const student = getParentSelectedStudent()
    const [courses, setCourses] = useState([])
    const [progressMap, setProgressMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [loadingCourseId, setLoadingCourseId] = useState(null)
    const [selectedCourseId, setSelectedCourseId] = useState(null)

    useEffect(() => {
        if (!student?.id) return

        const token = localStorage.getItem('access_token')
        const headers = { Authorization: `Bearer ${token}` }

        const load = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${API}/api/v1/parent/students/${student.id}/courses/`, { headers })
                const data = await res.json()
                setCourses(data.courses || [])
            } catch {
                setCourses([])
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [student?.id])

    const handleSelectCourse = async (courseId) => {
        if (progressMap[courseId]) {
            setSelectedCourseId(courseId)
            return
        }

        setLoadingCourseId(courseId)
        try {
            const token = localStorage.getItem('access_token')
            const res = await fetch(
                `${API}/api/v1/parent/students/${student.id}/progress/?course_id=${courseId}`,
                { headers: { Authorization: `Bearer ${token}` } },
            )
            const data = await res.json()
            if (res.ok) {
                setProgressMap(prev => ({ ...prev, [courseId]: data }))
                setSelectedCourseId(courseId)
            }
        } finally {
            setLoadingCourseId(null)
        }
    }

    const selectedCourse = selectedCourseId ? progressMap[selectedCourseId] : null

    if (!student) {
        return <EmptyState title="لم يتم اختيار طالب" message="ارجع واختر الطالب أولاً" />
    }

    return (
        <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.4rem', fontWeight: 800 }}>تقييم أدائي 📊</h2>
            <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.95rem' }}>
                أداء {student.full_name || student.first_name} في الدورات المسجّل بها
            </p>

            {loading ? (
                <EmptyState isLoading title="جاري تحميل الدورات..." message="" />
            ) : (
                <AnimatePresence mode="wait">
                    {selectedCourse ? (
                        <CourseEvaluationDetail
                            key="detail"
                            course={selectedCourse}
                            onBack={() => setSelectedCourseId(null)}
                        />
                    ) : courses.length === 0 ? (
                        <EmptyState title="لا توجد دورات" message="الطالب غير مسجّل بأي دورة حالياً" />
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {courses.map(course => (
                                    <button
                                        key={course.course_id}
                                        type="button"
                                        onClick={() => handleSelectCourse(course.course_id)}
                                        disabled={loadingCourseId === course.course_id}
                                        style={{
                                            padding: '16px 18px', borderRadius: '12px',
                                            border: '1px solid rgba(56,189,248,0.2)',
                                            background: 'rgba(56,189,248,0.06)',
                                            cursor: 'pointer', textAlign: 'right', width: '100%', color: 'inherit',
                                        }}
                                    >
                                        <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 'bold' }}>
                                            {course.course_title}
                                        </h4>
                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                            {course.teacher_name || 'أستاذ'}
                                            {loadingCourseId === course.course_id ? ' — جاري التحميل...' : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            )}
        </div>
    )
}

export default ParentPerformance
