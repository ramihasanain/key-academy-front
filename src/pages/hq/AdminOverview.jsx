import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import {
    HiOutlineUsers, HiOutlineAcademicCap,
    HiOutlineDocumentText, HiOutlinePresentationChartLine,
    HiOutlineFire, HiOutlineUserPlus, HiOutlineSparkles,
    HiOutlinePlayCircle, HiOutlineChatBubbleLeftRight, HiOutlinePencilSquare
} from 'react-icons/hi2'
import { useNavigate } from 'react-router-dom'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts'

export const AdminOverview = () => {
    const [stats, setStats] = useState(null)
    const [period, setPeriod] = useState('all')
    const [teacher, setTeacher] = useState('all')
    const [grade, setGrade] = useState('all')
    const [subject, setSubject] = useState('all')
    
    const [teachersList, setTeachersList] = useState([])
    const [gradesList, setGradesList] = useState([])
    const [subjectsList, setSubjectsList] = useState([])
    const navigate = useNavigate()

    useEffect(() => {
        const fetchFiltersData = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                // Fetch Teachers
                let res = await fetch(API + '/api/hq/teachers/?page_size=100', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) setTeachersList((await res.json()).results || [])
                
                // Fetch Grades
                res = await fetch(API + '/api/hq/grades/?page_size=100', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = (await res.json()).results || []
                    const uniqueMap = new Map()
                    const cleanGrades = []
                    for(const g of data) {
                        const val = g.grade_name || g.title
                        if(!uniqueMap.has(val)) {
                            uniqueMap.set(val, true)
                            cleanGrades.push({ val: val })
                        }
                    }
                    setGradesList(cleanGrades)
                }

                // Fetch Subjects
                res = await fetch(API + '/api/hq/subjects/?page_size=100', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = (await res.json()).results || []
                    const uniqueMap = new Map()
                    const cleanSubjects = []
                    for(const s of data) {
                        if(!uniqueMap.has(s.name)) {
                            uniqueMap.set(s.name, true)
                            cleanSubjects.push({ val: s.name })
                        }
                    }
                    setSubjectsList(cleanSubjects)
                }
            } catch (err) {}
        }
        fetchFiltersData()
    }, [])

    useEffect(() => {
        const fetchStats = async () => {
            setStats(null)
            const tk = localStorage.getItem('access_token')
            try {
                const url = new URL(API + '/api/hq/stats/')
                url.searchParams.append('period', period)
                url.searchParams.append('teacher', teacher)
                url.searchParams.append('grade', grade)
                url.searchParams.append('subject', subject)
                
                const res = await fetch(url.toString(), {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (err) {
                console.error(err)
            }
        }
        fetchStats()
    }, [period, teacher, grade, subject])

    if (!stats) return <div className="hq-loading">جاري سحب وتحليل ملايين البيانات...</div>

    const coreCards = [
        { title: 'إجمالي الطلاب المسجلين', value: stats.total_users || 0, subtitle: 'مجتمع المنصة', icon: <HiOutlineUsers />, color: 'var(--blue-main)', link: '/hq/students' },
        { title: 'الدورات المتاحة', value: stats.total_courses || 0, subtitle: 'جاهزة للطلاب', icon: <HiOutlineAcademicCap />, color: 'var(--purple-main)', link: '/hq/courses' },
        { title: 'حجم المحتوى (الدروس)', value: stats.total_lessons || 0, subtitle: 'فيديو وملفات', icon: <HiOutlinePlayCircle />, color: 'var(--pink-main)', link: '/hq/lessons' },
        { title: 'حجم التفاعل (الأسئلة)', value: (stats.total_qa_posts || 0) + (stats.total_qa_comments || 0), subtitle: 'سؤال وجواب', icon: <HiOutlineChatBubbleLeftRight />, color: 'var(--green-main)', link: '/hq/qaposts' },
    ]

    const pulseCards = [
        { title: 'الطلاب النشطين اليوم', value: stats.active_today || 0, subtitle: 'سجلوا دخولهم آخر 24 ساعة', icon: <HiOutlineFire />, color: 'var(--orange-main)', link: '/hq/students' },
        { title: 'التسجيلات اليوم', value: stats.signups_today || 0, subtitle: `+${stats.signups_today || 0} انضموا حديثاً`, icon: <HiOutlineUserPlus />, color: 'var(--blue-main)', link: '/hq/students' },
        { title: 'الاشتراكات الفعالة', value: stats.total_enrollments || 0, subtitle: `+${stats.enrollments_today || 0} اشتراك اليوم`, icon: <HiOutlineDocumentText />, color: 'var(--purple-main)', link: '/hq/enrollments' },
        { title: 'المذكرات المكتوبة', value: stats.total_notes || 0, subtitle: 'ملاحظة خاصة بالدارسين', icon: <HiOutlinePencilSquare />, color: 'var(--pink-main)', link: '/hq/notes' },
    ]

    return (
        <div className="hq-overview">
            <div className="hq-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h2>مركز القيادة والتحليلات 📊</h2>
                    <p>مراقبة حية وشاملة لكل ما يدور داخل أروقة المنصة التعليمية</p>
                </div>
                
                {/* Global Dashboard Filters */}
                <div style={{ display: 'flex', gap: '10px', background: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid var(--hq-border)', flexWrap: 'wrap' }}>
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 15px', color: 'white', minWidth: '150px', outline: 'none' }}
                    >
                        <option value="all">شامل (كل الأوقات)</option>
                        <option value="daily">اليوم (آخر 24 ساعة)</option>
                        <option value="weekly">هذا الأسبوع (آخر 7 أيام)</option>
                        <option value="monthly">هذا الشهر (آخر 30 يوم)</option>
                    </select>

                    <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 15px', color: 'white', minWidth: '150px', outline: 'none' }}
                    >
                        <option value="all">جميع المراحل</option>
                        {gradesList.map((g, idx) => (
                            <option key={`g-${idx}`} value={g.val}>{g.val}</option>
                        ))}
                    </select>

                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 15px', color: 'white', minWidth: '150px', outline: 'none' }}
                    >
                        <option value="all">جميع المواد</option>
                        {subjectsList.map((s, idx) => (
                            <option key={`s-${idx}`} value={s.val}>{s.val}</option>
                        ))}
                    </select>

                    <select
                        value={teacher}
                        onChange={(e) => setTeacher(e.target.value)}
                        style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '8px 15px', color: 'white', minWidth: '180px', outline: 'none' }}
                    >
                        <option value="all">جميع الأساتذة العاملين</option>
                        {teachersList.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="hq-stats-grid" style={{ marginBottom: '20px' }}>
                {coreCards.map((c, i) => (
                    <div key={`core-${i}`} className="hq-stat-card" onClick={() => navigate(c.link)} style={{ cursor: 'pointer' }} title="اضغط للانتقال">
                        <div className="hq-sc-icon" style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 15%, transparent)` }}>
                            {c.icon}
                        </div>
                        <div className="hq-sc-info">
                            <span className="hq-sc-title">{c.title}</span>
                            <strong className="hq-sc-value">{c.value}</strong>
                            <span className="hq-sc-subtitle">{c.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pulse Stats Grid */}
            <div className="hq-stats-grid">
                {pulseCards.map((c, i) => (
                    <div key={`pulse-${i}`} className="hq-stat-card" onClick={() => navigate(c.link)} style={{ cursor: 'pointer' }} title="اضغط للانتقال">
                        <div className="hq-sc-icon" style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 15%, transparent)` }}>
                            {c.icon}
                        </div>
                        <div className="hq-sc-info">
                            <span className="hq-sc-title">{c.title}</span>
                            <strong className="hq-sc-value">{c.value}</strong>
                            <span className="hq-sc-subtitle" style={{ color: c.subtitle.includes('+') ? 'var(--green-main)' : undefined, fontWeight: c.subtitle.includes('+') ? 'bold' : 'normal' }}>{c.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="hq-charts-section" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '24px', alignItems: 'start' }}>

                {/* Visual Analytics */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="hq-chart-box">
                        <div className="hq-cb-head">
                            <h3><HiOutlinePresentationChartLine /> معدل التسجيل والاشتراك (آخر 7 أيام)</h3>
                        </div>
                        <div className="hq-cb-body" style={{ height: 350 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chart_data || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorUsr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ec4899" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis stroke="#94a3b8" />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                    <Legend />
                                    <Area type="monotone" dataKey="الاشتراكات" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSub)" />
                                    <Area type="monotone" dataKey="التسجيلات" stroke="#ec4899" strokeWidth={3} fillOpacity={1} fill="url(#colorUsr)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="hq-chart-box">
                        <div className="hq-cb-head" style={{ marginBottom: '16px' }}>
                            <h3><HiOutlineChatBubbleLeftRight /> أحدث الأسئلة المطروحة بالمناهج</h3>
                        </div>
                        <div className="hq-cb-body hq-recent-users">
                            {stats.recent_questions && stats.recent_questions.map(q => (
                                <div key={q.id} className="hq-ru-item hover-item" style={{ alignItems: 'flex-start', cursor: 'pointer', transition: 'background 0.2s', padding: '10px', borderRadius: '10px' }} onClick={() => navigate('/hq/qaposts')} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <div className="hq-ru-av" style={{ background: 'var(--hq-bg)', color: 'var(--green-main)', fontSize: '1rem' }}><HiOutlineChatBubbleLeftRight /></div>
                                    <div className="hq-ru-info">
                                        <strong style={{ fontSize: '0.95rem' }}>{q.student_name} <span style={{ color: 'var(--hq-text-muted)', fontSize: '0.8rem', fontWeight: 'normal' }}>• دورة {q.course_title}</span></strong>
                                        <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--hq-text-main)', background: 'var(--hq-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)' }}>{q.content}</p>
                                    </div>
                                    <span style={{ color: 'var(--hq-text-muted)', fontSize: '0.8rem', flexShrink: 0 }}>{q.time_ago}</span>
                                </div>
                            ))}
                            {(!stats.recent_questions || stats.recent_questions.length === 0) && (
                                <p className="hq-empty-state">لم يتم طرح أي أسئلة مؤخراً.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Vertical Lists Data */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="hq-chart-box">
                        <div className="hq-cb-head" style={{ marginBottom: '16px' }}>
                            <h3><HiOutlineSparkles style={{ color: 'var(--orange-main)' }} /> أكثر الدورات إقبالاً</h3>
                        </div>
                        <div className="hq-cb-body hq-recent-users">
                            {stats.top_courses && stats.top_courses.map((c, idx) => (
                                <div key={c.id} className="hq-ru-item hover-item" style={{ alignItems: 'center', cursor: 'pointer', padding: '10px', borderRadius: '10px', transition: 'background 0.2s' }} onClick={() => navigate(`/hq/enrollments?course=${c.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="عرض المشتركين بالدورة">
                                    <div className="hq-ru-av" style={{ background: idx === 0 ? 'var(--orange-main)' : 'var(--hq-primary-bg)', color: idx === 0 ? 'white' : 'var(--hq-primary)', fontSize: '0.9rem' }}>{idx + 1}</div>
                                    <div className="hq-ru-info">
                                        <strong style={{ fontSize: '0.95rem' }}>{c.title}</strong>
                                    </div>
                                    <div style={{ background: 'var(--hq-bg)', padding: '4px 10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--hq-text-muted)' }}>
                                        {c.enroll_count} طالب
                                    </div>
                                </div>
                            ))}
                            {(!stats.top_courses || stats.top_courses.length === 0) && (
                                <p className="hq-empty-state">لا يوجد بيانات دورات.</p>
                            )}
                        </div>
                    </div>

                    <div className="hq-chart-box">
                        <div className="hq-cb-head" style={{ marginBottom: '16px' }}>
                            <h3><HiOutlineUserPlus /> أحدث المسجلين</h3>
                        </div>
                        <div className="hq-cb-body hq-recent-users">
                            {stats.recent_users && stats.recent_users.map(u => (
                                <div key={u.id} className="hq-ru-item hover-item" style={{ alignItems: 'center', cursor: 'pointer', padding: '10px', borderRadius: '10px', transition: 'background 0.2s' }} onClick={() => navigate(`/hq/students/${u.id}`)} onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'} onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'} title="عرض تفاصيل الطالب">
                                    <div className="hq-ru-av">{u.first_name?.[0] || u.username[0]}</div>
                                    <div className="hq-ru-info">
                                        <strong style={{ fontSize: '0.9rem' }}>{u.first_name || u.username} {u.last_name}</strong>
                                        <span>@{u.username}</span>
                                    </div>
                                    <span style={{ background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>جديد ✨</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
