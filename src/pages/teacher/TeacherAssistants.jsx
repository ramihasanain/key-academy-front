import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUsers } from 'react-icons/hi2'
import '../hq/Admin.css'

export const TeacherAssistants = () => {
    const [assistants, setAssistants] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(API + '/api/teachers/dashboard/stats/', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setAssistants(data.assistants || [])
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="hq-loading">جاري تحميل أداء المساعدين...</div>

    return (
        <div style={{ padding: '0 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <div className="hq-page-header">
                <h2>إدارة وتقييم المساعدين</h2>
                <p>تتبع مدى نشاط المساعدين، سرعة استجابتهم لأسئلة الطلبة، وحالة تفعيل حساباتهم.</p>
            </div>

            <div className="hq-table-card">
                <div className="hq-tc-toolbar">
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--hq-primary-text)' }}>كادر المساعدين الخاص بك</h3>
                </div>
                <div className="hq-table-container">
                    <table className="hq-table">
                        <thead>
                            <tr>
                                <th>اسم المساعد</th>
                                <th>صلاحية النظام</th>
                                <th>عدد الطلاب</th>
                                <th>الردود النقاشية (Q&A)</th>
                                <th>رسائل الجروبات (Chat)</th>
                                <th>متوسط سرعة الإجابة</th>
                                <th>الحالة</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assistants.length > 0 ? assistants.map(ta => (
                                <tr key={ta.id}>
                                    <td style={{ fontWeight: 'bold' }}>{ta.name}</td>
                                    <td><span className="hq-badge-purple" style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--hq-text-muted)' }}>{ta.role || 'مساعد'}</span></td>
                                    <td><span className="hq-badge-blue" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8' }}>{ta.students_count || 0} طالب</span></td>
                                    <td><span className="hq-badge-blue">{ta.qa_replies} رد</span></td>
                                    <td><span className="hq-badge-purple">{ta.chat_messages} رسالة</span></td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {ta.avg_response_min > 0 ? `${ta.avg_response_min} دقيقة` : 'سريع جداً'} ⚡
                                        </div>
                                    </td>
                                    <td>
                                        {ta.is_active
                                            ? <span className="hq-badge-green">مفعل ونشط</span>
                                            : <span className="hq-badge-red">موقف / محظور</span>}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center' }}>لا يوجد مساعدين لتتبعهم.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
