import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API } from '../../config'
import './Admin.css'

const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json',
})

const Badge = ({ children, color = 'gray' }) => {
    const colors = {
        gray:   'background:#f1f5f9;color:#475569',
        green:  'background:#dcfce7;color:#166534',
        blue:   'background:#dbeafe;color:#1e40af',
        yellow: 'background:#fef9c3;color:#854d0e',
        red:    'background:#fee2e2;color:#991b1b',
    }
    return (
        <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            ...Object.fromEntries((colors[color] || colors.gray).split(';').map(s => {
                const [k, v] = s.split(':')
                return [k.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase()), v?.trim()]
            })),
        }}>
            {children}
        </span>
    )
}

export const AdminTransferStudent = () => {
    const { id } = useParams()
    const navigate = useNavigate()

    const [student, setStudent]           = useState(null)
    const [enrollments, setEnrollments]   = useState([])
    const [fromCourseId, setFromCourseId] = useState('')
    const [toCourseId, setToCourseId]     = useState('')
    const [teacherCourses, setTeacherCourses] = useState([])
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [preview, setPreview]           = useState(null)
    const [loadingPreview, setLoadingPreview] = useState(false)
    const [executing, setExecuting]       = useState(false)
    const [result, setResult]             = useState(null)
    const [error, setError]               = useState('')

    // تحميل بيانات الطالب واشتراكاته
    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API}/api/hq/students/${id}/360/`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    setStudent(data.student)
                    setEnrollments(data.courses.filter(c => c.access_mode === 'full'))
                }
            } catch (e) { console.error(e) }
        }
        load()
    }, [id])

    // عند تغيير الدورة المصدر: جلب دورات نفس الأستاذ
    useEffect(() => {
        if (!fromCourseId) {
            setTeacherCourses([])
            setToCourseId('')
            setPreview(null)
            setError('')
            return
        }
        const loadCourses = async () => {
            setLoadingCourses(true)
            setToCourseId('')
            setPreview(null)
            setError('')
            try {
                const courseRes = await fetch(`${API}/api/hq/courses/${fromCourseId}/`, { headers: authHeaders() })
                if (!courseRes.ok) return
                const courseData = await courseRes.json()
                const teacherId = courseData.teacher

                const res = await fetch(
                    `${API}/api/hq/courses/?teacher=${teacherId}&page_size=200`,
                    { headers: authHeaders() }
                )
                if (res.ok) {
                    const data = await res.json()
                    const all = data.results || data
                    setTeacherCourses(all.filter(c => c.id !== parseInt(fromCourseId)))
                }
            } catch (e) { console.error(e) }
            finally { setLoadingCourses(false) }
        }
        loadCourses()
    }, [fromCourseId])

    const handlePreview = async () => {
        if (!fromCourseId || !toCourseId) return
        setLoadingPreview(true)
        setPreview(null)
        setError('')
        try {
            const res = await fetch(
                `${API}/api/hq/students/${id}/transfer-preview/?from_course=${fromCourseId}&to_course=${toCourseId}`,
                { headers: authHeaders() }
            )
            const data = await res.json()
            if (!res.ok) {
                setError(data.detail || 'تعذّر جلب المعاينة.')
            } else {
                setPreview(data)
                if (!data.valid) setError(data.error || 'الطلب مرفوض.')
            }
        } catch (e) {
            setError('خطأ في الاتصال بالسيرفر.')
        } finally {
            setLoadingPreview(false)
        }
    }

    const handleExecute = async () => {
        if (!preview?.valid) return
        setExecuting(true)
        setError('')
        try {
            const res = await fetch(`${API}/api/hq/students/${id}/transfer/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    from_course: parseInt(fromCourseId),
                    to_course:   parseInt(toCourseId),
                }),
            })
            const data = await res.json()
            if (res.ok && data.success) {
                setResult(data)
            } else {
                setError(data.detail || 'حدث خطأ أثناء النقل.')
            }
        } catch (e) {
            setError('خطأ في الاتصال بالسيرفر.')
        } finally {
            setExecuting(false)
        }
    }

    // ===== العرض =====

    if (result) {
        return (
            <div className="admin-page" dir="rtl">
                <div style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 56 }}>✅</div>
                    <h2 style={{ color: '#166534', marginBottom: 8 }}>تم النقل بنجاح</h2>
                    <p style={{ color: '#64748b', marginBottom: 24 }}>
                        تم نقل الطالب <strong>{student?.full_name || student?.username}</strong> بنجاح تام
                    </p>
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: 12, marginBottom: 32,
                    }}>
                        {[
                            { label: 'دروس', value: result.total_lessons },
                            { label: 'تقدم منقول', value: result.progress_moved },
                            { label: 'ملاحظات', value: result.notes_moved },
                            { label: 'أسئلة', value: result.qa_moved },
                            { label: 'رسائل', value: result.msgs_moved },
                            { label: 'رسائل نُقلت لغرفة المجموعة الجديدة', value: result.chat_room_msgs_moved },
                            { label: 'محاولات اختبار', value: result.quiz_moved },
                            { label: 'ذكاء اصطناعي', value: result.ai_moved },
                            { label: 'جلسات فيديو', value: result.sessions_moved },
                        ].map(item => (
                            <div key={item.label} style={{
                                background: '#f0fdf4', borderRadius: 10, padding: '14px 8px',
                            }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: '#166534' }}>{item.value}</div>
                                <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{item.label}</div>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <button
                            className="admin-btn admin-btn-primary"
                            onClick={() => navigate(`/hq/students/${id}/360`)}
                        >
                            صفحة الطالب
                        </button>
                        <button
                            className="admin-btn"
                            onClick={() => {
                                setResult(null); setPreview(null);
                                setFromCourseId(''); setToCourseId('')
                            }}
                        >
                            نقل آخر
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="admin-page" dir="rtl">

            {/* رأس الصفحة */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <button
                    className="admin-btn"
                    onClick={() => navigate(`/hq/students/${id}/360`)}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                >
                    ← رجوع
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>نقل الطالب بين الدورات</h1>
                    {student && (
                        <div style={{ color: '#64748b', fontSize: 13, marginTop: 2 }}>
                            {student.full_name || student.username} · {student.grade}
                        </div>
                    )}
                </div>
            </div>

            {/* قسم الاختيار */}
            <div style={{
                background: '#fff', borderRadius: 12, padding: 24,
                border: '1px solid #e2e8f0', marginBottom: 20,
            }}>
                <h3 style={{ margin: '0 0 16px', fontSize: 15, color: '#1e293b' }}>
                    اختر الدورتين
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'end' }}>

                    {/* من دورة */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                            من دورة (الحالية)
                        </label>
                        <select
                            className="admin-input"
                            value={fromCourseId}
                            onChange={e => { setFromCourseId(e.target.value); setPreview(null) }}
                            style={{ width: '100%' }}
                        >
                            <option value="">— اختر الدورة المصدر —</option>
                            {enrollments.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.title} ({c.teacher})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* سهم */}
                    <div style={{ fontSize: 22, color: '#94a3b8', paddingBottom: 4, textAlign: 'center' }}>←</div>

                    {/* إلى دورة */}
                    <div>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>
                            إلى دورة (الهدف)
                        </label>
                        <select
                            className="admin-input"
                            value={toCourseId}
                            onChange={e => { setToCourseId(e.target.value); setPreview(null) }}
                            disabled={!fromCourseId || loadingCourses}
                            style={{ width: '100%' }}
                        >
                            <option value="">
                                {loadingCourses ? 'جاري التحميل...' : '— اختر الدورة الهدف —'}
                            </option>
                            {teacherCourses.map(c => (
                                <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* شروط */}
                <div style={{
                    marginTop: 16, padding: '10px 14px',
                    background: '#fef9c3', borderRadius: 8, fontSize: 12, color: '#854d0e',
                }}>
                    <strong>الشروط الصارمة:</strong> نفس الأستاذ · عدد الدروس متساوٍ تماماً
                </div>

                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="admin-btn admin-btn-primary"
                        onClick={handlePreview}
                        disabled={!fromCourseId || !toCourseId || loadingPreview}
                    >
                        {loadingPreview ? 'جاري المعاينة...' : 'معاينة النقل'}
                    </button>
                </div>
            </div>

            {/* رسالة خطأ */}
            {error && (
                <div style={{
                    background: '#fee2e2', border: '1px solid #fca5a5',
                    borderRadius: 10, padding: '14px 18px',
                    color: '#991b1b', marginBottom: 20, fontWeight: 600,
                }}>
                    {error}
                </div>
            )}

            {/* معاينة النقل */}
            {preview?.valid && (
                <>
                    {/* ملخص */}
                    <div style={{
                        background: '#f0fdf4', borderRadius: 12, padding: 20,
                        border: '1px solid #bbf7d0', marginBottom: 20,
                    }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: 15, color: '#166534' }}>
                            ملخص ما سيُنقل
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                            {[
                                { label: 'إجمالي الدروس', value: preview.total_lessons, color: '#1e40af' },
                                { label: 'سجلات التقدم', value: preview.summary.progress_records, color: '#166534' },
                                { label: 'الملاحظات', value: preview.summary.notes, color: '#7c3aed' },
                                { label: 'الأسئلة', value: preview.summary.qa_posts, color: '#b45309' },
                                { label: 'الرسائل', value: preview.summary.messages, color: '#0891b2' },
                                { label: 'محاولات اختبار', value: preview.summary.quiz_attempts, color: '#be185d' },
                                { label: 'جلسات ذكاء اصطناعي', value: preview.summary.ai_usage, color: '#0284c7' },
                                { label: 'جلسات فيديو', value: preview.summary.video_sessions, color: '#047857' },
                            ].map(item => (
                                <div key={item.label} style={{
                                    background: '#fff', borderRadius: 8, padding: '12px 10px', textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: item.color }}>{item.value}</div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 13 }}>
                            <span style={{ color: '#64748b' }}>من:</span>
                            <strong>{preview.from_course.title}</strong>
                            <span style={{ color: '#94a3b8' }}>←</span>
                            <span style={{ color: '#64748b' }}>إلى:</span>
                            <strong>{preview.to_course.title}</strong>
                            <span style={{ color: '#94a3b8' }}>·</span>
                            <span style={{ color: '#64748b' }}>الأستاذ:</span>
                            <strong>{preview.from_course.teacher}</strong>
                        </div>
                    </div>

                    {/* جدول الدروس قبل/بعد */}
                    <div style={{
                        background: '#fff', borderRadius: 12,
                        border: '1px solid #e2e8f0', marginBottom: 20, overflow: 'hidden',
                    }}>
                        <div style={{
                            padding: '14px 18px',
                            borderBottom: '1px solid #f1f5f9',
                            display: 'flex', alignItems: 'center', gap: 10,
                        }}>
                            <h3 style={{ margin: 0, fontSize: 14, color: '#1e293b' }}>
                                تفاصيل الدروس — قبل / بعد
                            </h3>
                            <Badge color="blue">{preview.total_lessons} درس</Badge>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc' }}>
                                        {['#', 'الوحدة (قبل)', 'الدرس (قبل)', 'الوحدة (بعد)', 'الدرس (بعد)', 'تقدم', 'ملاحظات', 'أسئلة', 'رسائل'].map(h => (
                                            <th key={h} style={{
                                                padding: '10px 12px', textAlign: 'right',
                                                fontWeight: 600, color: '#64748b',
                                                borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap',
                                            }}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.lessons.map((row, i) => (
                                        <tr key={row.index} style={{
                                            background: i % 2 === 0 ? '#fff' : '#f8fafc',
                                            borderBottom: '1px solid #f1f5f9',
                                        }}>
                                            <td style={{ padding: '9px 12px', color: '#94a3b8', fontWeight: 600 }}>
                                                {row.index}
                                            </td>
                                            {/* وحدة قبل */}
                                            <td style={{ padding: '9px 12px', color: '#64748b', maxWidth: 140 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={row.from.module}>
                                                    {row.from.module}
                                                </div>
                                            </td>
                                            {/* درس قبل */}
                                            <td style={{ padding: '9px 12px', color: '#dc2626', maxWidth: 180 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
                                                    title={row.from.title}>
                                                    {row.from.title}
                                                </div>
                                            </td>
                                            {/* وحدة بعد */}
                                            <td style={{ padding: '9px 12px', color: '#64748b', maxWidth: 140 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={row.to.module}>
                                                    {row.to.module}
                                                </div>
                                            </td>
                                            {/* درس بعد */}
                                            <td style={{ padding: '9px 12px', color: '#166534', maxWidth: 180 }}>
                                                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
                                                    title={row.to.title}>
                                                    {row.to.title}
                                                </div>
                                            </td>
                                            {/* تقدم */}
                                            <td style={{ padding: '9px 12px' }}>
                                                {row.progress
                                                    ? <Badge color={row.progress.is_completed ? 'green' : 'yellow'}>
                                                        {row.progress.is_completed ? 'مكتمل' : 'زيارة'}
                                                    </Badge>
                                                    : <Badge color="gray">—</Badge>
                                                }
                                            </td>
                                            {/* ملاحظات */}
                                            <td style={{ padding: '9px 12px' }}>
                                                {row.notes > 0
                                                    ? <Badge color="blue">{row.notes}</Badge>
                                                    : <span style={{ color: '#cbd5e1' }}>—</span>
                                                }
                                            </td>
                                            {/* أسئلة */}
                                            <td style={{ padding: '9px 12px' }}>
                                                {row.qa > 0
                                                    ? <Badge color="yellow">{row.qa}</Badge>
                                                    : <span style={{ color: '#cbd5e1' }}>—</span>
                                                }
                                            </td>
                                            {/* رسائل */}
                                            <td style={{ padding: '9px 12px' }}>
                                                {row.messages > 0
                                                    ? <Badge color="blue">{row.messages}</Badge>
                                                    : <span style={{ color: '#cbd5e1' }}>—</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* تأكيد التنفيذ */}
                    <div style={{
                        background: '#fff7ed', border: '1px solid #fed7aa',
                        borderRadius: 12, padding: 20,
                    }}>
                        <div style={{ marginBottom: 14, color: '#7c2d12', fontWeight: 600, fontSize: 14 }}>
                            تأكيد النقل — هذا الإجراء لا يمكن التراجع عنه
                        </div>
                        <div style={{ color: '#92400e', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                            سيُنقل الطالب <strong>{student?.full_name || student?.username}</strong> من دورة{' '}
                            <strong>«{preview.from_course.title}»</strong> إلى دورة{' '}
                            <strong>«{preview.to_course.title}»</strong> مع جميع بياناته
                            ({preview.summary.progress_records} تقدم ·{' '}
                            {preview.summary.notes} ملاحظة ·{' '}
                            {preview.summary.qa_posts} سؤال ·{' '}
                            {preview.summary.messages} رسالة ·{' '}
                            {preview.summary.quiz_attempts} محاولة اختبار ·{' '}
                            {preview.summary.ai_usage} جلسة ذكاء اصطناعي ·{' '}
                            {preview.summary.video_sessions} جلسة فيديو).
                        </div>
                        <button
                            className="admin-btn admin-btn-primary"
                            style={{ background: '#b45309', borderColor: '#b45309' }}
                            onClick={handleExecute}
                            disabled={executing}
                        >
                            {executing ? 'جاري التنفيذ...' : 'تنفيذ النقل الآن'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
