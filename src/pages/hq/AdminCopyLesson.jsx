import React, { useEffect, useMemo, useState } from 'react'
import { API } from '../../config'
import './Admin.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

export const AdminCopyLesson = () => {
    const [step, setStep] = useState(1)
    const [teachers, setTeachers] = useState([])
    const [courses, setCourses] = useState([])
    const [modules, setModules] = useState([])
    const [lessons, setLessons] = useState([])

    const [teacherId, setTeacherId] = useState('')
    const [sourceCourseId, setSourceCourseId] = useState('')
    const [sourceLessonId, setSourceLessonId] = useState('')
    const [selectedTargetCourseIds, setSelectedTargetCourseIds] = useState([])
    const [targetModules, setTargetModules] = useState({})

    const [loading, setLoading] = useState(false)
    const [previewReport, setPreviewReport] = useState(null)
    const [executing, setExecuting] = useState(false)
    const [executeResult, setExecuteResult] = useState(null)

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const res = await fetch(`${API}/api/hq/teachers/?page_size=1000`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    setTeachers(data.results || data)
                }
            } catch (e) {
                console.error(e)
            }
        }
        fetchTeachers()
    }, [])

    useEffect(() => {
        if (!teacherId) {
            setCourses([])
            setSourceCourseId('')
            return
        }
        const load = async () => {
            setLoading(true)
            try {
                const res = await fetch(`${API}/api/hq/courses/?page_size=1000&teacher=${teacherId}`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    setCourses(data.results || data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [teacherId])

    useEffect(() => {
        if (!sourceCourseId) {
            setModules([])
            setLessons([])
            setSourceLessonId('')
            return
        }
        const load = async () => {
            setLoading(true)
            try {
                const [modRes, lesRes] = await Promise.all([
                    fetch(`${API}/api/hq/modules/?page_size=5000&course=${sourceCourseId}`, { headers: authHeaders() }),
                    // omit: القائمة للعرض فقط — الحقول الثقيلة تُنسخ في الباك اند مباشرة
                    fetch(`${API}/api/hq/lessons/?page_size=5000&module__course=${sourceCourseId}&omit=lesson_text,interactive_html`, { headers: authHeaders() }),
                ])
                if (modRes.ok) {
                    const data = await modRes.json()
                    setModules(data.results || data)
                }
                if (lesRes.ok) {
                    const data = await lesRes.json()
                    setLessons(data.results || data)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [sourceCourseId])

    const teacherCourses = useMemo(() => courses.filter(c => String(c.teacher) === String(teacherId)), [courses, teacherId])

    const sourceCourse = useMemo(
        () => teacherCourses.find(c => String(c.id) === String(sourceCourseId)),
        [teacherCourses, sourceCourseId],
    )

    const targetCourseOptions = useMemo(
        () => teacherCourses.filter(c => String(c.id) !== String(sourceCourseId)),
        [teacherCourses, sourceCourseId],
    )

    const lessonsWithModule = useMemo(() => {
        const modMap = Object.fromEntries(modules.map(m => [String(m.id), m]))
        return lessons
            .map(l => ({
                ...l,
                moduleTitle: modMap[String(l.module)]?.title || `وحدة #${l.module}`,
            }))
            .sort((a, b) => {
                const modA = modMap[String(a.module)]?.order ?? 0
                const modB = modMap[String(b.module)]?.order ?? 0
                if (modA !== modB) return modA - modB
                return (a.order || 0) - (b.order || 0)
            })
    }, [lessons, modules])

    const selectedLesson = useMemo(
        () => lessonsWithModule.find(l => String(l.id) === String(sourceLessonId)),
        [lessonsWithModule, sourceLessonId],
    )

    const toggleTargetCourse = async (courseId, checked) => {
        const idStr = String(courseId)
        if (checked) {
            setSelectedTargetCourseIds(prev => [...prev, courseId])
            try {
                const res = await fetch(`${API}/api/hq/modules/?page_size=5000&course=${courseId}`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    const courseModules = (data.results || data).sort((a, b) => (a.order || 0) - (b.order || 0))
                    setTargetModules(prev => ({
                        ...prev,
                        [idStr]: { modules: courseModules, selectedModuleId: courseModules[0]?.id || '' },
                    }))
                }
            } catch (e) {
                console.error(e)
            }
        } else {
            setSelectedTargetCourseIds(prev => prev.filter(id => String(id) !== idStr))
            setTargetModules(prev => {
                const next = { ...prev }
                delete next[idStr]
                return next
            })
        }
    }

    const setTargetModuleForCourse = (courseId, moduleId) => {
        const idStr = String(courseId)
        setTargetModules(prev => ({
            ...prev,
            [idStr]: { ...prev[idStr], selectedModuleId: moduleId },
        }))
    }

    const buildTargetsPayload = () =>
        selectedTargetCourseIds.map(courseId => ({
            course_id: courseId,
            module_id: targetModules[String(courseId)]?.selectedModuleId,
        }))

    const canGoTargets = () => {
        if (!sourceLessonId) return false
        if (selectedTargetCourseIds.length === 0) return false
        return selectedTargetCourseIds.every(id => targetModules[String(id)]?.selectedModuleId)
    }

    const handlePreview = async () => {
        if (!canGoTargets()) {
            alert('يرجى اختيار دورة هدف واحدة على الأقل مع تحديد الوحدة لكل دورة.')
            return
        }
        setLoading(true)
        setPreviewReport(null)
        setExecuteResult(null)
        try {
            const res = await fetch(`${API}/api/hq/lessons/copy/preview/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ lesson_id: sourceLessonId, targets: buildTargetsPayload() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل إنشاء التقرير')
            setPreviewReport(data.report)
            setStep(5)
        } catch (err) {
            alert('خطأ: ' + err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleExecute = async () => {
        if (!window.confirm('تأكيد نهائي: سيتم إضافة الدرس المنسوخ فقط للدورات المحددة دون تعديل أي محتوى آخر. هل تريد المتابعة؟')) return
        setExecuting(true)
        try {
            const res = await fetch(`${API}/api/hq/lessons/copy/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ lesson_id: sourceLessonId, targets: buildTargetsPayload() }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل النسخ')
            setExecuteResult(data)
        } catch (err) {
            alert('خطأ: ' + err.message)
        } finally {
            setExecuting(false)
        }
    }

    const resetAll = () => {
        setStep(1)
        setTeacherId('')
        setSourceCourseId('')
        setSourceLessonId('')
        setSelectedTargetCourseIds([])
        setTargetModules({})
        setPreviewReport(null)
        setExecuteResult(null)
    }

    const cardStyle = { background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' }
    const labelStyle = { display: 'block', marginBottom: '8px', fontWeight: 'bold' }
    const selectStyle = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' }
    const btnPrimary = { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#2563eb', color: 'white', fontWeight: 'bold', cursor: 'pointer' }
    const btnSecondary = { padding: '10px 20px', borderRadius: '8px', border: '1px solid #ccc', background: 'white', cursor: 'pointer', marginRight: '10px' }
    const btnDanger = { padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <h1 style={{ marginBottom: '8px' }}>نسخ درس بين الدورات</h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
                انسخ درساً واحداً من دورة إلى دورات أخرى لنفس الأستاذ كدرس جديد — بدون تعديل الدورة المصدر أو أي محتوى آخر في الدورات الهدف.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {['الأستاذ', 'الدورة المصدر', 'الدرس', 'الدورات الهدف', 'التقرير'].map((label, i) => (
                    <span
                        key={label}
                        style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '0.85rem',
                            background: step === i + 1 ? '#2563eb' : step > i + 1 ? '#dcfce7' : '#f3f4f6',
                            color: step === i + 1 ? 'white' : step > i + 1 ? '#166534' : '#666',
                            fontWeight: step === i + 1 ? 'bold' : 'normal',
                        }}
                    >
                        {i + 1}. {label}
                    </span>
                ))}
            </div>

            {step === 1 && (
                <div style={cardStyle}>
                    <label style={labelStyle}>1. اختر الأستاذ</label>
                    <select style={selectStyle} value={teacherId} onChange={e => { setTeacherId(e.target.value); setStep(1) }}>
                        <option value="">— اختر الأستاذ —</option>
                        {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.full_name || t.username || t.name}</option>
                        ))}
                    </select>
                    <div style={{ marginTop: '20px' }}>
                        <button style={btnPrimary} disabled={!teacherId} onClick={() => setStep(2)}>التالي</button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div style={cardStyle}>
                    <label style={labelStyle}>2. اختر دورة المصدر</label>
                    {loading ? <p>جاري التحميل...</p> : (
                        <select style={selectStyle} value={sourceCourseId} onChange={e => { setSourceCourseId(e.target.value); setSourceLessonId('') }}>
                            <option value="">— اختر الدورة —</option>
                            {teacherCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    )}
                    <div style={{ marginTop: '20px' }}>
                        <button style={btnSecondary} onClick={() => setStep(1)}>رجوع</button>
                        <button style={btnPrimary} disabled={!sourceCourseId} onClick={() => setStep(3)}>التالي</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div style={cardStyle}>
                    <label style={labelStyle}>3. اختر الدرس المراد نسخه</label>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                        من دورة: <strong>{sourceCourse?.title}</strong>
                    </p>
                    {loading ? <p>جاري التحميل...</p> : lessonsWithModule.length === 0 ? (
                        <p style={{ color: '#ef4444' }}>لا توجد دروس في هذه الدورة.</p>
                    ) : (
                        <select style={selectStyle} value={sourceLessonId} onChange={e => setSourceLessonId(e.target.value)}>
                            <option value="">— اختر الدرس —</option>
                            {lessonsWithModule.map(l => (
                                <option key={l.id} value={l.id}>
                                    [{l.moduleTitle}] {l.title} ({l.type === 'video' ? 'فيديو' : 'مستند'})
                                </option>
                            ))}
                        </select>
                    )}
                    <div style={{ marginTop: '20px' }}>
                        <button style={btnSecondary} onClick={() => setStep(2)}>رجوع</button>
                        <button style={btnPrimary} disabled={!sourceLessonId} onClick={() => setStep(4)}>التالي</button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div style={cardStyle}>
                    <label style={labelStyle}>4. اختر الدورات الهدف (نفس الأستاذ فقط)</label>
                    <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '12px' }}>
                        الدرس المختار: <strong>{selectedLesson?.title}</strong>
                    </p>
                    {targetCourseOptions.length === 0 ? (
                        <p style={{ color: '#ef4444' }}>لا توجد دورات أخرى لهذا الأستاذ.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {targetCourseOptions.map(course => {
                                const checked = selectedTargetCourseIds.some(id => String(id) === String(course.id))
                                const modState = targetModules[String(course.id)]
                                return (
                                    <div key={course.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={e => toggleTargetCourse(course.id, e.target.checked)}
                                            />
                                            <span style={{ fontWeight: 'bold' }}>{course.title}</span>
                                        </label>
                                        {checked && (
                                            <div style={{ marginTop: '10px', paddingRight: '28px' }}>
                                                <label style={{ ...labelStyle, fontSize: '0.9rem' }}>الوحدة التي يُضاف إليها الدرس:</label>
                                                {!modState?.modules?.length ? (
                                                    <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>لا توجد وحدات — أنشئ وحدة أولاً.</p>
                                                ) : (
                                                    <select
                                                        style={selectStyle}
                                                        value={modState.selectedModuleId || ''}
                                                        onChange={e => setTargetModuleForCourse(course.id, e.target.value)}
                                                    >
                                                        {modState.modules.map(m => (
                                                            <option key={m.id} value={m.id}>{m.title}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    <div style={{ marginTop: '20px' }}>
                        <button style={btnSecondary} onClick={() => setStep(3)}>رجوع</button>
                        <button style={btnPrimary} disabled={!canGoTargets() || loading} onClick={handlePreview}>
                            {loading ? 'جاري إعداد التقرير...' : 'عرض التقرير قبل الموافقة'}
                        </button>
                    </div>
                </div>
            )}

            {step === 5 && previewReport && (
                <div>
                    <div style={{ ...cardStyle, borderRight: '4px solid #2563eb' }}>
                        <h3 style={{ marginTop: 0 }}>الدورة المصدر — بدون أي تغيير</h3>
                        <p><strong>{previewReport.source.course_title}</strong> — {previewReport.source.module_title}</p>
                        <p>الدرس: <strong>{previewReport.source.lesson_title}</strong> (#{previewReport.source.lesson_id})</p>
                        <ul style={{ color: '#166534', lineHeight: 1.8 }}>
                            {Object.entries(previewReport.source.report || {}).map(([k, v]) => (
                                <li key={k}>{v}</li>
                            ))}
                        </ul>
                        <p style={{ background: '#ecfdf5', padding: '10px', borderRadius: '8px', color: '#166534' }}>
                            {previewReport.source.message}
                        </p>
                    </div>

                    <div style={cardStyle}>
                        <h3 style={{ marginTop: 0 }}>الدورات الهدف — ما سيُضاف فقط</h3>
                        {previewReport.targets.map(t => (
                            <div key={t.course_id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                                <h4 style={{ margin: '0 0 8px' }}>{t.course_title}</h4>
                                <p style={{ margin: '4px 0', color: '#666' }}>الوحدة: {t.module_title}</p>
                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', margin: '10px 0' }}>
                                    <strong>سيُضاف درس جديد:</strong> «{t.will_add.lesson_title}»
                                    <br />
                                    الترتيب: {t.will_add.order} | النوع: {t.will_add.lesson_type === 'video' ? 'فيديو' : 'مستند'}
                                    <br />
                                    اختبارات: {t.will_add.quizzes_count} | أسئلة: {t.will_add.questions_count}
                                    {t.will_add.in_video_quizzes_count > 0 && (
                                        <> | أسئلة داخل الفيديو: {t.will_add.in_video_quizzes_count}</>
                                    )}
                                </div>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '4px' }}>بدون تعديل:</p>
                                <ul style={{ margin: 0, paddingRight: '20px', color: '#666', fontSize: '0.9rem' }}>
                                    {Object.entries(t.unchanged || {}).map(([k, v]) => (
                                        <li key={k}>{v}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div style={{ ...cardStyle, background: '#f9fafb' }}>
                        <h3 style={{ marginTop: 0 }}>الملخص</h3>
                        <p>عدد الدورات الهدف: <strong>{previewReport.summary.targets_count}</strong></p>
                        <p>دروس جديدة ستُنشأ: <strong>{previewReport.summary.new_lessons_to_create}</strong></p>
                        <p>اختبارات/أسئلة لكل درس: <strong>{previewReport.summary.quizzes_per_lesson}</strong> / <strong>{previewReport.summary.questions_per_lesson}</strong></p>
                    </div>

                    {executeResult ? (
                        <div style={{ ...cardStyle, borderRight: '4px solid #16a34a' }}>
                            <h3 style={{ marginTop: 0, color: '#16a34a' }}>{executeResult.message}</h3>
                            <ul>
                                {executeResult.created?.map(item => (
                                    <li key={item.lesson_id}>
                                        {item.course_title} → {item.module_title}: «{item.lesson_title}» (درس #{item.lesson_id})
                                    </li>
                                ))}
                            </ul>
                            <button style={btnPrimary} onClick={resetAll}>نسخ درس آخر</button>
                        </div>
                    ) : (
                        <div style={cardStyle}>
                            <button style={btnSecondary} onClick={() => setStep(4)} disabled={executing}>رجوع للتعديل</button>
                            <button style={btnDanger} onClick={handleExecute} disabled={executing}>
                                {executing ? 'جاري النسخ...' : 'موافقة نهائية وتنفيذ النسخ'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
