import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineHome, HiOutlineUsers, HiOutlineAcademicCap,
    HiOutlineBookOpen, HiOutlineCreditCard, HiOutlineChatBubbleLeftRight,
    HiOutlineCog, HiOutlineArrowRightOnRectangle, HiOutlineBell, HiOutlineBars3,
    HiOutlineDocumentText, HiOutlineBriefcase, HiOutlineUserGroup, HiOutlineNoSymbol, HiOutlineClock
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
                    setProfile(await res.json())
                } else {
                    handleLogout()
                }

                // Fetch Unresolved Contact Messages
                const contactRes = await fetch(API + '/api/hq/contactmessages/?is_read=false', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                });
                if (contactRes.ok) {
                    const contactData = await contactRes.json();
                    setUnresolvedContacts(contactData.count || contactData.length || 0);
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

    const hasViewPerm = (modelPath) => {
        if (!profile) return false
        if (profile.is_superuser) return true
        if (modelPath === '') return true // Dashboard accessible by all staff

        // Remove trailing s if needed or map dynamically. Standard: content.view_course
        // Actually, our API paths: courses, teachers, users
        // Let's just do a simple check. If permission list contains 'view_course', 'view_user', etc.
        const pathMap = {
            'users': 'view_user', 'students': 'view_user', 'courses': 'view_course',
            'teachers': 'view_teacher', 'enrollments': 'view_enrollment',
            'contactmessages': 'view_contactmessage', 'faqs': 'view_faqitem',
            'muted-students': 'view_user',
            'moderation-history': 'view_user'
        }
        const needed = pathMap[modelPath]
        if (!needed) return true // default open if not strictly mapped

        return profile.permissions.some(p => p.endsWith(`.${needed}`))
    }

    const navItems = [
        { path: '', icon: <HiOutlineHome />, label: 'اللوحة الرئيسية (Overview)' },
        { path: 'users', icon: <HiOutlineUsers />, label: 'إدارة النظام' },
        { path: 'branches', icon: <HiOutlineBookOpen />, label: 'الفروع (علمي/أدبي)' },
        { path: 'grades', icon: <HiOutlineAcademicCap />, label: 'الصفوف والمراحل' },
        { path: 'subjects', icon: <HiOutlineDocumentText />, label: 'المواد الدراسية' },
        { path: 'students', icon: <HiOutlineUsers />, label: 'الطلاب المسجلين' },
        { path: 'courses', icon: <HiOutlineBookOpen />, label: 'المناهج والدورات' },
        { path: 'teachers', icon: <HiOutlineAcademicCap />, label: 'الأساتذة' },
        { path: 'teacherassistants', icon: <HiOutlineBriefcase />, label: 'مساعدي الأساتذة' },
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
                        <h2 className="hq-page-title">إدارة النظام (HQ)</h2>
                    </div>
                    <div className="hq-tb-right">
                        <button className="hq-tb-icon"><HiOutlineBell /><span className="hq-badge">3</span></button>
                        <div className="hq-admin-profile">
                            <div className="hq-ap-info">
                                <strong>{profile ? (profile.full_name || profile.username) : 'جاري التحميل...'}</strong>
                                <span>{profile?.role === 'admin' ? 'صلاحية مطلقة' : 'إدارة النظام'}</span>
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
