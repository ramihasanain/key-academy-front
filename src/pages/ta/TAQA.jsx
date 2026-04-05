import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineChatBubbleOvalLeftEllipsis, HiOutlineCheckBadge, HiOutlinePaperAirplane, HiOutlineNoSymbol } from 'react-icons/hi2'

export const TAQA = () => {
    const [posts, setPosts] = useState([])
    const [replyText, setReplyText] = useState('')
    const [activePost, setActivePost] = useState(null)
    const [tab, setTab] = useState('pending') // pending, answered
    const [dialog, setDialog] = useState(null) // { type, message, options?, onConfirm, onCancel }

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const res = await fetch(API + '/api/interactions/qa/', {
            headers: { 'Authorization': `Bearer ${tk}` }
        })
        if (res.ok) {
            const data = await res.json()
            setPosts(data.results || data)
        }
    }

    const submitReply = async (postId) => {
        if (!replyText.trim()) return
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/interactions/qa/${postId}/comment/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${tk}`
            },
            body: JSON.stringify({ content: replyText })
        })
        if (res.ok) {
            setReplyText('')
            setActivePost(null)
            fetchPosts()
        }
    }

    const activeComments = p => (p.comments || []).filter(c => !c.is_hidden)
    const lastActiveComment = p => {
        const comms = activeComments(p)
        return comms.length > 0 ? comms[comms.length - 1] : null
    }

    const pendingPosts = posts.filter(p => !p.is_hidden && !p.is_resolved && (!lastActiveComment(p) || !lastActiveComment(p).is_teacher))
    const answeredPosts = posts.filter(p => !p.is_hidden && !p.is_resolved && lastActiveComment(p)?.is_teacher)
    const resolvedPosts = posts.filter(p => !p.is_hidden && p.is_resolved)
    const deletedPosts = posts.filter(p => p.is_hidden)

    const displayPosts = tab === 'pending' ? pendingPosts : tab === 'answered' ? answeredPosts : tab === 'resolved' ? resolvedPosts : deletedPosts

    const handleHide = (modelType, id, isHidden) => {
        setDialog({
            type: 'confirm',
            message: isHidden ? 'متأكد من استرجاع هذا السؤال؟ سيعود لصفحة الطلبة.' : 'متأكد من حذف هذا العنصر؟ ستبدو محذوفة للجميع.',
            onConfirm: async () => {
                setDialog(null)
                const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
                try {
                    await fetch(`${API}/api/interactions/moderate/hide/${modelType}/${id}/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    });
                    fetchPosts();
                } catch (e) { }
            },
            onCancel: () => setDialog(null)
        })
    }

    const handleResolve = (id, isResolved) => {
        setDialog({
            type: 'confirm',
            message: isResolved ? 'متأكد من استرجاع هذا السؤال من قسم "ليس بحاجة لرد"؟' : 'متأكد من نقل هذا السؤال إلى قسم "ليس بحاجة لرد"؟',
            onConfirm: async () => {
                setDialog(null)
                const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
                try {
                    await fetch(`${API}/api/interactions/moderate/resolve/${id}/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    });
                    fetchPosts();
                } catch (e) { }
            },
            onCancel: () => setDialog(null)
        })
    }

    const handleMute = (studentId, studentName) => {
        setDialog({
            type: 'prompt',
            message: `أدخل مدة تقييد الطالب [${studentName}]:`,
            options: [
                { label: 'ليوم واحد (24h)', value: '24h' },
                { label: 'لأسبوع (week)', value: 'week' },
                { label: 'للأبد (forever)', value: 'forever' },
                { label: 'فك الحظر (unmute)', value: 'unmute' }
            ],
            onConfirm: async (val) => {
                if (!val) { setDialog(null); return; }

                if (val === 'unmute') {
                    setDialog(null);
                    await executeMute(studentId, 'unmute', 'تم فك الحظر');
                } else {
                    setDialog({
                        type: 'input',
                        message: 'أدخل سبب الإجراء (سيظهر في الهيستوري والتقارير):',
                        defaultValue: 'مخالفة سياسة الأسئلة والنقاش',
                        onConfirm: async (reason) => {
                            setDialog(null);
                            await executeMute(studentId, val, reason || 'بدون سبب محدد');
                        },
                        onCancel: () => setDialog(null)
                    });
                }
            },
            onCancel: () => setDialog(null)
        })
    }

    const executeMute = async (studentId, duration, reason) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        try {
            await fetch(`${API}/api/interactions/moderate/mute/${studentId}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ duration, reason })
            });
            setDialog({
                type: 'alert',
                message: 'تمت العملية بنجاح لتنظيم البيئة التعليمية.',
                onConfirm: () => setDialog(null)
            });
            fetchPosts();
        } catch (e) {
            alert('خطأ في العملية');
        }
    }

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid var(--hq-border)', paddingBottom: '15px' }}>
                <button
                    onClick={() => setTab('pending')}
                    style={{ background: 'transparent', color: tab === 'pending' ? 'var(--hq-primary)' : 'var(--hq-text-muted)', border: 'none', fontSize: '15px', fontWeight: tab === 'pending' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    قيد الانتظار ({pendingPosts.length})
                </button>
                <button
                    onClick={() => setTab('answered')}
                    style={{ background: 'transparent', color: tab === 'answered' ? '#10b981' : 'var(--hq-text-muted)', border: 'none', fontSize: '15px', fontWeight: tab === 'answered' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    تمت الإجابة ({answeredPosts.length})
                </button>
                <button
                    onClick={() => setTab('resolved')}
                    style={{ background: 'transparent', color: tab === 'resolved' ? '#f59e0b' : 'var(--hq-text-muted)', border: 'none', fontSize: '15px', fontWeight: tab === 'resolved' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    ليست بحاجة لرد ({resolvedPosts.length})
                </button>
                <button
                    onClick={() => setTab('deleted')}
                    style={{ background: 'transparent', color: tab === 'deleted' ? '#ef4444' : 'var(--hq-text-muted)', border: 'none', fontSize: '15px', fontWeight: tab === 'deleted' ? 'bold' : 'normal', cursor: 'pointer' }}
                >
                    المحذوفة ({deletedPosts.length})
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
                {displayPosts.map(p => (
                    <div key={p.id} style={{
                        background: 'var(--hq-surface)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: p.is_hidden ? '1px dashed #ef4444' : '1px solid var(--hq-border)',
                        color: 'var(--hq-text-main)',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 'bold' }}>
                                    {p.student?.full_name ? p.student.full_name[0] : (p.student?.username?.[0] || 'ط')}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <strong style={{ color: 'var(--hq-primary)', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {p.student?.full_name || p.student?.username || 'مجهول'}
                                        {p.student?.muted_until && new Date(p.student.muted_until) > new Date() && (
                                            <span title="هذا الطالب محظور حالياً" style={{ color: '#ef4444' }}>
                                                <HiOutlineNoSymbol size={16} />
                                            </span>
                                        )}
                                        {p.is_hidden && <span style={{ color: '#ef4444', marginRight: '8px', fontSize: '11px', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>سؤال محذوف</span>}
                                        <span style={{ marginRight: '8px', background: 'rgba(131, 42, 150, 0.1)', color: 'var(--purple)', padding: '2px 6px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>طالب</span>
                                    </strong>
                                    <small style={{ color: 'var(--hq-text-muted)', fontSize: '12px', marginTop: '2px' }}>{new Date(p.created_at).toLocaleDateString('ar-EG', { hour: 'numeric', minute: 'numeric' })}</small>
                                </div>
                            </div>
                        </div>

                        <div style={{ padding: '10px 14px', background: 'var(--hq-bg)', borderRadius: '10px', marginBottom: '16px', borderRight: '3px solid var(--hq-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: 'var(--hq-text-muted)', fontSize: '12px' }}>
                                <span style={{ fontWeight: 'bold' }}>الدورة:</span> {p.course_title}
                            </div>
                            <div style={{ color: 'var(--hq-text-main)', fontSize: '13px', fontWeight: 'bold' }}>
                                <span style={{ color: 'var(--hq-text-muted)', fontWeight: 'normal' }}>الدرس:</span> {p.lesson_title}
                            </div>
                        </div>

                        <p style={{ lineHeight: '1.7', marginBottom: '20px', fontSize: '15px', color: p.is_hidden ? 'var(--hq-text-muted)' : 'var(--hq-text-main)', textDecoration: p.is_hidden ? 'line-through' : 'none' }}>{p.content}</p>

                        {!sessionStorage.getItem('spy_token') && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--hq-border)' }}>
                                <button onClick={() => handleMute(p.student.id, p.student.full_name)} style={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', transition: '0.2s' }}>🚫 كتم</button>
                                <button onClick={() => handleHide('qapost', p.id, p.is_hidden)} style={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: p.is_hidden ? '#10b981' : '#ef4444', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', transition: '0.2s' }}>{p.is_hidden ? '🔙 استرجاع' : '🗑️ حذف'}</button>
                                <button onClick={() => handleResolve(p.id, p.is_resolved)} style={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: p.is_resolved ? '#10b981' : '#f59e0b', cursor: 'pointer', fontSize: '12px', padding: '6px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold', transition: '0.2s' }}>{p.is_resolved ? '🔙 لم تحل' : '✨ حُلّت'}</button>
                            </div>
                        )}

                        {p.comments && p.comments.length > 0 && (
                            <div style={{ marginBottom: '16px', padding: '15px', background: 'var(--hq-bg)', borderRadius: '12px', border: '1px solid var(--hq-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <strong style={{ color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', marginBottom: '4px' }}>💬 سلسلة الردود:</strong>
                                {p.comments.slice().sort((a, b) => {
                                    if (a.author_role === 'teacher' && b.author_role !== 'teacher') return -1;
                                    if (b.author_role === 'teacher' && a.author_role !== 'teacher') return 1;
                                    if (a.is_teacher && !b.is_teacher) return -1;
                                    if (b.is_teacher && !a.is_teacher) return 1;
                                    return new Date(a.created_at) - new Date(b.created_at);
                                }).map(c => (
                                    <div key={c.id} style={{
                                        padding: '12px', borderRadius: '10px',
                                        background: c.author_role === 'teacher' ? 'rgba(245, 158, 11, 0.05)' : (c.is_teacher ? 'rgba(16, 185, 129, 0.05)' : 'rgba(131, 42, 150, 0.03)'),
                                        borderRight: c.author_role === 'teacher' ? '3px solid #f59e0b' : (c.is_teacher ? '3px solid #10b981' : '3px solid var(--purple)')
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: 'bold', color: c.is_hidden ? 'var(--hq-text-muted)' : (c.author_role === 'teacher' ? '#f59e0b' : (c.is_teacher ? '#10b981' : 'var(--purple)')) }}>
                                                    {c.author?.first_name || c.author?.username}
                                                </span>
                                                {c.author_role === 'teacher' ? <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>أستاذ المادة</span> :
                                                    c.is_teacher ? <span style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>مساعد</span> :
                                                        <span style={{ background: 'rgba(131, 42, 150, 0.1)', color: 'var(--purple)', padding: '2px 6px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>طالب</span>}
                                            </div>
                                            {!sessionStorage.getItem('spy_token') && (
                                                <button onClick={() => handleHide('qacomment', c.id, c.is_hidden)} style={{ background: c.is_hidden ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: 'none', color: c.is_hidden ? '#10b981' : '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold', padding: '4px 8px', borderRadius: '6px' }}>{c.is_hidden ? '🔙 استرجاع' : '🗑️ حذف'}</button>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: c.is_hidden ? 'var(--hq-text-muted)' : 'var(--hq-text-main)', textDecoration: c.is_hidden ? 'line-through' : 'none' }}>
                                            {c.content}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!sessionStorage.getItem('spy_token') && (
                            activePost === p.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: 'auto' }}>
                                    <textarea
                                        className="hq-input"
                                        value={replyText}
                                        onChange={e => setReplyText(e.target.value)}
                                        placeholder="اكتب ردك هنا..."
                                        style={{ background: 'var(--hq-bg)', color: 'var(--hq-text-main)', minHeight: '90px', border: '1px solid var(--purple)', outline: 'none', borderRadius: '10px', padding: '12px', width: '100%', resize: 'vertical' }}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={() => submitReply(p.id)}
                                            style={{ background: 'var(--purple)', color: 'white', padding: '10px 15px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 'bold', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                                        >نشر الرد <HiOutlinePaperAirplane style={{ transform: 'scaleX(-1)' }} /></button>
                                        <button
                                            onClick={() => setActivePost(null)}
                                            style={{ background: 'var(--hq-bg)', color: '#ef4444', border: '1px solid #ef4444', padding: '10px 15px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}
                                        >إلغاء</button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setActivePost(p.id)}
                                    style={{ background: 'var(--hq-bg)', color: 'var(--purple)', marginTop: 'auto', border: '1px dashed var(--purple)', padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s', opacity: 0.8 }}
                                    onMouseOver={(e) => { e.currentTarget.style.opacity = 1; e.currentTarget.style.background = 'rgba(131, 42, 150, 0.05)' }}
                                    onMouseOut={(e) => { e.currentTarget.style.opacity = 0.8; e.currentTarget.style.background = 'var(--hq-bg)' }}
                                >
                                    <HiOutlineChatBubbleOvalLeftEllipsis size={20} /> إضافة رد
                                </button>
                            )
                        )}
                        {sessionStorage.getItem('spy_token') && (
                            <div style={{ textAlign: 'center', marginTop: '10px', color: '#ef4444', fontSize: '13px' }}>
                                وضع المراقبة: لا يمكنك الرد على الأسئلة
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {displayPosts.length === 0 && <div style={{ textAlign: 'center', color: 'var(--hq-text-muted)', padding: '40px', fontSize: '18px' }}>لا توجد بيانات حالياً! ✨</div>}

            {/* Custom Dialog Overlay */}
            {dialog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'var(--hq-surface, #ffffff)', border: '1px solid var(--hq-border, #e2e8f0)', borderRadius: '16px', padding: '25px', width: '400px', maxWidth: '90%', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
                        <h3 style={{ color: 'inherit', marginTop: 0, marginBottom: '15px', fontSize: '18px', lineHeight: 1.5, fontWeight: 'bold' }}>{dialog.message}</h3>

                        {dialog.type === 'prompt' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                                {dialog.options.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => dialog.onConfirm(opt.value)}
                                        style={{ background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)', border: '1px solid var(--hq-primary)', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {dialog.type === 'input' && (
                            <div style={{ marginBottom: '20px' }}>
                                <textarea
                                    autoFocus
                                    placeholder="اكتب السبب هنا أستاذي..."
                                    defaultValue={dialog.defaultValue}
                                    id="dialog-reason-input-qa"
                                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--hq-border)', background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)', fontWeight: '500', resize: 'none' }}
                                    rows={3}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: (dialog.type === 'prompt' || dialog.type === 'input') ? 0 : '20px' }}>
                            {(dialog.type !== 'prompt' && dialog.type !== 'input') && (
                                <button onClick={dialog.onConfirm} style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>موافق</button>
                            )}

                            {dialog.type === 'input' && (
                                <button
                                    onClick={() => dialog.onConfirm(document.getElementById('dialog-reason-input-qa').value)}
                                    style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                                >
                                    حفظ وتطبيق
                                </button>
                            )}

                            {dialog.type !== 'alert' && (
                                <button onClick={dialog.onCancel} style={{ background: 'transparent', color: 'var(--hq-text-muted)', border: '1px solid var(--hq-text-muted)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>إلغاء</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
