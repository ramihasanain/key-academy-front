import React, { useCallback, useEffect, useState } from 'react'
import { API } from '../../config'
import './Admin.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

export const AdminUnpublishedLessons = () => {
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [togglingId, setTogglingId] = useState(null)

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

    const handlePublishToggle = async (lessonId, publish) => {
        setTogglingId(lessonId)
        try {
            const res = await fetch(`${API}/api/hq/lessons/${lessonId}/`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ is_published: publish }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل تحديث النشر')
            }
            setLessons(prev => publish ? prev.filter(l => l.id !== lessonId) : prev.map(l => l.id === lessonId ? { ...l, is_published: publish } : l))
        } catch (err) {
            alert(err.message)
        } finally {
            setTogglingId(null)
        }
    }

    return (
        <div>
            <h1 style={{ marginBottom: '8px' }}>دروس غير منشورة</h1>
            <p style={{ color: '#666', marginBottom: '24px' }}>
                هذه الدروس مخفية عن الطلاب (ويب + موبايل) حتى يتم تفعيل النشر.
            </p>

            <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                {loading ? (
                    <p style={{ padding: '24px' }}>جاري التحميل...</p>
                ) : lessons.length === 0 ? (
                    <p style={{ padding: '24px', color: '#16a34a' }}>لا توجد دروس غير منشورة حالياً.</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }}>
                                <th style={{ padding: '14px', textAlign: 'right' }}>#</th>
                                <th style={{ padding: '14px', textAlign: 'right' }}>اسم الدرس</th>
                                <th style={{ padding: '14px', textAlign: 'right' }}>الأستاذ</th>
                                <th style={{ padding: '14px', textAlign: 'right' }}>الدورة</th>
                                <th style={{ padding: '14px', textAlign: 'center' }}>نشر</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lessons.map(lesson => (
                                <tr key={lesson.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px', fontWeight: 'bold', color: '#64748b' }}>{lesson.id}</td>
                                    <td style={{ padding: '14px', fontWeight: 'bold' }}>{lesson.title || '—'}</td>
                                    <td style={{ padding: '14px' }}>{lesson.teacher_name || '—'}</td>
                                    <td style={{ padding: '14px' }}>{lesson.course_title || '—'}</td>
                                    <td style={{ padding: '14px', textAlign: 'center' }}>
                                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: lesson.is_published ? '#16a34a' : '#ef4444' }}>
                                                {lesson.is_published ? 'منشور' : 'غير منشور'}
                                            </span>
                                            <div className="hq-toggle-switch publish-toggle">
                                                <input
                                                    type="checkbox"
                                                    id={`pub-${lesson.id}`}
                                                    checked={!!lesson.is_published}
                                                    disabled={togglingId === lesson.id}
                                                    onChange={e => handlePublishToggle(lesson.id, e.target.checked)}
                                                />
                                                <label htmlFor={`pub-${lesson.id}`}></label>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
