import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { API } from '../../config'
import './Admin.css'
import './AdminUnpublishedLessons.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

const UNSCHEDULED = '__none__'

const todayStr = () => {
    const d = new Date()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${m}-${day}`
}

const formatDayLabel = (dateStr) => {
    if (!dateStr) return 'بدون تاريخ — غير مجدولة'
    try {
        const d = new Date(`${dateStr}T00:00:00`)
        const fmt = new Intl.DateTimeFormat('ar', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        })
        return fmt.format(d)
    } catch {
        return dateStr
    }
}

const dayState = (dateStr) => {
    if (!dateStr) return 'none'
    const t = todayStr()
    if (dateStr < t) return 'overdue'
    if (dateStr === t) return 'today'
    return 'upcoming'
}

const dayStateLabel = { overdue: 'متأخر', today: 'اليوم', upcoming: 'قادم', none: '' }

export const AdminUnpublishedLessons = () => {
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [busyLessonId, setBusyLessonId] = useState(null)
    const [publishingGroup, setPublishingGroup] = useState(null)

    const fetchLessons = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API}/api/hq/lessons/unpublished/?page_size=500`, { headers: authHeaders() })
            if (res.ok) {
                const data = await res.json()
                setLessons(data.results || data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchLessons()
    }, [fetchLessons])

    // تحديث تاريخ النشر المخطط لدرس
    const setLessonDate = async (lessonId, date) => {
        setBusyLessonId(lessonId)
        try {
            const res = await fetch(`${API}/api/hq/lessons/${lessonId}/`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ planned_publish_date: date || null }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل حفظ التاريخ')
            }
            setLessons(prev => prev.map(l => l.id === lessonId ? { ...l, planned_publish_date: date || null } : l))
        } catch (err) {
            alert(err.message)
        } finally {
            setBusyLessonId(null)
        }
    }

    // نشر درس واحد
    const publishOne = async (lessonId) => {
        setBusyLessonId(lessonId)
        try {
            const res = await fetch(`${API}/api/hq/lessons/${lessonId}/`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ is_published: true }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل النشر')
            }
            setLessons(prev => prev.filter(l => l.id !== lessonId))
        } catch (err) {
            alert(err.message)
        } finally {
            setBusyLessonId(null)
        }
    }

    // نشر كل دروس يوم معيّن بكبسة واحدة
    const publishGroup = async (groupKey, ids) => {
        if (!ids.length) return
        const dayText = groupKey === UNSCHEDULED ? 'غير المجدولة' : formatDayLabel(groupKey)
        if (!window.confirm(`نشر ${ids.length} درس (${dayText})؟\nسيظهرون مباشرة للطلاب.`)) return
        setPublishingGroup(groupKey)
        try {
            const res = await fetch(`${API}/api/hq/lessons/publish-batch/`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ ids }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل النشر الجماعي')
            }
            const data = await res.json()
            const publishedSet = new Set(data.published_ids || ids)
            setLessons(prev => prev.filter(l => !publishedSet.has(l.id)))
        } catch (err) {
            alert(err.message)
        } finally {
            setPublishingGroup(null)
        }
    }

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return lessons
        return lessons.filter(l =>
            (l.title || '').toLowerCase().includes(q) ||
            (l.course_title || '').toLowerCase().includes(q) ||
            (l.teacher_name || '').toLowerCase().includes(q),
        )
    }, [lessons, search])

    // تجميع حسب تاريخ النشر المخطط، الأيام المؤرّخة تصاعدياً ثم غير المجدولة بالآخر
    const groups = useMemo(() => {
        const map = new Map()
        for (const l of filtered) {
            const key = l.planned_publish_date || UNSCHEDULED
            if (!map.has(key)) map.set(key, [])
            map.get(key).push(l)
        }
        const keys = [...map.keys()].sort((a, b) => {
            if (a === UNSCHEDULED) return 1
            if (b === UNSCHEDULED) return -1
            return a < b ? -1 : a > b ? 1 : 0
        })
        return keys.map(key => ({ key, lessons: map.get(key) }))
    }, [filtered])

    const scheduledCount = lessons.filter(l => l.planned_publish_date).length

    return (
        <div className="unpub-page">
            <div className="unpub-head">
                <div>
                    <h1>جدول نشر الدروس</h1>
                    <p>
                        نظّم الدروس غير المنشورة وحدّد لكل واحد موعد نشره المخطط، وانشر كل دروس اليوم بكبسة واحدة.
                        <br />
                        <span className="unpub-hint-note">التاريخ للتنظيم فقط — الدرس لا يُنشر إلا عند الضغط على «نشر».</span>
                    </p>
                </div>
                <div className="unpub-summary">
                    <div className="unpub-stat">
                        <b>{lessons.length}</b>
                        <span>غير منشورة</span>
                    </div>
                    <div className="unpub-stat unpub-stat--scheduled">
                        <b>{scheduledCount}</b>
                        <span>مجدولة</span>
                    </div>
                </div>
            </div>

            <div className="unpub-toolbar">
                <input
                    type="search"
                    className="unpub-search"
                    placeholder="ابحث باسم الدرس أو الدورة أو الأستاذ..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <button type="button" className="unpub-refresh" onClick={fetchLessons} disabled={loading}>
                    تحديث
                </button>
            </div>

            {loading ? (
                <div className="unpub-empty">جاري التحميل...</div>
            ) : groups.length === 0 ? (
                <div className="unpub-empty unpub-empty--done">
                    {search ? 'لا نتائج مطابقة للبحث.' : 'لا توجد دروس غير منشورة حالياً 🎉'}
                </div>
            ) : (
                <div className="unpub-agenda">
                    {groups.map(({ key, lessons: items }) => {
                        const state = dayState(key === UNSCHEDULED ? null : key)
                        const ids = items.map(l => l.id)
                        const isPublishing = publishingGroup === key
                        return (
                            <section key={key} className={`unpub-day unpub-day--${state}`}>
                                <header className="unpub-day-head">
                                    <div className="unpub-day-title">
                                        <span className="unpub-day-date">
                                            {key === UNSCHEDULED ? 'بدون تاريخ' : formatDayLabel(key)}
                                        </span>
                                        <span className="unpub-day-meta">
                                            {items.length} درس
                                            {dayStateLabel[state] && (
                                                <span className={`unpub-day-badge unpub-day-badge--${state}`}>
                                                    {dayStateLabel[state]}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    {key !== UNSCHEDULED && (
                                        <button
                                            type="button"
                                            className="unpub-publish-day"
                                            onClick={() => publishGroup(key, ids)}
                                            disabled={isPublishing}
                                        >
                                            {isPublishing ? 'جاري النشر...' : `نشر كل دروس هذا اليوم (${items.length})`}
                                        </button>
                                    )}
                                </header>

                                <ul className="unpub-lessons">
                                    {items.map(lesson => (
                                        <li key={lesson.id} className="unpub-lesson">
                                            <div className="unpub-lesson-info">
                                                <strong>{lesson.title || '— بدون عنوان'}</strong>
                                                <span>
                                                    {lesson.course_title || '—'}
                                                    {lesson.teacher_name ? ` · ${lesson.teacher_name}` : ''}
                                                </span>
                                            </div>
                                            <div className="unpub-lesson-actions">
                                                <label className="unpub-date-field">
                                                    <span>موعد النشر</span>
                                                    <input
                                                        type="date"
                                                        value={lesson.planned_publish_date || ''}
                                                        disabled={busyLessonId === lesson.id}
                                                        onChange={e => setLessonDate(lesson.id, e.target.value)}
                                                    />
                                                </label>
                                                <button
                                                    type="button"
                                                    className="unpub-publish-one"
                                                    onClick={() => publishOne(lesson.id)}
                                                    disabled={busyLessonId === lesson.id}
                                                >
                                                    نشر
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
