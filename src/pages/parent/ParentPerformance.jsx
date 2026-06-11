import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronLeft, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineBookOpen } from 'react-icons/hi2'
import { API } from '../../config'
import { getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import EmptyState from '../../components/core/EmptyState'
import './ParentPerformance.css'

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
        <div className={`parent-lesson-card ${active ? 'active' : ''}`} style={{ opacity: active ? 1 : 0.75 }}>
            <button
                type="button"
                className="parent-lesson-toggle"
                onClick={() => active && setExpanded(v => !v)}
                disabled={!active}
            >
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', margin: '0 0 6px', fontWeight: 'bold' }}>{lesson.lesson_title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem' }}>
                        {hasAi && (
                            <span style={{ background: 'rgba(16,185,129,0.12)', padding: '3px 8px', borderRadius: '6px', color: '#34d399' }}>
                                اختبار AI: <strong>{ai.best_percentage ?? ai.latest_attempt.percentage}%</strong>
                            </span>
                        )}
                        {hasVideo && (
                            <span style={{ background: 'rgba(56,189,248,0.12)', padding: '3px 8px', borderRadius: '6px', color: '#38bdf8' }}>
                                أسئلة الفيديو: <strong>{video.correct_answers}/{video.total_answers}</strong>
                            </span>
                        )}
                        {!active && <span style={{ color: '#94a3b8' }}>لا يوجد تقييم بعد</span>}
                    </div>
                </div>
                {active && (expanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />)}
            </button>

            <AnimatePresence>
                {expanded && active && (
                    <motion.div
                        className="parent-lesson-expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                    >
                        {hasAi && (
                            <div style={{ marginBottom: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)' }}>
                                <p style={{ margin: '0 0 6px', fontWeight: 600, fontSize: '0.88rem', color: '#34d399' }}>اختبار الذكاء الاصطناعي</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1' }}>
                                    آخر محاولة: <strong>{ai.latest_attempt.percentage}%</strong> ({ai.latest_attempt.score}/{ai.latest_attempt.total})
                                    {ai.attempts_count > 1 && ` — ${ai.attempts_count} محاولات`}
                                </p>
                                {ai.best_percentage != null && ai.best_percentage !== ai.latest_attempt.percentage && (
                                    <p style={{ margin: '6px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                                        أفضل نتيجة: <strong>{ai.best_percentage}%</strong>
                                    </p>
                                )}
                            </div>
                        )}
                        {hasVideo && (
                            <div>
                                <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: '0.88rem', color: '#38bdf8' }}>
                                    أسئلة الفيديو — أول إجابة لكل سؤال
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(video.first_answers || []).map((ans, idx) => (
                                        <div
                                            key={idx}
                                            className={`parent-answer-row ${ans.is_correct ? 'correct' : 'wrong'}`}
                                        >
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '4px' }}>{ans.question_text}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
                                                <span style={{ color: ans.is_correct ? '#34d399' : '#f87171' }}>إجابة الطالب: {ans.answer_text}</span>
                                                <span>{ans.is_correct ? '✅' : '❌'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const CourseEvaluationDetail = ({ course, courseMeta, onBack }) => {
    const modulesMap = new Map()
    ;(course.lessons || []).forEach(lesson => {
        const key = lesson.module_id
        if (!modulesMap.has(key)) {
            modulesMap.set(key, { module_id: key, module_title: lesson.module_title || 'وحدة', lessons: [] })
        }
        modulesMap.get(key).lessons.push(lesson)
    })
    const modules = Array.from(modulesMap.values())
    const summary = course.summary || {}

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <button type="button" className="parent-detail-back" onClick={onBack}>
                <HiOutlineChevronLeft /> رجوع للدورات
            </button>

            {courseMeta?.hero_image && (
                <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', maxHeight: '200px' }}>
                    <img
                        src={courseMeta.hero_image}
                        alt={course.course_title}
                        style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                </div>
            )}

            <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 'bold' }}>{course.course_title}</h3>
            {courseMeta?.teacher_name && (
                <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.9rem' }}>الأستاذ: {courseMeta.teacher_name}</p>
            )}

            <div className="parent-summary-row">
                <div className="parent-summary-card green">
                    <div className="value">{summary.ai_quiz_avg_percentage ?? 0}%</div>
                    <div className="label">معدل اختبارات AI</div>
                </div>
                <div className="parent-summary-card blue">
                    <div className="value">{summary.video_quiz_correct_percentage ?? 0}%</div>
                    <div className="label">دقة أسئلة الفيديو</div>
                </div>
                <div className="parent-summary-card" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                    <div className="value" style={{ color: '#fbbf24' }}>{summary.weekly_exams_graded ?? 0}/{summary.weekly_exams_total ?? 0}</div>
                    <div className="label">امتحانات مصحّحة</div>
                </div>
            </div>

            {modules.map(mod => (
                <div key={mod.module_id} style={{ marginBottom: '24px' }}>
                    <h4 className="parent-module-title">{mod.module_title}</h4>
                    {mod.lessons.map(lesson => (
                        <LessonEvaluationCard key={lesson.lesson_id} lesson={lesson} />
                    ))}
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
    const selectedMeta = courses.find(c => c.course_id === selectedCourseId)

    if (!student) {
        return <EmptyState title="لم يتم اختيار طالب" message="ارجع واختر الطالب أولاً" />
    }

    return (
        <div className="parent-perf-page">
            <div className="parent-perf-header">
                <h2>تقييم أدائي 📊</h2>
                <p>أداء {student.full_name || student.first_name} في الدورات المسجّل بها — اختر دورة لعرض التفاصيل</p>
            </div>

            {loading ? (
                <EmptyState isLoading title="جاري تحميل الدورات..." message="" />
            ) : (
                <AnimatePresence mode="wait">
                    {selectedCourse ? (
                        <CourseEvaluationDetail
                            key="detail"
                            course={selectedCourse}
                            courseMeta={selectedMeta}
                            onBack={() => setSelectedCourseId(null)}
                        />
                    ) : courses.length === 0 ? (
                        <EmptyState title="لا توجد دورات" message="الطالب غير مسجّل بأي دورة حالياً" />
                    ) : (
                        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="parent-course-grid">
                                {courses.map(course => (
                                    <button
                                        key={course.course_id}
                                        type="button"
                                        className="parent-course-card"
                                        onClick={() => handleSelectCourse(course.course_id)}
                                        disabled={loadingCourseId === course.course_id}
                                    >
                                        {course.hero_image ? (
                                            <img
                                                src={course.hero_image}
                                                alt={course.course_title}
                                                className="parent-course-card-image"
                                            />
                                        ) : (
                                            <div
                                                className="parent-course-card-placeholder"
                                                style={course.color?.startsWith('#') ? { background: course.color } : undefined}
                                            >
                                                <HiOutlineBookOpen style={{ fontSize: '2rem' }} />
                                            </div>
                                        )}
                                        <div className="parent-course-card-body">
                                            <h3>{course.course_title}</h3>
                                            <div className="parent-course-card-meta">
                                                <span className="parent-course-card-badge">{course.teacher_name || 'أستاذ'}</span>
                                                {course.is_completed && (
                                                    <span className="parent-course-card-badge" style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                                                        مكتملة
                                                    </span>
                                                )}
                                                {loadingCourseId === course.course_id && (
                                                    <span>جاري التحميل...</span>
                                                )}
                                            </div>
                                        </div>
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
