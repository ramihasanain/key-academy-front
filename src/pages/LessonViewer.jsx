import { useState, useEffect, useRef, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../config'
import { useAuth } from '../contexts/AuthContext'
import { useUser } from '../hooks/useUser'
import { motion, AnimatePresence } from 'framer-motion'
const ReactMarkdown = lazy(() => import('react-markdown'))
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
    HiOutlineXMark,
    HiOutlineComputerDesktop,
    HiOutlineGlobeAlt
} from 'react-icons/hi2'
import { HiHeart, HiCheckCircle } from 'react-icons/hi'
import ParticleBackground from '../components/ParticleBackground'

import robotVideo from '../assets/robot_website.webm'
import { VirtualLabsData } from '../data/VirtualLabsData'
import LiveChat from '../components/LiveChat'
import TabNotes from '../components/LessonViewerTabs/TabNotes'
import TabQA from '../components/LessonViewerTabs/TabQA'
import TabDocs from '../components/LessonViewerTabs/TabDocs'
import TabLab from '../components/LessonViewerTabs/TabLab'
import TabKeyAI from '../components/LessonViewerTabs/TabKeyAI'
const SecurePDFViewer = lazy(() => import('../components/SecurePDFViewer'))
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
        
        // Launch the protocol directly using window.location to prevent Chrome from silently canceling iframe requests.
        // This ensures the desktop app opens properly with the required authentication params.
        window.location.href = protocolUrl;
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
                    
                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                        <a href="/KeyAcademy.exe" download="KeyAcademy.exe" className="lv-sb-btn-secondary" style={{ flex: 1, padding: '12px', justifyContent: 'center' }}>
                            <span>تحميل ويندوز 🪟</span>
                            <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" className="lv-sb-btn-icon" style={{marginLeft: '10px'}}>
                                <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                        </a>
                    </div>
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

const ViewSlides = ({ lessonInfo, lessonContent, userData }) => {
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    const renderWatermarkOverlay = () => {
        if (!userData) return null;
        return (
            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '120px', justifyContent: 'center', alignContent: 'center', zIndex: 10 }}>
                {Array.from({ length: 30 }).map((_, i) => (
                    <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '20px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.15)', textShadow: '1px 1px 0 rgba(255, 255, 255, 0.2)', whiteSpace: 'nowrap', userSelect: 'none', letterSpacing: '2px' }}>
                        {userData?.username || 'KeyAcademy_Student'}
                    </div>
                ))}
            </div>
        );
    };

    const slidesHtml = lessonContent?.interactive_html || lessonInfo?.interactive_html;

    if (slidesHtml) {
        const rawCode = slidesHtml.trim();
        const isIframe = rawCode.toLowerCase().startsWith('<iframe');

        const secureScript = `
<style>
    * {
        -webkit-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
    }
</style>
<script>
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('dragstart', e => {
        if (e.target.tagName === 'IMG') {
            e.preventDefault();
        }
    });
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if((e.ctrlKey || e.metaKey) && ['c','v','x','a','p','s','u'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
</script>`;

        return (
            <div ref={containerRef} className="lv-screen lv-slides-screen" style={{ padding: 0, display: 'flex', flexDirection: 'column', width: '100%', minHeight: isFullscreen ? '100vh' : '75vh', background: '#fff', userSelect: 'none' }} onContextMenu={e => e.preventDefault()} onCopy={e => { e.preventDefault(); return false; }}>
                <div className="lv-sf-bar" style={{ padding: '15px 25px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid var(--border-glass)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="lv-sf-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold' }}><HiOutlineSparkles /> السلايدات التفاعلية</span>
                    <button onClick={toggleFullscreen} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                        {isFullscreen ? 'إنهاء التكبير ✖' : 'تكبير الشاشة ⛶'}
                    </button>
                </div>
                <div className="lv-sf-viewer interactive-html-wrap" style={{ width: '100%', flex: 1, padding: 0, background: '#fff', position: 'relative' }}>
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
                                            iframe.style.borderRadius = isFullscreen ? '0' : '0 0 16px 16px';
                                        }
                                    }, 150);
                                }
                            }}
                        />
                    ) : (
                        <iframe
                            srcDoc={rawCode + secureScript}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', backgroundColor: '#fff', borderRadius: isFullscreen ? '0' : '0 0 16px 16px' }}
                            title="السلايدات التفاعلية"
                        />
                    )}
                    {renderWatermarkOverlay()}
                </div>
            </div>
        );
    }

    if (!lessonInfo?.doc_file) {
        return (
            <div className="lv-screen lv-slides-screen">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '400px', gap: '15px' }}>
                    <h2 style={{ color: '#94a3b8' }}>لا توجد سلايدات أو ملزمة تفاعلية متاحة لهذا الدرس حالياً</h2>
                </div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="lv-screen lv-slides-screen" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: isFullscreen ? '100vh' : '75vh', background: '#fff' }}>
            <div className="lv-sf-bar" style={{ padding: '15px 25px', background: 'rgba(0,0,0,0.8)', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="lv-sf-bar-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: 'bold' }}><HiOutlineDocumentText /> ملزمة وسلايدات الدرس</span>
                <button onClick={toggleFullscreen} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                    {isFullscreen ? 'إنهاء التكبير ✖' : 'تكبير الشاشة ⛶'}
                </button>
            </div>
            <div className="lv-sf-viewer" style={{ flex: 1, padding: 0, height: '100%', position: 'relative', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
                <Suspense fallback={<div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>جاري تهيئة قارئ المستندات الآمن 🛡️...</div>}>
                    <SecurePDFViewer url={lessonInfo.doc_file} isFullscreen={isFullscreen} />
                </Suspense>
                {renderWatermarkOverlay()}
            </div>
        </div>
    );
};

const ViewQuiz = ({ lessonId, userData }) => {
    const [phase, setPhase] = useState('intro') // intro, exam, result
    const [quizData, setQuizData] = useState(null)
    const [answers, setAnswers] = useState({})
    const [result, setResult] = useState(null)
    const [history, setHistory] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [timeLeft, setTimeLeft] = useState(null)

    useEffect(() => {
        let interval = null;
        if (phase === 'exam' && timeLeft !== null && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        window.location.reload();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [phase, timeLeft]);

    const formatTime = (seconds) => {
        if (seconds === null) return `${quizData?.duration_minutes || 0}:00`;
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

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

                // Smoothly scroll to the results section, accounting for fixed headers
                setTimeout(() => {
                    const resultEl = document.querySelector('.lv-quiz-result') || document.querySelector('.lv-quiz-screen');
                    if (resultEl) {
                        const yOffset = -120; // Extra offset to account for navbar and padding
                        const y = resultEl.getBoundingClientRect().top + window.scrollY + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }, 150);
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
        <div className="lv-screen lv-quiz-screen" style={{ position: 'relative', userSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
            
            {/* Watermark Overlay */}
            {userData && (
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '100px', justifyContent: 'center', alignContent: 'center', zIndex: 0 }}>
                    {Array.from({ length: 25 }).map((_, i) => (
                        <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '16px', fontWeight: 'bold', color: 'rgba(0, 0, 0, 0.1)', textShadow: '1px 1px 0 rgba(255, 255, 255, 0.1)', whiteSpace: 'nowrap', userSelect: 'none' }}>
                            {userData?.username || 'Key Academy'}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column' }}>
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
                    <button className="premium-btn exact-btn-orange lv-qi-start" onClick={() => { setPhase('exam'); setTimeLeft(quizData.duration_minutes * 60); }}>ابدأ التحدي الآن</button>
                    {history.length > 0 && <button className="lv-txt-link" onClick={() => {
                        alert(`عندك ${history.length} محاولات سابقة، أفضلها ${Math.max(...history.map(h => h.percentage))}%`)
                    }}><HiOutlineClock /> عرض محاولاتي السابقة ({history.length})</button>}
                </div>
            )}
            {phase === 'exam' && (
                <div className="lv-quiz-exam">
                    <div className="lv-qe-header">
                        <h3>{quizData.title}</h3>
                        <div className="lv-qe-timer"><span className="lv-timer-dot" style={{ animation: timeLeft <= 60 ? 'pulse 0.5s infinite' : 'pulse 1.5s infinite', backgroundColor: timeLeft <= 60 ? '#ef4444' : '#f59e0b' }}></span> <span style={{ color: timeLeft <= 60 ? '#ef4444' : 'inherit' }}>{formatTime(timeLeft)} دقيقة</span></div>
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
            {phase === 'result' && result && (
                <div className="lv-quiz-result">
                    <div className="lv-qr-top">
                        <h2>نتيجة التقييم</h2>
                        <div className="lv-qr-circle">
                            <svg className="lv-svg-ring" viewBox="0 0 36 36">
                                <path className="lv-ring-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                                <path className="lv-ring-fill" strokeDasharray={`${result.percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                            </svg>
                            <div className="lv-qr-score"><span className="n">{result.percentage}</span><span className="u">%</span></div>
                        </div>
                        <h3 className="lv-qr-msg">{getResultMsg(result.percentage)}</h3>
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
            )}
            </div>
        </div>
    )
}

/* ======== BOTTOM TABS ======== */


/* ======== MAIN LAYOUT ======== */

const LessonViewer = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const urlParams = new URLSearchParams(location.search)
    const { lessonId } = useParams()
    const courseId = urlParams.get('course')

    const [lessonInfo, setLessonInfo] = useState(null)
    const [lessonContent, setLessonContent] = useState(null)
    const [lessonList, setLessonList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [isLoadingContent, setIsLoadingContent] = useState(false)
    
    const { userData } = useUser()

    const [activeContent, setActiveContent] = useState('video')
    const [activeTab, setActiveTab] = useState('notes')
    const [previewCode, setPreviewCode] = useState('')
    const [isActivating, setIsActivating] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null' || token.trim() === '') {
            navigate('/login')
        }
    }, [navigate])

    // 1. Fetch Lesson Basic Info (Lightweight)
    useEffect(() => {
        if (lessonId) {
            const controller = new AbortController();
            setIsLoading(true);
            setLessonContent(null); // Reset content when switching lessons
            fetch(`${API}/api/courses/lessons/${lessonId}/`, { signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    setLessonInfo(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    if (err.name === 'AbortError') return;
                    console.error('Failed to fetch lesson', err);
                    setIsLoading(false);
                });
            return () => controller.abort();
        }
    }, [lessonId]);

    // 2. Fetch Sidebar/Playlist (Once per courseId)
    useEffect(() => {
        if (courseId && lessonList.length === 0) {
            const controller = new AbortController();
            const token = localStorage.getItem('access_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            fetch(`${API}/api/courses/${courseId}/`, { headers, signal: controller.signal })
                .then(res => res.json())
                .then(courseData => {
                    let allLessons = [];
                    courseData.modules?.forEach(m => {
                        m.lessons?.forEach(l => {
                            allLessons.push({ ...l, unitTitle: m.title });
                        });
                    });
                    setLessonList(allLessons);
                })
                .catch(err => {
                    if (err.name === 'AbortError') return;
                    console.error('Failed to fetch playlist', err);
                });
            return () => controller.abort();
        }
    }, [courseId, lessonList.length]);

    // 3. Lazy Load Heavy Content (Slides/Text)
    useEffect(() => {
        if (activeContent === 'slides' && lessonId && !lessonContent) {
            const controller = new AbortController();
            setIsLoadingContent(true);
            const token = localStorage.getItem('access_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            fetch(`${API}/api/courses/lessons/${lessonId}/content/`, { headers, signal: controller.signal })
                .then(res => {
                    if (!res.ok) throw new Error('Failed to fetch content');
                    return res.json();
                })
                .then(data => {
                    setLessonContent(data);
                    setIsLoadingContent(false);
                })
                .catch(err => {
                    if (err.name === 'AbortError') return;
                    console.error("Error loading slides content:", err);
                    setIsLoadingContent(false);
                });
            return () => controller.abort();
        }
    }, [activeContent, lessonId, lessonContent]);

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

    const currentIndex = lessonList.findIndex(l => l.id == lessonId);
    const prevLesson = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
    const nextLesson = currentIndex !== -1 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;

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
                        <>
                            <button className="lv-sb-nav-btn" disabled={!prevLesson} onClick={() => prevLesson && navigate(`/lesson/${prevLesson.id}?course=${courseId}`)}>
                                <HiOutlineChevronRight style={{ transform: 'scaleX(-1)' }} /> الدرس القبله
                            </button>
                            <button className="lv-sb-nav-btn next" disabled={!nextLesson} onClick={() => nextLesson && navigate(`/lesson/${nextLesson.id}?course=${courseId}`)}>
                                الدرس الجاي <HiOutlineChevronLeft style={{ transform: 'scaleX(-1)' }} />
                            </button>
                        </>
                    </div>
                </aside>

                {/* Left: Main */}
                <main className="lv-main" style={{ flex: 1, minWidth: 0, transition: 'all 0.3s ease' }}>
                    <div className="lv-lesson-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div>
                                <span className="lv-lh-sub">{CURRENT_LESSON.title}</span>
                                <h1 className="lv-lh-title" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {CURRENT_LESSON.items.find(i => i.id === activeContent)?.title}
                                </h1>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span className="lv-lh-teacher">شرح وتدريس: {CURRENT_LESSON.teacher}</span>
                        </div>
                    </div>

                    {/* Portal */}
                    <div className={`lv-portal cv-super-glass ${(activeContent === 'slides' || activeContent === 'quiz') ? 'free-ratio' : ''}`} style={activeContent === 'slides' ? { height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 } : activeContent === 'quiz' ? { minHeight: '85vh', display: 'flex', flexDirection: 'column', padding: 0 } : {}}>
                        <AnimatePresence mode="wait">
                            {activeContent === 'video' && <motion.div key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner"><ViewVideo videoUrl={lessonInfo?.video_url} lessonId={lessonId} isCompleted={lessonInfo?.is_completed} onComplete={handleMarkComplete} /></motion.div>}
                            {activeContent === 'slides' && <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner">
                                {isLoadingContent ? (
                                    <div className="lv-screen" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div className="lv-qi-badge" style={{ animation: 'aiCharFloat 2s infinite ease-in-out' }}><HiOutlineSparkles /></div>
                                        <h3 style={{ color: 'var(--purple)', marginTop: '20px' }}>جاري تحميل الملفات التفاعلية...</h3>
                                    </div>
                                ) : (
                                    <ViewSlides lessonInfo={lessonInfo} lessonContent={lessonContent} userData={userData} />
                                )}
                            </motion.div>}
                            {activeContent === 'quiz' && <motion.div key="q" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="lv-portal-inner"><ViewQuiz lessonId={lessonId} userData={userData} /></motion.div>}
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
                            <div style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
                                <TabNotes lessonId={lessonId} />
                            </div>
                            <div style={{ display: activeTab === 'qa' ? 'block' : 'none' }}>
                                <TabQA lessonId={lessonId} userData={userData} />
                            </div>
                            <div style={{ display: activeTab === 'group' ? 'block' : 'none', height: '500px' }}>
                                <LiveChat courseId={courseId} userData={userData} lessonId={lessonId} />
                            </div>
                            <div style={{ display: activeTab === 'docs' ? 'block' : 'none' }}>
                                <TabDocs lessonInfo={lessonInfo} courseId={courseId} userData={userData} />
                            </div>
                            {CURRENT_LESSON.hasLab && (
                                <div style={{ display: activeTab === 'lab' ? 'block' : 'none' }}>
                                    <TabLab />
                                </div>
                            )}
                            <div style={{ display: activeTab === 'keyai' ? 'block' : 'none' }}>
                                <TabKeyAI lessonInfo={lessonInfo} userData={userData} />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default LessonViewer
