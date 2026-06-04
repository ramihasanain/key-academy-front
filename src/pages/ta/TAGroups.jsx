import React, { useState, useEffect, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlinePaperClip, HiOutlinePaperAirplane, HiOutlineMicrophone, HiOutlineStop, HiOutlineTrash, HiOutlineNoSymbol, HiOutlineChatBubbleOvalLeftEllipsis, HiOutlinePhoto, HiOutlineArrowDownTray, HiOutlineXMark, HiOutlineEye, HiOutlineArrowUturnLeft } from 'react-icons/hi2'
import { TAStudent360 } from './TAStudent360'
import './TAGroups.css'
import { FEATURE_LOCKED_MESSAGE } from '../../constants/platformFeatures'

/** FRONTEND-ONLY: غيّر إلى true لإعادة صور/ملفات/صوت في دردشة الأستاذ والمساعد */
const STAFF_CHAT_MEDIA_ENABLED = false

export const TAGroups = () => {
    const { activeGroupId: assistantGroupId, activeGroup: assistantGroup, profile } = useOutletContext() || {}
    const isTeacherUser = profile?.role === 'teacher'
    const chatSenderLabel = isTeacherUser
        ? (profile?.teacher_name || profile?.first_name || profile?.username || 'الأستاذ')
        : 'مساعد المادة'
    const chatSenderRole = isTeacherUser ? 'teacher' : 'assistant'
    const [courses, setCourses] = useState([])
    const [showStudentProfile, setShowStudentProfile] = useState(null)
    const [groups, setGroups] = useState([])
    const [activeCourseId, setActiveCourseId] = useState(null)
    const [activeGroupId, setActiveGroupId] = useState(null)
    const [messages, setMessages] = useState([])
    const [messageText, setMessageText] = useState('')
    const [file, setFile] = useState(null)
    const [dialog, setDialog] = useState(null) // { type, message, options?, onConfirm, onCancel }
    const [fullScreenImage, setFullScreenImage] = useState(null)
    const [offset, setOffset] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const fileInputRef = useRef(null)
    const endOfMessagesRef = useRef(null)
    const isHistoryLoadRef = useRef(false)

    // Audio Recorder
    const [isRecording, setIsRecording] = useState(false)
    const [audioBlob, setAudioBlob] = useState(null)
    const mediaRecorderRef = useRef(null)
    const audioChunksRef = useRef([])

    // Private Messaging Target
    const [privateTarget, setPrivateTarget] = useState(null) // { id, name }
    const [inboxContacts, setInboxContacts] = useState([])
    const [mobileView, setMobileView] = useState('list')

    // WS reference
    const wsRef = useRef(null)
    const privateTargetRef = useRef(null)
    useEffect(() => { privateTargetRef.current = privateTarget }, [privateTarget])

    // Read Receipts Popup
    const [readReceiptPopup, setReadReceiptPopup] = useState(null)
    const [readReceiptData, setReadReceiptData] = useState(null)
    const [readReceiptLoading, setReadReceiptLoading] = useState(false)
    const [replyingTo, setReplyingTo] = useState(null)

    // 1. Fetch available courses on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission();
        }
        
        const fetchCourses = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
            const groupQs = assistantGroupId ? `?group_id=${assistantGroupId}` : ''
            const res = await fetch(API + `/api/hq/courses${groupQs}`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setCourses(data.results || data)
            }
            const resGr = await fetch(API + `/api/interactions/ta-chat-rooms${groupQs}`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (resGr.ok) {
                const dataGr = await resGr.json()
                const fetchedGroups = dataGr.rooms || []
                setGroups(fetchedGroups)
                if (fetchedGroups.length > 0) {
                     const first = fetchedGroups[0];
                     setActiveCourseId(first.course);
                     setActiveGroupId(first.id);
                     setMessages([]);
                     setPrivateTarget(null);
                     setInboxContacts([]);
                     fetchInbox(first.course, first.id);
                     startPolling(first.course, first.id);
                } else {
                     setActiveCourseId(null);
                     setActiveGroupId(null);
                     setMessages([]);
                }
            }
        }
        fetchCourses()
        return () => stopPolling()
    }, [assistantGroupId, assistantGroup])

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
        const wsBaseUrl = API.replace(/^http/, 'ws');
        const wsUrl = `${wsBaseUrl}/ws/chat/${courseId}/${groupId}/?token=${tk}`;
        const ws = new WebSocket(wsUrl);



        ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.error) {
                showChatBlocked(data.error);
                return;
            }
            
            if (data.type === 'messages_read') {
                setMessages(prev => prev.map(m => {
                    if (data.message_ids.includes(m.id)) {
                        return { ...m, read_by_student: data.read_by_student };
                    }
                    return m;
                }));
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
                    const withoutTemps = prev.filter(m => !String(m.id).startsWith('temp-'))
                    if (withoutTemps.find(m => m.id === data.message.id)) return withoutTemps
                    return [...withoutTemps, data.message]
                });

                if (data.message.is_private) {
                    const isFromStudent = data.message.sender_role === 'student'
                        || data.message.sender?.role === 'student';
                    const studentId = isFromStudent
                        ? data.message.sender?.id
                        : (data.message.recipient_id || 0);
                    if (studentId) {
                        setInboxContacts(prev => {
                            const exists = prev.find(c => c.id === studentId);
                            if (exists) {
                                return prev.map(c => c.id === studentId
                                    ? { ...c, unread_count: isFromStudent ? (c.unread_count || 0) + 1 : c.unread_count }
                                    : c);
                            }
                            return [...prev, {
                                id: studentId,
                                name: isFromStudent
                                    ? (data.message.sender?.full_name || data.message.sender?.username || 'طالب')
                                    : 'طالب',
                                username: isFromStudent ? data.message.sender?.username : '',
                                unread_count: isFromStudent ? 1 : 0,
                            }];
                        });
                        if (isFromStudent && privateTargetRef.current?.id === studentId) {
                            setMessages(prev => {
                                const withoutTemps = prev.filter(m => !String(m.id).startsWith('temp-'));
                                if (withoutTemps.find(m => m.id === data.message.id)) return withoutTemps;
                                return [...withoutTemps, data.message];
                            });
                        }
                    }
                }
                fetchInbox(courseId, groupId);
            }
        };

        wsRef.current = ws;
    }

    const fetchMessages = async (courseId, groupId) => {
        setOffset(0)
        setHasMore(true)
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const agQs = assistantGroupId ? `&group_id=${assistantGroupId}` : ''
        const res = await fetch(`${API}/api/interactions/group-chat/?course=${courseId}&group=${groupId}&type=all&offset=0&limit=50${agQs}`, {
            headers: { 'Authorization': `Bearer ${tk}` }
        })
        if (res.ok) {
            const data = await res.json()
            if (data.length < 50) setHasMore(false)
            setMessages(data)
        }
    }

    const openReadReceipts = async (msgId) => {
        setReadReceiptPopup(msgId)
        setReadReceiptLoading(true)
        setReadReceiptData(null)
        try {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
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

    const loadMoreMessages = async () => {
        if (!hasMore) return;
        const newOffset = offset + 50;
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        try {
            const container = document.getElementById('ta-chat-msgs');
            const oldScrollHeight = container ? container.scrollHeight : 0;

            const agQs = assistantGroupId ? `&group_id=${assistantGroupId}` : ''
            const res = await fetch(`${API}/api/interactions/group-chat/?course=${activeCourseId}&group=${activeGroupId}&type=all&offset=${newOffset}&limit=50${agQs}`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.length < 50) setHasMore(false);
                
                isHistoryLoadRef.current = true;
                setMessages(prev => [...data, ...prev]);
                setOffset(newOffset);

                setTimeout(() => {
                    const newContainer = document.getElementById('ta-chat-msgs');
                    if (newContainer && oldScrollHeight > 0) {
                        newContainer.scrollTop = newContainer.scrollHeight - oldScrollHeight;
                    }
                }, 50);
            }
        } catch (err) {
            console.error('Failed to load more messages', err);
        }
    }

    const fetchInbox = async (courseId, groupId) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        const agQs = assistantGroupId ? `&group_id=${assistantGroupId}` : ''
        const res = await fetch(`${API}/api/interactions/ta-inbox/?course=${courseId}&group=${groupId}${agQs}`, {
            headers: { 'Authorization': `Bearer ${tk}` }
        })
        if (res.ok) {
            setInboxContacts(await res.json())
        }
    }

    // Scroll to bottom when messages update
    useEffect(() => {
        if (!isHistoryLoadRef.current) {
            endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
        }
        isHistoryLoadRef.current = false
    }, [messages])

    const handleHide = (msgId) => {
        setDialog({
            type: 'confirm',
            message: 'متأكد من إخفاء هذه الرسالة؟ ستبدو محذوفة للجميع. لكن ستبقى ظاهرة لدى الادارة',
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

    const handlePin = async (msgId) => {
        const isCurrentlyPinned = messages.find(m => m.id === msgId)?.is_pinned;
        setMessages(prev => prev.map(m => {
            if (m.id === msgId) return { ...m, is_pinned: !isCurrentlyPinned };
            if (!isCurrentlyPinned) return { ...m, is_pinned: false };
            return m;
        }));

        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
        try {
            await fetch(`${API}/api/interactions/moderate/pin/groupmessage/${msgId}/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}` }
            });
        } catch (e) {
            console.error("Failed to pin message", e);
        }
    }

    const handleMute = (studentId, studentName, mutedUntil) => {
        const isMuted = mutedUntil && new Date(mutedUntil) > new Date();

        let options = [];
        if (isMuted) {
            options = [
                { label: 'فك الحظر (unmute)', value: 'unmute' },
                { label: 'تمديد ليوم واحد (24h)', value: '24h' },
                { label: 'تمديد لأسبوع (week)', value: 'week' },
                { label: 'تمديد للأبد (forever)', value: 'forever' }
            ];
        } else {
            options = [
                { label: 'ليوم واحد (24h)', value: '24h' },
                { label: 'لأسبوع (week)', value: 'week' },
                { label: 'للأبد (forever)', value: 'forever' }
            ];
        }

        setDialog({
            type: 'prompt',
            message: `أدخل مدة تقييد الطالب [${studentName}]:`,
            options: options,
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
        setMobileView('chat')
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

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const stripTempMessages = () => {
        setMessages(prev => prev.filter(m => !String(m.id).startsWith('temp-')))
    }

    const showChatBlocked = (message) => {
        stripTempMessages()
        alert(message || FEATURE_LOCKED_MESSAGE)
    }

    const appendMessage = (msg) => {
        setMessages(prev => {
            const withoutTemps = prev.filter(m => !String(m.id).startsWith('temp-'))
            if (withoutTemps.find(m => m.id === msg.id)) return withoutTemps
            return [...withoutTemps, msg]
        })
    }

    const sendMessage = async () => {
        const hasMedia = STAFF_CHAT_MEDIA_ENABLED && (file || audioBlob)
        if (!messageText.trim() && !hasMedia) return

        let finalContent = messageText;
        if (privateTarget) {
            finalContent = `__PRIVATE_MSG__[${privateTarget.id}]::${finalContent || ' '}`;
        }

        if (hasMedia) {
            // For attachments, we MUST use HTTP POST
            const fd = new FormData()
            fd.append('course', activeCourseId)
            fd.append('group', activeGroupId)
            if (messageText.trim()) fd.append('content', messageText.trim())
            if (replyingTo) fd.append('reply_to_id', replyingTo.id)

            if (file) {
                fd.append('attachment', file)
            } else if (audioBlob) {
                const ext = audioBlob.type.includes('mp4') ? 'mp4' : (audioBlob.type.includes('ogg') ? 'ogg' : 'webm');
                fd.append('attachment', new File([audioBlob], `voice-message.${ext}`, { type: audioBlob.type }))
            }

            setMessageText('')
            setFile(null)
            setAudioBlob(null)
            setReplyingTo(null)
            
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
            const res = await fetch(API + '/api/interactions/group-chat/', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}` },
                body: fd
            })
            if (res.ok) {
                appendMessage(await res.json())
            } else {
                let errMsg = FEATURE_LOCKED_MESSAGE
                try {
                    const err = await res.json()
                    errMsg = err.error || err.detail || errMsg
                } catch { /* ignore */ }
                showChatBlocked(errMsg)
            }
        } else {
            // For text-only messages, use WebSocket for instant delivery
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                const trimmed = messageText
                const tempMsg = {
                    id: `temp-${Date.now()}`,
                    content: trimmed,
                    sender: {
                        id: null,
                        full_name: chatSenderLabel,
                        username: isTeacherUser ? 'teacher' : 'assistant',
                        role: chatSenderRole,
                    },
                    sender_role: chatSenderRole,
                    is_private: privateTarget !== null,
                    recipient_id: privateTarget ? privateTarget.id : 0,
                    created_at: new Date().toISOString(),
                }
                appendMessage(tempMsg)
                const payload = {
                    content: trimmed,
                    is_private: privateTarget !== null,
                    recipient_id: privateTarget ? privateTarget.id : null,
                    reply_to_id: replyingTo ? replyingTo.id : null
                }
                wsRef.current.send(JSON.stringify(payload))
                setMessageText('')
                setReplyingTo(null)
            } else {
                showChatBlocked('الاتصال بالخادم مفقود. قد تكون المجموعات معطلة على حسابك.')
            }
        }
    }

    return (
        <div className="ta-chat-layout">
            {/* Left Sidebar: Select Course & Group */}
            <div className={`ta-chat-sidebar ${mobileView === 'chat' ? 'hidden-mobile' : ''}`}>
                <h3 style={{ color: 'var(--hq-primary)', margin: '0 0 20px 0', fontSize: '16px' }}>قائمة الدردشة</h3>
                
                {groups.length === 0 ? (
                    <div style={{ color: 'var(--hq-text-muted)', fontSize: '0.8rem', paddingRight: '10px' }}>لا توجد مجموعات دردشة لطلاب هذه المجموعة. تأكد من تسجيل الطلاب في دورات الأستاذ.</div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <div style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>مجموعات الدردشة</div>
                        {groups.map(g => (
                            <div
                                key={g.id}
                                onClick={() => handleSelectGroup(g.course, g.id)}
                                style={{
                                    padding: '10px',
                                    cursor: 'pointer',
                                    fontSize: '13px',
                                    background: !privateTarget && activeGroupId === g.id ? 'rgba(131, 42, 150, 0.12)' : 'transparent',
                                    color: !privateTarget && activeGroupId === g.id ? 'var(--hq-primary)' : 'var(--hq-text-main)',
                                    borderRadius: '8px',
                                    fontWeight: !privateTarget && activeGroupId === g.id ? 'bold' : 'normal',
                                }}
                            >
                                💬 {g.label || `دردشة ${g.course_title || 'الأستاذ'} — مجموعة ${g.index}`}
                                {g.students_count != null && (
                                    <span style={{ fontSize: '11px', color: 'var(--hq-text-muted)', marginRight: '6px' }}>({g.students_count})</span>
                                )}
                            </div>
                        ))}

                        <div style={{ margin: '15px 0 5px 0', fontSize: '12px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>رسائل الطلاب الخاصة</div>

                        {/* Private Inbox Contacts */}
                        {inboxContacts.map(contact => (
                            <div
                                key={contact.id}
                                onClick={() => {
                                    setPrivateTarget(contact);
                                    setInboxContacts(prev => prev.map(c => c.id === contact.id ? { ...c, unread_count: 0 } : c));
                                    setMobileView('chat');
                                }}
                                style={{ padding: '10px', cursor: 'pointer', fontSize: '13px', background: privateTarget?.id === contact.id ? 'rgba(16, 185, 129, 0.1)' : 'transparent', color: privateTarget?.id === contact.id ? '#10b981' : 'var(--hq-text-main)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontWeight: privateTarget?.id === contact.id ? 'bold' : 'normal' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                    💬 <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{contact.name || contact.username}</span>
                                    {contact.muted_until && new Date(contact.muted_until) > new Date() && (
                                        <span title="هذا الطالب محظور حالياً" style={{ color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                                            <HiOutlineNoSymbol size={14} />
                                        </span>
                                    )}
                                </div>
                                {contact.unread_count > 0 && (
                                    <span style={{ background: '#ef4444', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{contact.unread_count}</span>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Right Side: Chat Box */}
            <div className={`ta-chat-main ${mobileView === 'list' ? 'hidden-mobile' : ''}`}>
                {activeCourseId ? (
                    <>
                        <div className="ta-chat-header" style={{ padding: '15px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-text-main)', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                            <button className="ta-chat-back-btn" onClick={() => setMobileView('list')} style={{ display: 'none', border: 'none', cursor: 'pointer' }}>
                                <HiOutlineArrowUturnLeft size={20} />
                            </button>
                            <img src="/new-logo.png" alt="Logo" style={{ height: '35px', objectFit: 'contain' }} />
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                {privateTarget ? (
                                    <>
                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>{(privateTarget.name || 'ط')[0]}</div>
                                        <span>محادثة خاصة: {privateTarget.name}</span>
                                    </>
                                ) : (
                                    <span>مجموعة ({groups.find(g => g.id === activeGroupId)?.index})</span>
                                )}
                            </div>

                            <img src="/key-icon-logo.png" alt="Key Logo" style={{ height: '35px', objectFit: 'contain' }} />
                        </div>

                        <div id="ta-chat-msgs" className="ta-chat-msgs-scroll">
                            {hasMore && (
                                <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                    <button onClick={loadMoreMessages} style={{ background: 'var(--hq-surface-light, rgba(255,255,255,0.05))', border: '1px solid var(--hq-border)', borderRadius: '20px', padding: '6px 16px', color: 'var(--hq-text-muted)', cursor: 'pointer', fontSize: '0.9rem', transition: 'all 0.2s' }} onMouseOver={e => e.target.style.color = 'var(--hq-primary)'} onMouseOut={e => e.target.style.color = 'var(--hq-text-muted)'}>
                                        تحميل المزيد من الرسائل السابقة
                                    </button>
                                </div>
                            )}
                            
                            {(() => {
                                const dispMsgs = messages.filter(m => {
                                    if (!privateTarget) return !m.is_private;
                                    return m.is_private && (m.sender?.id === privateTarget.id || m.recipient_id === privateTarget.id);
                                });
                                const pinnedMsgs = dispMsgs.filter(m => m.is_pinned);
                                const latestPinned = pinnedMsgs.length > 0 ? pinnedMsgs[pinnedMsgs.length - 1] : null;
                                
                                return (
                                    <>
                                        {latestPinned && !privateTarget && (
                                            <div 
                                                onClick={() => {
                                                    const msgEl = document.getElementById(`ta-msg-${latestPinned.id}`);
                                                    if (msgEl) {
                                                        msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        const oldBg = msgEl.style.background;
                                                        msgEl.style.transition = 'background 0.5s ease';
                                                        msgEl.style.background = 'rgba(236, 54, 101, 0.15)';
                                                        setTimeout(() => { msgEl.style.background = oldBg }, 1500);
                                                    }
                                                }}
                                                style={{ padding: '10px 15px', background: 'rgba(236, 54, 101, 0.05)', border: '1px solid rgba(236, 54, 101, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px', flexShrink: 0, marginBottom: '10px', cursor: 'pointer' }}>
                                                <div style={{ color: '#ec3665', marginTop: '2px' }}>📌</div>
                                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#ec3665', marginBottom: '4px' }}>رسالة مثبتة من {latestPinned.sender?.full_name || latestPinned.sender?.username || 'الإدارة'}</div>
                                                    <div style={{ fontSize: '0.9rem', color: 'var(--hq-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{latestPinned.content || (latestPinned.attachment ? 'مرفق 📎' : 'رسالة')}</div>
                                                </div>
                                            </div>
                                        )}
                                        {dispMsgs.map(m => (
                                <div id={`ta-msg-${m.id}`} key={m.id} style={{
                                    background: m.is_pinned ? 'rgba(236, 54, 101, 0.05)' : (m.is_hidden ? 'rgba(239, 68, 68, 0.05)' : (m.sender_role === 'teacher' ? 'rgba(245, 158, 11, 0.08)' : (m.sender_role === 'assistant' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)'))),
                                    padding: '15px',
                                    borderRadius: '12px',
                                    width: 'fit-content',
                                    maxWidth: '80%',
                                    border: m.is_pinned ? '1px solid #ec3665' : (m.is_hidden ? '1px dashed #ef4444' : (m.sender_role === 'teacher' ? '1px solid rgba(245, 158, 11, 0.3)' : (m.sender_role === 'assistant' ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--hq-border)')))
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: m.sender_role === 'teacher' ? '#f59e0b' : (m.sender_role === 'assistant' ? '#10b981' : 'var(--hq-primary)'), fontSize: '13px', fontWeight: 'bold' }}>
                                            <span 
                                                onClick={() => {
                                                    if (m.sender_role === 'student' || !m.sender_role) {
                                                        setShowStudentProfile(m.sender.id);
                                                    }
                                                }}
                                                style={{ 
                                                    cursor: (m.sender_role === 'student' || !m.sender_role) ? 'pointer' : 'default', 
                                                    textDecoration: (m.sender_role === 'student' || !m.sender_role) ? 'underline' : 'none' 
                                                }}
                                            >
                                                {m.sender?.full_name || m.sender?.username}
                                            </span>
                                            {m.sender_role === 'teacher' && <span className="ta-role-badge" style={{ background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>أستاذ المادة</span>}
                                            {m.sender_role === 'assistant' && <span className="ta-role-badge" style={{ background: '#10b981', color: 'white', padding: '2px 6px', borderRadius: '12px', fontSize: '10px' }}>مساعد</span>}
                                            {m.is_hidden && <span style={{ color: '#ef4444', fontSize: '11px' }}>(رسالة محذوفة)</span>}
                                        </div>
                                        {(!m.is_hidden && !sessionStorage.getItem('spy_token')) && (
                                            <div className="ta-msg-actions" style={{ display: 'flex', gap: '10px', marginRight: '20px' }}>
                                                {(!privateTarget && (m.sender_role === 'teacher' || m.sender_role === 'assistant')) && (
                                                    <button onClick={() => openReadReceipts(m.id)} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }} title="تفاصيل القراءة">
                                                        <HiOutlineEye size={16} /> المشاهدات
                                                    </button>
                                                )}
                                                {(!privateTarget) && (
                                                    <button onClick={() => handlePin(m.id)} style={{ background: 'transparent', border: 'none', color: m.is_pinned ? '#ec3665' : 'var(--hq-text-muted)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>📌 {m.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}</button>
                                                )}
                                                {(m.sender_role !== 'teacher' && m.sender_role !== 'assistant') && (
                                                    <>
                                                        {!privateTarget && (
                                                            <button onClick={() => {
                                                                setPrivateTarget({ id: m.sender.id, name: m.sender.full_name || m.sender.username });
                                                                setReplyingTo(m);
                                                            }} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineChatBubbleOvalLeftEllipsis size={16} /> رد خاص</button>
                                                        )}
                                                        <button onClick={() => handleMute(m.sender.id, m.sender.full_name, m.sender.muted_until)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineNoSymbol size={16} /> كتم مؤقت</button>
                                                    </>
                                                )}
                                                <button onClick={() => setReplyingTo(m)} style={{ background: 'transparent', border: 'none', color: 'var(--hq-primary)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineArrowUturnLeft size={16} /> رد</button>
                                                <button onClick={() => handleHide(m.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><HiOutlineTrash size={16} /> إخفاء</button>
                                            </div>
                                        )}
                                    </div>
                                    {m.replied_to && (
                                        <div 
                                            onClick={() => {
                                                const msgEl = document.getElementById(`ta-msg-${m.replied_to.id}`);
                                                if (msgEl) {
                                                    msgEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    const oldBg = msgEl.style.background;
                                                    msgEl.style.transition = 'background 0.5s ease';
                                                    msgEl.style.background = 'rgba(131, 42, 150, 0.15)';
                                                    setTimeout(() => { msgEl.style.background = oldBg }, 1500);
                                                }
                                            }}
                                            style={{ background: 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: '8px', borderRight: '3px solid var(--hq-primary)', marginBottom: '8px', fontSize: '0.85rem', cursor: 'pointer', opacity: 0.9 }}
                                        >
                                            <div style={{ color: 'var(--hq-primary)', fontWeight: 'bold', marginBottom: '4px' }}>{m.replied_to.sender_name}</div>
                                            <div style={{ color: 'var(--hq-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.replied_to.content || (m.replied_to.has_attachment ? 'مرفق 📎' : '')}</div>
                                        </div>
                                    )}
                                    {m.content && <div style={{ color: m.is_hidden ? 'var(--hq-text-muted)' : (m.is_private ? '#10b981' : 'var(--hq-text-main)'), lineHeight: '1.5', textDecoration: m.is_hidden ? 'line-through' : 'none', fontWeight: m.is_private ? 'bold' : 'normal' }}>
                                        {m.content}
                                    </div>}
                                    {m.attachment && (
                                        <div style={{ marginTop: '10px' }}>
                                            {m.attachment.match(/\.(jpeg|jpg|gif|png|webp)(\?|$)/i) ? (
                                                <div style={{ position: 'relative', display: 'inline-block' }}>
                                                    <div onClick={() => setFullScreenImage(m.attachment)} style={{ display: 'block', cursor: 'zoom-in' }}>
                                                        <img src={m.attachment} alt="attachment" style={{ maxWidth: '100%', borderRadius: '8px', maxHeight: '250px', border: '1px solid var(--hq-border)', display: 'block' }} />
                                                    </div>
                                                </div>
                                            ) : m.attachment.match(/\.(webm|mp3|ogg|wav)(\?|$)/i) || m.attachment.includes('voice-message') ? (
                                                <audio controls src={m.attachment} style={{ height: '40px', maxWidth: '100%' }} />
                                            ) : (
                                                <a href={m.attachment} download target="_blank" rel="noreferrer" style={{ color: 'var(--hq-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--hq-primary-bg)', padding: '8px 12px', borderRadius: '8px', width: 'fit-content', fontWeight: 'bold' }}>
                                                    <HiOutlineArrowDownTray size={18} />
                                                    تحميل المُرفق
                                                </a>
                                            )}
                                        </div>
                                    )}
                                    <div style={{ fontSize: '11px', color: 'var(--hq-text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', direction: 'ltr' }}>
                                        <span>
                                            {m.is_private && (m.sender_role === 'teacher' || m.sender_role === 'assistant') && (
                                                <span style={{ marginRight: '8px', color: (m.is_read || m.read_by_student) ? '#3b82f6' : 'var(--hq-text-muted)', fontWeight: 'bold' }}>
                                                    {(m.is_read || m.read_by_student) ? '✓✓ تمت المشاهدة' : '✓ تم الإرسال'}
                                                </span>
                                            )}
                                        </span>
                                        <span>{new Date(m.created_at).toLocaleString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ))}
                            </>
                            );
                        })()}
                            <div ref={endOfMessagesRef} />
                        </div>

                        {!sessionStorage.getItem('spy_token') ? (
                            <div className="ta-chat-input-area">
                                {privateTarget && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px 15px', borderRadius: '8px', color: '#10b981', fontSize: '13px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>أنت الآن في وضع الرد الخاص 🕵️ على: <strong>{privateTarget.name}</strong></span>
                                        <button onClick={() => { setPrivateTarget(null); setReplyingTo(null); }} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer' }}>إلغاء ×</button>
                                    </div>
                                )}
                                
                                {replyingTo && (
                                    <div style={{ background: 'rgba(131, 42, 150, 0.05)', border: '1px solid rgba(131, 42, 150, 0.2)', padding: '8px 15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', borderRight: '4px solid var(--hq-primary)' }}>
                                        <div style={{ overflow: 'hidden' }}>
                                            <div style={{ color: 'var(--hq-primary)', fontWeight: 'bold', marginBottom: '2px' }}>الرد على {replyingTo.sender?.full_name || replyingTo.sender?.username}</div>
                                            <div style={{ color: 'var(--hq-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{replyingTo.content || (replyingTo.attachment ? 'مرفق 📎' : '')}</div>
                                        </div>
                                        <button onClick={() => setReplyingTo(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><HiOutlineXMark size={18} /></button>
                                    </div>
                                )}

                                {STAFF_CHAT_MEDIA_ENABLED && (file || audioBlob) && (
                                    <div className="ta-chat-attachment-preview">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 'bold' }}>
                                            {audioBlob ? <HiOutlineMicrophone size={18} /> : <HiOutlinePaperClip size={18} />}
                                            <span>{audioBlob ? 'مقطع صوتي مسجل جاهز للإرسال 🎵' : `مرفق جاهز للإرسال: ${file.name}`}</span>
                                        </div>
                                        <button type="button" onClick={() => { setFile(null); setAudioBlob(null); }} className="ta-chat-attachment-cancel">إلغاء المرفق ×</button>
                                    </div>
                                )}

                                <div className="ta-chat-input-row">
                                    {STAFF_CHAT_MEDIA_ENABLED && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="ta-chat-media-btn"
                                                title="إرفاق صورة"
                                            >
                                                <HiOutlinePhoto size={24} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="ta-chat-media-btn"
                                                title="إرفاق ملف"
                                            >
                                                <HiOutlinePaperClip size={24} />
                                            </button>
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                className="ta-chat-file-input"
                                                onChange={e => setFile(e.target.files[0])}
                                            />

                                            {!isRecording ? (
                                                <button
                                                    type="button"
                                                    onClick={startRecording}
                                                    className="ta-chat-media-btn"
                                                    title="تسجيل رسالة صوتية"
                                                >
                                                    <HiOutlineMicrophone size={22} />
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={stopRecording}
                                                    className="ta-chat-media-btn ta-chat-media-btn--recording"
                                                    title="إيقاف وحفظ"
                                                >
                                                    <HiOutlineStop size={22} />
                                                </button>
                                            )}
                                        </>
                                    )}

                                    <input
                                        type="text"
                                        className="ta-chat-input-field"
                                        value={messageText}
                                        onChange={e => setMessageText(e.target.value)}
                                        placeholder={
                                            STAFF_CHAT_MEDIA_ENABLED && file
                                                ? `تم أختيار مرفق: ${file.name}`
                                                : STAFF_CHAT_MEDIA_ENABLED && audioBlob
                                                    ? 'تم التقاط بصمة صوتية 🎵'
                                                    : STAFF_CHAT_MEDIA_ENABLED && isRecording
                                                        ? 'جاري التسجيل...'
                                                        : 'اكتب رسالة توجيهية للطلاب هنا...'
                                        }
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        disabled={STAFF_CHAT_MEDIA_ENABLED && isRecording}
                                    />

                                    <button type="button" onClick={sendMessage} className="ta-chat-send-btn" aria-label="إرسال">
                                        <HiOutlinePaperAirplane size={20} style={{ transform: 'rotate(-45deg)', marginLeft: '2px', marginTop: '-2px' }} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ padding: '15px', borderTop: '1px solid var(--hq-border)', textAlign: 'center', color: '#ef4444', fontWeight: 'bold', lineHeight: 1.7 }}>
                                <div>🕵️‍♂️ وضع المراقبة (الإدارة) — قراءة فقط</div>
                                <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)', fontWeight: 'normal', marginTop: '6px' }}>
                                    لمشاهدة الرسائل الخاصة مع الطلاب: اختر الطالب من قسم «رسائل الطلاب الخاصة» على اليسار
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="ta-chat-main--empty">
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

            {showStudentProfile && (
                <div className="ta-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 'clamp(0px, 4vw, 40px)' }}>
                    <div className="ta-modal-fullscreen" style={{ background: 'var(--hq-bg)', width: '100%', maxWidth: '1400px', height: '100%', borderRadius: '16px', overflow: 'hidden', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
                        <button onClick={() => setShowStudentProfile(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', zIndex: 100, fontWeight: 'bold' }}>إغلاق الملف</button>
                        <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
                            <TAStudent360 studentIdProp={showStudentProfile} groupId={assistantGroupId} onClose={() => setShowStudentProfile(null)} />
                        </div>
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
                    <a href={fullScreenImage} download target="_blank" rel="noreferrer" style={{ marginTop: '24px', background: 'var(--hq-primary)', color: 'white', padding: '12px 28px', borderRadius: '24px', textDecoration: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(131, 42, 150, 0.3)' }}>
                        <HiOutlineArrowDownTray size={22} />
                        تنزيل الصورة
                    </a>
                </div>
            )}

            {/* Read Receipts Popup */}
            {readReceiptPopup && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'var(--hq-surface)', width: '100%', maxWidth: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--hq-surface)' }}>
                            <h3 style={{ margin: 0, color: 'var(--hq-text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HiOutlineEye color="var(--hq-primary)" /> تفاصيل مشاهدة الرسالة
                            </h3>
                            <button onClick={() => setReadReceiptPopup(null)} style={{ background: 'transparent', border: 'none', color: 'var(--hq-text-muted)', cursor: 'pointer', display: 'flex' }}>
                                <HiOutlineXMark size={24} />
                            </button>
                        </div>
                        <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
                            {readReceiptLoading ? (
                                <p style={{ textAlign: 'center', color: 'var(--hq-text-muted)', padding: '20px' }}>جاري تحميل البيانات...</p>
                            ) : readReceiptData ? (
                                <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 10px 0', color: '#10b981', display: 'flex', justifyContent: 'space-between' }}>
                                            <span>👀 شاهدوا الرسالة</span>
                                            <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{readReceiptData.read_by.length}</span>
                                        </h4>
                                        <div style={{ background: 'var(--hq-primary-bg)', borderRadius: '12px', border: '1px solid var(--hq-border)', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {readReceiptData.read_by.length === 0 ? (
                                                <p style={{ margin: 0, color: 'var(--hq-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>لم يقم أحد برؤية الرسالة بعد</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {readReceiptData.read_by.map(s => (
                                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--hq-surface)', borderRadius: '8px' }}>
                                                            <strong style={{ fontSize: '0.9rem', color: 'var(--hq-text-main)' }}>{s.name}</strong>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>@{s.username}</span>
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
                                        <div style={{ background: 'var(--hq-primary-bg)', borderRadius: '12px', border: '1px solid var(--hq-border)', padding: '10px', maxHeight: '200px', overflowY: 'auto' }}>
                                            {readReceiptData.unread_by.length === 0 ? (
                                                <p style={{ margin: 0, color: 'var(--hq-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>الجميع شاهد الرسالة!</p>
                                            ) : (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {readReceiptData.unread_by.map(s => (
                                                        <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--hq-surface)', borderRadius: '8px' }}>
                                                            <strong style={{ fontSize: '0.9rem', color: 'var(--hq-text-main)' }}>{s.name}</strong>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>@{s.username}</span>
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
