import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineHome, HiOutlineUsers, HiOutlineAcademicCap,
    HiOutlineBookOpen, HiOutlineCreditCard, HiOutlineChatBubbleLeftRight,
    HiOutlineCog, HiOutlineArrowRightOnRectangle, HiOutlineBell, HiOutlineBars3,
    HiOutlineDocumentText, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineNoSymbol, HiOutlineClock,
    HiOutlineDevicePhoneMobile
} from 'react-icons/hi2'
import './Admin.css'

export const AdminLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [unresolvedContacts, setUnresolvedContacts] = useState(0)

    useEffect(() => {
        const fetchProfile = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(API + '/api/hq/me/', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setProfile(data)

                    const taPerfOnly = !data.is_superuser &&
                        data.role !== 'ta_manager' &&
                        (data.permissions || []).some(p => p.endsWith('.view_ta_performance')) &&
                        (data.permissions || []).every(
                            p => p.endsWith('.view_ta_performance') || p === 'teachers.view_ta_performance'
                        )

                    if (!taPerfOnly) {
                        const contactRes = await fetch(API + '/api/hq/contactmessages/?is_read=false', {
                            headers: { 'Authorization': `Bearer ${tk}` }
                        })
                        if (contactRes.ok) {
                            const contactData = await contactRes.json()
                            setUnresolvedContacts(contactData.count || contactData.length || 0)
                        }
                    }
                } else {
                    handleLogout()
                }

            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigate('/login')
    }

    const hasPerm = (suffix) => {
        if (!profile?.permissions) return false
        return profile.permissions.some(p => p.endsWith(`.${suffix}`) || p === suffix)
    }

    /** موظف مكلّف بصفحة تقييم المساعدين فقط — بدون أي صلاحيات أخرى */
    const isTaPerformanceOnlyStaff = () => {
        if (!profile || profile.is_superuser || profile.role === 'ta_manager') return false
        if (!hasPerm('view_ta_performance')) return false
        const otherPerms = (profile.permissions || []).filter(
            p => !p.endsWith('.view_ta_performance') && p !== 'teachers.view_ta_performance'
        )
        return otherPerms.length === 0
    }

    const restrictedTaPerformance = isTaPerformanceOnlyStaff()

    const hasViewPerm = (modelPath) => {
        if (!profile) return false
        if (profile.is_superuser) return true

        if (restrictedTaPerformance) {
            return modelPath === 'ta-manager'
        }
        
        if (profile.role === 'ta_manager') {
            const allowedForTAManager = ['ta-manager', '', 'teacherassistants', 'coursegroups', 'teachers']
            return allowedForTAManager.includes(modelPath)
        }

        if (modelPath === '') return true // Dashboard accessible by all staff

        const pathMap = {
            'users': 'view_user', 'students': 'view_user',             'courses': 'view_course',
            'quick-courses': 'add_course',
            'copy-lesson': 'change_lesson',
            'unpublished-lessons': 'change_lesson',
            'course-schedule': 'change_lesson',
            'teachers': 'view_teacher', 'enrollments': 'view_enrollment',
            'contactmessages': 'view_contactmessage', 'faqs': 'view_faqitem',
            'muted-students': 'view_user',
            'moderation-history': 'view_user',
            'student-devices': 'view_user',
            'ta-manager': 'view_ta_performance'
        }
        const needed = pathMap[modelPath]
        if (!needed) return true // default open if not strictly mapped

        return hasPerm(needed)
    }

    useEffect(() => {
        if (!profile || isLoading || !restrictedTaPerformance) return
        const path = location.pathname
        // لا تعيد التوجيه أثناء إعداد 2FA — كان يسبب حلقة لا نهائية مع ProtectedRoute
        if (path.includes('/2fa-setup')) return
        if (path === '/hq' || path === '/hq/' || !path.startsWith('/hq/ta-manager')) {
            navigate('/hq/ta-manager', { replace: true })
        }
    }, [profile, isLoading, restrictedTaPerformance, location.pathname, navigate])

    const navItems = [
        { path: '', icon: <HiOutlineHome />, label: 'اللوحة الرئيسية (Overview)' },
        { path: 'users', icon: <HiOutlineUsers />, label: 'إدارة النظام' },
        { path: 'grades', icon: <HiOutlineAcademicCap />, label: 'الصفوف والمراحل' },
        { path: 'branches', icon: <HiOutlineBookOpen />, label: 'الفروع الدراسية' },
        { path: 'subjects', icon: <HiOutlineDocumentText />, label: 'المواد الدراسية' },
        { path: 'students', icon: <HiOutlineUsers />, label: 'الطلاب المسجلين' },
        { path: 'student-devices', icon: <HiOutlineDevicePhoneMobile />, label: 'أجهزة الطلاب' },
        { path: 'courses', icon: <HiOutlineBookOpen />, label: 'المناهج والدورات' },
        { path: 'quick-courses', icon: <HiOutlineBookOpen />, label: 'التعبئة السريعة (Excel)' },
        { path: 'copy-lesson', icon: <HiOutlineDocumentText />, label: 'نسخ درس بين الدورات' },
        { path: 'unpublished-lessons', icon: <HiOutlineDocumentText />, label: 'دروس غير منشورة' },
        { path: 'course-schedule', icon: <HiOutlineClock />, label: 'الجدول الأسبوعي للدورات' },
        { path: 'cohortconfig', icon: <HiOutlineUserGroup />, label: 'نظام الدفعات (جديد/قديم)' },
        { path: 'teachers', icon: <HiOutlineAcademicCap />, label: 'الأساتذة' },
        { path: 'teacherassistants', icon: <HiOutlineBriefcase />, label: 'مساعدي الأساتذة' },
        { path: 'ta-manager', icon: <HiOutlineUserGroup />, label: 'أداء المساعدين (تقييم)' },
        { path: 'coursegroups', icon: <HiOutlineUserGroup />, label: 'المجموعات (للمساعدين)' },
        { path: 'enrollments', icon: <HiOutlineDocumentText />, label: 'الاشتراكات الفعالة' },
        { path: 'muted-students', icon: <HiOutlineNoSymbol />, label: 'الطلاب المحظورين' },
        { path: 'moderation-history', icon: <HiOutlineClock />, label: 'سجل الرقابة' },
        { path: 'contactmessages', icon: <HiOutlineChatBubbleLeftRight />, label: 'الاستفسارات (تواصل معنا)', badge: unresolvedContacts },
        { path: 'faqs', icon: <HiOutlineChatBubbleLeftRight />, label: 'الأسئلة الشائعة' },
    ]

    if (isLoading) return <div className="hq-loading">جاري مصادقة الدخول...</div>

    return (
        <div className="hq-layout">
            {/* Sidebar */}
            <aside className={`hq-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="hq-sb-logo">
                    <img src="/new-logo.png" alt="Key Academy" />
                </div>
                <nav className="hq-sb-nav">
                    {navItems.filter(item => hasViewPerm(item.path)).map(item => {
                        // Check if active: exact match for root, or startsWith for others
                        const isActive = item.path === ''
                            ? location.pathname === '/hq'
                            : location.pathname.startsWith(`/hq/${item.path}`)

                        return (
                            <NavLink
                                key={item.path}
                                end={item.path === ''}
                                to={item.path}
                                className={`hq-nav-link ${isActive ? 'active' : ''}`}
                                style={{ position: 'relative' }}
                            >
                                <span className="hq-icon">{item.icon}</span>
                                {sidebarOpen && <span className="hq-label">{item.label}</span>}
                                {sidebarOpen && item.badge > 0 && (
                                    <span style={{ background: '#ef4444', color: 'white', fontSize: '11px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '10px', position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }}>{item.badge}</span>
                                )}
                            </NavLink>
                        )
                    })}
                </nav>
                <div className="hq-sb-footer">
                    <button className="hq-logout-btn" onClick={handleLogout}>
                        <HiOutlineArrowRightOnRectangle /> {sidebarOpen && 'تسجيل الخروج'}
                    </button>
                    {sidebarOpen && <span className="hq-version">إصدار لوحة التحكم v1.0</span>}
                </div>
            </aside>

            {/* Main Content */}
            <div className="hq-main">
                <header className="hq-topbar">
                    <div className="hq-tb-left">
                        <button className="hq-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
                            <HiOutlineBars3 />
                        </button>
                        <h2 className="hq-page-title">
                            {restrictedTaPerformance ? 'أداء المساعدين (تقييم)' : 'إدارة النظام (HQ)'}
                        </h2>
                    </div>
                    <div className="hq-tb-right">
                        <button className="hq-tb-icon"><HiOutlineBell /><span className="hq-badge">3</span></button>
                        <div className="hq-admin-profile">
                            <div className="hq-ap-info">
                                <strong>{profile ? (profile.full_name || profile.username) : 'جاري التحميل...'}</strong>
                                <span>{restrictedTaPerformance ? 'مقيّم المساعدين' : (profile?.role === 'admin' ? 'صلاحية مطلقة' : 'إدارة النظام')}</span>
                            </div>
                            <div className="hq-ap-av">A</div>
                        </div>
                    </div>
                </header>

                <div className="hq-content">
                    <Outlet context={{ profile }} />
                </div>
            </div>
        </div>
    )
}
