import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
    HiOutlineInformationCircle,
    HiOutlineAcademicCap,
    HiOutlineChartBar,
    HiOutlineClipboardDocumentCheck,
    HiOutlineArrowRightOnRectangle,
    HiOutlineBars3,
    HiOutlineXMark,
    HiOutlineUserGroup,
    HiOutlineArrowsRightLeft,
} from 'react-icons/hi2'
import { ParentProtectedRoute, getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import './ParentLayout.css'

const NAV_ITEMS = [
    { to: '/parent/about', label: 'من نحن', shortLabel: 'من نحن', icon: HiOutlineInformationCircle },
    { to: '/parent/teachers', label: 'الأساتذة', shortLabel: 'الأساتذة', icon: HiOutlineAcademicCap },
    { to: '/parent/performance', label: 'تقييم أدائي', shortLabel: 'التقييم', icon: HiOutlineChartBar },
    { to: '/parent/weekly-exams', label: 'الامتحانات الأسبوعية', shortLabel: 'الامتحانات', icon: HiOutlineClipboardDocumentCheck },
]

const ParentLayoutShell = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const student = getParentSelectedStudent()

    let userChildren = []
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        userChildren = user.children || []
    } catch {
        userChildren = []
    }

    const studentName = student?.full_name || student?.first_name || 'الطالب'
    const studentInitial = (studentName || 'ط')[0]

    useEffect(() => {
        setSidebarOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if (!sidebarOpen) return undefined
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => { document.body.style.overflow = prev }
    }, [sidebarOpen])

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        localStorage.removeItem('parent_selected_student')
        navigate('/parent/login')
    }

    const handleSwitchStudent = () => {
        localStorage.removeItem('parent_selected_student')
        navigate('/parent/select-student')
    }

    const closeSidebar = () => setSidebarOpen(false)

    return (
        <div className="parent-portal">
            {sidebarOpen && (
                <button
                    type="button"
                    className="parent-sidebar-overlay"
                    aria-label="إغلاق القائمة"
                    onClick={closeSidebar}
                />
            )}

            <aside className={`parent-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="parent-sidebar-brand">
                    <div className="parent-brand-icon">
                        <HiOutlineUserGroup />
                    </div>
                    <div>
                        <h2>بوابة أولياء الأمور</h2>
                        <span>Key Academy</span>
                    </div>
                    <button
                        type="button"
                        className="parent-sidebar-close"
                        onClick={closeSidebar}
                        aria-label="إغلاق"
                    >
                        <HiOutlineXMark />
                    </button>
                </div>

                <div className="parent-welcome-card">
                    <div className="parent-student-avatar">{studentInitial}</div>
                    <div className="parent-welcome-text">
                        <span className="parent-welcome-label">أهلاً بولي أمر الطالب</span>
                        <strong className="parent-student-name">{studentName}</strong>
                    </div>
                </div>

                {userChildren.length > 1 && (
                    <button type="button" className="parent-switch-student" onClick={handleSwitchStudent}>
                        <HiOutlineArrowsRightLeft />
                        تبديل الطالب
                    </button>
                )}

                <nav className="parent-sidebar-nav">
                    {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `parent-nav-link ${isActive ? 'active' : ''}`}
                            onClick={closeSidebar}
                        >
                            <span className="parent-nav-icon"><Icon /></span>
                            <span className="parent-nav-label">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                <button type="button" className="parent-logout-btn" onClick={handleLogout}>
                    <HiOutlineArrowRightOnRectangle />
                    تسجيل الخروج
                </button>
            </aside>

            <div className="parent-main">
                <header className="parent-topbar">
                    <button
                        type="button"
                        className="parent-menu-btn"
                        onClick={() => setSidebarOpen(v => !v)}
                        aria-label="القائمة"
                    >
                        <HiOutlineBars3 />
                    </button>
                    <div className="parent-topbar-center">
                        <span className="parent-topbar-greeting">أهلاً بولي أمر الطالب</span>
                        <strong>{studentName}</strong>
                    </div>
                    <div className="parent-topbar-avatar">{studentInitial}</div>
                </header>

                <div className="parent-main-inner">
                    <Outlet />
                </div>

                <nav className="parent-bottom-nav" aria-label="التنقل السريع">
                    {NAV_ITEMS.map(({ to, shortLabel, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) => `parent-bottom-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon />
                            <span>{shortLabel}</span>
                        </NavLink>
                    ))}
                </nav>
            </div>
        </div>
    )
}

const ParentLayout = () => (
    <ParentProtectedRoute>
        <ParentLayoutShell />
    </ParentProtectedRoute>
)

export default ParentLayout
