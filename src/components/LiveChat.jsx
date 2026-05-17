import { useState, useEffect, useRef } from 'react'
import { API } from '../config'
import { HiOutlineUserGroup, HiOutlineXMark, HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineMicrophone, HiOutlineStop, HiOutlinePhoto, HiOutlineArrowDownTray, HiOutlineEye, HiOutlineArrowUturnLeft } from 'react-icons/hi2'
import '../pages/LessonViewer.css' // Reuse the same CSS

const groupChatHistoryCache = new Map()

const fetchGroupChatOnce = (key, url, options) => {
    if (groupChatHistoryCache.has(key)) return groupChatHistoryCache.get(key)
    const request = fetch(url, options).then(r => {
        if (!r.ok) throw new Error(`Failed to load chat history: ${r.status}`)
        return r.json()
    }).finally(() => {
        groupChatHistoryCache.delete(key)
    })
    groupChatHistoryCache.set(key, request)
    return request
}

const LiveChat = ({ courseId, userData, lessonId = null }) => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [chatType, setChatType] = useState('public') // 'public' | 'private'
    const [socket, setSocket] = useState(null)
    const [loading, setLoading] = useState(true)

    // Attachments & Voice
    const [file, setFile] = useState(null)
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const [fullScreenImage, setFullScreenImage] = useState(null)
    const fileInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    const isMuted = userData?.muted_until && new Date(userData.muted_until) > new Date();
    const messagesEndRef = useRef(null)
    const [privateUnread, setPrivateUnread] = useState(0)
    const [publicUnread, setPublicUnread] = useState(0)
    const chatTypeRef = useRef(chatType)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const markedReadRef = useRef(new Set())
    const isHistoryLoadRef = useRef(false)

    const [readReceiptPopup, setReadReceiptPopup] = useState(null)
    const [readReceiptData, setReadReceiptData] = useState(null)
    const [readReceiptLoading, setReadReceiptLoading] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        if (!isHistoryLoadRef.current) {
            scrollToBottom()
        }
        isHistoryLoadRef.current = false
    }, [messages])

    // Load initial history when chatType changes
    useEffect(() => {
        setLoading(true)
        setOffset(0)
        setHasMore(true)
        const t = localStorage.getItem('access_token')
        if (!t || !courseId) {
            setLoading(false)
            return
        }
        let isActive = true
        const requestKey = `${courseId}:${chatType}:${t}:0` // Append offset to key
        fetchGroupChatOnce(
            requestKey,
            `${API}/api/interactions/group-chat/?course=${courseId}&type=${chatType}&offset=0&limit=50`,
            { headers: { 'Authorization': `Bearer ${t}` } }
        )
            .then(d => {
                if (!isActive) return
                if (d.length < 50) setHasMore(false)
                setMessages(d)
                setLoading(false)
            })
            .catch(() => {
                if (!isActive) return
                setLoading(false)
            })
        return () => {
            isActive = false
        }
    }, [courseId, chatType])

    // WebSocket Setup
    useEffect(() => {
        const t = localStorage.getItem('access_token')
        if (!t) return

        const wsUrl = API.replace(/^http/, 'ws')
        const baseUrl = wsUrl.endsWith('/') ? wsUrl.slice(0, -1) : wsUrl

        const ws = new WebSocket(`${baseUrl}/ws/chat/${courseId}/?token=${t}`)
        setSocket(ws)

        ws.onmessage = (e) => {
            const data = JSON.parse(e.data)
            if (data.type === 'messages_read') {
                setMessages(prev => prev.map(m => {
                    if (data.message_ids.includes(m.id)) {
                        return { ...m, read_by_student: data.read_by_student }
                    }
                    return m
                }))
            } else if (data.type === 'message_pinned') {
                setMessages(prev => prev.map(m => {
                    if (m.id === data.message_id) {
                        return { ...m, is_pinned: data.is_pinned };
                    }
                    if (data.is_pinned) {
                        return { ...m, is_pinned: false };
                    }
                    return m;
                }));
            } else if (data.message) {
                setMessages(prev => {
                    return [...prev.filter(m => m.id !== data.message.id), data.message]
                })
                // Track unread notifications for the tab that's NOT active
                const isMsgPrivate = data.message.is_private === true
                if (isMsgPrivate && chatTypeRef.current !== 'private') {
                    setPrivateUnread(prev => prev + 1)
                } else if (!isMsgPrivate && chatTypeRef.current !== 'public') {
                    setPublicUnread(prev => prev + 1)
                }
            }
        }

        ws.onclose = () => console.log('Chat socket closed')

        return () => ws.close()
    }, [courseId])

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
                const mimeType = mediaRecorder.mimeType || 'audio/webm';
                const blob = new Blob(audioChunksRef.current, { type: mimeType });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
        } catch (err) {
            alert("يرجى السماح باستخدام الميكروفون لتسجيل الصوت.");
        }
    };

    const loadMoreMessages = async () => {
        if (!hasMore) return;
        const newOffset = offset + 50;
        const tk = localStorage.getItem('access_token');
        try {
            const container = document.querySelector('.lv-gc-msgs');
            const oldScrollHeight = container ? container.scrollHeight : 0;

            const res = await fetch(`${API}/api/interactions/group-chat/?course=${courseId}&type=all&offset=${newOffset}&limit=50`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length < 50) setHasMore(false);
                
                isHistoryLoadRef.current = true;
                setMessages(prev => [...data, ...prev]);
                setOffset(newOffset);

                setTimeout(() => {
                    const newContainer = document.querySelector('.lv-gc-msgs');
                    if (newContainer && oldScrollHeight > 0) {
                        newContainer.scrollTop = newContainer.scrollHeight - oldScrollHeight;
                    }
                }, 50);
            }
        } catch (err) {
            console.error('Failed to load more messages', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const handleSend = async () => {
        if (!input.trim() && !file && !audioBlob) return

        if (file || audioBlob) {
            const fd = new FormData()
            fd.append('course', courseId)
            fd.append('is_private', chatType === 'private')
            if (lessonId) fd.append('lesson_id', lessonId)
            if (input.trim()) fd.append('content', input.trim())
            if (replyingTo) fd.append('reply_to_id', replyingTo.id)

            if (file) {
                fd.append('attachment', file)
            } else if (audioBlob) {
                const ext = audioBlob.type.includes('mp4') ? 'mp4' : (audioBlob.type.includes('ogg') ? 'ogg' : 'webm');
                fd.append('attachment', new File([audioBlob], `voice-message.${ext}`, { type: audioBlob.type }))
            }

            setInput('')
            setFile(null)
            setAudioBlob(null)
            setReplyingTo(null)

            const tk = localStorage.getItem('access_token')
            await fetch(API + '/api/interactions/group-chat/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}` },
                body: fd
            })
        } else {
            if (!socket) return
            const payload = { content: input, is_private: chatType === 'private', lesson_id: lessonId }
            if (replyingTo) payload.reply_to_id = replyingTo.id
            socket.send(JSON.stringify(payload))
            setInput('')
            setReplyingTo(null)
        }
    }

    // Mark as read logic
    useEffect(() => {
        let unreadIds = []
        if (chatType === 'private') {
            const unreadPrivate = displayedMessages.filter(m => (m.sender_role === 'teacher' || m.sender_role === 'assistant') && !m.is_read && !m.read_by_student);
            unreadIds = unreadPrivate.map(m => m.id);
        } else if (chatType === 'public' && userData?.role === 'student') {
            const unreadPublic = displayedMessages.filter(m => {
                const isStaff = m.sender_role === 'teacher' || m.sender_role === 'assistant' || m.is_ta || m.sender?.role === 'teacher' || m.sender?.role === 'assistant' || m.sender?.is_ta;
                return isStaff && !markedReadRef.current.has(m.id);
            });
            unreadIds = unreadPublic.map(m => m.id);
            unreadIds.forEach(id => markedReadRef.current.add(id));
        }

        if (unreadIds.length > 0) {
            const tk = localStorage.getItem('access_token')
            fetch(API + '/api/interactions/group-chat/mark-read/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_ids: unreadIds })
            }).catch(() => {}) // Ignore errors if endpoint doesn't exist
        }
    }, [messages, chatType, userData])

    const openReadReceipts = async (msgId) => {
        setReadReceiptPopup(msgId)
        setReadReceiptLoading(true)
        setReadReceiptData(null)
        try {
            const tk = localStorage.getItem('access_token')
            const res = await fetch(`${API}/api/interactions/group-chat/${msgId}/read-receipts/`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setReadReceiptData(data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setReadReceiptLoading(false)
        }
    }

    // Filter messages to strictly enforce what we see
    const displayedMessages = messages.filter(m => {
        const isMsgPrivate = m.is_private === true
        return chatType === 'private' ? isMsgPrivate : !isMsgPrivate
    })

    const pinnedMessages = displayedMessages.filter(m => m.is_pinned)
    const latestPinned = pinnedMessages.length > 0 ? pinnedMessages[pinnedMessages.length - 1] : null

    return (
        <div className="lv-tab-pane lv-fade" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'transparent', height: '100%', overflow: 'hidden' }}>
            <div className="lv-chat-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '10px', padding: '15px 15px 0 15px', flexShrink: 0 }}>
                <button className={`lv-chat-tab ${chatType === 'public' ? 'active' : ''}`} onClick={() => { setChatType('public'); chatTypeRef.current = 'public'; setPublicUnread(0); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: chatType === 'public' ? 'var(--primary-dark)' : 'transparent', color: '#000', position: 'relative' }}>
                    🌐 مجموعة المادة
                    {publicUnread > 0 && <span style={{ position: 'absolute', top: '-6px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(239,68,68,0.5)' }}>{publicUnread}</span>}
                </button>
                <button className={`lv-chat-tab ${chatType === 'private' ? 'active' : ''}`} onClick={() => { setChatType('private'); chatTypeRef.current = 'private'; setPrivateUnread(0); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: chatType === 'private' ? 'var(--primary-dark)' : 'transparent', color: chatType === 'private' ? '#fff' : 'var(--text-muted)', position: 'relative' }}>
                    💬 خاص مع المساعد
                    {privateUnread > 0 && <span style={{ position: 'absolute', top: '-6px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(239,68,68,0.5)', animation: 'pulse 1.5s infinite' }}>{privateUnread}</span>}
                </button>
            </div>

            <div className="lv-gc-header" style={{ margin: '0 15px', flexShrink: 0 }}>
                <div className="lv-gc-info">
                    <div className="lv-gc-icon"><HiOutlineUserGroup /></div>
                    <div>
                        <h4>{chatType === 'public' ? 'مجموعة المادة العامة' : 'تواصل مع المساعد المباشر'}</h4>
                        <p style={{ marginTop: '4px' }}>{chatType === 'public' ? 'شوف رسائل المدرس وباقي الطلاب واسأل بمجموعة الدورة' : 'رسائلك هنا يشوفها الأستاذ والمساعد فقط ويجاوبك بشكل خاص'}</p>
                    </div>
                </div>
            </div>

            {latestPinned && chatType === 'public' && (
                <div 
                    onClick={() => {
                        const msgEl = document.getElementById(`msg-${latestPinned.id}`);
                        if (msgEl) {
                            msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            const oldBg = msgEl.style.background;
                            msgEl.style.transition = 'background 0.5s ease';
                            msgEl.style.background = 'rgba(236, 54, 101, 0.15)';
                            setTimeout(() => { msgEl.style.background = oldBg }, 1500);
                        }
                    }}
                    style={{ margin: '10px 15px 0', padding: '10px 15px', background: 'linear-gradient(90deg, rgba(236, 54, 101, 0.1), rgba(131, 42, 150, 0.05))', border: '1px solid var(--border-glow)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', flexShrink: 0, boxShadow: '0 4px 15px rgba(131, 42, 150, 0.05)', cursor: 'pointer' }}>
                    <div style={{ color: 'var(--pink)', marginTop: '2px' }}>📌</div>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--purple)', marginBottom: '4px' }}>رسالة مثبتة من {latestPinned.sender?.full_name || latestPinned.sender?.username || 'الإدارة'}</div>
                        <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{latestPinned.content || (latestPinned.attachment ? 'مرفق 📎' : 'رسالة')}</div>
                    </div>
                </div>
            )}

            <div className="lv-gc-msgs" style={{ flex: 1, overflowY: 'auto', padding: '10px 15px', minHeight: 0 }}>
                {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</p> :
                    displayedMessages.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>لا توجد رسائل سابقة. كن أول من يرسل!</p> :
                        <>
                            {hasMore && (
                                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                                    <button onClick={loadMoreMessages} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-glass)', borderRadius: '20px', padding: '6px 16px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--primary)'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
                                        تحميل المزيد من الرسائل السابقة
                                    </button>
                                </div>
                            )}
                            {displayedMessages.map(m => {
                                const isTeacher = m.sender_role === 'teacher' || m.sender?.role === 'teacher';
                                const isAssist = !isTeacher && (m.sender_role === 'assistant' || m.sender?.role === 'assistant' || m.is_ta || m.sender?.is_ta);
                                const isStaffMessage = isTeacher || isAssist;
                                return (
                                    <div id={`msg-${m.id}`} key={m.id || Math.random()} className={`lv-gc-msg ${isTeacher ? 'prof' : (isAssist ? 'assist' : '')}`} style={{
                                        display: 'flex', flexDirection: 'column',
                                        background: isTeacher ? 'rgba(245, 158, 11, 0.08)' : undefined,
                                        borderColor: isTeacher ? 'rgba(245, 158, 11, 0.3)' : undefined
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isTeacher ? '#b45309' : undefined }}>
                                                {isStaffMessage ? (m.sender?.full_name || m.sender?.first_name || m.sender_name || 'مساعد') : (m.sender?.username || m.sender_username || 'طالب')}
                                                {isTeacher && <span style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>أستاذ المادة</span>}
                                                {isAssist && <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>مساعد</span>}
                                            </strong>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {chatType === 'public' && (
                                                    <button onClick={() => setReplyingTo(m)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '2px' }} title="رد">
                                                        <HiOutlineArrowUturnLeft size={14} />
                                                    </button>
                                                )}
                                                {isStaffMessage && chatType === 'public' && userData && userData.role !== 'student' && (
                                                    <button 
                                                        onClick={() => openReadReceipts(m.id)}
                                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                        title="تفاصيل القراءة"
                                                    >
                                                        <HiOutlineEye size={16} />
                                                    </button>
                                                )}
                                                <span style={{ fontSize: '0.75rem', color: isStaffMessage ? 'var(--text-muted)' : '#64748b', opacity: 0.8 }}>{new Date(m.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        </div>
                                        
                                        {m.replied_to && (
                                            <div 
                                                onClick={() => {
                                                    const msgEl = document.getElementById(`msg-${m.replied_to.id}`);
                                                    if (msgEl) {
                                                        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        const oldBg = msgEl.style.background;
                                                        msgEl.style.transition = 'background 0.5s ease';
                                                        msgEl.style.background = 'rgba(131, 42, 150, 0.15)';
                                                        setTimeout(() => { msgEl.style.background = oldBg }, 1500);
                                                    }
                                                }}
                                                style={{ background: 'rgba(0,0,0,0.05)', padding: '6px 10px', borderRadius: '8px', borderRight: '3px solid var(--primary)', marginBottom: '8px', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.8 }}
                                            >
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '2px' }}>{m.replied_to.sender_name}</div>
                                                <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.replied_to.content || (m.replied_to.has_attachment ? 'مرفق 📎' : '')}</div>
                                            </div>
                                        )}
                                        
                                        {m.content && <div style={{ color: isTeacher ? '#92400e' : (isAssist ? '#065f46' : 'var(--text-primary)'), lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            {m.content}
                                        </div>}
                                        
                                        {m.attachment && (
                                            <div style={{ marginTop: '10px' }}>
                                                {m.attachment.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i) ? (
                                                    <div style={{ position: 'relative', display: 'inline-block' }}>
                                                        <div onClick={() => setFullScreenImage(m.attachment)} style={{ display: 'block', cursor: 'zoom-in' }}>
                                                            <img src={m.attachment} alt="مرفق" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px', border: '1px solid var(--border-glass)', display: 'block' }} />
                                                        </div>
                                                    </div>
                                                ) : m.attachment.match(/\.(webm|mp3|ogg|wav|mp4)(\?|$)/i) || m.attachment.includes('voice-message') ? (
                                                    <audio controls src={m.attachment} style={{ height: '40px', width: '100%', maxWidth: '250px' }} />
                                                ) : (
                                                    <a href={m.attachment} download target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '8px', width: 'fit-content', fontWeight: 'bold' }}>
                                                        <HiOutlineArrowDownTray size={18} />
                                                        تحميل المُرفق
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                            <div ref={messagesEndRef} />
                        </>
                }
            </div>

            {isMuted && chatType === 'public' ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderTop: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', color: '#ef4444', textAlign: 'center', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexShrink: 0 }}>
                    <HiOutlineXMark /> عذراً، أنت محظور من الدردشة العامة حالياً حتى {new Date(userData.muted_until).toLocaleString('ar-IQ')}
                </div>
            ) : (
                <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {replyingTo && (
                        <div style={{ background: 'rgba(131, 42, 150, 0.05)', border: '1px solid rgba(131, 42, 150, 0.2)', padding: '8px 12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderRight: '4px solid var(--primary)' }}>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', marginBottom: '2px' }}>الرد على {replyingTo.sender?.full_name || replyingTo.sender?.username}</div>
                                <div style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyingTo.content || (replyingTo.attachment ? 'مرفق 📎' : '')}</div>
                            </div>
                            <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><HiOutlineXMark size={18} /></button>
                        </div>
                    )}
                    {(file || audioBlob) && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '8px 12px', borderRadius: '8px', color: '#10b981', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold' }}>
                                {audioBlob ? <HiOutlineMicrophone size={16} /> : <HiOutlinePaperClip size={16} />}
                                <span>{audioBlob ? 'مقطع صوتي جاهز للإرسال 🎵' : `مرفق: ${file.name}`}</span>
                            </div>
                            <button onClick={() => { setFile(null); setAudioBlob(null); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>إلغاء ×</button>
                        </div>
                    )}
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {chatType === 'private' && (
                            <>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ background: 'transparent', color: file ? '#10b981' : 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    title="إرفاق صورة"
                                >
                                    <HiOutlinePhoto size={20} />
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{ background: 'transparent', color: file ? '#10b981' : 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                    title="إرفاق ملف"
                                >
                                    <HiOutlinePaperClip size={20} />
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
                                        style={{ background: 'transparent', color: 'var(--text-muted)', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                                        title="تسجيل رسالة صوتية"
                                    >
                                        <HiOutlineMicrophone size={20} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={stopRecording}
                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '8px', borderRadius: '50%', cursor: 'pointer', display: 'flex', animation: 'pulse 1s infinite' }}
                                        title="إيقاف وحفظ"
                                    >
                                        <HiOutlineStop size={20} />
                                    </button>
                                )}
                            </>
                        )}
                        <input 
                            type="text" 
                            className="lv-gc-input" 
                            placeholder={chatType === 'public' ? "اكتب رسالتك للمجموعة العـامة..." : (file ? `مرفق: ${file.name}` : (audioBlob ? "صوتية 🎵" : (isRecording ? "جاري التسجيل..." : "اكتب رسالتك للمساعد الخـاص...")))} 
                            value={input} 
                            onChange={e => setInput(e.target.value)} 
                            onKeyDown={e => { if (e.key === 'Enter') handleSend() }} 
                            disabled={isRecording}
                            style={{ flex: 1, padding: '10px 15px', borderRadius: '20px', border: '1px solid var(--border-glass)', background: '#fff' }}
                        />
                        <button className="lv-gc-send-btn" onClick={handleSend} style={{ background: 'var(--gradient-brand)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 15px rgba(236, 54, 101, 0.3)' }}>
                            <HiOutlinePaperAirplane style={{ transform: 'rotate(-45deg)', marginLeft: '2px', marginTop: '-2px' }} size={18} />
                        </button>
                    </div>
                </div>
            )}
            
            {/* Image Viewer Popup */}
            {fullScreenImage && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.9)', backdropFilter: 'blur(8px)', zIndex: 99999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <button onClick={() => setFullScreenImage(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '10px' }}>
                        <HiOutlineXMark size={36} />
                    </button>
                    <img src={fullScreenImage} style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }} />
                    <a href={fullScreenImage} download target="_blank" rel="noreferrer" style={{ marginTop: '24px', background: 'var(--gradient-brand)', color: 'white', padding: '12px 28px', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(236, 54, 101, 0.3)' }}>
                        <HiOutlineArrowDownTray size={22} />
                        تنزيل الصورة
                    </a>
                </div>
            )}

            {/* Read Receipts Popup */}
            {readReceiptPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--bg-secondary)', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-primary)' }}>
                            <h3 style={{ margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HiOutlineEye color="var(--primary)" /> تفاصيل مشاهدة الرسالة
                            </h3>
                            <button onClick={() => setReadReceiptPopup(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <HiOutlineXMark size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {readReceiptLoading ? (
                                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>جاري تحميل البيانات...</p>
                            ) : readReceiptData ? (
                                <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>👀 شاهدوا الرسالة</span>
                                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{readReceiptData.read_by.length}</span>
                                        </h4>
                                        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {readReceiptData.read_by.length === 0 ? (
                                                <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>لم يقم أحد برؤية الرسالة بعد</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {readReceiptData.read_by.map(s => (
                                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.name}</strong>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{s.username}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#ef4444', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>🙈 لم يشاهدوا الرسالة</span>
                                            <span style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{readReceiptData.unread_by.length}</span>
                                        </h4>
                                        <div style={{ background: 'var(--bg-primary)', borderRadius: '12px', border: '1px solid var(--border-glass)', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {readReceiptData.unread_by.length === 0 ? (
                                                <p style={{ margin: 0, color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>الجميع شاهد الرسالة!</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {readReceiptData.unread_by.map(s => (
                                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                                            <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{s.name}</strong>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{s.username}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <p style={{ textAlign: 'center', color: '#ef4444' }}>حدث خطأ أثناء تحميل البيانات.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LiveChat
