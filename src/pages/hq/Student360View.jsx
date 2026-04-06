import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineArrowRight, HiOutlineBookOpen, HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineClock, HiOutlineDocumentText, HiOutlineNoSymbol } from 'react-icons/hi2'
import './Admin.css'

export const Student360View = ({ id }) => {
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [toggling, setToggling] = useState(false)
    const [dialog, setDialog] = useState(null)
    const [subjectFilter, setSubjectFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [teacherFilter, setTeacherFilter] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(`${API}/api/hq/students/${id}/360/`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    setData(await res.json())
                } else {
                    alert('لا يمكن جلب بيانات الطالب المطلوبة.')
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [id])

    const closeDialog = () => setDialog(null)

    const handleToggleStatus = async () => {
        setDialog({
            type: 'confirm',
            message: `هل أنت متأكد من رغبتك في ${data.student.is_active ? 'تجميد' : 'إعادة تفعيل'} هذا الحساب؟`,
            onConfirm: async () => {
                closeDialog()
                setToggling(true)
                const tk = localStorage.getItem('access_token')
                try {
                    const res = await fetch(`${API}/api/hq/students/${id}/toggle-status/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    })
                    if (res.ok) {
                        const result = await res.json()
                        setData(prev => ({
                            ...prev,
                            student: { ...prev.student, is_active: result.is_active }
                        }))
                        setDialog({ type: 'alert', message: result.message })
                    }
                } catch (e) {
                    console.error(e)
                } finally {
                    setToggling(false)
                }
            }
        })
    }

    const handleMuteStudent = async () => {
        setDialog({
            type: 'multi_select',
            message: 'اختر الدورة (دورة واحدة أو أكثر):',
            options: [
                { label: 'كل الدورات (شامل)', value: 'all' },
                ...data.courses.map(c => ({ label: 'دورة - ' + c.title, value: c.id }))
            ],
            onConfirm: (selectedCourses) => {
                setDialog({
                    type: 'choices',
                    message: 'اختر نوع التقييد للطالب:',
                    options: [
                        { label: '🚫 حظر كلي (دردشة + أسئلة)', value: 'all' },
                        { label: '💬 منع من الدردشة فقط', value: 'chat' },
                        { label: '❓ منع من طرح الأسئلة فقط', value: 'qa' }
                    ],
                    onConfirm: (muteType) => {
                        setDialog({
                            type: 'choices',
                            message: 'حدد مدة الحظر:',
                            options: [
                                { label: '⏱️ 24 ساعة', value: '24h' },
                                { label: '📅 أسبوع', value: 'week' },
                                { label: '♾️ للأبد', value: 'forever' }
                            ],
                            onConfirm: (duration) => {
                                setDialog({
                                    type: 'input',
                                    message: 'ما سبب الحظر؟ (للتوثيق الإداري)',
                                    placeholder: 'مثلاً: سلوك غير لائق بالدردشة...',
                                    onConfirm: async (reason) => {
                                        closeDialog();
                                        const tk = localStorage.getItem('access_token');
                                        try {
                                            const res = await fetch(`${API}/api/interactions/moderate/mute/${id}/`, {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${tk}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ mute_type: muteType, duration: duration, reason: reason, course_ids: selectedCourses })
                                            });
                                            if (res.ok) {
                                                const result = await res.json();
                                                setDialog({
                                                    type: 'alert',
                                                    message: 'تم تنفيذ الحظر بنجاح حتى: ' + (result.muted_until ? new Date(result.muted_until).toLocaleString('ar-IQ') : '---'),
                                                    onConfirm: () => window.location.reload()
                                                });
                                            }
                                        } catch (e) {
                                            console.error(e);
                                        }
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    const handleHideInteraction = async (type, pk) => {
        setDialog({
            type: 'confirm',
            message: 'هل أنت متأكد من إخفاء هذا المحتوى عن الطالب؟ ستتم أرشفته فوراً.',
            onConfirm: async () => {
                closeDialog()
                const tk = localStorage.getItem('access_token')
                try {
                    const res = await fetch(`${API}/api/interactions/moderate/hide/${type}/${pk}/`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${tk}` }
                    })
                    if (res.ok) {
                        const result = await res.json()
                        setDialog({
                            type: 'alert',
                            message: result.is_hidden ? 'تم إخفاء المحتوى بنجاح' : 'تمت إعادة إظهار المحتوى',
                            onConfirm: () => window.location.reload()
                        })
                    }
                } catch (e) {
                    console.error(e)
                }
            }
        })
    }

    if (loading) return <div className="hq-loading" style={{ padding: '50px' }}>جاري سحب بيانات الطالب التفصيلية (360)...</div>
    if (!data) return <div className="hq-loading" style={{ color: 'red' }}>لم يتم العثور على الطالب.</div>

    const { student, kpis, courses, history, quizzes, questions, notes, chats } = data

    const subjectsList = [...new Set(courses.map(c => c.subject))];
    const teachersList = [...new Set(courses.map(c => c.teacher))];
    const coursesList = [...new Set(courses.map(c => c.title))];

    const filteredCourses = courses.filter(c => 
        (!subjectFilter || c.subject === subjectFilter) &&
        (!courseFilter || c.title === courseFilter) &&
        (!teacherFilter || c.teacher === teacherFilter)
    );

    const validCourseTitles = filteredCourses.map(c => c.title);
    const checkCourse = (cTitle) => validCourseTitles.includes(cTitle) || (cTitle === 'غير معروف' && !subjectFilter && !courseFilter && !teacherFilter) || (!cTitle && !subjectFilter && !courseFilter && !teacherFilter);

    const filteredHistory = history.filter(h => checkCourse(h.course_title));
    const filteredQuizzes = quizzes.filter(q => checkCourse(q.course_title));
    const filteredQuestions = questions.filter(q => checkCourse(q.course_title));
    const filteredNotes = notes.filter(n => checkCourse(n.course_title));
    const filteredChats = chats.filter(c => checkCourse(c.course_title));

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '20px', borderBottom: '1px solid var(--hq-border)', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <button className="hq-back-btn" onClick={() => navigate(`/hq/students`)} style={{ marginTop: '5px' }}>
                        <HiOutlineArrowRight />
                    </button>
                    <div>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            ملف الطالب (360) - {student.full_name} (@{student.username})
                            {!student.is_active && <span style={{ fontSize: '0.7rem', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>مجمد ❄️</span>}
                        </h2>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.8rem', color: 'var(--hq-primary-text)' }}>
                            <span style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>📞 الطالب: {student.email || 'غير متوفر'}</span>
                            <span style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>📱 الوالد: {student.parent_phone || 'غير متوفر'}</span>
                            <span style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>📍 {student.city || 'بغداد'}</span>
                            <span style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>🎓 {student.grade || 'غير محدد'} ({student.branch || 'عام'})</span>
                            <span style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--hq-border)' }}>📅 الانضمام: {new Date(student.date_joined).toLocaleDateString('ar-EG')}</span>

                            {/* Mute Indicators */}
                            {new Date(student.muted_until) > new Date() && (
                                <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', border: '1px solid #ef4444', fontWeight: 'bold' }}>🚫 حظر كلي</span>
                            )}
                            {new Date(student.chat_muted_until) > new Date() && (
                                <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', border: '1px solid #38bdf8', fontWeight: 'bold' }}>💬 حظر دردشة</span>
                            )}
                            {new Date(student.qa_muted_until) > new Date() && (
                                <span style={{ background: 'rgba(251, 191, 36, 0.2)', color: '#fbbf24', padding: '4px 10px', borderRadius: '6px', border: '1px solid #fbbf24', fontWeight: 'bold' }}>❓ حظر أسئلة</span>
                            )}
                        </div>
                        {student.mute_reason && (new Date(student.muted_until) > new Date() || new Date(student.chat_muted_until) > new Date() || new Date(student.qa_muted_until) > new Date()) && (
                            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#ef4444', background: 'rgba(239,68,68,0.05)', padding: '8px 12px', borderRadius: '8px', borderRight: '3px solid #ef4444' }}>
                                <strong>سبب الحظر:</strong> {student.mute_reason}
                            </div>
                        )}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={handleMuteStudent}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: '1px solid #fbbf24', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                            background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24'
                        }}>
                        <HiOutlineNoSymbol size={20} /> تقييد المشاركة
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        disabled={toggling}
                        style={{
                            padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: toggling ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', fontSize: '0.9rem', transition: 'all 0.3s ease',
                            background: student.is_active ? 'rgba(239, 68, 68, 0.1)' : 'rgba(52, 211, 153, 0.1)',
                            color: student.is_active ? '#ef4444' : '#34d399',
                            opacity: toggling ? 0.7 : 1
                        }}>
                        {student.is_active ? <><HiOutlineNoSymbol size={20} /> تجميد الحساب</> : <><HiOutlineCheckCircle size={20} /> تنشيط تدريجي</>}
                    </button>
                </div>
            </div>

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '30px' }}>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', width: '40px', height: '40px' }}><HiOutlineBookOpen size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>دورات مسجل بها</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{kpis.total_courses}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', width: '40px', height: '40px' }}><HiOutlineChartBar size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>متوسط الاختبارات</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{kpis.avg_quiz_score}%</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', width: '40px', height: '40px' }}><HiOutlineCheckCircle size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>دروس مكتملة</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{kpis.completed_lessons}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(167, 139, 250, 0.1)', color: '#a78bfa', width: '40px', height: '40px' }}><HiOutlineDocumentText size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>تفاعل (س+م)</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{kpis.total_notes + kpis.total_questions}</div>
                    </div>
                </div>
                <div className="hq-stat-card" style={{ padding: '15px' }}>
                    <div className="hq-sc-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', width: '40px', height: '40px' }}><HiOutlineDocumentText size={20} /></div>
                    <div className="hq-sc-info">
                        <h3 style={{ fontSize: '0.85rem' }}>دردشات عامة</h3>
                        <div className="hq-sc-value" style={{ fontSize: '1.3rem' }}>{kpis.total_chats || 0}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="hq-table-card" style={{ marginBottom: '20px', padding: '15px 20px', display: 'flex', gap: '15px', alignItems: 'center', background: 'var(--hq-bg)', flexWrap: 'wrap' }}>
                <strong style={{ color: 'var(--hq-primary-text)' }}>فلاتر السجل (360):</strong>
                <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)', background: 'transparent', color: 'var(--hq-primary-text)', outline: 'none' }}>
                    <option value="" style={{color: 'black'}}>كل المواد</option>
                    {subjectsList.map(s => <option key={s} value={s} style={{color: 'black'}}>{s}</option>)}
                </select>
                <select value={courseFilter} onChange={e => setCourseFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)', background: 'transparent', color: 'var(--hq-primary-text)', outline: 'none' }}>
                    <option value="" style={{color: 'black'}}>كل الدورات</option>
                    {coursesList.map(c => <option key={c} value={c} style={{color: 'black'}}>{c}</option>)}
                </select>
                <select value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)', background: 'transparent', color: 'var(--hq-primary-text)', outline: 'none' }}>
                    <option value="" style={{color: 'black'}}>كل الأساتذة</option>
                    {teachersList.map(t => <option key={t} value={t} style={{color: 'black'}}>{t}</option>)}
                </select>
                {(subjectFilter || courseFilter || teacherFilter) && (
                    <button onClick={() => { setSubjectFilter(''); setCourseFilter(''); setTeacherFilter(''); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', textDecoration: 'underline' }}>
                        مسح الفلاتر
                    </button>
                )}
            </div>

            {/* Courses Progress */}
            <div className="hq-table-card" style={{ marginBottom: '30px' }}>
                <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>التقدم بالدورات</h3>
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredCourses.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد اشتراكات تطابق الفلتر</p> : filteredCourses.map(c => (
                        <div key={c.id} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '10px', border: '1px solid var(--hq-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, color: 'var(--hq-primary-text)' }}>{c.title}</h4>
                                <span style={{ fontWeight: 'bold', color: c.progress_pct === 100 ? '#34d399' : 'var(--hq-primary)' }}>{c.progress_pct}%</span>
                            </div>
                            <div style={{ height: '8px', background: 'var(--hq-border)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${c.progress_pct}%`, background: c.progress_pct === 100 ? '#34d399' : 'var(--hq-primary)', transition: 'width 0.5s ease' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', color: 'var(--hq-text-muted)' }}>
                                <span>الدروس المكتملة: {c.completed_lessons} من أصل {c.total_lessons}</span>
                                <span>تاريخ الاشتراك: {new Date(c.enrolled_at).toLocaleDateString('ar-EG')}</span>
                            </div>
                            <div style={{ display: 'flex', flexWrap:'wrap', gap:'10px', marginTop: '10px', fontSize: '0.80rem', color: 'var(--hq-text-muted)' }}>
                                <span style={{background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', padding: '3px 8px', borderRadius: '4px'}}>المادة: {c.subject}</span>
                                <span style={{background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', padding: '3px 8px', borderRadius: '4px'}}>الأستاذ: {c.teacher}</span>
                                <span style={{background: 'rgba(251, 191, 36, 0.1)', color: '#fbbf24', padding: '3px 8px', borderRadius: '4px'}}>المجموعة: {c.group_index}</span>
                                <span style={{background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', padding: '3px 8px', borderRadius: '4px'}}>المساعد المشرف: {c.assistant}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Grid 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                {/* Watch History */}
                <div className="hq-table-card">
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>آخر المشاهدات</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredHistory.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد بيانات التزام تطابق الفلتر</p> : filteredHistory.map((h, i) => (
                            <div key={i} style={{ display: 'flex', gap: '15px', background: 'var(--hq-bg)', padding: '10px', borderRadius: '8px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <HiOutlineClock size={20} />
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 5px', fontWeight: '500', color: 'var(--hq-primary-text)' }}>{h.lesson_title}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>{h.course_title} - {new Date(h.last_visited).toLocaleString('ar-EG')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quizzes */}
                <div className="hq-table-card">
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>سجل الاختبارات</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredQuizzes.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد اختبارات تطابق الفلتر</p> : filteredQuizzes.map((q, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--hq-bg)', padding: '10px 15px', borderRadius: '8px' }}>
                                <div>
                                    <p style={{ margin: '0 0 5px', fontWeight: '500', color: 'var(--hq-primary-text)' }}>{q.quiz_title}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>{new Date(q.attempted_at).toLocaleDateString('ar-EG')}</p>
                                </div>
                                <div style={{ fontWeight: 'bold', background: q.percentage >= 50 ? 'rgba(52,211,153,0.1)' : 'rgba(239,68,68,0.1)', color: q.percentage >= 50 ? '#34d399' : '#ef4444', padding: '5px 12px', borderRadius: '20px' }}>
                                    {q.percentage}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notes, QA, Chats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
                <div className="hq-table-card">
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>أسئلة واستفسارات</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredQuestions.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد أسئلة تطابق الفلتر</p> : filteredQuestions.map((q, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderLeft: q.is_resolved ? '3px solid #34d399' : '3px solid #fbbf24', position: 'relative' }}>
                                <p style={{ margin: '0 0 10px', color: 'var(--hq-primary-text)', lineHeight: '1.5', paddingRight: '25px' }}>{q.content}</p>
                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>درس: {q.lesson_title}</div>
                                <button
                                    onClick={() => handleHideInteraction('qapost', q.pk || q.id)}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                    title="إخفاء السؤال"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hq-table-card">
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>الملاحظات الشخصية</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {filteredNotes.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد ملاحظات تطابق الفلتر</p> : filteredNotes.map((n, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                                <p style={{ margin: '0 0 10px', color: 'var(--hq-primary-text)', lineHeight: '1.5' }}>{n.content}</p>
                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>درس: {n.lesson_title}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hq-table-card">
                    <h3 style={{ padding: '20px', borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-primary)' }}>المشاركات العامة في المجموعة</h3>
                    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {!filteredChats || filteredChats.length === 0 ? <p style={{ color: 'var(--hq-text-muted)' }}>لا يوجد دردشات تطابق الفلتر</p> : filteredChats.map((c, i) => (
                            <div key={i} style={{ background: 'var(--hq-bg)', padding: '15px', borderRadius: '8px', borderLeft: '3px solid #ec4899', position: 'relative' }}>
                                <p style={{ margin: '0 0 10px', color: 'var(--hq-primary-text)', lineHeight: '1.5', paddingRight: '25px' }}>{c.content}</p>
                                <div style={{ fontSize: '0.8rem', color: 'var(--hq-text-muted)' }}>دورة: {c.course_title}</div>
                                <button
                                    onClick={() => handleHideInteraction('groupmessage', c.pk || c.id)}
                                    style={{ position: 'absolute', top: '10px', right: '10px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', opacity: 0.6 }}
                                    title="إخفاء الرسالة"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Premium Dialog Overlay */}
            {dialog && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '24px', padding: '30px', width: '420px', maxWidth: '90%', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', animation: 'hq-modal-pop 0.3s ease-out' }}>
                        <h3 style={{ color: '#f8fafc', marginTop: 0, marginBottom: '20px', fontSize: '20px', lineHeight: 1.6, textAlign: 'center', fontWeight: 'bold' }}>{dialog.message}</h3>

                        {dialog.type === 'choices' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '25px' }}>
                                {dialog.options.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => dialog.onConfirm(opt.value)}
                                        style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '12px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s' }}
                                        onMouseOver={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                                        onMouseOut={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}

                        {dialog.type === 'multi_select' && (
                            <div style={{ marginBottom: '25px' }}>
                                <select 
                                    multiple 
                                    id="hq-dialog-multi-select" 
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '14px', minHeight: '150px' }}
                                >
                                    {dialog.options.map(opt => (
                                        <option key={opt.value} value={opt.value} style={{ padding: '8px', cursor: 'pointer' }}>{opt.label}</option>
                                    ))}
                                </select>
                                <p style={{fontSize:'0.8rem', color:'#94a3b8', marginTop:'10px', textAlign: 'center'}}>* يُرجى الضغط على المفتاح Ctrl لاختيار أكثر من دورة معاً</p>
                            </div>
                        )}

                        {dialog.type === 'input' && (
                            <div style={{ marginBottom: '25px' }}>
                                <textarea
                                    autoFocus
                                    placeholder={dialog.placeholder}
                                    id="hq-dialog-input"
                                    style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: '14px', resize: 'none', minHeight: '100px' }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            {dialog.type === 'confirm' && (
                                <>
                                    <button onClick={dialog.onConfirm} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>نعم، تأكيد</button>
                                    <button onClick={closeDialog} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>إلغاء</button>
                                </>
                            )}
                            {dialog.type === 'input' && (
                                <>
                                    <button onClick={() => dialog.onConfirm(document.getElementById('hq-dialog-input').value)} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>استمرار</button>
                                    <button onClick={closeDialog} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>إغلاق</button>
                                </>
                            )}
                            {dialog.type === 'alert' && (
                                <button onClick={() => { if (dialog.onConfirm) dialog.onConfirm(); closeDialog(); }} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>موافق</button>
                            )}
                            {dialog.type === 'choices' && (
                                <button onClick={closeDialog} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>إلغاء</button>
                            )}
                            {dialog.type === 'multi_select' && (
                                <>
                                    <button onClick={() => { 
                                        const select = document.getElementById('hq-dialog-multi-select');
                                        const selectedValues = Array.from(select.selectedOptions).map(opt => opt.value);
                                        if (selectedValues.length === 0) { alert('الرجاء اختيار خيار واحد على الأقل'); return; }
                                        dialog.onConfirm(selectedValues.includes('all') ? ['all'] : selectedValues);
                                    }} style={{ background: '#6366f1', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>استمرار</button>
                                    <button onClick={closeDialog} style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #334155', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}>إغلاق</button>
                                </>
                            )}
                        </div>
                    </div>
                    <style>{`
                        @keyframes hq-modal-pop {
                            from { opacity: 0; transform: scale(0.95) translateY(10px); }
                            to { opacity: 1; transform: scale(1) translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    )
}
