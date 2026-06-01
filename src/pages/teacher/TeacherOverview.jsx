import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    BarChart, Bar, Legend,
    PieChart, Pie, Cell
} from 'recharts'
import {
    HiOutlineAcademicCap,
    HiOutlineUsers,
    HiOutlinePresentationChartLine,
    HiOutlineCheckCircle
} from 'react-icons/hi2'
import '../hq/Admin.css'

const COLORS = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

export const TeacherOverview = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch(API + '/api/teachers/dashboard/stats/', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="hq-loading">جاري تحليل البيانات وبناء المخططات...</div>
    if (!stats) return <div className="hq-loading" style={{ color: 'red' }}>فشل تحميل إحصائيات الأستاذ</div>

    const { charts } = stats;

    return (
        <div className="teacher-overview-page ta-page">
            <div className="hq-page-header" style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.5rem', color: 'var(--hq-text-main)', marginBottom: '5px', fontWeight: 900 }}>
                    💎 مركز القيادة والتحليلات البيانية
                </h1>
                <p style={{ color: 'var(--hq-text-muted)', margin: 0 }}>
                    مراقبة تفصيلية وعميقة لأداء الدورات، الطلاب، وكادر العمل عبر المخططات.
                </p>
            </div>

            <div className="hq-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', marginBottom: '30px' }}>
                <div className="hq-stat-card">
                    <div className="hq-sc-icon" style={{ background: 'rgba(30, 58, 138, 0.1)', color: '#1e3a8a' }}><HiOutlinePresentationChartLine size={24} /></div>
                    <div className="hq-sc-info">
                        <h3>وحداتك الدراسية (الدورات)</h3>
                        <div className="hq-sc-value">{stats.stats.total_courses}</div>
                    </div>
                </div>
                <div className="hq-stat-card">
                    <div className="hq-sc-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}><HiOutlineUsers size={24} /></div>
                    <div className="hq-sc-info">
                        <h3>إجمالي طلابك</h3>
                        <div className="hq-sc-value">{stats.stats.total_students}</div>
                    </div>
                </div>
                <div className="hq-stat-card">
                    <div className="hq-sc-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}><HiOutlineAcademicCap size={24} /></div>
                    <div className="hq-sc-info">
                        <h3>فريقك (المساعدين)</h3>
                        <div className="hq-sc-value">{stats.stats.total_assistants}</div>
                    </div>
                </div>
                <div className="hq-stat-card">
                    <div className="hq-sc-icon" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}><HiOutlineCheckCircle size={24} /></div>
                    <div className="hq-sc-info">
                        <h3>إجمالي الدروس المنجزة</h3>
                        <div className="hq-sc-value">{stats.stats.total_completed_lessons}</div>
                    </div>
                </div>
            </div>

            <div className="teacher-overview-charts hq-charts-section">
                <div className="hq-chart-box teacher-chart-panel">
                    <div className="hq-cb-head">
                        <h3>📈 معدل انضمام الطلاب (آخر 6 أشهر)</h3>
                    </div>
                    <div className="teacher-chart-body">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts?.enrollments || []} margin={{ top: 20, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="var(--hq-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--hq-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={36} />
                                <RechartsTooltip
                                    contentStyle={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', borderRadius: '10px', textAlign: 'right' }}
                                    itemStyle={{ color: 'var(--hq-primary-text)' }}
                                />
                                <Area type="monotone" dataKey="value" name="عدد الطلاب" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorEnroll)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="hq-chart-box teacher-chart-panel">
                    <div className="hq-cb-head">
                        <h3>📊 توزيع الطلاب على الدورات</h3>
                    </div>
                    <div className="teacher-chart-body teacher-chart-body--pie">
                        {(!charts?.distribution || charts.distribution.length === 0) ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hq-text-muted)' }}>لا توجد بيانات كافية</div>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={charts.distribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={48}
                                            outerRadius={72}
                                            paddingAngle={5}
                                            dataKey="value"
                                            nameKey="name"
                                        >
                                            {charts.distribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip
                                            contentStyle={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', borderRadius: '10px' }}
                                            itemStyle={{ color: 'var(--hq-primary-text)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <ul className="teacher-pie-legend" aria-label="توزيع الدورات">
                                    {charts.distribution.map((entry, index) => (
                                        <li key={`legend-${index}`}>
                                            <span className="teacher-pie-legend-swatch" style={{ background: COLORS[index % COLORS.length] }} aria-hidden />
                                            <span>{entry.name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="teacher-overview-bottom">
                <div className="hq-chart-box">
                    <div className="hq-cb-head">
                        <h3>🔥 النشاط التفاعلي (الأسئلة والدردشة - آخر 7 أيام)</h3>
                    </div>
                    <div className="teacher-chart-body teacher-chart-body--bar">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts?.activity || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="var(--hq-text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--hq-text-muted)" fontSize={11} tickLine={false} axisLine={false} width={36} />
                                <RechartsTooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{ background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', borderRadius: '10px' }}
                                    itemStyle={{ color: 'var(--hq-primary-text)' }}
                                />
                                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                <Bar dataKey="qa" name="أسئلة" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="chat" name="رسائل مجموعة" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="hq-chart-box">
                    <div className="hq-cb-head">
                        <h3>👨‍💻 سرعة وأداء المساعدين</h3>
                    </div>
                    <div className="hq-table-container ta-table-wrap">
                        <table className="hq-table ta-wide-table">
                            <thead>
                                <tr>
                                    <th>اسم المساعد</th>
                                    <th>الردود / الرسائل</th>
                                    <th>السرعة</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.assistants && stats.assistants.length > 0 ? stats.assistants.map(ta => (
                                    <tr key={ta.id}>
                                        <td style={{ fontWeight: 'bold', color: 'var(--hq-primary-text)' }}>{ta.name}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                                                <span className="hq-badge-blue">{ta.qa_replies}</span>
                                                <span className="hq-badge-purple">{ta.chat_messages}</span>
                                            </div>
                                        </td>
                                        <td>{ta.avg_response_min > 0 ? `${ta.avg_response_min} د` : 'سريع⚡'}</td>
                                        <td>{ta.is_active ? <span style={{ color: '#10b981' }}>●</span> : <span style={{ color: '#ef4444' }}>●</span>}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>لا يوجد مساعدين.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
