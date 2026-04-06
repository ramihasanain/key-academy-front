import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineAcademicCap, HiOutlineUsers, HiOutlineChatBubbleLeftRight,
    HiOutlineChartBar, HiOutlineCheckCircle, HiOutlineExclamationTriangle,
    HiOutlineClock
} from 'react-icons/hi2'
import '../hq/Admin.css'

export const TAStudentStats = () => {
    const navigate = useNavigate()
    const { courseId } = useParams()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchStats = async () => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        const url = courseId
            ? `${API}/api/interactions/ta-stats/?course_id=${courseId}`
            : API + '/api/interactions/ta-stats/'
        try {
            const res = await fetch(url, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                setStats(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    if (loading) return <div className="hq-loading">جاري تحليل الأداء...</div>

    return (
        <div style={{ padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '35px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                <h1 style={{
                    fontSize: '28px', margin: 0, fontWeight: '900',
                    background: 'linear-gradient(45deg, #a855f7, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <HiOutlineAcademicCap color="#a855f7" /> اللوحة التحليلية للطلاب
                </h1>
                <p style={{ color: 'var(--hq-text-muted)', marginTop: '8px', fontSize: '1rem', fontWeight: '500' }}>
                    نظرة شاملة ومتقدمة على أداء طلبة مجموعاتك وتفاعلهم.
                </p>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '35px' }}>
                <div style={{
                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(56, 189, 248, 0.02))',
                    border: '1px solid rgba(56, 189, 248, 0.2)',
                    borderRadius: '20px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '18px', borderRadius: '16px' }}>
                        <HiOutlineUsers size={34} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', color: 'var(--hq-text-muted)', marginBottom: '4px' }}>إجمالي الطلاب المسجلين</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--hq-primary-text)', letterSpacing: '1px' }}>{stats?.totalStudents || 0}</div>
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.02))',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '20px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '18px', borderRadius: '16px' }}>
                        <HiOutlineChartBar size={34} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', color: 'var(--hq-text-muted)', marginBottom: '4px' }}>الطلاب المتفاعلين</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'baseline', gap: '10px' }}>
                            {stats?.activeStudents || 0}
                            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '10px' }}>هذا الأسبوع</span>
                        </div>
                    </div>
                </div>

                <div style={{
                    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08), rgba(239, 68, 68, 0.02))',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '20px', padding: '25px', display: 'flex', alignItems: 'center', gap: '20px',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', padding: '18px', borderRadius: '16px' }}>
                        <HiOutlineExclamationTriangle size={34} />
                    </div>
                    <div>
                        <div style={{ fontSize: '1rem', color: 'var(--hq-text-muted)', marginBottom: '4px' }}>الطلاب غير النشطين</div>
                        <div style={{ fontSize: '32px', fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>{stats?.inactiveStudents || 0}</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
                {/* Left Column: Leaderboard */}
                <div>
                    <div className="hq-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, color: 'var(--hq-primary-text)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <HiOutlineCheckCircle color="#10b981" size={24} />
                                لوحة الشرف (أفضل 10 طلاب)
                            </h3>
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <tbody>
                                {(!stats?.leaderboard || stats.leaderboard.length === 0) ? (
                                    <tr>
                                        <td style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>
                                            لا توجد بيانات للإنجاز حتى الآن.
                                        </td>
                                    </tr>
                                ) : stats.leaderboard.map((student, idx) => (
                                    <tr key={student.id} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: idx < 3 ? 'linear-gradient(90deg, rgba(251, 191, 36, 0.05), transparent)' : 'transparent'
                                    }}>
                                        <td style={{ padding: '18px 20px', fontWeight: 'bold', width: '60px', color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--hq-text-muted)', fontSize: '1.2rem', textAlign: 'center' }}>
                                            #{idx + 1}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: 'var(--hq-primary-text)' }}>{student.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)', marginTop: '2px' }}>@{student.username}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px', textAlign: 'center' }}>
                                            <div style={{ display: 'inline-block', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 14px', borderRadius: '12px', fontWeight: 'bold' }}>
                                                {student.completedCount} درس
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Column: Alerts & Recent Activity */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

                    {/* Recent Activities */}
                    <div className="hq-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                            <h3 style={{ margin: 0, color: 'var(--hq-primary-text)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <HiOutlineClock color="#6366f1" size={24} />
                                أحدث الأنشطة الحية
                            </h3>
                        </div>
                        <div style={{ padding: '10px 20px' }}>
                            {(!stats?.recentActivities || stats.recentActivities.length === 0) ? (
                                <div style={{ padding: '30px 0', textAlign: 'center', color: 'var(--hq-text-muted)' }}>لا يوجد نشاط حديث</div>
                            ) : stats.recentActivities.map((act, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', padding: '15px 0', borderBottom: i !== stats.recentActivities.length - 1 ? '1px dashed rgba(255,255,255,0.1)' : 'none' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#6366f1', marginTop: '6px', boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)' }}></div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: 'var(--hq-primary-text)', fontSize: '1rem' }}><span style={{ fontWeight: 'bold' }}>{act.student_name}</span> قام بإنهاء درس:</div>
                                        <div style={{ color: '#818cf8', fontSize: '0.9rem', marginTop: '4px' }}>{act.lesson_title}</div>
                                    </div>
                                    <div style={{ color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>{act.time}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* At Risk Students */}
                    <div className="hq-card" style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)' }}>
                            <h3 style={{ margin: 0, color: '#ef4444', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <HiOutlineExclamationTriangle color="#ef4444" size={24} />
                                طلاب معرضون للرسوب (غياب أكثر من 14 يوم)
                            </h3>
                        </div>
                        <div style={{ padding: '0' }}>
                            {(!stats?.atRisk || stats.atRisk.length === 0) ? (
                                <div style={{ padding: '30px', textAlign: 'center', color: '#10b981', fontWeight: 'bold' }}>
                                    ✅ جميع الطلاب متفاعلون، لا يوجد غياب طويل!
                                </div>
                            ) : stats.atRisk.map((student, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: i !== stats.atRisk.length - 1 ? '1px solid rgba(239,68,68,0.1)' : 'none', background: 'rgba(239,68,68,0.02)' }}>
                                    <div>
                                        <div style={{ color: 'var(--hq-primary-text)', fontWeight: 'bold' }}>{student.name}</div>
                                        <div style={{ color: 'var(--hq-text-muted)', fontSize: '0.85rem' }}>@{student.username}</div>
                                    </div>
                                    <div style={{ color: '#ef4444', fontSize: '0.9rem', background: 'rgba(239,68,68,0.1)', padding: '5px 10px', borderRadius: '8px' }}>
                                        آخر ظهور: {student.last_login}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Row: All Students Table */}
            <div className="hq-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', marginTop: '30px' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                    <h3 style={{ margin: 0, color: 'var(--hq-primary-text)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineUsers color="#38bdf8" size={24} />
                        القائمة الشاملة للطلاب
                    </h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                        <thead>
                            <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--hq-text-muted)' }}>
                                <th style={{ padding: '15px' }}>اسم الطالب</th>
                                <th style={{ padding: '15px' }}>الـيوزرنيم</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>الحالة</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>آخر ظهور</th>
                                <th style={{ padding: '15px', textAlign: 'center' }}>الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(!stats?.allStudents || stats.allStudents.length === 0) ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>
                                        لا يوجد طلاب مضافين تحت إشرافك حتى الآن.
                                    </td>
                                </tr>
                            ) : stats.allStudents.map(student => (
                                <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s', cursor: 'pointer' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                    onClick={() => {
                                        if (window.location.pathname.startsWith('/teacher')) {
                                            navigate(`/teacher/students/${student.id}/360`)
                                        } else {
                                            navigate(`/ta/student/${student.id}/360`)
                                        }
                                    }}
                                >
                                    <td style={{ padding: '15px', fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>{student.name}</td>
                                    <td style={{ padding: '15px', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>@{student.username}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        {student.is_active ?
                                            <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' }}>فعال</span> :
                                            <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '10px', fontSize: '0.85rem' }}>مجمد</span>
                                        }
                                    </td>
                                    <td style={{ padding: '15px', textAlign: 'center', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>{student.last_login}</td>
                                    <td style={{ padding: '15px', textAlign: 'center' }}>
                                        <button
                                            style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                                        >
                                            استعراض الملف
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
