import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineClock, HiOutlineUser, HiOutlineShieldCheck, HiOutlineChatBubbleBottomCenterText, HiOutlineNoSymbol, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2'

export const TAModerationHistory = () => {
    const [history, setHistory] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchHistory = async () => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
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
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineClock /> سجل الرقابة والعقوبات (طلاب مجموعتك)
                </h1>
                <p style={{ color: 'var(--hq-text-muted)', marginTop: '5px' }}>الأرشيف الكامل لكافة إجراءات الحظر وفك الحظر التي تمت لطلابك.</p>
            </div>

            <div className="hq-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--hq-border)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--hq-border)' }}>
                            <th style={{ padding: '15px' }}>الوقت والتاريخ</th>
                            <th style={{ padding: '15px' }}>الطالب</th>
                            <th style={{ padding: '15px' }}>الإجراء</th>
                            <th style={{ padding: '15px' }}>النطاق</th>
                            <th style={{ padding: '15px' }}>السبب المسجل</th>
                            <th style={{ padding: '15px' }}>بواسطة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>
                                    📜 السجل فارغ. لم يتم اتخاذ أي إجراءات رقابية لطلابك بعد.
                                </td>
                            </tr>
                        ) : history.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--hq-border)' }}>
                                <td style={{ padding: '15px', color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>
                                    {new Date(item.created_at).toLocaleString('ar-IQ')}
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontWeight: 'bold' }}>{item.student_name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>@{item.student_username}</div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', color: item.action === 'كتم' ? '#ef4444' : '#10b981' }}>
                                        {item.action === 'كتم' ? <HiOutlineXCircle size={18} /> : <HiOutlineCheckCircle size={18} />}
                                        {item.action}
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
                                    <div style={{ fontSize: '0.9rem' }}>{item.mute_type}</div>
                                    {item.duration && <div style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)' }}>مدة: {item.duration}</div>}
                                </td>
                                <td style={{ padding: '15px', maxWidth: '250px', whiteSpace: 'normal' }}>
                                    <div style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px', borderRight: '2px solid var(--hq-primary)', fontStyle: 'italic' }}>
                                        "{item.reason}"
                                    </div>
                                </td>
                                <td style={{ padding: '15px' }}>
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
