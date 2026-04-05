import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineUserMinus, HiOutlineClock, HiOutlineChatBubbleBottomCenterText, HiOutlineNoSymbol, HiOutlineShieldCheck, HiOutlineArrowUturnLeft } from 'react-icons/hi2'

export const TAMutedStudents = () => {
    const [mutedStudents, setMutedStudents] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchMuted = async () => {
        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(API + '/api/interactions/moderate/muted-students/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setMutedStudents(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchMuted() }, [])

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
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify({
                    duration: 'unmute',
                    reason: dialog.reason || 'تم فك الحظر بواسطة المساعد'
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

    if (isLoading) return <div className="hq-loading">جاري تحميل قائمة المحظورين...</div>

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '800', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineNoSymbol /> قائمة الطلاب المحظورين
                </h1>
                <p style={{ color: 'var(--hq-text-muted)', marginTop: '5px' }}>هنا يمكنك متابعة الطلاب الذين تم تقييدهم من الدردشة والتعليقات.</p>
            </div>

            {mutedStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', border: '2px dashed var(--hq-border)', borderRadius: '20px', color: 'var(--hq-text-muted)' }}>
                    <h3>لا يوجد طلاب محظورون حالياً!</h3>
                    <p>كل الطلاب لديهم صلاحيات كاملة.</p>
                </div>
            ) : (
                <div className="hq-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--hq-border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--hq-border)' }}>
                                <th style={{ padding: '15px' }}>الطالب</th>
                                <th style={{ padding: '15px' }}>نوع الحظر</th>
                                <th style={{ padding: '15px' }}>محظور حتى</th>
                                <th style={{ padding: '15px' }}>السبب</th>
                                <th style={{ padding: '15px' }}>بواسطة</th>
                                <th style={{ padding: '15px' }}>الإجراء</th>
                            </tr>
                        </thead>
                        <tbody>
                            {mutedStudents.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid var(--hq-border)' }}>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ fontWeight: 'bold' }}>{student.full_name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>@{student.username}</div>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold',
                                            background: student.mute_type === 'الأسئلة فقط' ? 'rgba(251, 191, 36, 0.1)' : student.mute_type === 'الدردشة فقط' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                            color: student.mute_type === 'الأسئلة فقط' ? '#fbbf24' : student.mute_type === 'الدردشة فقط' ? '#38bdf8' : '#ef4444',
                                            border: '1px solid'
                                        }}>
                                            {student.mute_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#ef4444' }}>
                                            <HiOutlineClock />
                                            {new Date(student.muted_until).toLocaleString('ar-IQ')}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px', maxWidth: '300px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <HiOutlineChatBubbleBottomCenterText color="var(--hq-primary)" />
                                            {student.reason}
                                        </div>
                                    </td>
                                    <td style={{ padding: '15px' }}>{student.moderator}</td>
                                    <td style={{ padding: '15px' }}>
                                        <button
                                            onClick={() => openUnmuteDialog(student.id)}
                                            style={{
                                                background: 'rgba(16, 185, 129, 0.1)',
                                                color: '#10b981',
                                                border: '1px solid #10b981',
                                                padding: '5px 12px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <HiOutlineArrowUturnLeft /> فك الحظر
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

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
