import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUser, HiOutlinePhone, HiOutlineChartBar, HiOutlineClock, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import './Admin.css'

export const TA360View = ({ id }) => {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(`${API}/api/hq/teacherassistants/${id}/360/`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    setData(await res.json())
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    if (loading) return <div className="hq-loading" style={{ padding: '20px' }}>جاري سحب التقرير الاستخباراتي للمساعد... 🕵️‍♂️</div>
    if (!data) return null

    const { profile, stats, recent_qa, recent_chat } = data

    const handleImpersonate = async () => {
        try {
            const res = await fetch(`${API}/api/hq/teacherassistants/${id}/impersonate/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
            })
            if (res.ok) {
                const result = await res.json()
                if (result.access) {
                    window.open(`/ta-spy/${result.access}`, '_blank')
                }
            } else {
                const err = await res.json()
                alert(err.error || 'حدث خطأ في جلب بيانات الدخول')
            }
        } catch (e) {
            console.error(e)
            alert('تعذر الاتصال بالخادم')
        }
    }

    return (
        <div style={{ marginBottom: '40px', background: 'rgba(34, 211, 238, 0.03)', borderRadius: '12px', border: '1px solid #22d3ee', padding: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <h2 style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                    <HiOutlineChartBar size={28} /> التقرير الشامل والمراقبة الذكية (TA-Spy 360)
                </h2>
                <button
                    onClick={handleImpersonate}
                    style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)' }}
                >
                    🕵️‍♂️ الدخول ومراقبة لوحته (View Only)
                </button>
            </div>

            {/* Stats KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div className="hq-stat-card" style={{ padding: '15px', background: 'var(--hq-bg)' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '40px', height: '40px' }}><HiOutlineChatBubbleOvalLeftEllipsis size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>إجمالي الردود (الأسئلة)</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{stats.total_replies}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px', background: 'var(--hq-bg)' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', width: '40px', height: '40px' }}><HiOutlineChatBubbleLeftRight size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>رسائل المجموعات اللايف</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{stats.total_messages}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px', background: 'var(--hq-bg)' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', width: '40px', height: '40px' }}><HiOutlineClock size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>متوسط سرعة الرد</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{stats.avg_response_time_min} دقيقة</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                {/* QA Log */}
                <div className="hq-table-card" style={{ border: '1px solid var(--hq-border)' }}>
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)', margin: 0 }}>آخر إجاباته للطلبة بالطيلة الفائتة</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {recent_qa.length === 0 ? <p style={{ color: 'var(--hq-text-muted)', textAlign: 'center' }}>لم يجب على أي سؤال بعد.</p> : recent_qa.map((qa, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderRight: '3px solid #10b981' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)', marginBottom: '8px' }}>سؤال الطالب:</div>
                                <p style={{ margin: '0 0 10px', color: '#cbd5e1', fontStyle: 'italic', fontSize: '0.9rem' }}>"{qa.post_content}"</p>
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '5px', fontWeight: 'bold' }}>رد المساعد:</div>
                                <p style={{ margin: '0 0 8px', color: 'white', fontSize: '0.95rem' }}>{qa.my_reply}</p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)', textAlign: 'left' }}>{new Date(qa.time).toLocaleString('ar-EG')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Log */}
                <div className="hq-table-card" style={{ border: '1px solid var(--hq-border)' }}>
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: '#ec4899', margin: 0 }}>آخر مشاركاته بمجموعات المحادثة الحية</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {recent_chat.length === 0 ? <p style={{ color: 'var(--hq-text-muted)', textAlign: 'center' }}>لم يرسل أي رسائل في المجموعات.</p> : recent_chat.map((m, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderRight: '3px solid #ec4899' }}>
                                {m.content && <p style={{ margin: '0 0 10px', color: 'white', lineHeight: '1.5' }}>{m.content}</p>}
                                {m.attachment && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <a href={m.attachment} target="_blank" rel="noreferrer" style={{ color: '#ec4899', textDecoration: 'underline', fontSize: '0.85rem' }}>📄 عرض المُرفق الذي أرسله</a>
                                    </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)', textAlign: 'left' }}>{new Date(m.time).toLocaleString('ar-EG')}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
