import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUser, HiOutlinePhone, HiOutlineChartBar, HiOutlineClock, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import './Admin.css'
import { useParams, useNavigate } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi2'

export const TA360View = ({ id }) => {
    const { id: paramId } = useParams()
    const finalId = id || paramId
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [studentFilter, setStudentFilter] = useState('')
    const [dateFilter, setDateFilter] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const queryParams = new URLSearchParams()
                if (studentFilter) queryParams.append('student', studentFilter)
                if (dateFilter) queryParams.append('date', dateFilter)
                
                const res = await fetch(`${API}/api/hq/teacherassistants/${finalId}/360/?${queryParams.toString()}`, {
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
        
        // Debounce to prevent spam requests while typing
        const timeoutId = setTimeout(() => {
            fetchData()
        }, 500)
        
        return () => clearTimeout(timeoutId)
    }, [finalId, studentFilter, dateFilter])

    if (loading) return <div className="hq-loading" style={{ padding: '20px' }}>جاري سحب التقرير الاستخباراتي للمساعد... 🕵️‍♂️</div>
    if (!data) return null

    const { profile, stats, recent_qa, recent_chat } = data

    const handleImpersonate = async () => {
        try {
            const res = await fetch(`${API}/api/hq/teacherassistants/${finalId}/impersonate/`, {
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
        <div className="hq-360-container" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '25px' }}>
                <button className="hq-back-btn" onClick={() => navigate(-1)} style={{ color: 'var(--hq-primary)', background: 'rgba(34, 211, 238, 0.1)', fontSize: '20px', width: '45px', height: '45px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }} title="العودة للصفحة السابقة">
                    <HiOutlineArrowRight />
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                    <h2 style={{ color: '#22d3ee', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <HiOutlineChartBar size={28} /> الملف الشامل والمراقبة الذكية (TA-Spy 360)
                    </h2>
                    <button
                        onClick={handleImpersonate}
                        style={{ background: '#ef4444', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 6px rgba(239, 68, 68, 0.3)' }}
                    >
                        🕵️‍♂️ الدخول ومراقبة لوحته (View Only)
                    </button>
                </div>
            </div>

            {/* بطاقة التعريف Profile Card */}
            <div className="glass-card" style={{ padding: '25px', borderRadius: '15px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: `linear-gradient(135deg, var(--hq-primary), #3b82f6)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', fontWeight: 'bold', color: 'white', flexShrink: 0
                }}>
                    {profile.initials || '?'}
                </div>
                <div style={{ flex: '1 1 300px' }}>
                    <h2 style={{ margin: '0 0 10px', fontSize: '22px' }}>{profile.name}</h2>
                    <p style={{ margin: '0 0 5px', color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>
                        المشرف المنفذ لـ: {profile.teacher}
                    </p>
                    <p style={{ margin: '0', color: 'var(--hq-text-muted)', fontSize: '14px' }}>
                        الخلايا المقيدة: {profile.groups_str}
                    </p>
                    <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '14px', display: 'flex', gap: '10px' }}>
                        <span>الهاتف: <span dir="ltr">{profile.phone}</span></span>
                        <span>اليوزر: <span dir="ltr">{profile.username}</span></span>
                    </p>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'center', padding: '15px 30px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)', marginBottom: '5px' }}>حالة החשבון</div>
                    {profile.is_active ? (
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', padding: '5px 15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '20px' }}>فعال النشاط</div>
                    ) : (
                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444', padding: '5px 15px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '20px' }}>حساب معطل</div>
                    )}
                </div>
            </div>

            {/* Stats KPI */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}><HiOutlineChatBubbleOvalLeftEllipsis /></div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>إجمالي الردود (الأسئلة)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_replies}</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}><HiOutlineChatBubbleLeftRight /></div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>رسائل المجموعات اللايف</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_messages}</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}><HiOutlineClock /></div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>متوسط سرعة الرد</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avg_response_time_min} دقيقة</div>
                    </div>
                </div>
            </div>

            {/* Filters / أدوات المنقّب */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', marginBottom: '25px', display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <h3 style={{ margin: 0, color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                    <HiOutlineChartBar /> منقب البيانات:
                </h3>
                <input
                    type="text"
                    placeholder="بحث باسم الطالب أو محتوى الرسالة..."
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                    style={{ flex: '1 1 250px', background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: 'var(--hq-text)', padding: '10px 15px', borderRadius: '8px', outline: 'none' }}
                />
                <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: 'var(--hq-text)', padding: '10px 15px', borderRadius: '8px', outline: 'none' }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px' }}>
                <div className="glass-card" style={{ padding: '25px', borderRadius: '15px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid var(--hq-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineChatBubbleOvalLeftEllipsis style={{ color: '#10b981' }} />
                        آخر إجاباته للطلبة بالطيلة الفائتة
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {recent_qa.length === 0 ? <p style={{ color: 'var(--hq-text-muted)', textAlign: 'center' }}>لا توجد نتائج مطابقة.</p> : recent_qa.map((qa, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderRight: '3px solid #10b981' }}>
                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)', marginBottom: '8px' }}>سؤال الطالب (<strong style={{ color: 'var(--hq-text)' }}>{qa.student_name}</strong>):</div>
                                <p style={{ margin: '0 0 10px', color: 'var(--hq-text)', fontStyle: 'italic', fontSize: '0.9rem' }}>"{qa.post_content}"</p>
                                <div style={{ fontSize: '0.8rem', color: '#10b981', marginBottom: '5px', fontWeight: 'bold' }}>رد المساعد:</div>
                                <p style={{ margin: '0 0 8px', color: 'var(--hq-text)', fontSize: '0.95rem' }}>{qa.my_reply}</p>
                                <div style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)', textAlign: 'left' }}>{new Date(qa.time).toLocaleString('ar-EG')}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '25px', borderRadius: '15px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid var(--hq-border)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineChatBubbleLeftRight style={{ color: '#ec4899' }} />
                        آخر مشاركاته بمجموعات المحادثة الحية
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                        {recent_chat.length === 0 ? <p style={{ color: 'var(--hq-text-muted)', textAlign: 'center' }}>لا توجد نتائج مطابقة.</p> : recent_chat.map((m, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderRight: '3px solid #ec4899' }}>
                                {m.content && <p style={{ margin: '0 0 10px', color: 'var(--hq-text)', lineHeight: '1.5' }}>{m.content}</p>}
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
