import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../config'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineArrowRight,
    HiOutlineCheckBadge,
    HiOutlinePencilSquare,
    HiOutlineChatBubbleLeftRight,
    HiOutlineUserGroup,
    HiOutlineDocumentText,
    HiOutlineSparkles,
    HiOutlinePaperAirplane,
    HiOutlineLockClosed,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlinePlayCircle,
    HiOutlineClock,
    HiOutlineArrowPath,
    HiOutlineBeaker,
    HiOutlineCheckCircle,
    HiOutlineNoSymbol,
    HiOutlineXMark
} from 'react-icons/hi2'
import { HiHeart, HiCheckCircle } from 'react-icons/hi'
import ParticleBackground from '../components/ParticleBackground'
import { Mascots } from '../components/KeyAiMascots'
import { VirtualLabsData } from '../data/VirtualLabsData'
import './LessonViewer.css'



/* ======== PORTAL SCREENS ======== */

const ViewVideo = ({ videoUrl, lessonId, isCompleted, onComplete }) => {
    const handleLaunchApp = () => {
        if (!videoUrl) {
            alert('لا يوجد فيديو متاح لهذا الدرس حالياً.');
            return;
        }
        
        let vid = videoUrl;
        if (videoUrl.includes('v=')) {
            vid = videoUrl.split('v=')[1].split('&')[0];
        } else if (videoUrl.includes('youtu.be/')) {
            vid = videoUrl.split('youtu.be/')[1].split('?')[0];
        } else if (videoUrl.includes('embed/')) {
            vid = videoUrl.split('embed/')[1].split('?')[0];
        }
        
        let encodedArr = [];
        for (let i = 0; i < vid.length; i++) {
            encodedArr.push((vid.charCodeAt(i) + 7) ^ 0x1A);
        }
        const encodedVid = encodedArr.join(',');
        
        const token = localStorage.getItem('access_token') || '';
        const protocolUrl = `mediaplayer://loginyoutube?vid=${encodedVid}&token=${token}&lesson=${lessonId}&api=${encodeURIComponent(API)}`;
        
        // Use an iframe to try launching without disrupting the current page, and avoid multiple clicks failing
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = protocolUrl;
        document.body.appendChild(iframe);
        setTimeout(() => document.body.removeChild(iframe), 1500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', height: '100%' }}>
            <div className="lv-secure-box">
                <img src="/key-icon-logo.png" alt="Key Academy" className="lv-sb-logo" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; }} />
                
                <div className="lv-sb-lock-ring">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lv-sb-lock-icon">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                </div>
                
                <h2 className="lv-sb-title">أمان المحتوى مفعل</h2>
                <p className="lv-sb-desc">شغل الفيديو من تطبيق Key Academy للابتوب أو الحاسبة حتى تضمن تفهم الدرس بأعلى جودة وبدون تقطيع.</p>
                
                <div className="lv-sb-actions">
                    <button className="lv-sb-btn-primary" onClick={handleLaunchApp}>
                        <span>افتح الدرس بالتطبيق هسة</span>
                        <svg viewBox="0 0 24 24" fill="currentColor" className="lv-sb-btn-icon" style={{transform: 'rotate(180deg)', marginLeft: '10px'}}>
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    </button>
                    
                    <a href="/KeyAcademy_MediaPlayer.exe" download="KeyAcademy_MediaPlayer.exe" className="lv-sb-btn-secondary">
                        <span>ما محمل التطبيق؟ نزله من هنا</span>
                        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" className="lv-sb-btn-icon" style={{marginLeft: '10px'}}>
                            <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                    </a>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'auto', paddingBottom: '20px' }}>
                <button
                    onClick={onComplete}
                    disabled={isCompleted}
                    className={`premium-btn ${isCompleted ? 'exact-btn-green' : 'exact-btn-purple'}`}
                    style={{ padding: '15px 40px', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: isCompleted ? 'none' : '0 10px 25px rgba(131, 42, 150, 0.3)', opacity: isCompleted ? 0.9 : 1 }}
                >
                    {isCompleted ? <><HiOutlineCheckBadge /> تم إكمال الدرس ومراجعته بنجاح</> : <><HiOutlineCheckCircle /> تحديد كدرس مكتمل</>}
                </button>
            </div>
        </div>
    )
}

const ViewSlides = ({ lessonInfo, userData }) => {
    if (lessonInfo?.interactive_html) {
        const rawCode = lessonInfo.interactive_html.trim()
        const isIframe = rawCode.toLowerCase().startsWith('<iframe')

        return (
            <div className="lv-screen lv-slides-screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', width: '100%', minHeight: '850px' }}>
                <div className="lv-sf-bar" style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
                    <span className="lv-sf-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineSparkles /> شرائح تفاعلية</span>
                </div>
                <div className="lv-sf-viewer interactive-html-wrap" style={{ width: '100%', height: '850px', padding: 0, background: '#fff', position: 'relative' }}>
                    {isIframe ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: rawCode }}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                            ref={(el) => {
                                if (el) {
                                    setTimeout(() => {
                                        const iframe = el.querySelector('iframe');
                                        if (iframe) {
                                            iframe.style.width = '100%';
                                            iframe.style.height = '100%';
                                            iframe.style.maxHeight = '100%';
                                            iframe.style.border = 'none';
                                            iframe.style.borderRadius = '0 0 16px 16px';
                                        }
                                    }, 150);
                                }
                            }}
                        />
                    ) : (
                        <iframe
                            srcDoc={rawCode}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', backgroundColor: '#fff', borderRadius: '0 0 16px 16px' }}
                            title="شرائح تفاعلية"
                        />
                    )}
                </div>
            </div>
        )
    }

    if (!lessonInfo?.doc_file) {
        return (
            <div className="lv-screen lv-slides-screen">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '15px' }}>
                    <h2 style={{ color: '#94a3b8' }}>لا توجد سلايدات أو ملزمة تفاعلية متاحة لهذا الدرس حالياً</h2>
                </div>
            </div>
        )
    }

    return (
        <div className="lv-screen lv-slides-screen" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '600px' }}>
            <div className="lv-sf-bar" style={{ padding: '15px 20px', background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-glass)' }}>
                <span className="lv-sf-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineDocumentText /> ملزمة وسلايدات الدرس</span>
            </div>
            <div className="lv-sf-viewer" style={{ flex: 1, padding: 0, height: '100%', position: 'relative' }} onContextMenu={(e) => e.preventDefault()}>
                <iframe
                    src={`${lessonInfo.doc_file}#toolbar=0&navpanes=0&scrollbar=0`}
                    style={{ width: '100%', height: '100%', minHeight: '600px', border: 'none', backgroundColor: '#fff', borderRadius: '0 0 16px 16px' }}
                    title="مستندات الدرس"
                />

                {/* Watermark Overlay */}
                {userData && (
                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '50px', justifyContent: 'center', alignContent: 'center', opacity: 0.06, zIndex: 5 }}>
                        {Array.from({ length: 40 }).map((_, i) => (
                            <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '24px', fontWeight: 'bold', color: 'black', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                {userData?.username || 'Student'}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

const ViewQuiz = ({ lessonId }) => {
    const [phase, setPhase] = useState('intro') // intro, exam, result
    const [quizData, setQuizData] = useState(null)
    const [answers, setAnswers] = useState({})
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token) return

        // Fetch Quiz Data
        fetch(`${API}/api/quizzes/by-lesson/${lessonId}/`, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => {
                if (!res.ok) throw new Error('No quiz')
                return res.json()
            })
            .then(data => {
                setQuizData(data)
                setIsLoading(false)
                // Fetch History if quiz exists
                if (data.id) {
                    fetch(`${API}/api/quizzes/${data.id}/attempts/`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    })
                        .then(r => r.json())
                        .then(hdata => setHistory(hdata))
                        .catch(e => console.error(e))
                }
            })
            .catch(err => {
                setQuizData(null)
                setIsLoading(false)
            })
    }, [lessonId])

    const pick = (qId, i) => setAnswers(p => ({ ...p, [qId]: i }))

    const submitQuiz = () => {
        setIsSubmitting(true)
        const token = localStorage.getItem('access_token')
        fetch(`${API}/api/quizzes/${quizData.id}/submit/`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
        })
            .then(r => r.json())
            .then(data => {
                setResult(data)
                setPhase('result')
                setIsSubmitting(false)

                // update history locally
                setHistory(prev => [{
                    id: data.attempt_id,
                    percentage: data.percentage,
                    score: data.score,
                    total: data.total,
                    attempted_at: new Date().toISOString()
                }, ...prev])
            })
            .catch(err => {
                console.error(err)
                setIsSubmitting(false)
                alert('حدث خطأ أثناء تقييم الإجابات')
            })
    }

    const getResultMsg = (pct) => {
        if (pct === 100) return 'عاشت ايدك يا بطل! 🔥 مبدع ومفول تركيز!'
        if (pct >= 70) return 'شغل حلو بس لازم تركز أكثر يبطل! 💪'
        if (pct >= 40) return 'شكلك ما ذاكرت مزبوط.. يلا عيد الدرس! 📖'
        return 'هاي شنو هالنتيجة؟! 😂 روح ذاكر وارجع!'
    }

    if (isLoading) return <div className="lv-screen">جاري تحميل الاختبار...</div>
    if (!quizData) return <div className="lv-screen">
        <div className="lv-quiz-intro">
            <h2>لا يوجد اختبار متاح</h2>
            <p>لا يوجد اختبار تقييمي متاح لهذا الدرس حالياً. يمكنك المتابعة إلى الأقسام الأخرى.</p>
        </div>
    </div>

    return (
        <div className="lv-screen lv-quiz-screen">
            {phase === 'intro' && (
                <div className="lv-quiz-intro">
                    <div className="lv-qi-badge"><HiOutlineCheckBadge /></div>
                    <h2>{quizData.title}</h2>
                    <p>هذا الاختبار يقيم فهمك للدرس بالكامل مدعوم بالذكاء الاصطناعي الخاص بالمنصة.</p>
                    <div className="lv-qi-stats">
                        <div className="lv-qi-stat"><strong>{quizData.duration_minutes}</strong> دقيقة</div>
                        <div className="lv-qi-stat"><strong>{quizData.questions.length}</strong> أسئلة</div>
                        <div className="lv-qi-stat"><strong>AI</strong> ذكاء اصطناعي</div>
                    </div>
                    <button className="premium-btn exact-btn-orange lv-qi-start" onClick={() => setPhase('exam')}>ابدأ التحدي الآن</button>
                    {history.length > 0 && <button className="lv-txt-link" onClick={() => {
                        alert(`عندك ${history.length} محاولات سابقة، أفضلها ${Math.max(...history.map(h => h.percentage))}%`)
                    }}><HiOutlineClock /> عرض محاولاتي السابقة ({history.length})</button>}
                </div>
            )}
            {phase === 'exam' && (
                <div className="lv-quiz-exam">
                    <div className="lv-qe-header">
                        <h3>{quizData.title}</h3>
                        <div className="lv-qe-timer"><span className="lv-timer-dot"></span> {quizData.duration_minutes}:00 دقيقة</div>
                    </div>
                    <div className="lv-qe-list">
                        {quizData.questions.map((q, qi) => (
                            <div key={q.id} className="lv-qe-card">
                                <h4 className="lv-qe-q"><span className="lv-qe-num">{qi + 1}</span> {q.text}</h4>
                                <div className="lv-qe-opts">
                                    {q.options.map((opt, oi) => (
                                        <button key={oi} className={`lv-qe-opt ${answers[q.id] === oi ? 'selected' : ''}`} onClick={() => pick(q.id, oi)}>
                                            <span className="lv-qe-radio">{answers[q.id] === oi && <HiCheckCircle />}</span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lv-qe-footer">
                        <button className="premium-btn exact-btn-pink" onClick={submitQuiz} disabled={isSubmitting || Object.keys(answers).length < quizData.questions.length}>
                            {isSubmitting ? 'جاري تقييم الذكاء الاصطناعي...' : 'تقديم الإجابات وتقييم النتيجة'}
                        </button>
                    </div>
                </div>
            )}
            {phase === 'result' && result && (() => {
                const pct = result.percentage
                return (
                    <div className="lv-quiz-result">
                        <div className="lv-qr-top">
                            <h2>نتيجة التقييم</h2>
                            <div className="lv-qr-circle">
                                <svg className="lv-svg-ring" viewBox="0 0 36 36">
                                    <path className="lv-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                    <path className="lv-ring-fill" strokeDasharray={`${pct}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                </svg>
                                <div className="lv-qr-score"><span className="n">{pct}</span><span className="u">%</span></div>
                            </div>
                            <h3 className="lv-qr-msg">{getResultMsg(pct)}</h3>
                            <div className="lv-qr-stats-row">
                                <div className="lv-qrs correct"><HiCheckCircle /> <strong>{result.score}</strong> إجابة صحيحة</div>
                                <div className="lv-qrs wrong">✕ <strong>{result.total - result.score}</strong> إجابة خاطئة</div>
                            </div>
                            <button className="lv-outline-btn" onClick={() => { setAnswers({}); setResult(null); setPhase('intro') }}><HiOutlineArrowPath /> إعادة المحاولة</button>
                        </div>

                        {/* Detailed Answer Review */}
                        <div className="lv-qr-review">
                            <h4 className="lv-section-label"><HiOutlineSparkles /> مراجعة الإجابات التفصيلية المدعومة بالذكاء الاصطناعي</h4>
                            {result.review.map((q, qi) => {
                                const userAnswer = q.user_answer
                                const isCorrect = q.is_correct
                                return (
                                    <div key={q.question_id} className={`lv-rv-card ${isCorrect ? 'correct' : 'wrong'}`}>
                                        <div className="lv-rv-head">
                                            <span className={`lv-rv-badge ${isCorrect ? 'green' : 'red'}`}>
                                                {isCorrect ? '✓ صحيح' : '✕ خطأ'}
                                            </span>
                                            <span className="lv-rv-qnum">السؤال {qi + 1}</span>
                                        </div>
                                        <p className="lv-rv-question">{q.question}</p>
                                        <div className="lv-rv-answers">
                                            {q.options.map((opt, oi) => {
                                                let cls = ''
                                                if (oi === q.correct_index) cls = 'correct-answer'
                                                else if (oi === userAnswer && !isCorrect) cls = 'wrong-answer'
                                                return (
                                                    <div key={oi} className={`lv-rv-opt ${cls}`}>
                                                        {oi === q.correct_index && <HiCheckCircle className="lv-rv-icon green" />}
                                                        {oi === userAnswer && !isCorrect && oi !== q.correct_index && <span className="lv-rv-icon red">✕</span>}
                                                        {oi !== q.correct_index && oi !== userAnswer && <span className="lv-rv-icon neutral">○</span>}
                                                        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                            <span>{opt}</span>
                                                            {q.options_explanations && q.options_explanations[oi] && (
                                                                <span style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>💡 {q.options_explanations[oi]}</span>
                                                            )}
                                                        </div>
                                                        {oi === userAnswer && <span className="lv-rv-tag user">إجابتك</span>}
                                                        {oi === q.correct_index && <span className="lv-rv-tag correct">الإجابة الصحيحة</span>}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                        {q.explanation && (
                                            <div className="lv-rv-explain" style={{ background: 'rgba(131, 42, 150, 0.05)', padding: '15px', borderRadius: '12px', marginTop: '15px', borderLeft: '4px solid #832A96' }}>
                                                <HiOutlineSparkles className="lv-rv-ai-icon" style={{ color: '#832A96' }} />
                                                <div>
                                                    <strong>تفسير الذكاء الاصطناعي Key AI:</strong>
                                                    <p>{q.explanation}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>

                        {/* History */}
                        {history.length > 0 && (
                            <div className="lv-qr-history">
                                <h4><HiOutlineClock /> سجل محاولاتك اللي فاتت</h4>
                                <table className="lv-ht-table">
                                    <thead><tr><th>تاريخ المحاولة</th><th>النتيجة</th><th>الحالة</th></tr></thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={i}>
                                                <td>{new Date(h.attempted_at).toLocaleDateString('ar-IQ')} - {new Date(h.attempted_at).toLocaleTimeString('ar-IQ')}</td>
                                                <td><strong>{h.percentage}%</strong> ({h.score}/{h.total})</td>
                                                <td><span className={`lv-pill ${h.percentage >= 70 ? 'green' : 'red'}`}>{h.percentage >= 70 ? 'بطل' : 'يحتاج مراجعة'}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )
            })()}
        </div>
    )
}

/* ======== BOTTOM TABS ======== */

const TabNotes = ({ lessonId }) => {
    const [notes, setNotes] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/notes/?lesson=${lessonId}`, { headers: { 'Authorization': `Bearer ${t}` } })
            .then(r => r.json()).then(d => { setNotes(d); setLoading(false) }).catch(e => console.log(e))
    }, [lessonId])

    const handleSave = () => {
        if (!input.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/notes/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson: lessonId, content: input })
        }).then(r => r.json()).then(d => { setNotes([d, ...notes]); setInput('') })
    }

    return (
        <div className="lv-tab-pane lv-fade">
            <div className="lv-notes-editor">
                <div className="lv-ne-toolbar"><button className="lv-tb-b"><b>B</b></button><button className="lv-tb-b"><i>I</i></button><button className="lv-tb-b"><u>U</u></button></div>
                <textarea className="lv-ne-area" rows="5" placeholder="اكتب ملاحظاتك الخاصة هنا... هذي الملاحظات بس انت تشوفها." value={input} onChange={e => setInput(e.target.value)}></textarea>
                <div className="lv-ne-foot"><button className="premium-btn exact-btn-purple lv-sm-btn" onClick={handleSave}>احفظ الملاحظة</button></div>
            </div>
            <h4 className="lv-section-label">ملاحظاتي السابقة</h4>
            {loading ? <p>جاري التحميل...</p> : notes.length === 0 ? <p style={{ color: '#94a3b8' }}>ماكو أي ملاحظات مسجلة.</p> : notes.map(n => (
                <div key={n.id} className="lv-note-card">
                    <div className="lv-nc-strip"></div>
                    <p>{n.content}</p>
                    <span className="lv-nc-date">انحفظت بيوم: {new Date(n.created_at).toLocaleDateString('ar-IQ')}</span>
                </div>
            ))}
        </div>
    )
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

    const loadQA = () => {
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/qa/?lesson=${lessonId}`, { headers: { 'Authorization': `Bearer ${t}` } })
            .then(r => r.json()).then(d => { setPosts(d); setLoading(false) })
    }
    useEffect(() => { loadQA() }, [lessonId])

    const handlePost = () => {
        if (!input.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/qa/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson: lessonId, content: input })
        }).then(r => r.json()).then(() => { setInput(''); loadQA() })
    }

    const handleComment = (postId) => {
        const comment = commentInputs[postId]
        if (!comment || !comment.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/qa/${postId}/comment/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: comment })
        }).then(r => r.json()).then(() => { setCommentInputs(p => ({ ...p, [postId]: '' })); loadQA() })
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

const TabGroup = ({ courseId, userData, lessonId }) => {
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [chatType, setChatType] = useState('public') // 'public' | 'private'
    const [socket, setSocket] = useState(null)
    const [loading, setLoading] = useState(true)

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
        if (!t) return
        fetch(`${API}/api/interactions/group-chat/?course=${courseId}&type=${chatType}`, { headers: { 'Authorization': `Bearer ${t}` } })
            .then(r => r.json()).then(d => {
                setMessages(d)
                setLoading(false)
            })
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
            if (data.message) {
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

    const handleSend = () => {
        if (!input.trim() || !socket) return
        const payload = { content: input, is_private: chatType === 'private', lesson_id: lessonId }
        socket.send(JSON.stringify(payload))
        setInput('')
    }

    // Filter messages to strictly enforce what we see
    const displayedMessages = messages.filter(m => {
        const isMsgPrivate = m.is_private === true
        return chatType === 'private' ? isMsgPrivate : !isMsgPrivate
    })

    return (
        <div className="lv-tab-pane lv-fade" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>

            <div className="lv-chat-tabs" style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button className={`lv-chat-tab ${chatType === 'public' ? 'active' : ''}`} onClick={() => { setChatType('public'); chatTypeRef.current = 'public'; setPublicUnread(0); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: chatType === 'public' ? 'var(--primary-dark)' : 'transparent', color: chatType === 'public' ? '#fff' : 'var(--text-muted)', position: 'relative' }}>
                    🌐 الدردشة العامة المشتركة
                    {publicUnread > 0 && <span style={{ position: 'absolute', top: '-6px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(239,68,68,0.5)' }}>{publicUnread}</span>}
                </button>
                <button className={`lv-chat-tab ${chatType === 'private' ? 'active' : ''}`} onClick={() => { setChatType('private'); chatTypeRef.current = 'private'; setPrivateUnread(0); }} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border-glass)', background: chatType === 'private' ? 'var(--primary-dark)' : 'transparent', color: chatType === 'private' ? '#fff' : 'var(--text-muted)', position: 'relative' }}>
                    💬 دردشة الدعم والمساعد
                    {privateUnread > 0 && <span style={{ position: 'absolute', top: '-6px', left: '10px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold', boxShadow: '0 2px 6px rgba(239,68,68,0.5)', animation: 'pulse 1.5s infinite' }}>{privateUnread}</span>}
                </button>
            </div>

            <div className="lv-gc-header">
                <div className="lv-gc-info"><div className="lv-gc-icon"><HiOutlineUserGroup /></div>
                    <div>
                        <h4>{chatType === 'public' ? 'مجموعة المادة العامة' : 'تواصل مع المساعد المباشر'}</h4>
                        <p style={{ marginTop: '4px' }}>{chatType === 'public' ? 'شوف رسائل المدرس وباقي الطلاب واسأل بمجموعة الدورة' : 'رسائلك هنا يشوفها الأستاذ والمساعد فقط ويجاوبك بشكل خاص'}</p>
                    </div></div>
                <div className="lv-gc-live"><span className="lv-gc-dot"></span> Socket متصل</div>
            </div>

            <div className="lv-gc-msgs" style={{ flex: 1, overflowY: 'auto', maxHeight: '400px', padding: '10px 0' }}>
                {loading ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>جاري التحميل...</p> :
                    displayedMessages.length === 0 ? <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '20px' }}>لا توجد رسائل سابقة. كن أول من يرسل!</p> :
                        // Make sure newer messages are at bottom if reversed, but we reverse array from backend so we flex column-reverse typically.
                        // Backend sends newest first. So we map. The UI puts them top-to-bottom. If we want newest at bottom, we should reverse them.
                        // Wait, backend sends reversed() order so oldest is first. That's perfect.
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
            {isMuted ? (
                <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderTop: '1px solid rgba(239, 68, 68, 0.2)', padding: '15px', color: '#ef4444', textAlign: 'center', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <HiOutlineNoSymbol /> عذراً، أنت محظور من الدردشة حالياً حتى {new Date(userData.muted_until).toLocaleString('ar-IQ')}
                </div>
            ) : (
                <div className="lv-gc-input-row" style={{ marginTop: 'auto' }}>
                    <input type="text" className="lv-gc-input" placeholder={chatType === 'public' ? "اكتب رسالتك للمجموعة العـامة..." : "اكتب رسالتك للمساعد الخـاص..."} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSend() }} />
                    <button className="lv-gc-send-btn" onClick={handleSend}><HiOutlinePaperAirplane style={{ transform: 'scaleX(-1)' }} /></button>
                </div>
            )}
        </div>
    )
}

const TabDocs = ({ lessonInfo, courseId, userData }) => {
    const [courseDocs, setCourseDocs] = useState([])
    const [viewedDoc, setViewedDoc] = useState(null)

    useEffect(() => {
        if (!courseId) return
        fetch(`${API}/api/courses/${courseId}/`)
            .then(res => res.json())
            .then(data => {
                if (data.ministerial_docs) {
                    setCourseDocs(data.ministerial_docs)
                }
            })
            .catch(console.error)
    }, [courseId])

    const getExt = (url) => url ? url.split('?')[0].split('.').pop().toUpperCase() : 'DOC'
    let docsList = []
    if (lessonInfo?.doc_file) {
        docsList.push({ name: 'ملزمة الدرس الحالية', url: lessonInfo.doc_file, size: 'ملف PDF', type: getExt(lessonInfo.doc_file), color: '#dc2626', icon: '📄' })
    }
    courseDocs.forEach(d => {
        docsList.push({ name: d.title, url: d.file, size: 'مرفق وزاري', type: d.doc_type || 'PDF', color: '#2563eb', icon: '📘' })
    })

    return (
        <div className="lv-tab-pane lv-fade">
            <h4 className="lv-section-label"><HiOutlineDocumentText /> ملازم ومستندات الدرس</h4>
            <div className="lv-docs-grid">
                {docsList.length === 0 ? <p style={{ color: '#94a3b8' }}>ماكو ملازم متوفرة.</p> : docsList.map((doc, i) => (
                    <div key={i} className="lv-doc-card">
                        <div className="lv-doc-icon">{doc.icon}</div>
                        <div className="lv-doc-info">
                            <strong>{doc.name}</strong>
                            <span>{doc.type} • {doc.size}</span>
                        </div>
                        <button className="lv-doc-dl" style={{ color: doc.color, border: `1px solid ${doc.color}`, background: 'transparent' }} onClick={() => setViewedDoc(doc)}>عرض الملف</button>
                    </div>
                ))}
            </div>

            {/* Secure PDF Viewer Modal inside TabDocs */}
            {createPortal(
                <AnimatePresence>
                    {viewedDoc && (
                        <motion.div
                            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewedDoc(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '95%', height: '95%', maxWidth: '1200px', background: '#fff', borderRadius: '20px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                            >
                                <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <HiOutlineDocumentText size={22} style={{ color: 'var(--purple-light)' }} />
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{viewedDoc.name || 'مستند الدورة'}</h3>
                                    </div>
                                    <button onClick={() => setViewedDoc(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '50%', transition: 'background 0.3s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                                        <HiOutlineXMark size={24} />
                                    </button>
                                </div>
                                <div style={{ flex: 1, position: 'relative', backgroundColor: '#e2e8f0' }} onContextMenu={(e) => e.preventDefault()}>
                                    <iframe 
                                        src={`${viewedDoc.url}#toolbar=0&navpanes=0&scrollbar=0`}
                                        style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                                        title={viewedDoc.name}
                                    />
                                    
                                    {/* Watermark Overlay */}
                                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '50px', justifyContent: 'center', alignContent: 'center', opacity: 0.06, zIndex: 5 }}>
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '24px', fontWeight: 'bold', color: 'black', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                                {userData?.username || 'Student'}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Security Overlay */}
                                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', zIndex: 6 }}></div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}

const TabLab = () => {
    const { lessonId } = useParams()
    const lab = VirtualLabsData.find(l => l.id === lessonId) || VirtualLabsData[0]

    return (
        <div className="lv-tab-pane lv-fade">
            <h4 className="lv-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineBeaker /> المختبر الافتراضي التطبيقي: {lab.title}
            </h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{lab.description}</p>

            <div className="lv-lab-container" style={{ width: '100%', height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <iframe
                    src={lab.phetUrl}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    title={lab.title}
                    style={{ border: 'none', backgroundColor: '#fff' }}
                ></iframe>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>* مدعوم من PhET Interactive Simulations (جامعة كولورادو)</span>
                <button className="lv-outline-btn" onClick={() => window.open(lab.phetUrl, '_blank')}>
                    توسيع الشاشة بالكامل
                </button>
            </div>
        </div>
    )
}

const TabKeyAI = () => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'هلا بيك! اني Key AI 🔑 مساعدك الذكي. اسألني أي شي عن درس المتجهات وراح أجاوبك! 💡' }
    ])
    const [input, setInput] = useState('')
    const [activeMascotIndex, setActiveMascotIndex] = useState(0)

    const sendMsg = () => {
        if (!input.trim()) return
        const userMsg = input
        setMessages(prev => [...prev, { role: 'user', text: userMsg }])
        setInput('')
        setTimeout(() => {
            setMessages(prev => [...prev, { role: 'ai', text: 'خوش سؤال! 🤔 المتجه هو كمية فيزيائية بيها مقدار واتجاه. مثلاً لو كلنا "5 متر شمالاً" هذا متجه. بينما "5 متر" بدون اتجاه = كمية قياسية. تريد أمثلة بعد؟' }])
        }, 1200)
    }

    const activeMascot = Mascots[activeMascotIndex];
    const ActiveMain = activeMascot.Main;
    const ActiveMini = activeMascot.Mini;

    const { lessonId } = useParams()
    const labContext = VirtualLabsData.find(l => l.id === lessonId) || VirtualLabsData[0]

    return (
        <div className="lv-tab-pane lv-fade" style={{ minHeight: '500px', display: 'flex', gap: '30px' }}>
            {/* The Robot Mascot Area (First in RTL = Right side) */}
            <div className="lv-ai-robot-side" style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100%' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                    <ActiveMain />
                </div>
                {/* Switcher UI */}
                <div className="mascot-switcher-ui">
                    <button className="mascot-sw-btn" onClick={() => setActiveMascotIndex(prev => prev === 0 ? Mascots.length - 1 : prev - 1)}>
                        <HiOutlineChevronRight />
                    </button>
                    <div className="mascot-sw-info">
                        <span className="mascot-sw-name">{activeMascot.name}</span>
                        <div className="mascot-sw-dots">
                            {Mascots.map((_, idx) => (
                                <span key={idx} className={`mascot-sw-dot ${idx === activeMascotIndex ? 'active' : ''}`} />
                            ))}
                        </div>
                    </div>
                    <button className="mascot-sw-btn" onClick={() => setActiveMascotIndex(prev => (prev + 1) % Mascots.length)}>
                        <HiOutlineChevronLeft />
                    </button>
                </div>
            </div>

            {/* Chat Area (Second in RTL = Left side) */}
            <div className="lv-ai-chat-side" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--bg-glass)', borderRadius: '16px', padding: '24px', boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(131, 42, 150, 0.1)' }}>
                <div className="lv-ai-header" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', paddingBottom: '16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="lv-ai-info">
                        <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>Key AI <span className="lv-ai-badge">ذكاء اصطناعي</span></h4>
                        <p style={{ margin: 0, marginTop: '4px' }}>مساعدك الشخصي لفهم درس {labContext.subject} بشكل أعمق</p>
                    </div>
                    <div className="lv-ai-status"><span className="lv-gc-dot"></span> متصل</div>
                </div>

                <div className="lv-ai-msgs">
                    {messages.map((msg, i) => (
                        <motion.div key={i} className={`lv-ai-msg ${msg.role}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            {msg.role === 'ai' && <div className="lv-ai-msg-avatar" style={{ background: 'transparent', padding: 0, border: 'none' }}>
                                <ActiveMini />
                            </div>}
                            <div className="lv-ai-msg-bubble">
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                </div>

                <div className="lv-ai-input-row" style={{ marginTop: 'auto' }}>
                    <input
                        type="text" className="lv-ai-input"
                        placeholder="اسأل Key AI عن أي شي بالدرس..."
                        value={input} onChange={e => setInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendMsg()}
                    />
                    <button className="lv-ai-send-btn" onClick={sendMsg}><HiOutlinePaperAirplane style={{ transform: 'scaleX(-1)' }} /></button>
                </div>
            </div>
        </div>
    )
}

/* ======== MAIN LAYOUT ======== */

const LessonViewer = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const urlParams = new URLSearchParams(location.search)
    const { lessonId } = useParams()
    const courseId = urlParams.get('course')

    const [lessonInfo, setLessonInfo] = useState(null)
    const [lessonList, setLessonList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [userData, setUserData] = useState(null)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            navigate('/login')
        } else {
            fetch(API + '/api/auth/me/', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(d => setUserData(d))
                .catch(console.error)
        }
    }, [navigate])

    useEffect(() => {
        if (lessonId) {
            fetch(`${API}/api/courses/lessons/${lessonId}/`)
                .then(res => res.json())
                .then(data => {
                    // Update to match backend structure
                    if (courseId) {
                        // Check completion status from courses endpoint
                        const token = localStorage.getItem('access_token');
                        fetch(`${API}/api/courses/${courseId}/`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                            .then(r => r.json())
                            .then(courseData => {
                                let completed = false;
                                let allLessons = [];
                                courseData.modules?.forEach(m => {
                                    if (m.lessons) allLessons.push(...m.lessons);
                                    const found = m.lessons?.find(l => l.id == lessonId);
                                    if (found && found.is_completed) completed = true;
                                });
                                setLessonList(allLessons);
                                setLessonInfo({ ...data, is_completed: completed });
                                setIsLoading(false);
                            }).catch(() => {
                                setLessonInfo(data)
                                setIsLoading(false)
                            })
                    } else {
                        setLessonInfo(data)
                        setIsLoading(false)
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch lesson', err)
                    setIsLoading(false)
                })
        }
    }, [lessonId, courseId])

    const handleMarkComplete = () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        fetch(`${API}/api/courses/lessons/${lessonId}/complete/`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data.is_completed) {
                    setLessonInfo(prev => ({ ...prev, is_completed: true }))
                    alert('تم تسجيل إكمال الدرس بنجاح! 🎉')
                }
            })
            .catch(console.error)
    }

    const fallbackTitle = lessonInfo?.title || 'درس عام';
    const fallbackUnits = lessonInfo?.course_title ? `${lessonInfo.module_title} - ${lessonInfo.course_title}` : 'محاضرة الدورة';

    const CURRENT_LESSON = {
        id: lessonId,
        title: fallbackTitle,
        unitTitle: fallbackUnits,
        teacher: lessonInfo?.teacher_name || 'أستاذ المادة',
        items: [
            { id: 'video', type: 'video', title: 'فيديو الشرح التفصيلي' },
            { id: 'slides', type: 'slides', title: 'السلايدات التفاعلية' },
            { id: 'quiz', type: 'quiz', title: 'اختبار الذكاء الاصطناعي' }
        ],
        hasLab: lessonInfo?.has_virtual_lab
    }

    const isPreview = urlParams.get('preview') === 'true'

    const [activeContent, setActiveContent] = useState('video')
    const [activeTab, setActiveTab] = useState('notes')
    const [previewCode, setPreviewCode] = useState('')
    const [isActivating, setIsActivating] = useState(false)

    useEffect(() => { window.scrollTo(0, 0) }, [])

    const handleContentChange = (id) => {
        if (isPreview && id !== 'video') {
            alert('هذا المحتوى مقفول بالوضع التجريبي! اكتب كارت الاشتراك جوة حتى تفتحه 💎')
            return
        }
        setActiveContent(id)
    }

    const handlePreviewActivate = async (e) => {
        e.preventDefault()
        if (!previewCode || previewCode.length < 5) {
            alert('اكتب كود تفعيل صحيح (على الأقل 5 أرقام)')
            return
        }
        setIsActivating(true)
        await new Promise(r => setTimeout(r, 1500))
        setIsActivating(false)
        alert(`تفعلت الدورة بنجاح بالكود: ${previewCode} 🎉 انفتحت كل المحتويات!`)
        // remove preview query param
        navigate(`/lesson/${CURRENT_LESSON.id}`, { replace: true })
        window.location.reload()
    }

    const getIcon = (type, active) => {
        if (type === 'video') return <HiOutlinePlayCircle />
        if (type === 'slides') return <HiOutlineSparkles />
        if (type === 'quiz') return <HiOutlineCheckBadge />
        return <HiOutlineDocumentText />
    }

    if (isLoading) {
        return (
            <div className="lv-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <h2 style={{ color: 'white' }}>جاري تحضير بيئة الدرس...</h2>
            </div>
        )
    }

    return (
        <div className="lv-page">
            <ParticleBackground />
            {/* Mesh Blobs */}
            <div className="lv-mesh-bg">
                <div className="lv-blob lv-blob-1"></div>
                <div className="lv-blob lv-blob-2"></div>
                <div className="lv-blob lv-blob-3"></div>
            </div>

            {/* Top Navbar */}
            <nav className="lv-top-nav">
                <div className="lv-nav-inner">
                    <button className="lv-back-btn" onClick={() => {
                        if (isPreview && courseId) navigate(`/course-preview/${courseId}`)
                        else if (courseId) navigate(`/course/${courseId}`)
                        else navigate('/dashboard')
                    }}>
                        <span className="lv-back-circle"><HiOutlineArrowRight /></span>
                        ارجع للدورة
                    </button>
                    <span className="lv-nav-breadcrumb">{CURRENT_LESSON.unitTitle} <span className="lv-bc-sep">/</span> <strong>{CURRENT_LESSON.title}</strong></span>
                    <img src="/new-logo.png" alt="Logo" className="lv-nav-logo" />
                </div>
            </nav>

            {/* Content */}
            <div className="lv-content-wrapper">
                {/* Right: Sidebar */}
                <aside className="lv-sidebar cv-super-glass">
                    <div className="lv-sb-head">
                        <h3>شنو بالدرس؟</h3>
                    </div>
                    <div className="lv-sb-items">
                        {CURRENT_LESSON.items.map(item => {
                            const isActive = activeContent === item.id
                            return (
                                <div key={item.id} className={`lv-sb-item ${isActive ? 'active' : ''} ${isPreview && item.id !== 'video' ? 'preview-locked' : ''}`} onClick={() => handleContentChange(item.id)}>
                                    <span className={`lv-sb-icon ${isActive ? 'active' : ''}`}>{getIcon(item.type, isActive)}</span>
                                    <span className="lv-sb-label">{item.title}</span>
                                    {isPreview && item.id !== 'video' && <HiOutlineLockClosed className="lv-sb-lock-icn" />}
                                </div>
                            )
                        })}
                    </div>
                    <div className="lv-sb-footer">
                        {(() => {
                            const currentIndex = lessonList.findIndex(l => l.id == lessonId);
                            const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
                            const nextLesson = currentIndex !== -1 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

                            return (
                                <>
                                    <button className="lv-sb-nav-btn" disabled={!prevLesson} onClick={() => navigate(`/lesson/${prevLesson.id}?course=${courseId}`)}>
                                        <HiOutlineChevronRight style={{ transform: 'scaleX(-1)' }} /> الدرس القبله
                                    </button>
                                    <button className="lv-sb-nav-btn next" disabled={!nextLesson} onClick={() => navigate(`/lesson/${nextLesson.id}?course=${courseId}`)}>
                                        الدرس الجاي <HiOutlineChevronLeft style={{ transform: 'scaleX(-1)' }} />
                                    </button>
                                </>
                            )
                        })()}
                    </div>
                </aside>

                {/* Left: Main */}
                <main className="lv-main">
                    <div className="lv-lesson-head">
                        <div>
                            <span className="lv-lh-sub">{CURRENT_LESSON.title}</span>
                            <h1 className="lv-lh-title">{CURRENT_LESSON.items.find(i => i.id === activeContent)?.title}</h1>
                        </div>
                        <span className="lv-lh-teacher">شرح وتدريس: {CURRENT_LESSON.teacher}</span>
                    </div>

                    {/* Portal */}
                    <div className={`lv-portal cv-super-glass ${activeContent === 'slides' ? 'free-ratio' : ''}`}>
                        <AnimatePresence mode="wait">
                            {activeContent === 'video' && <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner"><ViewVideo videoUrl={lessonInfo?.video_url} lessonId={lessonId} isCompleted={lessonInfo?.is_completed} onComplete={handleMarkComplete} /></motion.div>}
                            {activeContent === 'slides' && <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner"><ViewSlides lessonInfo={lessonInfo} userData={userData} /></motion.div>}
                            {activeContent === 'quiz' && <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner"><ViewQuiz lessonId={lessonId} /></motion.div>}
                        </AnimatePresence>
                    </div>

                    {isPreview && (
                        <div className="lv-preview-light-banner">
                            <div className="lv-pb-info-light">
                                <div className="lv-pb-icon-light"><HiOutlineSparkles /></div>
                                <div className="lv-pb-text">
                                    <h3>انت دتشوف الدرس بـ "الوضع التجريبي"</h3>
                                    <p>حتى تفتح كل الدروس والملازم والامتحانات.. اكتب كارت الاشتراك مالتك جوة.</p>
                                </div>
                            </div>
                            <form className="lv-pb-form-light" onSubmit={handlePreviewActivate}>
                                <div className="lv-pb-input-wrap">
                                    <input type="text" placeholder="اكتب كارت الاشتراك (14 رقم)" value={previewCode} onChange={e => setPreviewCode(e.target.value)} disabled={isActivating} maxLength={14} />
                                </div>
                                <button type="submit" className="premium-btn exact-btn-purple" disabled={isActivating}>
                                    {isActivating ? 'دا يفتح...' : 'فعل كل الدروس'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Bottom Tabs */}
                    <div className="lv-bottom-section">
                        <div className="lv-tabs-row">
                            {[
                                { id: 'notes', icon: <HiOutlinePencilSquare />, label: 'ملاحظاتي' },
                                { id: 'qa', icon: <HiOutlineChatBubbleLeftRight />, label: 'الأسئلة والأجوبة' },
                                { id: 'group', icon: <HiOutlineUserGroup />, label: 'مجموعة المادة' },
                                { id: 'docs', icon: <HiOutlineDocumentText />, label: 'المستندات' },
                                { id: 'keyai', icon: <HiOutlineSparkles />, label: 'Key AI' },
                                ...(CURRENT_LESSON.hasLab ? [{ id: 'lab', icon: <HiOutlineBeaker />, label: 'المختبر 🧪' }] : [])
                            ].map(tab => (
                                <button key={tab.id} className={`lv-tab-btn ${activeTab === tab.id ? 'active' : ''} ${tab.id === 'keyai' ? 'lv-tab-ai' : ''}`} onClick={() => setActiveTab(tab.id)}>
                                    {tab.icon} {tab.label}
                                    {activeTab === tab.id && <motion.div className="lv-tab-indicator" layoutId="tabInd" />}
                                </button>
                            ))}
                        </div>
                        <div className="lv-tab-body cv-super-glass">
                            {activeTab === 'notes' && <TabNotes lessonId={lessonId} />}
                            {activeTab === 'qa' && <TabQA lessonId={lessonId} userData={userData} />}
                            {activeTab === 'group' && <TabGroup courseId={courseId} userData={userData} lessonId={lessonId} />}
                            {activeTab === 'docs' && <TabDocs lessonInfo={lessonInfo} courseId={courseId} userData={userData} />}
                            {activeTab === 'lab' && <TabLab />}
                            {activeTab === 'keyai' && <TabKeyAI />}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default LessonViewer
