import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineUser, HiOutlineChevronLeft, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2'
import { useUser } from '../../hooks/useUser'
import EmptyState from '../core/EmptyState'

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
            padding: '14px 16px',
            borderRadius: '12px',
            border: `1px solid ${active ? 'rgba(56, 189, 248, 0.2)' : 'var(--border-color, rgba(0,0,0,0.05))'}`,
            opacity: active ? 1 : 0.75,
        }}>
            <button
                type="button"
                onClick={() => setExpanded(v => !v)}
                style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'right',
                    color: 'inherit',
                }}
            >
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem', margin: '0 0 6px', fontWeight: 'bold', color: 'var(--text-primary, #333)' }}>
                        {lesson.lesson_title}
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem' }}>
                        {hasAi && (
                            <span style={{ background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: '6px', color: '#059669' }}>
                                اختبار AI: <strong>{ai.best_percentage ?? ai.latest_attempt.percentage}%</strong>
                            </span>
                        )}
                        {hasVideo && (
                            <span style={{ background: 'rgba(56,189,248,0.1)', padding: '3px 8px', borderRadius: '6px', color: '#0284c7' }}>
                                أسئلة الفيديو: <strong>{video.correct_answers}/{video.total_answers}</strong>
                            </span>
                        )}
                        {!active && (
                            <span style={{ color: 'var(--text-muted, #888)' }}>لا يوجد تقييم بعد</span>
                        )}
                    </div>
                </div>
                {active && (expanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />)}
            </button>

            <AnimatePresence>
                {expanded && active && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ overflow: 'hidden', marginTop: '14px' }}
                    >
                        {hasAi && (
                            <div style={{ marginBottom: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(16,185,129,0.05)' }}>
                                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '0.85rem' }}>اختبار الذكاء الاصطناعي</p>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted, #666)' }}>
                                    آخر محاولة: <strong>{ai.latest_attempt.percentage}%</strong> ({ai.latest_attempt.score}/{ai.latest_attempt.total})
                                    {ai.attempts_count > 1 && ` — ${ai.attempts_count} محاولات`}
                                </p>
                            </div>
                        )}
                        {hasVideo && (
                            <div>
                                <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: '0.85rem' }}>أسئلة الفيديو — أول إجابة لكل سؤال</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {(video.first_answers || []).map((ans, idx) => (
                                        <div
                                            key={idx}
                                            style={{
                                                padding: '8px 12px',
                                                borderRadius: '8px',
                                                background: ans.is_correct ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)',
                                                border: `1px solid ${ans.is_correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                            }}
                                        >
                                            <div style={{ fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '4px' }}>{ans.question_text}</div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem' }}>
                                                <span style={{ color: ans.is_correct ? '#059669' : '#dc2626' }}>إجابتك: {ans.answer_text}</span>
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
            <button
                type="button"
                onClick={onBack}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginBottom: '16px',
                    background: 'rgba(56,189,248,0.1)',
                    border: '1px solid rgba(56,189,248,0.25)',
                    color: '#0284c7',
                    padding: '8px 14px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                }}
            >
                <HiOutlineChevronLeft /> رجوع للدورات
            </button>

            <h3 style={{ margin: '0 0 16px', fontSize: '1.2rem', fontWeight: 'bold' }}>{course.course_title}</h3>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
                <div className="hq-stat-card" style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{summary.ai_quiz_avg_percentage ?? 0}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>معدل اختبارات AI</div>
                </div>
                <div className="hq-stat-card" style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>{summary.video_quiz_correct_percentage ?? 0}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>دقة أسئلة الفيديو</div>
                </div>
                <div className="hq-stat-card" style={{ padding: '14px 18px', borderRadius: '12px', flex: 1, minWidth: '120px', background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#d97706' }}>{summary.weekly_exams_graded ?? 0}/{summary.weekly_exams_total ?? 0}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #666)' }}>امتحانات مصحّحة</div>
                </div>
            </div>

            {exams.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 'bold' }}>الامتحانات الأسبوعية</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {exams.map(ex => (
                            <div key={ex.exam_id} className="hq-card glass-panel" style={{ padding: '12px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                <span style={{ fontWeight: 600 }}>{ex.module_title || ex.title}</span>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {ex.is_graded
                                        ? <strong style={{ color: '#059669' }}>{ex.grade} / {ex.total_mark}</strong>
                                        : <span style={{ color: 'var(--text-muted, #888)' }}>بانتظار التصحيح</span>}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {modules.map(mod => (
                <div key={mod.module_id} style={{ marginBottom: '20px' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '1rem', fontWeight: 'bold', color: 'var(--text-primary, #444)' }}>
                        {mod.module_title}
                    </h4>
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

const TabProfile = ({ courseProgressList = [], isLoading = false }) => {
    const { userData } = useUser()
    const [selectedCourseId, setSelectedCourseId] = useState(null)

    if (!userData) return null

    const selectedCourse = courseProgressList.find(c => c.course_id === selectedCourseId)

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
            <div className="section-header-row">
                <h2 className="dash-section-title">إعدادات حسابك ⚙️</h2>
            </div>
            <div className="dash-profile-card glass-panel premium-profile">
                <div className="profile-header-bg"></div>
                <div className="dash-profile-avatar-lg pulse-glow-strong">
                    {userData.full_name ? userData.full_name[0] : 'س'}
                    <div className="cam-btn"><HiOutlineUser /></div>
                </div>

                <div style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1.5px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    color: '#fbbf24'
                }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🔒</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
                            لا يمكنك تعديل بياناتك بشكل مباشر
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(251, 191, 36, 0.85)', lineHeight: 1.7 }}>
                            لتعديل أي معلومة في حسابك، يرجى التواصل مع إدارة المنصة عبر الهاتف أو منصات التواصل الإجتماعي.
                        </p>
                    </div>
                </div>

                <div className="dash-profile-form">
                    <div className="input-row-half">
                        <div className="dash-input-group glass-input flex-1">
                            <label>الاسم الكامل</label>
                            <input type="text" value={userData.full_name || ''} disabled className="disabled-glass" readOnly />
                        </div>
                        <div className="dash-input-group glass-input flex-1">
                            <label>اليوزرنيم (المعرف)</label>
                            <input type="text" value={userData.username || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                        </div>
                    </div>
                    <div className="dash-input-group glass-input">
                        <label>رقم التليفون الأساسي</label>
                        <input type="tel" value={userData.phone || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                    </div>
                    <div className="dash-input-group glass-input">
                        <label>المسار الدراسي</label>
                        <input type="text" value={userData.grade || ''} disabled className="disabled-glass" readOnly />
                    </div>
                </div>
            </div>

            <div className="section-header-row mt-6 pt-6" style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 className="dash-section-title">تقييم أدائي 📊</h2>
            </div>

            <div className="dash-profile-card glass-panel premium-profile" style={{ marginTop: '20px' }}>
                {isLoading ? (
                    <EmptyState isLoading title="جاري تحميل تقييمك..." message="" />
                ) : courseProgressList.length === 0 ? (
                    <EmptyState
                        title="ماكو تقييم بعد"
                        message="سجّل بدورة وابدأ بالتفاعل مع الدروس والاختبارات حتى يظهر تقييمك هنا."
                    />
                ) : (
                    <AnimatePresence mode="wait">
                        {selectedCourse ? (
                            <CourseEvaluationDetail
                                key="detail"
                                course={selectedCourse}
                                onBack={() => setSelectedCourseId(null)}
                            />
                        ) : (
                            <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                <p style={{ margin: '0 0 16px', fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>
                                    اختر دورة لعرض تقييمك درساً بدرس
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {courseProgressList.map(course => {
                                        const s = course.summary || {}
                                        const activeLessons = (course.lessons || []).filter(hasLessonActivity).length
                                        return (
                                            <button
                                                key={course.course_id}
                                                type="button"
                                                onClick={() => setSelectedCourseId(course.course_id)}
                                                className="hq-card glass-panel"
                                                style={{
                                                    padding: '16px 18px',
                                                    borderRadius: '12px',
                                                    border: '1px solid rgba(56,189,248,0.2)',
                                                    cursor: 'pointer',
                                                    textAlign: 'right',
                                                    width: '100%',
                                                    background: 'rgba(56,189,248,0.04)',
                                                    color: 'inherit',
                                                    transition: 'transform 0.15s, box-shadow 0.15s',
                                                }}
                                                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                onMouseOut={e => { e.currentTarget.style.transform = 'none' }}
                                            >
                                                <h4 style={{ margin: '0 0 10px', fontSize: '1.05rem', fontWeight: 'bold' }}>
                                                    {course.course_title}
                                                </h4>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.82rem' }}>
                                                    <span style={{ background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '6px', color: '#059669' }}>
                                                        AI: <strong>{s.ai_quiz_avg_percentage ?? 0}%</strong>
                                                    </span>
                                                    <span style={{ background: 'rgba(56,189,248,0.1)', padding: '4px 10px', borderRadius: '6px', color: '#0284c7' }}>
                                                        فيديو: <strong>{s.video_quiz_correct_percentage ?? 0}%</strong>
                                                    </span>
                                                    <span style={{ background: 'rgba(251,191,36,0.1)', padding: '4px 10px', borderRadius: '6px', color: '#d97706' }}>
                                                        امتحانات: <strong>{s.weekly_exams_graded ?? 0}/{s.weekly_exams_total ?? 0}</strong>
                                                    </span>
                                                    <span style={{ color: 'var(--text-muted, #888)' }}>
                                                        {activeLessons} درس فيه نشاط
                                                    </span>
                                                </div>
                                            </button>
                                        )
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    )
}

export default TabProfile
