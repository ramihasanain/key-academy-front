import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineBriefcase, HiOutlineUser, HiOutlineInformationCircle } from 'react-icons/hi2'
import './Admin.css'
import { useParams } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi2'

export const Teacher360View = ({ id }) => {
    const { id: paramId } = useParams()
    const finalId = id || paramId
    const navigate = useNavigate()
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    // Enrollments State
    const [enrollments, setEnrollments] = useState([])
    const [enrollmentsLoading, setEnrollmentsLoading] = useState(true)
    const [studentFilter, setStudentFilter] = useState('')
    const [courseFilter, setCourseFilter] = useState('')

    // Fetch Base Data
    useEffect(() => {
        const fetchData = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(`${API}/api/hq/teachers/${finalId}/360/`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    setData(await res.json())
                } else {
                    alert('لا يمكن جلب بيانات الأستاذ المطلوبة.')
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [finalId])

    // Fetch Enrollments Data with Debounce
    useEffect(() => {
        const fetchEnrollments = async () => {
            setEnrollmentsLoading(true)
            const tk = localStorage.getItem('access_token')
            try {
                const queryParams = new URLSearchParams()
                queryParams.append('course__teacher', finalId)
                queryParams.append('page_size', '100') // Max 100 limit to prevent overloading
                
                if (studentFilter) {
                    queryParams.append('search', studentFilter) // DRF search will handle name/username if configured, or we can use specific filters
                }
                if (courseFilter) {
                    queryParams.append('course', courseFilter)
                }

                const res = await fetch(`${API}/api/hq/enrollments/?${queryParams.toString()}`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                
                if (res.ok) {
                    const json = await res.json()
                    setEnrollments(json.results || json)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setEnrollmentsLoading(false)
            }
        }
        
        const timeoutId = setTimeout(() => {
            fetchEnrollments()
        }, 500)
        
        return () => clearTimeout(timeoutId)
    }, [finalId, studentFilter, courseFilter])

    if (loading) return <div className="hq-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>جاري تحميل الملف الشامل للاستاذ...</div>
    if (!data) return <div style={{ padding: '20px', color: '#ef4444', textAlign: 'center' }}>البيانات غير متوفرة.</div>

    return (
        <div className="hq-360-container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', color: 'var(--hq-text)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate(-1)} className="hq-action-btn edit" style={{ color: 'var(--hq-text-muted)', background: 'rgba(255,255,255,0.05)' }}>
                    <HiOutlineArrowRight />
                </button>
                <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineBriefcase style={{ color: '#0ea5e9' }} />
                    الملف الشامل: {data.profile.name}
                </h1>
            </div>

            {/* بطاقة التعريف Profile Card */}
            <div className="glass-card" style={{ padding: '25px', borderRadius: '15px', marginBottom: '30px', display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%',
                    background: `linear-gradient(135deg, var(--hq-primary), #3b82f6)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '36px', fontWeight: 'bold', color: 'white', flexShrink: 0
                }}>
                    {data.profile.initials || data.profile.name.charAt(0)}
                </div>
                <div style={{ flex: '1 1 300px' }}>
                    <h2 style={{ margin: '0 0 10px', fontSize: '22px' }}>{data.profile.name}</h2>
                    <p style={{ margin: '0 0 5px', color: 'var(--hq-text-muted)', fontSize: '14px' }}>
                        الوصف: {data.profile.subtitle || 'لا يوجد'}
                    </p>
                    <p style={{ margin: '0', color: 'var(--hq-text-muted)', fontSize: '14px' }}>
                        التخصصات: {(data.subjects || []).join('، ') || 'غير محدد'} | الفروع: {(data.branches || []).join('، ') || 'غير محدد'}
                    </p>
                    <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '14px' }}>
                        رقم الهاتف: <span dir="ltr">{data.profile.phone}</span>
                    </p>
                    {data.profile.bio && (
                        <p style={{ margin: '10px 0 0', fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', lineHeight: '1.6' }}>
                            {data.profile.bio}
                        </p>
                    )}
                </div>
                <div style={{ flexShrink: 0, textAlign: 'center', padding: '15px 30px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)', marginBottom: '5px' }}>التقييم العام</div>
                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#f59e0b' }}>
                        {data.profile.rating} <span style={{ fontSize: '18px' }}>★</span>
                    </div>
                </div>
            </div>

            {/* الإحصائيات السريعة Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        <HiOutlineUserGroup />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>إجمالي الطلاب المسجلين (فعال)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.profile.students_count} طالب</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        <HiOutlineBookOpen />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>إجمالي الدورات التدريبية</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.stats?.total_courses || 0} دورة</div>
                    </div>
                </div>
                <div className="glass-card" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                        <HiOutlineUser />
                    </div>
                    <div>
                        <div style={{ fontSize: '13px', color: 'var(--hq-text-muted)' }}>عدد المساعدين (TAs)</div>
                        <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.stats?.total_tas || 0} مساعد</div>
                    </div>
                </div>
            </div>

            {/* الدورات والمساعدين Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                
                {/* الدورات Course List */}
                <div className="glass-card" style={{ padding: '25px', borderRadius: '15px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineBookOpen style={{ color: '#6366f1' }} />
                        دورات الأستاذ ({data.recent_courses?.length || 0})
                    </h3>
                    {data.recent_courses?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {data.recent_courses.map(course => (
                                <div key={course.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        {course.image ? (
                                            <img src={course.image} alt={course.title} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} />
                                        ) : (
                                            <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <HiOutlineBookOpen style={{ color: 'var(--hq-text-muted)' }} />
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '4px' }}>{course.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)', display: 'flex', gap: '10px' }}>
                                                <span>{course.price} د.ع</span>
                                                <span style={{ color: course.is_active ? '#10b981' : '#ef4444' }}>{course.is_active ? 'فعال' : 'غير فعال'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', background: 'rgba(56,189,248,0.1)', padding: '8px 15px', borderRadius: '20px', color: '#38bdf8' }}>
                                        <div style={{ fontSize: '11px', opacity: 0.8 }}>طالب مسجل</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{course.enrollments}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--hq-text-muted)', padding: '30px 0' }}>لا يوجد دورات حالياً</p>
                    )}
                </div>

                {/* المساعدين TA List */}
                <div className="glass-card" style={{ padding: '25px', borderRadius: '15px' }}>
                    <h3 style={{ margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineUserGroup style={{ color: '#8b5cf6' }} />
                        المساعدين (TAs)
                    </h3>
                    {data.teacher_assistants?.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {data.teacher_assistants.map(ta => (
                                <div key={ta.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{ta.name}</div>
                                        <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }} dir="ltr">{ta.phone}</div>
                                    </div>
                                    <div style={{ fontSize: '12px', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '4px 8px', borderRadius: '12px' }}>
                                        {ta.total_replies} رد
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p style={{ textAlign: 'center', color: 'var(--hq-text-muted)', padding: '20px 0' }}>لا يوجد مساعدين مسجلين</p>
                    )}
                </div>

            </div>

            {/* سجل الاشتراكات مع الفلتر */}
            <div className="glass-card" style={{ padding: '25px', borderRadius: '15px', marginTop: '30px' }}>
                <h3 style={{ margin: '0 0 20px', fontSize: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineUserGroup style={{ color: '#0ea5e9' }} />
                    سجل الاشتراكات والطلاب ({enrollments.length})
                </h3>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <input
                        type="text"
                        placeholder="بحث باسم الطالب أو @يوزر..."
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                        style={{ flex: '1 1 250px', background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: 'var(--hq-text)', padding: '10px 15px', borderRadius: '8px', outline: 'none' }}
                    />
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        style={{ flex: '1 1 200px', background: 'var(--hq-bg)', border: '1px solid var(--hq-border)', color: 'var(--hq-text)', padding: '10px 15px', borderRadius: '8px', outline: 'none' }}
                    >
                        <option value="">جميع دورات الأستاذ</option>
                        {data.recent_courses?.map(c => (
                            <option key={c.id} value={c.id}>{c.title}</option>
                        ))}
                    </select>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto', background: 'rgba(0,0,0,0.1)', borderRadius: '10px', padding: '1px' }}>
                    {enrollmentsLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--hq-primary)' }}>جاري البحث وتحديث القائمة...</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>#</th>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>اسم الطالب</th>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>معرف اليوزر</th>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>الدورة</th>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>تاريخ الانضمام</th>
                                    <th style={{ padding: '12px 15px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>حالة الاشتراك</th>
                                </tr>
                            </thead>
                            <tbody>
                                {enrollments.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--hq-text-muted)' }}>لا توجد نتائج مطابقة لبحثك.</td>
                                    </tr>
                                ) : (
                                    enrollments.map((enr, i) => (
                                        <tr key={enr.id} style={{ borderBottom: '1px solid rgba(150,150,150,0.1)' }}>
                                            <td style={{ padding: '12px 15px' }}>{i + 1}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <button onClick={() => navigate(`/hq/students/${enr.student}/360`)} style={{ background: 'none', border: 'none', color: '#0ea5e9', cursor: 'pointer', outline: 'none', padding: 0, fontSize: '14px', fontWeight: 'bold' }}>
                                                    {enr.student_str?.replace(/\s*[-—]\s*.*/, '') || enr.student}
                                                </button>
                                            </td>
                                            <td style={{ padding: '12px 15px' }} dir="ltr">
                                                <button onClick={() => navigate(`/hq/students/${enr.student}/360`)} style={{ background: 'none', border: 'none', color: 'var(--hq-text-muted)', cursor: 'pointer', outline: 'none', padding: 0, fontSize: '14px' }}>
                                                    {enr.student_str?.match(/(@[^\s()]+)/)?.[1] || '-'}
                                                </button>
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>{enr.course_str || enr.course}</td>
                                            <td style={{ padding: '12px 15px' }}>{new Date(enr.enrolled_at || enr.created_at).toLocaleDateString('ar-EG')}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                {enr.is_active ? <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>نشط</span> : <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>غير نشط</span>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
                {enrollments.length === 100 && <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '12px', color: '#f59e0b' }}>⚠️ تم عرض أحدث 100 نتيجة فقط لتخفيف الضغط. يرجى استخدام منقب البيانات لنتائج أعمق.</div>}
            </div>
        </div>
    )
}
