import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineChevronLeft, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineBookOpen } from 'react-icons/hi2'
import { API } from '../../config'
import { getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import EmptyState from '../../components/core/EmptyState'
import ParentEvaluationGuideModal, { ParentEvaluationGuideTrigger } from './ParentEvaluationGuideModal'
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
                    <h4>{lesson.lesson_title}</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {hasAi && (
                            <span className="parent-badge-ai">
                                اختبار AI: <strong>{ai.best_percentage ?? ai.latest_attempt.percentage}%</strong>
                            </span>
                        )}
                        {hasVideo && (
                            <span className="parent-badge-video">
                                أسئلة الفيديو: <strong>{video.correct_answers}/{video.total_answers}</strong>
                            </span>
                        )}
                        {!active && <span className="parent-lesson-muted">لا يوجد تقييم بعد</span>}
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
                            <div className="parent-ai-block">
                                <p className="parent-ai-block-title">اختبار الذكاء الاصطناعي</p>
                                <p className="parent-ai-block-text">
                                    آخر محاولة: <strong>{ai.latest_attempt.percentage}%</strong> ({ai.latest_attempt.score}/{ai.latest_attempt.total})
                                    {ai.attempts_count > 1 && ` — ${ai.attempts_count} محاولات`}
                                </p>
                                {ai.best_percentage != null && ai.best_percentage !== ai.latest_attempt.percentage && (
                                    <p className="parent-ai-block-sub">
                                        أفضل نتيجة: <strong>{ai.best_percentage}%</strong>
                                    </p>
                                )}
                            </div>
                        )}
                        {hasVideo && (
                            <div>
                                <p className="parent-video-block-title">أسئلة الفيديو — أول إجابة لكل سؤال</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(video.first_answers || []).map((ans, idx) => (
                                        <div
                                            key={idx}
                                            className={`parent-answer-row ${ans.is_correct ? 'correct' : 'wrong'}`}
                                        >
                                            <div className="parent-answer-q">{ans.question_text}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
                                                <span className={ans.is_correct ? 'parent-answer-a-correct' : 'parent-answer-a-wrong'}>
                                                    إجابة الطالب: {ans.answer_text}
                                                </span>
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
                <div className="parent-course-detail-hero">
                    <img
                        src={courseMeta.hero_image}
                        alt={course.course_title}
                        loading="eager"
                        decoding="async"
                    />
                </div>
            )}

            <h3 className="parent-course-detail-title">{course.course_title}</h3>
            {courseMeta?.teacher_name && (
                <p className="parent-course-detail-teacher">الأستاذ: {courseMeta.teacher_name}</p>
            )}

            <div className="parent-summary-row">
                <div className="parent-summary-card green">
                    <div className="value">{summary.ai_quiz_avg_percentage ?? 0}%</div>
                    <div className="label">معدل اختبارات الذكاء الاصطناعي</div>
                </div>
                <div className="parent-summary-card blue">
                    <div className="value">{summary.video_quiz_correct_percentage ?? 0}%</div>
                    <div className="label">دقة أسئلة الفيديو</div>
                </div>
                <div className="parent-summary-card amber">
                    <div className="value">{summary.weekly_exams_graded ?? 0}/{summary.weekly_exams_total ?? 0}</div>
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
    const [guideOpen, setGuideOpen] = useState(false)

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
                <div className="parent-perf-title-row">
                    <h2>مستوى الطالب 📊</h2>
                    <ParentEvaluationGuideTrigger onClick={() => setGuideOpen(true)} />
                </div>
                <p>أداء {student.full_name || student.first_name} في الدورات المسجّل بها — اختر دورة لعرض التفاصيل</p>
            </div>

            <ParentEvaluationGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

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
                                            <div className="parent-course-card-image-wrap">
                                                <img
                                                    src={course.hero_image}
                                                    alt={course.course_title}
                                                    className="parent-course-card-image"
                                                    loading="lazy"
                                                    decoding="async"
                                                />
                                            </div>
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
                                                    <span className="parent-course-card-badge parent-badge-complete">
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
