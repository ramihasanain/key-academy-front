import { useState, useEffect, useRef } from 'react'
import { API } from '../config'
import { HiOutlineUserGroup, HiOutlineXMark, HiOutlinePaperAirplane, HiOutlinePaperClip, HiOutlineMicrophone, HiOutlineStop, HiOutlinePhoto } from 'react-icons/hi2'
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
    const fileInputRef = useRef(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    const isMuted = userData?.muted_until && new Date(userData.muted_until) > new Date();
    const messagesEndRef = useRef(null)
    const [privateUnread, setPrivateUnread] = useState(0)
    const [publicUnread, setPublicUnread] = useState(0)
    const chatTypeRef = useRef(chatType)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Load initial history when chatType changes
    useEffect(() => {
        setLoading(true)
        const t = localStorage.getItem('access_token')
        if (!t || !courseId) {
            setLoading(false)
            return
        }
        let isActive = true
        const requestKey = `${courseId}:${chatType}:${t}`
        fetchGroupChatOnce(
            requestKey,
            `${API}/api/interactions/group-chat/?course=${courseId}&type=${chatType}`,
            { headers: { 'Authorization': `Bearer ${t}` } }
        )
            .then(d => {
                if (!isActive) return
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

    const handleSend = async () => {
        if (!input.trim() && !file && !audioBlob) return

        if (file || audioBlob) {
            const fd = new FormData()
            fd.append('course', courseId)
            fd.append('is_private', chatType === 'private')
            if (lessonId) fd.append('lesson_id', lessonId)
            if (input.trim()) fd.append('content', input.trim())

            if (file) {
                fd.append('attachment', file)
            } else if (audioBlob) {
                fd.append('attachment', new File([audioBlob], 'voice-message.webm', { type: 'audio/webm' }))
            }

            setInput('')
            setFile(null)
            setAudioBlob(null)

            const tk = localStorage.getItem('access_token')
            await fetch(API + '/api/interactions/group-chat/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}` },
                body: fd
            })
        } else {
            if (!socket) return
            const payload = { content: input, is_private: chatType === 'private', lesson_id: lessonId }
            socket.send(JSON.stringify(payload))
            setInput('')
        }
    }

    // Mark as read logic
    useEffect(() => {
        if (chatType === 'private') {
            const unreadMessages = displayedMessages.filter(m => (m.sender_role === 'teacher' || m.sender_role === 'assistant') && !m.is_read && !m.read_by_student);
            if (unreadMessages.length > 0) {
                const tk = localStorage.getItem('access_token')
                fetch(API + '/api/interactions/group-chat/mark-read/', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message_ids: unreadMessages.map(m => m.id) })
                }).catch(() => {}) // Ignore errors if endpoint doesn't exist
            }
        }
    }, [messages, chatType])

    // Filter messages to strictly enforce what we see
    const displayedMessages = messages.filter(m => {
        const isMsgPrivate = m.is_private === true
        return chatType === 'private' ? isMsgPrivate : !isMsgPrivate
    })

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

            <div className="lv-gc-msgs" style={{ flex: 1, overflowY: 'auto', padding: '10px 15px', minHeight: '200px' }}>
                {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</p> :
                    displayedMessages.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>لا توجد رسائل سابقة. كن أول من يرسل!</p> :
                        displayedMessages.map(m => {
                            const isTeacher = m.sender_role === 'teacher' || m.sender?.role === 'teacher';
                            const isAssist = !isTeacher && (m.sender_role === 'assistant' || m.sender?.role === 'assistant' || m.is_ta || m.sender?.is_ta);
                            return (
                                <div key={m.id || Math.random()} className={`lv-gc-msg ${isTeacher ? 'prof' : (isAssist ? 'assist' : '')}`} style={{
                                    display: 'flex', flexDirection: 'column',
                                    background: isTeacher ? 'rgba(245, 158, 11, 0.08)' : undefined,
                                    borderColor: isTeacher ? 'rgba(245, 158, 11, 0.3)' : undefined
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <strong style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isTeacher ? '#b45309' : undefined }}>
                                            {(isTeacher || isAssist) ? (m.sender?.full_name || m.sender?.first_name || m.sender_name || 'مساعد') : (m.sender?.username || m.sender_username || 'طالب')}
                                            {isTeacher && <span style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>أستاذ المادة</span>}
                                            {isAssist && <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>مساعد</span>}
                                        </strong>
                                        <span style={{ fontSize: '0.75rem', color: (isAssist || isTeacher) ? 'var(--text-muted)' : '#64748b', opacity: 0.8 }}>{new Date(m.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <span>{m.content}</span>
                                    {m.attachment && (
                                        <div style={{ marginTop: '10px' }}>
                                            {m.attachment.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i) ? (
                                                <img src={m.attachment} alt="مرفق" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px', border: '1px solid var(--border-glass)' }} />
                                            ) : m.attachment.match(/\.(webm|mp3|ogg|wav|mp4)(\?|$)/i) || m.attachment.includes('voice-message') ? (
                                                <audio controls src={m.attachment} style={{ height: '40px', width: '100%', maxWidth: '250px' }} />
                                            ) : (
                                                <a href={m.attachment} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '5px' }}>📄 عرض المُرفق</a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                <div ref={messagesEndRef} />
            </div>

            {isMuted && chatType === 'public' ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderTop: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', color: '#ef4444', textAlign: 'center', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', flexShrink: 0 }}>
                    <HiOutlineXMark /> عذراً، أنت محظور من الدردشة العامة حالياً حتى {new Date(userData.muted_until).toLocaleString('ar-IQ')}
                </div>
            ) : (
                <div style={{ padding: '15px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                        <button className="lv-gc-send-btn" onClick={handleSend} style={{ background: 'var(--primary)', color: '#fff', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HiOutlinePaperAirplane style={{ transform: 'rotate(-45deg)', marginLeft: '2px' }} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LiveChat
