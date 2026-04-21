import { useState, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import { API } from '../../config'
import robotVideoWebm from '../../assets/robot_website.webm'
import robotVideoMov from '../../assets/native_hevc_alpha.mov'
import { motion } from 'framer-motion'
import { HiOutlineSparkles, HiOutlinePaperAirplane } from 'react-icons/hi2'
import ReactMarkdown from 'react-markdown'
import '../../pages/LessonViewer.css'

const TabKeyAI = ({ lessonInfo, userData }) => {
    const { lessonId } = useParams()
    const subjectName = lessonInfo?.course_title || 'المادة'
    
    const [messages, setMessages] = useState([
        { role: 'ai', text: `هلا بيك! اني Key AI 🔑 مساعدك الذكي. اسألني أي شي عن درس ${subjectName} وراح أجاوبك! 💡` }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const sendMsg = async () => {
        if (!input.trim() || isLoading) return
        const userMsg = input
        
        const chatHistory = messages.slice(1).map(m => ({
            role: m.role === 'ai' ? 'assistant' : 'user',
            content: m.text
        }))

        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput('')
        setIsLoading(true)

        try {
            const token = localStorage.getItem('access_token')
            const response = await fetch(`${API}/api/courses/lessons/${lessonId}/analyze/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    question: userMsg,
                    chat_history: chatHistory
                })
            })

            const data = await response.json()
            if (data.success && data.data) {
                setMessages(prev => [...prev, { role: 'ai', text: data.data.answer }])
            } else {
                setMessages(prev => [...prev, { role: 'ai', text: data.error || 'عذراً، صار خطأ بالاتصال. حاول مرة ثانية.' }])
            }
        } catch (error) {
            console.error('AI Error:', error)
            setMessages(prev => [...prev, { role: 'ai', text: 'عذراً، صار مشكلة بالشبكة، ما گدرت أجاوبك هسه.' }])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="lv-tab-pane lv-fade" style={{ minHeight: '500px', display: 'flex', gap: '30px' }}>
            {/* The Robot Mascot Area (First in RTL = Right side) */}
            <div className="lv-ai-robot-side" style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100%', position: 'relative' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <video 
                        autoPlay 
                        loop 
                        muted 
                        playsInline 
                        style={{ width: '100%', maxWidth: '350px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 15px 30px rgba(0,0,0,0.15))' }}
                    >
                        <source src={robotVideoMov} type='video/mp4; codecs="hvc1"' />
                        <source src={robotVideoWebm} type="video/webm" />
                    </video>
                </div>
            </div>

            {/* Chat Area (Second in RTL = Left side) */}
            <div className="lv-ai-chat-side" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-glass)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(131, 42, 150, 0.1)', position: 'relative', userSelect: 'none' }} onContextMenu={(e) => e.preventDefault()}>
                
                {/* Watermark Overlay */}
                {userData && (
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '50px', justifyContent: 'center', alignContent: 'center', opacity: 0.06, mixBlendMode: 'difference', zIndex: 0 }}>
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '20px', fontWeight: 'bold', color: '#000', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                {userData?.username || 'Key Academy'}
                            </div>
                        ))}
                    </div>
                )}

                <div className="lv-ai-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                    <div className="lv-ai-info">
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>Key AI <span className="lv-ai-badge">ذكاء اصطناعي</span></h4>
                        <p style={{ margin: 0, marginTop: '4px' }}>مساعدك الشخصي لفهم الدرس بشكل أعمق</p>
                    </div>
                    <div className="lv-ai-status"><span className="lv-gc-dot"></span> متصل</div>
                </div>

                <div className="lv-ai-msgs" style={{ position: 'relative', zIndex: 1, overflowY: 'auto', flex: 1, paddingBottom: '15px' }}>
                    {messages.map((msg, i) => (
                        <motion.div key={i} className={`lv-ai-msg ${msg.role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            {msg.role === 'ai' && <div className="lv-ai-msg-avatar" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                                <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                                    <HiOutlineSparkles size={18} />
                                </div>
                            </div>}
                            <div className="lv-ai-msg-bubble markdown-chat">
                                <Suspense fallback={<span style={{color: 'var(--text-muted)'}}>جاري كتابة التحليل...</span>}>
                                    <ReactMarkdown
                                        components={{
                                            p: ({node, ...props}) => <p style={{margin: '0 0 8px 0', lineHeight: 1.6}} {...props} />,
                                            ul: ({node, ...props}) => <ul style={{margin: '0 20px 8px 0', padding: 0, listStyleType: 'disc'}} {...props} />,
                                            ol: ({node, ...props}) => <ol style={{margin: '0 20px 8px 0', padding: 0, listStyleType: 'decimal'}} {...props} />,
                                            li: ({node, ...props}) => <li style={{margin: '4px 0'}} {...props} />,
                                            strong: ({node, ...props}) => <strong style={{color: 'var(--purple)'}} {...props} />
                                        }}
                                    >
                                        {msg.text}
                                    </ReactMarkdown>
                                </Suspense>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="lv-ai-input-row" style={{ marginTop: 'auto', flexShrink: 0 }}>
                    <input
                        type="text" className="lv-ai-input"
                        placeholder="اسأل Key AI عن أي شي بالدرس..."
                        value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMsg()}
                        disabled={isLoading}
                    />
                    <button className="lv-ai-send-btn" onClick={sendMsg} disabled={isLoading} style={{ opacity: isLoading ? 0.7 : 1 }}>
                        {isLoading ? <span style={{ fontSize: '18px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⏳</span> : <HiOutlinePaperAirplane style={{ transform: 'scaleX(-1)' }} />}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TabKeyAI
