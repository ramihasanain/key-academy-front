import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineClock, HiOutlineArrowRight } from 'react-icons/hi2'
import '../hq/Admin.css'

export const TAActivitiesList = () => {
    const navigate = useNavigate()
    const { activeGroupId } = useOutletContext() || {}
    const [activities, setActivities] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchActivities = async () => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        try {
            const groupQs = activeGroupId ? `?group_id=${activeGroupId}` : ''
            const res = await fetch(`${API}/api/interactions/activities/all${groupQs}`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                setActivities(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchActivities()
    }, [activeGroupId])

    const handleActivityClick = async (act) => {
        // Optimistic UI update
        setActivities(prev => prev.filter(a => a.id !== act.id || a.type !== act.type));

        // Fire API to dismiss
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        try {
            await fetch(`${API}/api/interactions/activities/dismiss/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify({ activity_type: act.type, object_id: act.id })
            });
        } catch(e) { console.error(e) }

        // Navigate based on type
        if (act.type === 'lesson_progress' || act.type === 'exam_submission') {
            navigate(`/ta/students/${act.student_id}/360`);
        } else if (act.type === 'qa_comment' || act.type === 'qa_post') {
            navigate(`/ta/qa`);
        } else if (act.type === 'note') {
            navigate(`/ta/notes`);
        } else if (act.type === 'group_message') {
            navigate(`/ta/groups`);
        }
    };

    if (loading) return <div className="hq-loading">جاري تحميل الأنشطة...</div>

    return (
        <div style={{ padding: '20px 30px', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ marginBottom: '35px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button onClick={() => navigate(-1)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HiOutlineArrowRight size={20} />
                </button>
                <h1 style={{
                    fontSize: '28px', margin: 0, fontWeight: '900',
                    background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <HiOutlineClock color="#a855f7" /> جميع الأنشطة الحديثة
                </h1>
            </div>

            <div className="hq-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                <div style={{ padding: '20px' }}>
                    {activities.length === 0 ? (
                        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--hq-text-muted)', fontSize: '1.1rem' }}>لا يوجد أنشطة جديدة حالياً</div>
                    ) : (
                        activities.map((act, i) => (
                            <div 
                                key={i} 
                                onClick={() => handleActivityClick(act)}
                                style={{ 
                                    display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', 
                                    borderBottom: i !== activities.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    cursor: 'pointer', transition: 'all 0.2s', borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.01)', marginBottom: '8px'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.01)'}
                            >
                                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 12px rgba(99, 102, 241, 0.6)' }}></div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ color: 'white', fontSize: '1.1rem', marginBottom: '6px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#a855f7' }}>{act.student_name}</span> {act.action_text || 'قام بنشاط:'}
                                    </div>
                                    <div style={{ color: '#cbd5e1', fontSize: '1rem' }}>{act.item_title || act.lesson_title}</div>
                                </div>
                                <div style={{ color: 'var(--hq-text-muted)', fontSize: '0.9rem', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px' }}>
                                    {new Date(act.timestamp).toLocaleString('ar-EG')}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
