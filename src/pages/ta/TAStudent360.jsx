import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API } from '../../config'
import { useTAActiveGroup } from '../../contexts/TAActiveGroupContext'
import { HiOutlineArrowRight, HiOutlineBookOpen, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineDocumentText, HiOutlineClipboardDocumentCheck } from 'react-icons/hi2'
import '../hq/Admin.css'

export const TAStudent360 = ({ studentIdProp, groupId, onClose }) => {
    const params = useParams()
    const id = studentIdProp || params.id
    const navigate = useNavigate()
    const { activeGroupId } = useTAActiveGroup()
    // وضع المراقبة (أدمن): لا نرسل group_id من localStorage — قد يكون قديماً من مساعد آخر
    const isSpyMode = !!sessionStorage.getItem('spy_token')
    const effectiveGroupId = isSpyMode ? (groupId ?? null) : (groupId ?? activeGroupId)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
            const groupQs = effectiveGroupId ? `?group_id=${effectiveGroupId}` : ''
            try {
                const res = await fetch(`${API}/api/interactions/ta-students/${id}/360/${groupQs}`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    setData(await res.json())
                } else if (res.status === 403) {
                    alert('لا تملك صلاحية الوصول إلى بيانات هذا الطالب (خارج مجموعتك).')
                    if (onClose) onClose()
                    else navigate('/ta')
                } else {
                    alert('حدث خطأ أثناء تحميل ملف الطالب. حاول مرة أخرى.')
                    if (onClose) onClose()
                    else navigate('/ta')
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id, effectiveGroupId, navigate, onClose])

    if (loading) return <div className="hq-loading" style={{ padding: '50px' }}>جاري تحميل ملف الطالب...</div>
    if (!data) return <div className="hq-loading" style={{ color: 'red' }}>لم يتم العثور على الطالب.</div>

    const { student, courses, history, quizzes, interactions, video_stats } = data

    return (
        <div className="hq-form-wrap" style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            <div className="hq-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--hq-border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <button className="hq-back-btn" onClick={() => onClose ? onClose() : navigate(window.location.pathname.startsWith('/teacher') ? '/teacher' : `/ta`)} style={{ marginTop: '5px', background: 'transparent', border: 'none', color: 'var(--hq-primary)', cursor: 'pointer', fontSize: '24px' }}>
                        <HiOutlineArrowRight />
                    </button>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--hq-primary-text)' }}>
                            ملف الطالب - {student.full_name}
                            <span style={{ fontSize: '1rem', color: 'var(--hq-text-muted)', fontWeight: 'normal' }}>@{student.username}</span>
                            {!student.is_active && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>مجمد ❄️</span>}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--hq-primary-text)' }}>
                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>📅 الانضمام: {new Date(student.date_joined).toLocaleDateString('ar-EG')}</span>

                            {/* Mute Indicators */}
                            {student.muted_until && new Date(student.muted_until) > new Date() && (
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ef4444', fontWeight: 'bold' }}>🚫 حظر حساب</span>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', width: '40px', height: '40px' }}><HiOutlineChartBar size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--hq-text-muted)' }}>الأسئلة والملاحظات</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem', color: 'var(--hq-primary-text)' }}>
                            {(interactions?.qa_posts || 0) + (interactions?.notes || 0)}
                        </div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', width: '40px', height: '40px' }}><HiOutlineDocumentText size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--hq-text-muted)' }}>رسائل المجموعات</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem', color: 'var(--hq-primary-text)' }}>{interactions?.group_msgs || 0}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', width: '40px', height: '40px' }}><HiOutlineClipboardDocumentCheck size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem', color: 'var(--hq-text-muted)' }}>تفاعلات الفيديو</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem', color: 'var(--hq-primary-text)' }}>{video_stats?.overall_correct_pct || 0}%</div>
                    </div>
                </div>
            </div>

            {/* Main Layout 2 Columns */}
            <div className="ta-360-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', alignItems: 'start' }}>

                {/* Left Column: Progress & Watch History */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="hq-card" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiOutlineChartBar /> تقدم المنهاج ({courses.length})
                        </h3>
                        {courses.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد اشتراكات فعالة.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {courses.map(c => (
                                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid var(--hq-border)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <strong style={{ color: 'var(--hq-primary-text)' }}>{c.title}</strong>
                                            <span style={{ color: c.is_completed ? '#10b981' : 'var(--hq-primary)', fontWeight: 'bold' }}>{c.progress_pct}%</span>
                                        </div>
                                        <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                            <div style={{ width: `${c.progress_pct}%`, height: '100%', background: c.is_completed ? '#10b981' : 'var(--hq-primary)' }}></div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>
                                            <span>الدروس المنجزة: {c.completed_lessons} من {c.total_lessons}</span>
                                            <span>تاريخ الاشتراك: {new Date(c.enrolled_at).toLocaleDateString('ar-EG')}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="hq-card" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiOutlineCheckCircle /> سجل الامتحانات ({quizzes.length})
                        </h3>
                        {quizzes.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لم يقم الطالب بأي امتحان بعد.</p> : (
                            <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ paddingBottom: '10px' }}>الامتحان / الدرس</th>
                                        <th style={{ paddingBottom: '10px' }}>النتيجة</th>
                                        <th style={{ paddingBottom: '10px' }}>التاريخ</th>
                                        <th style={{ paddingBottom: '10px' }}>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {quizzes.map((q, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px 0' }}>
                                                <div style={{ color: 'var(--hq-primary-text)', fontWeight: 'bold' }}>{q.quiz_title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-primary)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <HiOutlineBookOpen size={13} /> {q.lesson_title || 'غير مرتبط بدرس'}
                                                </div>
                                                {q.module_title && <div style={{ fontSize: '0.72rem', color: 'var(--hq-text-muted)', marginTop: '2px' }}>{q.module_title}</div>}
                                            </td>
                                            <td style={{ padding: '10px 0', fontWeight: 'bold', color: 'var(--hq-primary-text)', verticalAlign: 'top' }}>{q.score}/{q.total_questions}</td>
                                            <td style={{ padding: '10px 0', color: 'var(--hq-primary-text)', verticalAlign: 'top' }}>{new Date(q.date).toLocaleDateString('ar-EG')}</td>
                                            <td style={{ padding: '10px 0', verticalAlign: 'top' }}>
                                                {q.passed ? <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>ناجح ✨</span> : <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>راسب</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="hq-card" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiOutlineClipboardDocumentCheck /> الامتحانات الأسبوعية ({data.weekly_exams?.length || 0})
                        </h3>
                        {!data.weekly_exams || data.weekly_exams.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لم يقم الطالب بتسليم أي امتحان أسبوعي.</p> : (
                            <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>
                                        <th style={{ paddingBottom: '10px' }}>الامتحان / الوحدة</th>
                                        <th style={{ paddingBottom: '10px' }}>التسليم</th>
                                        <th style={{ paddingBottom: '10px' }}>النتيجة</th>
                                        <th style={{ paddingBottom: '10px' }}>الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.weekly_exams.map((we, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                            <td style={{ padding: '10px 0' }}>
                                                <div style={{ color: 'var(--hq-primary-text)', fontWeight: 'bold' }}>{we.exam_title}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>{we.module_title}</div>
                                            </td>
                                            <td style={{ padding: '10px 0', color: 'var(--hq-primary-text)' }}>{new Date(we.date).toLocaleDateString('ar-EG')}</td>
                                            <td style={{ padding: '10px 0', fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>
                                                {we.is_graded ? `${we.score}/${we.total_mark}` : '---'}
                                            </td>
                                            <td style={{ padding: '10px 0' }}>
                                                {we.is_graded 
                                                    ? <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>تم التقييم</span> 
                                                    : <span style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem' }}>بانتظار تصحيحك</span>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Right Column: Interaction History (Quizzes/Watch Log) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="hq-card" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiOutlineBookOpen /> آخر الدروس المشاهدة
                        </h3>
                        {history.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد سجل مشاهدات حديث.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {history.map((h, i) => (
                                    <div key={i} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `3px solid ${h.is_completed ? '#10b981' : '#fbbf24'}` }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--hq-primary-text)' }}>{h.lesson_title}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '5px' }}>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--hq-primary)' }}>{h.course_title}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)' }}>
                                                {h.last_visited ? new Date(h.last_visited).toLocaleDateString('ar-EG') : 'غير محدد'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Video Stats Details */}
                    <div className="hq-card" style={{ padding: '20px' }}>
                        <h3 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <HiOutlineChartBar /> إحصائيات أسئلة الفيديو ({video_stats?.total_lessons || 0})
                        </h3>
                        {!video_stats || video_stats.lesson_stats.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا توجد تفاعلات وتجارب أسئلة مسجلة.</p> : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {video_stats.lesson_stats.map((ls, idx) => (
                                    <div key={idx} style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '10px', border: '1px solid var(--hq-border)' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '0.95rem', color: 'var(--hq-primary-text)', marginBottom: '10px' }}>{ls.lesson_title}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--hq-text-muted)', marginBottom: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                                            <span>مرات المشاهدة: <strong style={{color: 'var(--hq-primary-text)'}}>{ls.total_views}</strong></span>
                                            <span>دقة الإجابات: <strong style={{color: ls.total_answers ? (ls.correct_answers/ls.total_answers >= 0.5 ? '#10b981' : '#ef4444') : 'inherit'}}>{ls.total_answers ? Math.round((ls.correct_answers/ls.total_answers)*100) : 0}%</strong></span>
                                        </div>
                                        
                                        <div style={{ fontSize: '0.8rem', color: 'var(--hq-primary-text)', marginBottom: '5px' }}>أول إجابة للطالب لكل سؤال:</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {ls.first_answers && ls.first_answers.length === 0 ? <span style={{opacity: 0.5}}>لم يجب على أي سؤال</span> : (
                                                ls.first_answers.map((ans, aidx) => (
                                                    <div key={aidx} style={{ padding: '8px 10px', borderRadius: '6px', background: ans.is_correct ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)', border: `1px solid ${ans.is_correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}` }}>
                                                        <div style={{ color: 'var(--hq-primary-text)', marginBottom: '4px', fontWeight: 'bold', fontSize: '0.85rem' }}>{ans.question_text}</div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ color: ans.is_correct ? '#34d399' : '#f87171', fontSize: '0.8rem' }}>إجابة الطالب: {ans.answer_text}</span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--hq-text-muted)' }}>{new Date(ans.created_at).toLocaleDateString('ar-EG')} {ans.is_correct ? '✅' : '❌'}</span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

        </div>
    )
}
