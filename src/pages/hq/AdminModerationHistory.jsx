import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck, HiOutlineChatBubbleBottomCenterText, HiOutlineNoSymbol, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'
import '../hq/Admin.css'

export const AdminModerationHistory = () => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchHistory = async () => {
        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(API + '/api/interactions/moderate/mute-history/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                setHistory(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchHistory()
    }, [])

    if (loading) return <div className="hq-loading">جاري تحميل سجل الرقابة...</div>

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '12px', borderRadius: '12px' }}>
                    <HiOutlineClock size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--hq-primary-text)' }}>سجل الرقابة والعقوبات</h2>
                    <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>الأرشيف الكامل لكافة إجراءات الحظر وفك الحظر التي تمت عبر المنصة.</p>
                </div>
            </div>

            <div className="hq-table-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--hq-border)' }}>
                            <th style={{ padding: '18px' }}>الوقت والتاريخ</th>
                            <th style={{ padding: '18px' }}>الطالب</th>
                            <th style={{ padding: '18px' }}>الإجراء</th>
                            <th style={{ padding: '18px' }}>النطاق والمدة</th>
                            <th style={{ padding: '18px' }}>السبب المسجل</th>
                            <th style={{ padding: '18px' }}>بواسطة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>
                                    📜 السجل فارغ تماماً. لم يتم اتخاذ أي إجراءات رقابية بعد.
                                </td>
                            </tr>
                        ) : history.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--hq-border)' }} className="hq-table-row">
                                <td style={{ padding: '18px', color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>
                                    {new Date(item.created_at).toLocaleString('ar-IQ')}
                                </td>
                                <td style={{ padding: '15px 18px' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>{item.student_name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>@{item.student_username}</div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: item.action === 'كتم' ? '#ef4444' : '#10b981' }}>
                                        {item.action === 'كتم' ? <HiOutlineXCircle size={18} /> : <HiOutlineCheckCircle size={18} />}
                                        {item.action}
                                    </div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--hq-primary-text)' }}>{item.mute_type}</div>
                                    {item.duration && <div style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)' }}>مدة: {item.duration}</div>}
                                </td>
                                <td style={{ padding: '18px', maxWidth: '300px', whiteSpace: 'normal' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--hq-primary-text)', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px', borderRight: '2px solid var(--hq-primary)', fontStyle: 'italic' }}>
                                        "{item.reason}"
                                    </div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hq-primary)', fontWeight: '500' }}>
                                        <HiOutlineShieldCheck />
                                        {item.moderator_name}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
