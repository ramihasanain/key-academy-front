import { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineNoSymbol, HiOutlineChatBubbleLeftRight, HiOutlinePaperAirplane } from 'react-icons/hi2'
import '../../pages/LessonViewer.css'

const qaRequestCache = new Map()

const fetchQAOnce = (key, url, options) => {
    if (qaRequestCache.has(key)) return qaRequestCache.get(key)
    const request = fetch(url, options).then(r => {
        if (!r.ok) throw new Error(`Failed to load QA: ${r.status}`)
        return r.json()
    }).finally(() => {
        qaRequestCache.delete(key)
    })
    qaRequestCache.set(key, request)
    return request
}

const TabQA = ({ lessonId, userData }) => {
    const [posts, setPosts] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)

    const isMuted = userData?.muted_until && new Date(userData.muted_until) > new Date();
    const [commentInputs, setCommentInputs] = useState({})
    const [expandedPosts, setExpandedPosts] = useState({})

    const toggleExpanded = (postId) => {
        setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
    }

    const loadQA = (force = false) => {
        const t = localStorage.getItem('access_token')
        if (!t || !lessonId) {
            setLoading(false)
            return
        }
        const requestKey = `${lessonId}:${t}`
        if (force) qaRequestCache.delete(requestKey)
        const loader = force
            ? fetch(`${API}/api/interactions/qa/?lesson=${lessonId}`, { headers: { 'Authorization': `Bearer ${t}` } }).then(r => {
                if (!r.ok) throw new Error(`Failed to load QA: ${r.status}`)
                return r.json()
            })
            : fetchQAOnce(requestKey, `${API}/api/interactions/qa/?lesson=${lessonId}`, { headers: { 'Authorization': `Bearer ${t}` } })
        loader.then(d => { setPosts(d); setLoading(false) }).catch(() => setLoading(false))
    }
    useEffect(() => { loadQA() }, [lessonId])

    const handlePost = () => {
        if (!input.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/qa/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson: lessonId, content: input })
        }).then(r => r.json()).then(() => { setInput(''); loadQA(true) })
    }

    const handleComment = (postId) => {
        const comment = commentInputs[postId]
        if (!comment || !comment.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/qa/${postId}/comment/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: comment })
        }).then(r => r.json()).then(() => { setCommentInputs(p => ({ ...p, [postId]: '' })); loadQA(true) })
    }

    return (
        <div className="lv-tab-pane lv-fade">
            {isMuted ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', padding: '15px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px', color: '#ef4444' }}>
                    <div style={{ fontSize: '20px' }}><HiOutlineNoSymbol /></div>
                    <div style={{ fontSize: '13px' }}>
                        <b>أنت محظور من طرح الأسئلة حالياً.</b> يفك القيد في <b>{new Date(userData.muted_until).toLocaleString('ar-IQ')}</b>. تواصل مع الإدارة للتفاصيل.
                    </div>
                </div>
            ) : (
                <div className="lv-qa-write">
                    <div className="lv-qa-av">أنت</div>
                    <div className="lv-qa-wr-body">
                        <textarea className="lv-textarea" placeholder="اطرح سؤالك حول هذا الدرس... سيجيب المعلم بمجرد رؤيته" value={input} onChange={e => setInput(e.target.value)}></textarea>
                        <div className="lv-qa-wr-foot"><button className="premium-btn exact-btn-purple lv-sm-btn" onClick={handlePost}>انشر السؤال</button></div>
                    </div>
                </div>
            )}
            <h4 className="lv-section-label">أسئلة الطلبة حول الدرس</h4>
            {loading ? <p>جاري التحميل...</p> : posts.length === 0 ? <p style={{ color: '#94a3b8' }}>ماكو أي أسئلة. خليك أول من يسأل!</p> : posts.map(p => (
                <div key={p.id} className="lv-post-card">
                    <div className="lv-post-header">
                        <div className="lv-post-avatar">👤</div>
                        <div className="lv-post-meta" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>{p.student?.username || 'طالب'} <span className="lv-student-badge">طالب</span></strong>
                                {p.comments?.some(c => c.is_teacher && !c.is_hidden) && (
                                    <span style={{ background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>✓ تمت الإجابة</span>
                                )}
                            </div>
                            <span>{new Date(p.created_at).toLocaleDateString('ar-IQ')}</span>
                        </div>
                    </div>
                    <p className="lv-post-body">{p.content}</p>
                    <button className="lv-post-reply-toggle" onClick={() => toggleExpanded(p.id)}><HiOutlineChatBubbleLeftRight /> {p.comments_count || 0} تعليقات</button>

                    {expandedPosts[p.id] && (
                        <div className="lv-comments-section">
                            {[...(p.comments || [])].sort((a, b) => {
                                if (a.author_role === 'teacher' && b.author_role !== 'teacher') return -1;
                                if (!a.author_role === 'teacher' && b.author_role === 'teacher') return 1;
                                if (a.is_teacher && !b.is_teacher) return -1;
                                if (!a.is_teacher && b.is_teacher) return 1;
                                return new Date(a.created_at) - new Date(b.created_at);
                            }).map(c => (
                                <div key={c.id} className={`lv-comment ${c.author_role === 'teacher' ? 'prof-comment' : (c.is_teacher ? 'teacher-comment' : '')}`}>
                                    <div className={`lv-comment-avatar ${c.author_role === 'teacher' ? 'prof-av' : (c.is_teacher ? 'teacher-av' : '')}`}>👤</div>
                                    <div className="lv-comment-content">
                                        <div className="lv-comment-head">
                                            <strong className={c.author_role === 'teacher' ? 'prof-name' : (c.is_teacher ? 'teacher-name' : '')}>
                                                {c.is_teacher && <span style={{ marginLeft: '4px' }}>📌</span>}
                                                {c.is_teacher
                                                    ? (c.author?.full_name || c.author?.first_name || c.author?.username || 'أستاذ')
                                                    : (c.author?.username || 'طالب')
                                                }
                                                {c.author_role === 'teacher' ? <span className="lv-teacher-badge" style={{ background: 'linear-gradient(90deg, #f59e0b, #d97706)' }}>أستاذ المادة</span> :
                                                    c.is_teacher ? <span className="lv-teacher-badge">مساعد</span> : <span className="lv-student-badge">طالب</span>}
                                            </strong>
                                            <span>{new Date(c.created_at).toLocaleDateString('ar-IQ')}</span>
                                        </div>
                                        <p>{c.content}</p>
                                    </div>
                                </div>
                            ))}
                            {isMuted ? (
                                <div style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(239, 68, 68, 0.7)', textAlign: 'center', padding: '10px', border: '1px dashed rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
                                    🚫 لا يمكنك التعليق حالياً بسبب تقييد الحساب
                                </div>
                            ) : (
                                <div className="lv-comment-write">
                                    <input type="text" placeholder="اكتب تعليق..." className="lv-comment-input" value={commentInputs[p.id] || ''} onChange={e => setCommentInputs(prev => ({ ...prev, [p.id]: e.target.value }))} onKeyDown={e => { if (e.key === 'Enter') handleComment(p.id) }} />
                                    <button className="lv-comment-send" onClick={() => handleComment(p.id)}><HiOutlinePaperAirplane style={{ transform: 'scaleX(-1)' }} /></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default TabQA
