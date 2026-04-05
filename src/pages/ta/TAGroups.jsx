import React, { useState, useEffect, useRef } from 'react'
import { API } from '../../config'
import { HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineMicrophone, HiOutlineStop, HiOutlineTrash, HiOutlineNoSymbol, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlinePhoto } from 'react-icons/hi2'

export const TAGroups = () => {
    const [courses, setCourses] = useState([])
    const [groups, setGroups] = useState([])
    const [activeCourseId, setActiveCourseId] = useState(null)
    const [activeGroupId, setActiveGroupId] = useState(null)
    const [messages, setMessages] = useState([])
    const [messageText, setMessageText] = useState('')
    const [file, setFile] = useState(null)
    const [dialog, setDialog] = useState(null) // { type, message, options?, onConfirm, onCancel }
    const fileInputRef = useRef(null)
    const endOfMessagesRef = useRef(null)

    // Audio Recorder
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    // Private Messaging Target
    const [privateTarget, setPrivateTarget] = useState(null) // { id, name }
    const [inboxContacts, setInboxContacts] = useState([])

    // WS reference
    const wsRef = useRef(null)

    // 1. Fetch available courses on mount
    useEffect(() => {
        const fetchCourses = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
            const res = await fetch(API + '/api/hq/courses/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCourses(data.results || data)
            }
            const resGr = await fetch(API + '/api/hq/coursegroups/?page_size=5000', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (resGr.ok) {
                const dataGr = await resGr.json()
                setGroups(dataGr.results || dataGr)
            }
        }
        fetchCourses()
        return () => stopPolling()
    }, [])

    const stopPolling = () => {
        if (wsRef.current) {
            wsRef.current.close()
            wsRef.current = null
        }
    }

    const startPolling = (courseId, groupId) => {
        stopPolling()
        fetchMessages(courseId, groupId)

        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const wsUrl = `ws://127.0.0.1:8000/ws/chat/${courseId}/${groupId}/?token=${tk}`;
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);
            if (data.message) {
                setMessages(prev => {
                    if (prev.find(m => m.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
                // Update inbox unread counts for private messages
                if (data.message.is_private && data.message.sender) {
                    setInboxContacts(prev => {
                        const senderId = data.message.sender.id;
                        const exists = prev.find(c => c.id === senderId);
                        if (exists) {
                            return prev.map(c => c.id === senderId ? { ...c, unread_count: (c.unread_count || 0) + 1 } : c);
                        } else {
                            return [...prev, { id: senderId, name: data.message.sender.full_name || data.message.sender.username, username: data.message.sender.username, unread_count: 1 }];
                        }
                    });
                }
                fetchInbox(courseId, groupId);
            }
        };

        wsRef.current = ws;
    }

    const fetchMessages = async (courseId, groupId) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/interactions/group-chat/?course=${courseId}&group=${groupId}&type=all`, {
            headers: { 'Authorization': `Bearer ${tk}` }
        })
        if (res.ok) {
            const data = await res.json()
            setMessages(data)
        }
    }

    const fetchInbox = async (courseId, groupId) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const res = await fetch(`${API}/api/interactions/ta-inbox/?course=${courseId}&group=${groupId}`, {
            headers: { 'Authorization': `Bearer ${tk}` }
        })
        if (res.ok) {
            setInboxContacts(await res.json())
        }
    }

    // Scroll to bottom when messages update
    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleHide = (msgId) => {
        setDialog({
            type: 'confirm',
            message: 'متأكد من إخفاء هذه الرسالة؟ ستبدو محذوفة للجميع.',
            onConfirm: async () => {
                setDialog(null)
                const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
                try {
                    await fetch(`${API}/api/interactions/moderate/hide/groupmessage/${msgId}/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    });
                    fetchMessages(activeCourseId, activeGroupId);
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
                    // Show second dialog for reason
                    setDialog({
                        type: 'input',
                        message: 'أدخل سبب الإجراء (سيظهر في الهيستوري والتقارير):',
                        defaultValue: 'مخالفة سياسة الدردشة',
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
            fetchInbox(activeCourseId, activeGroupId);
        } catch (e) {
            alert('خطأ في العملية');
        }
    }

    const handleSelectGroup = (courseId, groupId) => {
        setActiveCourseId(courseId)
        setActiveGroupId(groupId)
        setMessages([])
        setPrivateTarget(null)
        setInboxContacts([])
        fetchInbox(courseId, groupId)
        startPolling(courseId, groupId)
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("يرجى السماح باستخدام الميكروفون لتسجيل الصوت.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendMessage = async () => {
        if (!messageText.trim() && !file && !audioBlob) return

        const fd = new FormData()
        fd.append('course', activeCourseId)
        fd.append('group', activeGroupId)

        let finalContent = messageText;
        if (privateTarget) {
            finalContent = `__PRIVATE_MSG__[${privateTarget.id}]::${finalContent || ' '}`;
        }

        if (finalContent) fd.append('content', finalContent)

        if (file) {
            fd.append('attachment', file)
        } else if (audioBlob) {
            fd.append('attachment', new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }))
        }

        setMessageText('')
        setFile(null)
        setAudioBlob(null)
        // DO NOT reset privateTarget here — keep TA in private chat mode

        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        await fetch(API + '/api/interactions/group-chat/', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tk}` },
            body: fd
        })
        // No fetchMessages call because WebSocket will push it!
    }

    return (
        <div style={{ display: 'flex', height: '80vh', gap: '20px' }}>
            {/* Left Sidebar: Select Course & Group */}
            <div style={{ width: '250px', background: 'var(--hq-surface)', border: '1px solid var(--hq-border)', borderRadius: '12px', padding: '15px', overflowY: 'auto' }}>
                <h3 style={{ color: 'var(--hq-primary)', margin: '0 0 20px 0', fontSize: '16px' }}>قوائم الكورسات والمجموعات</h3>
                {courses.map(c => {
                    const courseGroups = groups.filter(g => g.course === c.id)

                    return (
                        <div key={c.id} style={{ marginBottom: '15px' }}>
                            <div style={{ color: 'var(--hq-text-main)', fontWeight: 'bold', marginBottom: '8px' }}>{c.title}</div>
                            {courseGroups.length === 0 ? (
                                <div style={{ color: 'var(--hq-text-muted)', fontSize: '0.8rem', paddingRight: '10px' }}>لا توجد لك مجموعات محددة مسندة لك بهذه الدورة</div>
                            ) : courseGroups.map(g => {
                                const isActive = activeCourseId === c.id && activeGroupId === g.id
                                return (
                                    <React.Fragment key={g.id}>
                                        <div
                                            onClick={() => handleSelectGroup(c.id, g.id)}
                                            style={{
                                                padding: '10px',
                                                background: isActive ? 'rgba(131, 42, 150, 0.1)' : 'transparent',
                                                color: isActive ? 'var(--hq-primary)' : 'var(--hq-text-muted)',
                                                borderLeft: isActive ? '3px solid var(--hq-primary)' : '3px solid transparent',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                marginBottom: '5px',
                                                borderRadius: '0 8px 8px 0',
                                                fontWeight: isActive ? 'bold' : 'normal'
                                            }}
                                        >
                                            مجموعة الدورة ({g.index})
                                        </div>
                                        {/* Nested Accordion for Inbox */}
                                        {isActive && (
                                            <div style={{ paddingRight: '15px', display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '10px', borderRight: '1px solid var(--hq-border)' }}>
                                                {/* Global Chat */}
                                                <div
                                                    onClick={() => setPrivateTarget(null)}
                                                    style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', background: privateTarget === null ? 'rgba(131, 42, 150, 0.1)' : 'transparent', color: privateTarget === null ? 'var(--hq-primary)' : 'var(--hq-text-muted)', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: privateTarget === null ? 'bold' : 'normal' }}
                                                >
                                                    🌍 الدردشة العامة
                                                </div>
                                                {/* Private Inbox Contacts */}
                                                {inboxContacts.map(contact => (
                                                    <div
                                                        key={contact.id}
                                                        onClick={() => {
                                                            setPrivateTarget(contact);
                                                            setInboxContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread_count: 0 } : c));
                                                        }}
                                                        style={{ padding: '8px', cursor: 'pointer', fontSize: '12px', background: privateTarget?.id === contact.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: privateTarget?.id === contact.id ? '#10b981' : 'var(--hq-text-muted)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: privateTarget?.id === contact.id ? 'bold' : 'normal' }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                                            💬 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name || contact.username}</span>
                                                            {contact.muted_until && new Date(contact.muted_until) > new Date() && (
                                                                <span title="هذا الطالب محظور حالياً" style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                                                    <HiOutlineNoSymbol size={12} />
                                                                </span>
                                                            )}
                                                        </div>
                                                        {contact.unread_count > 0 && (
                                                            <span style={{ background: '#ef4444', color: 'white', padding: '1px 5px', borderRadius: '8px', fontSize: '10px' }}>{contact.unread_count}</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </React.Fragment>
                                )
                            })}
                        </div>
                    )
                })}
            </div>

            {/* Right Side: Chat Box */}
            <div style={{ flex: 1, background: 'var(--hq-surface)', border: '1px solid var(--hq-border)', borderRadius: '12px', display: 'flex', flexDirection: 'column' }}>
                {activeCourseId ? (
                    <>
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-text-main)', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {privateTarget ? (
                                <>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{(privateTarget.name || 'ط')[0]}</div>
                                    <span>محادثة خاصة: {privateTarget.name}</span>
                                </>
                            ) : (
                                <span>المحادثة الحية: مجموعة ({groups.find(g => g.id === activeGroupId)?.index}) 🔴</span>
                            )}
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {messages.filter(m => {
                                if (!privateTarget) return !m.is_private; // In global room, show only public messages
                                return m.is_private && (m.sender?.id === privateTarget.id || m.recipient_id === privateTarget.id);
                            }).map(m => (
                                <div key={m.id} style={{
                                    background: m.is_hidden ? 'rgba(239, 68, 68, 0.05)' : (m.sender_role === 'teacher' ? 'rgba(245, 158, 11, 0.08)' : (m.sender_role === 'assistant' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)')),
                                    padding: '15px',
                                    borderRadius: '12px',
                                    width: 'fit-content',
                                    maxWidth: '80%',
                                    border: m.is_hidden ? '1px dashed #ef4444' : (m.sender_role === 'teacher' ? '1px solid rgba(245, 158, 11, 0.3)' : (m.sender_role === 'assistant' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--hq-border)'))
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.sender_role === 'teacher' ? '#f59e0b' : (m.sender_role === 'assistant' ? '#10b981' : 'var(--hq-primary)'), fontSize: '13px', fontWeight: 'bold' }}>
                                            {m.sender?.full_name || m.sender?.username}
                                            {m.sender_role === 'teacher' && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>أستاذ المادة</span>}
                                            {m.sender_role === 'assistant' && <span style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>مساعد</span>}
                                            {m.is_hidden && <span style={{ color: '#ef4444', fontSize: '11px' }}>(رسالة محذوفة)</span>}
                                        </div>
                                        {(!m.is_teacher && !m.is_hidden && !sessionStorage.getItem('spy_token')) && (
                                            <div style={{ display: 'flex', gap: '10px', marginRight: '20px' }}>
                                                <button onClick={() => setPrivateTarget({ id: m.sender.id, name: m.sender.full_name || m.sender.username })} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineChatBubbleOvalLeftEllipsis size={16} /> رد خاص</button>
                                                <button onClick={() => handleMute(m.sender.id, m.sender.full_name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineNoSymbol size={16} /> كتم مؤقت</button>
                                                <button onClick={() => handleHide(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineTrash size={16} /> حذف</button>
                                            </div>
                                        )}
                                    </div>
                                    {m.content && <div style={{ color: m.is_hidden ? 'var(--hq-text-muted)' : (m.is_private ? '#10b981' : 'var(--hq-text-main)'), lineHeight: '1.5', textDecoration: m.is_hidden ? 'line-through' : 'none', fontWeight: m.is_private ? 'bold' : 'normal' }}>
                                        {m.is_private && <span>(رسالة خاصة) </span>}
                                        {m.content}
                                    </div>}
                                    {m.attachment && (
                                        <div style={{ marginTop: '10px' }}>
                                            {m.attachment.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i) ? (
                                                <img src={m.attachment} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px', border: '1px solid var(--hq-border)' }} />
                                            ) : m.attachment.match(/\.(webm|mp3|ogg|wav)(\?|$)/i) || m.attachment.includes('voice-message') ? (
                                                <audio controls src={m.attachment} style={{ height: '40px', maxWidth: '100%' }} />
                                            ) : (
                                                <a href={m.attachment} target="_blank" rel="noreferrer" style={{ color: 'var(--hq-primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '5px' }}>📄 عرض المُرفق</a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {!sessionStorage.getItem('spy_token') ? (
                            <div style={{ padding: '15px', borderTop: '1px solid var(--hq-border)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {privateTarget && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 15px', borderRadius: '8px', color: '#10b981', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>أنت الآن في وضع الرد الخاص 🕵️ على: <strong>{privateTarget.name}</strong></span>
                                        <button onClick={() => setPrivateTarget(null)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}>إلغاء ×</button>
                                    </div>
                                )}

                                {/* Attachment Preview Badge */}
                                {(file || audioBlob) && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '10px 15px', borderRadius: '12px', color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                                            {audioBlob ? <HiOutlineMicrophone size={18} /> : <HiOutlinePaperClip size={18} />}
                                            <span>{audioBlob ? 'مقطع صوتي مسجل جاهز للإرسال 🎵' : `مرفق جاهز للإرسال: ${file.name}`}</span>
                                        </div>
                                        <button onClick={() => { setFile(null); setAudioBlob(null); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>إلغاء المرفق ×</button>
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ background: 'transparent', color: file ? '#10b981' : 'var(--hq-text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                        title="إرفاق صورة"
                                    >
                                        <HiOutlinePhoto size={24} />
                                    </button>
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{ background: 'transparent', color: file ? '#10b981' : 'var(--hq-text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                        title="إرفاق ملف"
                                    >
                                        <HiOutlinePaperClip size={24} />
                                    </button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        style={{ display: 'none' }}
                                        onChange={e => setFile(e.target.files[0])}
                                    />

                                    {!isRecording ? (
                                        <button
                                            onClick={startRecording}
                                            style={{ background: 'transparent', color: 'var(--hq-text-muted)', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', fontSize: '18px', alignItems: 'center', justifyContent: 'center' }}
                                            title="تسجيل رسالة صوتية"
                                        >
                                            <HiOutlineMicrophone size={22} />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopRecording}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '10px', borderRadius: '50%', cursor: 'pointer', display: 'flex', fontSize: '18px', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1s infinite' }}
                                            title="إيقاف وحفظ"
                                        >
                                            <HiOutlineStop size={22} />
                                        </button>
                                    )}

                                    <input
                                        type="text"
                                        value={messageText}
                                        onChange={e => setMessageText(e.target.value)}
                                        placeholder={file ? `تم أختيار مرفق: ${file.name}` : (audioBlob ? "تم التقاط بصمة صوتية 🎵" : (isRecording ? "جاري التسجيل أستاذي..." : "اكتب رسالة توجيهية للطلاب هنا..."))}
                                        style={{ flex: 1, padding: '12px', borderRadius: '24px', border: privateTarget ? '1px solid #10b981' : '1px solid var(--hq-border)', background: 'var(--hq-surface)', color: 'var(--hq-text-main)' }}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        disabled={isRecording}
                                    />

                                    <button
                                        onClick={sendMessage}
                                        style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    >
                                        <HiOutlinePaperAirplane size={20} style={{ transform: 'rotate(-45deg)', marginLeft: '2px', marginTop: '-2px' }} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '15px', borderTop: '1px solid var(--hq-border)', textAlign: 'center', color: '#ef4444', fontWeight: 'bold' }}>
                                لقد قمت بالدخول في وضع المراقبة 🕵️‍♂️ (لا يمكنك إرسال رسائل أو التعديل)
                            </div>
                        )}
                    </>
                ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hq-text-muted)' }}>
                        رجاءً قم باختيار مجموعة لبدء التتبع والتوجيه المباشر
                    </div>
                )}
            </div>

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
                                    id="dialog-reason-input"
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
                                    onClick={() => dialog.onConfirm(document.getElementById('dialog-reason-input').value)}
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
