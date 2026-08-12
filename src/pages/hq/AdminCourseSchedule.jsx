import React, { useEffect, useMemo, useState } from 'react'
import { API } from '../../config'
import './Admin.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

// تحويل ISO القادم من السيرفر إلى قيمة حقل datetime-local بالتوقيت المحلي
const isoToLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// تحويل قيمة datetime-local إلى ISO لإرسالها للسيرفر
const localInputToIso = (val) => {
    if (!val) return null
    const d = new Date(val)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
}

const STATUS_BADGE = {
    published: { label: 'منشور', bg: '#dcfce7', fg: '#16a34a' },
    scheduled: { label: 'مجدول', bg: '#dbeafe', fg: '#2563eb' },
    unscheduled: { label: 'غير مجدول', bg: '#f1f5f9', fg: '#64748b' },
}

const lessonStatus = (l) => {
    if (l.is_published) return 'published'
    if (l.auto_publish && l.scheduled_publish_at) return 'scheduled'
    return 'unscheduled'
}

export const AdminCourseSchedule = () => {
    const [courses, setCourses] = useState([])
    const [courseId, setCourseId] = useState('')
    const [schedule, setSchedule] = useState(null) // {modules, counts, ...}
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    // إعدادات المولّد
    const [genStart, setGenStart] = useState('')
    const [genPerBatch, setGenPerBatch] = useState(2)
    const [genIntervalDays, setGenIntervalDays] = useState(7)
    const [generating, setGenerating] = useState(false)

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await fetch(`${API}/api/hq/courses/?page_size=1000`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    setCourses(data.results || data)
                }
            } catch (e) { console.error('fetch courses failed', e) }
        }
        fetchCourses()
    }, [])

    const loadSchedule = async (id) => {
        if (!id) { setSchedule(null); return }
        setLoading(true)
        setDirty(false)
        try {
            const res = await fetch(`${API}/api/hq/courses/${id}/schedule/`, { headers: authHeaders() })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل تحميل الجدول')
            setSchedule(data)
        } catch (e) {
            alert('حدث خطأ: ' + e.message)
            setSchedule(null)
        } finally { setLoading(false) }
    }

    const onSelectCourse = (id) => {
        if (dirty && !window.confirm('لديك تعديلات غير محفوظة، هل تريد تجاهلها؟')) return
        setCourseId(id)
        loadSchedule(id)
    }

    const updateLesson = (moduleId, lessonId, patch) => {
        setSchedule(prev => ({
            ...prev,
            modules: prev.modules.map(m => m.id !== moduleId ? m : {
                ...m,
                lessons: m.lessons.map(l => l.id !== lessonId ? l : { ...l, ...patch }),
            }),
        }))
        setDirty(true)
    }

    const handleGenerate = async () => {
        if (!courseId) return
        if (!genStart) return alert('حدد تاريخ بداية الجدول أولاً.')
        setGenerating(true)
        try {
            const res = await fetch(`${API}/api/hq/courses/${courseId}/schedule/generate/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({
                    start_at: localInputToIso(genStart),
                    lessons_per_batch: genPerBatch,
                    interval_days: genIntervalDays,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل التوليد')
            const byId = {}
            data.items.forEach(it => { byId[it.lesson_id] = it })
            setSchedule(prev => ({
                ...prev,
                modules: prev.modules.map(m => ({
                    ...m,
                    lessons: m.lessons.map(l => {
                        const it = byId[l.id]
                        if (!it || l.is_published) return l
                        return { ...l, scheduled_publish_at: it.scheduled_publish_at, auto_publish: true }
                    }),
                })),
            }))
            setDirty(true)
            alert(`تم توليد جدول لـ ${data.count} درس على ${data.weeks} أسبوع. راجع الجدول وعدّل ما تريد ثم اضغط حفظ.`)
        } catch (e) {
            alert('حدث خطأ: ' + e.message)
        } finally { setGenerating(false) }
    }

    const handleSave = async () => {
        if (!courseId || !schedule) return
        setSaving(true)
        try {
            const items = []
            schedule.modules.forEach(m => m.lessons.forEach(l => {
                if (l.is_published) return
                // القيمة إما ISO من السيرفر أو ISO ولّدها localInputToIso — تُرسل كما هي
                items.push({
                    lesson_id: l.id,
                    scheduled_publish_at: l.scheduled_publish_at || null,
                    auto_publish: !!l.auto_publish,
                })
            }))
            const res = await fetch(`${API}/api/hq/courses/${courseId}/schedule/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ items }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
            setSchedule(data.schedule)
            setDirty(false)
            alert(`تم الحفظ بنجاح (${data.updated} درس محدَّث).`)
        } catch (e) {
            alert('حدث خطأ: ' + e.message)
        } finally { setSaving(false) }
    }

    const clearAll = () => {
        if (!schedule) return
        if (!window.confirm('إلغاء الجدولة عن كل الدروس غير المنشورة؟ (لن يُحفظ حتى تضغط حفظ)')) return
        setSchedule(prev => ({
            ...prev,
            modules: prev.modules.map(m => ({
                ...m,
                lessons: m.lessons.map(l => l.is_published ? l : { ...l, scheduled_publish_at: null, auto_publish: false }),
            })),
        }))
        setDirty(true)
    }

    const counts = useMemo(() => {
        if (!schedule) return null
        let published = 0, scheduled = 0, unscheduled = 0, total = 0
        schedule.modules.forEach(m => m.lessons.forEach(l => {
            total++
            const s = lessonStatus(l)
            if (s === 'published') published++
            else if (s === 'scheduled') scheduled++
            else unscheduled++
        }))
        return { total, published, scheduled, unscheduled }
    }, [schedule])

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ paddingBottom: '15px', borderBottom: '1px solid var(--hq-border)' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>الجدول الأسبوعي للدورات ⏱️</h2>
                <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>
                    حدد موعد نشر كل درس — النشر التلقائي يعمل يومياً الساعة 12 ظهراً بتوقيت بغداد (مع جولة تحقق الساعة 1)،
                    فينشر كل درس حان موعده وينطلق إشعار «درس جديد» لطلاب الدورة، تماماً مثل النشر اليدوي.
                </p>
            </div>

            {/* اختيار الدورة */}
            <div className="hq-form-card" style={{ marginTop: '20px', marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>اختر الدورة:</label>
                <select value={courseId} onChange={e => onSelectCourse(e.target.value)} style={{ width: '100%', maxWidth: '600px', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }}>
                    <option value="">-- يرجى اختيار الدورة --</option>
                    {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}{c.teacher_str ? ` — ${c.teacher_str}` : ''}</option>
                    ))}
                </select>
            </div>

            {loading && <div className="hq-loading" style={{ padding: '30px' }}>جاري تحميل جدول الدورة...</div>}

            {schedule && !loading && (
                <>
                    {/* ملخص */}
                    {counts && (
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            {[
                                { label: 'إجمالي الدروس', value: counts.total, color: '#334155' },
                                { label: 'منشورة', value: counts.published, color: '#16a34a' },
                                { label: 'مجدولة', value: counts.scheduled, color: '#2563eb' },
                                { label: 'بلا جدولة', value: counts.unscheduled, color: '#f59e0b' },
                            ].map(item => (
                                <div key={item.label} style={{ background: 'white', border: '1px solid var(--hq-border)', borderRadius: '12px', padding: '12px 22px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: item.color }}>{item.value}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{item.label}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* المولّد */}
                    <div className="hq-form-card" style={{ marginBottom: '20px', background: '#f0f9ff', border: '1px solid #bae6fd' }}>
                        <h3 style={{ margin: '0 0 15px', fontSize: '1.05rem', color: '#0369a1' }}>توليد جدول تلقائي (للدروس غير المنشورة)</h3>
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>تاريخ ووقت أول دفعة</label>
                                <input type="datetime-local" value={genStart} onChange={e => setGenStart(e.target.value)} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>عدد الدروس بالدفعة</label>
                                <input type="number" min="1" max="20" value={genPerBatch} onChange={e => setGenPerBatch(parseInt(e.target.value) || 1)} style={{ width: '110px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 'bold', color: '#475569' }}>كل كم يوم</label>
                                <input type="number" min="1" max="60" value={genIntervalDays} onChange={e => setGenIntervalDays(parseInt(e.target.value) || 7)} style={{ width: '110px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                            </div>
                            <button onClick={handleGenerate} disabled={generating || !genStart} style={{ padding: '11px 22px', borderRadius: '8px', border: 'none', background: '#0284c7', color: 'white', fontWeight: 'bold', cursor: (generating || !genStart) ? 'not-allowed' : 'pointer' }}>
                                {generating ? 'جاري التوليد...' : 'ولّد الجدول'}
                            </button>
                            <button onClick={clearAll} style={{ padding: '11px 18px', borderRadius: '8px', border: '1px solid #fca5a5', background: 'white', color: '#ef4444', fontWeight: 'bold', cursor: 'pointer' }}>
                                إلغاء الجدولة عن الكل
                            </button>
                        </div>
                        <p style={{ margin: '12px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                            التوليد يملأ الجدول أدناه فقط — راجعه وعدّل أي درس يدوياً، ثم اضغط «حفظ الجدول».
                        </p>
                    </div>

                    {/* الجدول */}
                    {schedule.modules.map(mod => (
                        <div key={mod.id} style={{ background: 'white', borderRadius: '14px', border: '1px solid var(--hq-border)', marginBottom: '18px', overflow: 'hidden' }}>
                            <div style={{ padding: '13px 18px', background: '#f8fafc', borderBottom: '1px solid var(--hq-border)', fontWeight: 'bold', color: '#334155' }}>
                                {mod.title}
                            </div>
                            <div>
                                {mod.lessons.map(l => {
                                    const status = lessonStatus(l)
                                    const badge = STATUS_BADGE[status]
                                    return (
                                        <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 18px', borderBottom: '1px solid #f1f5f9', opacity: l.is_published ? 0.65 : 1, flexWrap: 'wrap' }}>
                                            <span style={{ background: badge.bg, color: badge.fg, borderRadius: '999px', padding: '3px 12px', fontSize: '0.75rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>{badge.label}</span>
                                            <span style={{ flex: 1, minWidth: '200px', fontWeight: '600', color: '#1e293b' }}>{l.title}</span>
                                            {l.is_published ? (
                                                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>منشور — لا يتأثر بالجدولة</span>
                                            ) : (
                                                <>
                                                    <input
                                                        type="datetime-local"
                                                        value={isoToLocalInput(l.scheduled_publish_at)}
                                                        onChange={e => updateLesson(mod.id, l.id, {
                                                            scheduled_publish_at: localInputToIso(e.target.value),
                                                            ...(e.target.value ? {} : { auto_publish: false }),
                                                        })}
                                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
                                                    />
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: l.auto_publish ? '#16a34a' : '#64748b', cursor: 'pointer', fontWeight: 'bold' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={!!l.auto_publish}
                                                            disabled={!l.scheduled_publish_at}
                                                            onChange={e => updateLesson(mod.id, l.id, { auto_publish: e.target.checked })}
                                                        />
                                                        نشر تلقائي
                                                    </label>
                                                </>
                                            )}
                                        </div>
                                    )
                                })}
                                {mod.lessons.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '15px' }}>لا توجد دروس في هذه الوحدة.</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* حفظ */}
                    <div style={{ position: 'sticky', bottom: '15px', display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '12px', background: 'rgba(255,255,255,0.95)', borderRadius: '12px', border: '1px solid var(--hq-border)', boxShadow: '0 -4px 12px rgba(0,0,0,0.05)' }}>
                        {dirty && <span style={{ alignSelf: 'center', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>لديك تعديلات غير محفوظة</span>}
                        <button onClick={handleSave} disabled={saving || !dirty} style={{ padding: '12px 30px', borderRadius: '10px', border: 'none', background: dirty ? 'var(--hq-primary)' : '#cbd5e1', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer' }}>
                            {saving ? 'جاري الحفظ...' : 'حفظ الجدول'}
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
