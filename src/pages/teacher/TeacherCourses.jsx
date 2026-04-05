import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUsers, HiOutlineCheckCircle } from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import '../hq/Admin.css'

export const TeacherCourses = () => {
    const [courses, setCourses] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(API + '/api/teachers/dashboard/stats/', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setCourses(data.courses || [])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="hq-loading">جاري تحميل الدورات...</div>

    return (
        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="hq-page-header">
                <h2>إدارة الدورات والحصص</h2>
                <p>متابعة وتفصيل وحداتك الدراسية وحالة النشر لكل دورة.</p>
            </div>

            <div className="hq-table-card">
                <div className="hq-tc-toolbar">
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--hq-primary-text)' }}>قائمة دوراتك</h3>
                </div>
                <div className="hq-table-container">
                    <table className="hq-table">
                        <thead>
                            <tr>
                                <th>اسم الدورة</th>
                                <th>حالة النشر</th>
                                <th>عدد المشتركين (التسجيلات)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {courses.length > 0 ? courses.map(c => (
                                <tr key={c.id}>
                                    <td style={{ fontWeight: 'bold' }}>{c.title}</td>
                                    <td>
                                        {c.is_published
                                            ? <span className="hq-badge-green"><HiOutlineCheckCircle style={{ verticalAlign: 'middle', marginLeft: '5px' }} /> منشورة</span>
                                            : <span className="hq-badge-red">مسودة</span>}
                                    </td>
                                    <td>
                                        <button className="hq-action-btn" style={{ background: 'var(--hq-primary)', color: 'white', display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '20px', whiteSpace: 'nowrap', width: 'max-content', border: 'none', cursor: 'pointer' }} onClick={() => navigate(`${c.id}/students`)}>
                                            <HiOutlineUsers /> <span>{c.enrollment_count} طالب</span>
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" style={{ textAlign: 'center' }}>لا توجد دورات مسجلة باسمك بعد.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
