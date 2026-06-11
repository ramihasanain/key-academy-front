import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineArrowRight, HiOutlineDocumentText, HiOutlineClock, HiOutlineCloudArrowUp, HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineInformationCircle, HiOutlineAcademicCap, HiOutlinePencilSquare } from 'react-icons/hi2'
import { ExamCorrectedViewer, ExamModelAnswerViewer } from '../../components/exam/ExamCorrectedViewer'
import './WeeklyExamPortal.css'

export const WeeklyExamPortal = () => {
    const { examId } = useParams()
    const navigate = useNavigate()
    
    const [exam, setExam] = useState(null)
    const [loading, setLoading] = useState(true)
    const [fileOptions, setFileOptions] = useState([])
    const [submitting, setSubmitting] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    
    // Countdown states
    const [timeLeftStr, setTimeLeftStr] = useState('')
    
    const fetchPortal = useCallback(async ({ silent = false } = {}) => {
        const tk = localStorage.getItem('access_token')
        if (!silent) setLoading(true)
        try {
            const res = await fetch(
                `${API}/api/interactions/exams/student-portal/${examId}/?_=${Date.now()}`,
                {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${tk}`,
                    },
                    cache: 'no-store',
                }
            )
            if (res.ok) {
                const data = await res.json()
                setExam(data)
                setErrorMsg('')
            } else {
                const err = await res.json().catch(() => ({}))
                setErrorMsg(err.error || 'خطأ في جلب بيانات الامتحان.')
            }
        } catch (err) {
            setErrorMsg('فشل الاتصال بالخادم. تأكد من إنترنتك.')
        } finally {
            if (!silent) setLoading(false)
        }
    }, [examId])

    useEffect(() => {
        fetchPortal()
    }, [fetchPortal])

    // إعادة الجلب عند العودة للتبويب (مثلاً بعد التسليم من الموبايل)
    useEffect(() => {
        const onVisible = () => {
            if (document.visibilityState === 'visible') {
                fetchPortal({ silent: true })
            }
        }
        const onPageShow = (e) => {
            if (e.persisted) fetchPortal({ silent: true })
        }
        document.addEventListener('visibilitychange', onVisible)
        window.addEventListener('pageshow', onPageShow)
        window.addEventListener('focus', onVisible)
        return () => {
            document.removeEventListener('visibilitychange', onVisible)
            window.removeEventListener('pageshow', onPageShow)
            window.removeEventListener('focus', onVisible)
        }
    }, [fetchPortal])
    
    useEffect(() => {
        if (!exam) return;
        
        const tick = () => {
            const now = new Date()
            
            if (exam.status === 'upcoming') {
                const diff = new Date(exam.start_time) - now
                if (diff <= 0) {
                    window.location.reload()
                } else {
                    setTimeLeftStr(formatDiff(diff))
                }
            } else if (exam.status === 'open') {
                const diff = new Date(exam.end_time) - now
                if (diff <= 0) {
                    // Time up
                    window.location.reload()
                } else {
                    setTimeLeftStr(formatDiff(diff))
                }
            }
        }
        
        tick()
        const timerId = setInterval(tick, 1000)
        return () => clearInterval(timerId)
    }, [exam])
    
    const formatDiff = (ms) => {
        const d = Math.floor(ms / (1000 * 60 * 60 * 24))
        const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
        const s = Math.floor((ms % (1000 * 60)) / 1000)
        
        let str = ''
        if (d > 0) str += `${d} يوم `
        if (h > 0) str += `${h} ساعة `
        if (m > 0 || d===0) str += `${m} دقيقة `
        str += `${s} ثانية`
        return str
    }
    
    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileOptions(Array.from(e.target.files))
            setErrorMsg('')
        }
    }
    
    const submitExam = async () => {
        if (!fileOptions || fileOptions.length === 0) {
            setErrorMsg('يجب إرفاق ملف الإجابة (PDF أو مجموعة صور) قبل التسليم.')
            return
        }
        
        setSubmitting(true)
        setErrorMsg('')
        const tk = localStorage.getItem('access_token')
        const fd = new FormData()
        fd.append('exam_id', exam.id)
        
        fileOptions.forEach(file => {
            fd.append('file', file)
        })
        
        try {
            const res = await fetch(`${API}/api/interactions/exams/submit/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}` },
                body: fd
            })
            
            if (res.ok) {
                setFileOptions([])
                await fetchPortal({ silent: true })
            } else {
                const err = await res.json()
                setErrorMsg(err.error || 'حدث خطأ أثناء الرفع')
            }
        } catch (err) {
            setErrorMsg('فشل الرفع، يرجى المحاولة مرة أخرى.')
        } finally {
            setSubmitting(false)
        }
    }
    
    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f8fafc', color: '#64748b' }}>جاري تحميل بوابة الامتحان...</div>
    if (errorMsg && !exam) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{errorMsg} <br/><button onClick={() => navigate(-1)} style={{ marginTop: '20px', padding: '10px 20px', background: '#e2e8f0', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>العودة</button></div>
    
    const hasSubmitted = Boolean(
        exam?.has_submitted || exam?.submission?.id || exam?.submission?.submitted_at
    );
    
    return (
        <div className="exam-student-portal">
            <div className="exam-student-portal-inner">
                
                {/* Header Navbar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                    <button onClick={() => navigate(-1)} style={{ background: 'white', border: '1px solid #cbd5e1', width: '45px', height: '45px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                        <HiOutlineArrowRight size={20} color="#334155" />
                    </button>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', fontWeight: '900' }}>{exam.title}</h1>
                        <p style={{ margin: 0, color: 'var(--purple)', fontSize: '1rem', marginTop: '5px', fontWeight: 'bold' }}>وحدة: {exam.module_title}</p>
                    </div>
                </div>
                
                {/* Status Alert */}
                {hasSubmitted ? (
                    <div style={{ background: '#ecfdf5', border: '1px solid #10b981', padding: '20px', borderRadius: '16px', marginBottom: '30px', display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                        <HiOutlineCheckCircle size={35} color="#10b981" />
                        <div>
                            <h3 style={{ margin: 0, color: '#065f46', fontSize: '1.2rem', marginBottom: '5px' }}>تم استلام إجاباتك بنجاح!</h3>
                            <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem' }}>وقت التسليم: {new Date(exam.submission.submitted_at).toLocaleString('ar-EG')}</p>
                        </div>
                    </div>
                ) : (
                    <div style={{ background: exam.status === 'upcoming' ? '#fffbeb' : (exam.status === 'closed' ? '#fef2f2' : '#eff6ff'), padding: '20px', borderRadius: '16px', border: `1px solid ${exam.status === 'upcoming' ? '#f59e0b' : (exam.status === 'closed' ? '#f43f5e' : '#3b82f6')}`, marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <HiOutlineClock size={35} color={exam.status === 'upcoming' ? '#d97706' : (exam.status === 'closed' ? '#e11d48' : '#2563eb')} />
                            <div>
                                <h3 style={{ margin: 0, color: exam.status === 'upcoming' ? '#92400e' : (exam.status === 'closed' ? '#9f1239' : '#1e40af'), fontSize: '1.2rem', marginBottom: '5px' }}>
                                    {exam.status === 'upcoming' ? 'الامتحان لم يبدأ بعد' : (exam.status === 'closed' ? 'انتهى وقت الامتحان' : 'الامتحان متاح الآن للتسليم')}
                                </h3>
                                <p style={{ margin: 0, color: exam.status === 'upcoming' ? '#b45309' : (exam.status === 'closed' ? '#be123c' : '#1e3a8a'), fontSize: '0.9rem' }}>
                                    الوقت المحدد للتسليم: من {new Date(exam.start_time).toLocaleString('ar-EG')} إلى {new Date(exam.end_time).toLocaleString('ar-EG')}
                                </p>
                            </div>
                        </div>
                        {(exam.status === 'upcoming' || exam.status === 'open') && (
                            <div style={{ background: 'white', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', textAlign: 'center', minWidth: '150px' }}>
                                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>{exam.status === 'upcoming' ? 'الوقت المتبقي للبدء' : 'ينتهي الوقت خلال'}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: exam.status === 'upcoming' ? '#f59e0b' : '#3b82f6', marginTop: '5px' }}>{timeLeftStr}</div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Main Content Layout */}
                <div className="exam-student-grid">
                    
                    {/* Right Col: Details & Instructions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                        
                        {/* Instructor Notes */}
                        <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineInformationCircle color="var(--purple)" size={22} /> تعليمات الامتحان</h3>
                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', color: '#334155', lineHeight: '1.8', whiteSpace: 'pre-wrap', fontSize: '0.95rem', border: '1px solid #e2e8f0' }}>
                                {exam.instructions || 'لا توجد تعليمات خاصة لهذا الامتحان. قم بتنزيل الأسئلة وحلها.'}
                            </div>
                            
                            <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                                <div style={{ flex: 1, background: '#f1f5f9', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>العلامة العظمى</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#0f172a', marginTop: '5px' }}>{exam.total_mark} درجات</div>
                                </div>
                                <div style={{ flex: 1, background: '#f1f5f9', padding: '15px', borderRadius: '10px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>مرفق الامتحان (ورقة الأسئلة)</div>
                                    <div style={{ marginTop: '5px' }}>
                                        {exam.file_url ? (
                                            <a href={exam.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--purple)', textDecoration: 'none', fontWeight: 'bold' }}><HiOutlineDocumentText size={20} /> عرض وتحميل الأسئلة</a>
                                        ) : (
                                            <span style={{ color: '#ef4444' }}>لا يوجد ملف مرفق</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Model Answer */}
                        {hasSubmitted && exam.model_answer?.visible && (exam.model_answer?.pages?.length || exam.model_answer?.url) && (
                            <div className="exam-student-card" style={{ border: '2px solid #6366f1' }}>
                                <div className="exam-student-card-header purple">
                                    <HiOutlineAcademicCap size={24} />
                                    <h3>الإجابة النموذجية</h3>
                                </div>
                                <div className="exam-student-card-body">
                                    <p className="exam-student-multi-hint">
                                        {exam.model_answer.pages?.length > 1
                                            ? `الإجابة النموذجية تحتوي ${exam.model_answer.pages.length} ملفات — اختر التبويب للتنقل بينها.`
                                            : 'أصبحت الإجابة النموذجية متاحة بعد انتهاء وقت الامتحان.'}
                                    </p>
                                    <div className="exam-student-viewer-wrap">
                                        <ExamModelAnswerViewer
                                            pages={exam.model_answer.pages || []}
                                            url={exam.model_answer.url}
                                            authToken={localStorage.getItem('access_token')}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grading Results */}
                        {hasSubmitted && exam.submission.grade !== null && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '0', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '2px solid #10b981' }}>
                                <div style={{ background: '#10b981', padding: '15px 25px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <HiOutlineCheckCircle size={24} />
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>نتيجة تقييم المساعد</h3>
                                </div>
                                <div style={{ padding: '25px', display: 'flex', alignItems: 'center', gap: '30px' }}>
                                    <div style={{ width: '120px', height: '120px', borderRadius: '50%', border: '8px solid #a7f3d0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', lineHeight: '1' }}>{exam.submission.grade}</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b', borderTop: '1px solid #cbd5e1', width: '60%', textAlign: 'center', marginTop: '5px', paddingTop: '5px' }}>{exam.total_mark}</div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', color: '#334155', marginBottom: '10px' }}>ملاحظات وتوجيهات التصحيح:</h4>
                                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '10px', color: '#475569', fontSize: '0.95rem', minHeight: '80px', border: '1px dashed #cbd5e1' }}>
                                            {exam.submission.feedback_note ? exam.submission.feedback_note : 'لا توجد ملاحظات إضافية من المساعد.'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {hasSubmitted && exam.submission.corrected_paper?.visible && (
                            <div className="exam-student-card" style={{ border: '2px solid #f59e0b' }}>
                                <div className="exam-student-card-header amber">
                                    <HiOutlinePencilSquare size={24} />
                                    <h3>ورقتك المصححة</h3>
                                </div>
                                <div className="exam-student-card-body">
                                    {(exam.submission.submission_pages?.length > 1 || exam.submission.corrected_paper?.pages?.length > 1) && (
                                        <p className="exam-student-multi-hint">
                                            التصحيح يشمل أكثر من ملف — استخدم التبويبات أعلى الورقة للتنقل بين الصفحات.
                                        </p>
                                    )}
                                    <div className="exam-student-viewer-wrap">
                                        <ExamCorrectedViewer
                                            pages={exam.submission.submission_pages || []}
                                            correctedPages={exam.submission.corrected_paper?.pages || []}
                                            gradingData={exam.submission.corrected_paper?.grading_data}
                                            correctedUrl={exam.submission.corrected_paper?.url}
                                            authToken={localStorage.getItem('access_token')}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        
                    </div>
                    
                    {/* Left Col: Submission Form */}
                    <div>
                        {!hasSubmitted && exam.status === 'open' && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--purple)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--purple)', marginBottom: '15px', textAlign: 'center' }}>تأكيد تسليم الإجابة</h3>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '20px' }}>يرجى التأكد من أن حلك واضح. يمكنك إرفاق PDF أو أكثر من صورة. <strong>لا يمكنك استبدال الملف بعد التسليم!</strong></p>
                                
                                {errorMsg && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <HiOutlineExclamationCircle size={18} /> {errorMsg}
                                    </div>
                                )}
                                
                                <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '30px 20px', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.2s', ...((fileOptions && fileOptions.length > 0 ? { borderColor: '#10b981', background: '#ecfdf5' } : {})) }}>
                                    <HiOutlineCloudArrowUp size={40} color={fileOptions && fileOptions.length > 0 ? '#10b981' : '#94a3b8'} />
                                    <span style={{ marginTop: '10px', fontWeight: 'bold', color: fileOptions && fileOptions.length > 0 ? '#10b981' : '#64748b' }}>
                                        {fileOptions && fileOptions.length > 0 ? `تم إرفاق: ${fileOptions.length} ملف/صور` : 'اضغط لاختيار أوراق الحل'}
                                    </span>
                                    <input type="file" accept=".pdf, image/*" multiple onChange={handleFileChange} style={{ display: 'none' }} />
                                </label>
                                
                                <button 
                                    onClick={submitExam}
                                    disabled={submitting || !fileOptions || fileOptions.length === 0}
                                    style={{ width: '100%', background: 'var(--purple)', color: 'white', border: 'none', padding: '15px', borderRadius: '10px', fontSize: '1.05rem', fontWeight: 'bold', marginTop: '20px', cursor: (submitting || !fileOptions || fileOptions.length === 0) ? 'not-allowed' : 'pointer', opacity: (submitting || !fileOptions || fileOptions.length === 0) ? 0.6 : 1, transition: 'all 0.2s' }}
                                >
                                    {submitting ? 'جاري رفع الأوراق...' : 'إرسال وتثبيت التسليم النهايئ'}
                                </button>
                            </div>
                        )}
                        
                        {!hasSubmitted && exam.status === 'upcoming' && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '30px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <HiOutlineClock size={50} color="#cbd5e1" style={{ marginBottom: '15px' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#475569', marginBottom: '10px' }}>نافذة التسليم مغلقة مؤقتاً</h3>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>ستظهر خانة رفع الإجابات بمجرد دخول وقت الامتحان الرسمي الموضح في الأعلى.</p>
                            </div>
                        )}

                        {!hasSubmitted && exam.status === 'closed' && (
                            <div style={{ background: 'white', borderRadius: '16px', padding: '30px 20px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <HiOutlineExclamationCircle size={50} color="#fca5a5" style={{ marginBottom: '15px' }} />
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#e11d48', marginBottom: '10px' }}>عذراً، لقد انتهى وقت التسليم!</h3>
                                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: 0 }}>مضى الوقت المسموح لرفع الأوراق ولن تتمكن من التسليم الآن.</p>
                            </div>
                        )}

                        {hasSubmitted && (
                            <div className="exam-student-card exam-student-submitted-card">
                                <div className="exam-student-card-header green">
                                    <HiOutlineDocumentText size={24} />
                                    <h3>إجابتك المرسلة</h3>
                                </div>
                                <div className="exam-student-card-body">
                                    <p className="exam-student-multi-hint">
                                        لا يمكنك تعديل الملف بعد التسليم. استخدم التبويبات للتنقل بين الصفحات إن وُجدت.
                                    </p>
                                    {(exam.submission.submission_pages?.length || exam.submission.file_url) ? (
                                        <div className="exam-student-viewer-wrap">
                                            <ExamModelAnswerViewer
                                                pages={exam.submission.submission_pages || []}
                                                url={exam.submission.file_url}
                                                authToken={localStorage.getItem('access_token')}
                                            />
                                        </div>
                                    ) : (
                                        <p className="exam-student-empty">لا يوجد ملف مرفق</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                    </div>
                </div>
                
            </div>
        </div>
    )
}
