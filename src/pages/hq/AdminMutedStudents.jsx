import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUser, HiOutlineClock, HiOutlineChatBubbleBottomCenterText, HiOutlineArrowUturnLeft, HiOutlineShieldCheck, HiOutlineNoSymbol } from 'react-icons/hi2'
import '../hq/Admin.css'

export const AdminMutedStudents = () => {
    const [muted, setMuted] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchMuted = async () => {
        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(API + '/api/interactions/moderate/muted-students/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                setMuted(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchMuted()
    }, [])

    const [dialog, setDialog] = useState(null) // { type: 'confirm'|'reason'|'result', studentId: null, reason: '' }

    const openUnmuteDialog = (studentId) => {
        setDialog({ type: 'confirm', studentId })
    }

    const handleUnmute = async () => {
        if (!dialog.reason && dialog.type === 'reason') {
            alert('يرجى إدخال سبب فك الحظر!')
            return
        }

        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/interactions/moderate/mute/${dialog.studentId}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tk}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    duration: 'unmute',
                    reason: dialog.reason || 'تم فك الحظر بواسطة الإدارة'
                })
            })
            if (res.ok) {
                setDialog({ type: 'result', title: 'تمت العملية', message: 'تم فك الحظر عن الطالب بنجاح وتم تسجيل العملية في السجل.' })
                fetchMuted()
            } else {
                setDialog({ type: 'result', title: 'خطأ', message: 'فشلت عملية فك الحظر. حاول مرة أخرى.' })
            }
        } catch (e) {
            console.error(e)
            setDialog({ type: 'result', title: 'خطأ تقني', message: 'حدث خطأ غير متوقع أثناء الاتصال بالخادم.' })
        }
    }

    if (loading) return <div className="hq-loading">جاري تحميل قائمة المحظورين...</div>

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '12px', borderRadius: '12px' }}>
                    <HiOutlineNoSymbol size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, color: 'var(--hq-primary-text)' }}>إدارة الطلاب المحظورين</h2>
                    <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>المراقبة المركزية لكافة القيود المفروضة على الطلاب من قبل الإدارة والمساعدين.</p>
                </div>
            </div>

            <div className="hq-table-card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--hq-border)' }}>
                            <th style={{ padding: '18px' }}>الطالب</th>
                            <th style={{ padding: '18px' }}>نطاق الحظر</th>
                            <th style={{ padding: '18px' }}>السبب</th>
                            <th style={{ padding: '18px' }}>بواسطة</th>
                            <th style={{ padding: '18px' }}>ينتهي في</th>
                            <th style={{ padding: '18px' }}>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {muted.length === 0 ? (
                            <tr>
                                <td colSpan="6" style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>
                                    ✨ لا يوجد طلاب محظورون حالياً. المنصة آمنة!
                                </td>
                            </tr>
                        ) : muted.map((item) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--hq-border)', transition: 'background 0.2s' }} className="hq-table-row">
                                <td style={{ padding: '15px 18px' }}>
                                    <div style={{ fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>{item.full_name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>@{item.username}</div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <span style={{
                                        padding: '5px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 'bold',
                                        background: item.mute_type === 'الأسئلة فقط' ? 'rgba(251, 191, 36, 0.1)' : item.mute_type === 'الدردشة فقط' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        color: item.mute_type === 'الأسئلة فقط' ? '#fbbf24' : item.mute_type === 'الدردشة فقط' ? '#38bdf8' : '#ef4444',
                                        border: '1px solid'
                                    }}>
                                        {item.mute_type}
                                    </span>
                                </td>
                                <td style={{ padding: '18px', maxWidth: '250px', whiteSpace: 'normal' }}>
                                    <div style={{ color: 'var(--hq-primary-text)', fontSize: '0.9rem' }}>{item.reason}</div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--hq-primary)' }}>
                                        <HiOutlineShieldCheck />
                                        {item.moderator}
                                    </div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ef4444', fontWeight: '500' }}>
                                        <HiOutlineClock />
                                        {new Date(item.muted_until).toLocaleString('ar-IQ')}
                                    </div>
                                </td>
                                <td style={{ padding: '18px' }}>
                                    <button
                                        onClick={() => openUnmuteDialog(item.id)}
                                        style={{
                                            background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', border: '1px solid #34d399',
                                            padding: '6px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                            fontSize: '0.85rem', fontWeight: 'bold'
                                        }}
                                    >
                                        <HiOutlineArrowUturnLeft size={14} /> فك الحظر
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Premium Dialog Overlay */}
            {dialog && (
                <div className="hq-dialog-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    animation: 'hqFadeIn 0.3s ease-out'
                }}>
                    <div className="hq-dialog-card" style={{
                        background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '30px', borderRadius: '24px', width: '450px', maxWidth: '90%',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', textAlign: 'center'
                    }}>
                        {dialog.type === 'confirm' && (
                            <>
                                <div style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#10b981', width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                    <HiOutlineShieldCheck size={32} />
                                </div>
                                <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '1.4rem' }}>تأكيد فك الحظر</h3>
                                <p style={{ color: '#94a3b8', marginBottom: '25px' }}>هل أنت متأكد من رغبتك في إعادة الصلاحيات لهذا الطالب؟ سيتمكن من المشاركة فوراً.</p>
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button onClick={() => setDialog({ ...dialog, type: 'reason' })} className="hq-btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>نعم، للمتابعة</button>
                                    <button onClick={() => setDialog(null)} className="hq-btn-secondary">إلغاء</button>
                                </div>
                            </>
                        )}

                        {dialog.type === 'reason' && (
                            <>
                                <h3 style={{ color: 'white', marginBottom: '10px' }}>سبب فك الحظر</h3>
                                <p style={{ color: '#94a3b8', marginBottom: '15px' }}>لماذا قررت فك الحظر؟ (سيتم تسجيل ذلك في الأرشيف)</p>
                                <textarea
                                    className="hq-input"
                                    placeholder="مثال: اعتذار الطالب، انتهاء العقوبة..."
                                    style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '12px', padding: '12px', color: 'white', width: '100%', minHeight: '100px', marginBottom: '20px', textAlign: 'right' }}
                                    value={dialog.reason || ''}
                                    onChange={(e) => setDialog({ ...dialog, reason: e.target.value })}
                                />
                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button onClick={handleUnmute} className="hq-btn-primary" style={{ background: '#10b981', borderColor: '#10b981' }}>تأكيد الفك والتسجيل</button>
                                    <button onClick={() => setDialog(null)} className="hq-btn-secondary">تراجع</button>
                                </div>
                            </>
                        )}

                        {dialog.type === 'result' && (
                            <>
                                <h3 style={{ color: 'white', marginBottom: '10px' }}>{dialog.title}</h3>
                                <p style={{ color: '#94a3b8', marginBottom: '25px' }}>{dialog.message}</p>
                                <button onClick={() => setDialog(null)} className="hq-btn-primary">حسناً</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
