import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
    HiOutlineInformationCircle,
    HiOutlineAcademicCap,
    HiOutlineChartBar,
    HiOutlineClipboardDocumentCheck,
    HiOutlineArrowRightOnRectangle,
    HiOutlineBars3,
    HiOutlineXMark,
} from 'react-icons/hi2'
import { ParentProtectedRoute, getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import './ParentLayout.css'

const ParentLayoutShell = () => {
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const student = getParentSelectedStudent()

    let userChildren = []
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        userChildren = user.children || []
    } catch {
        userChildren = []
    }

    const studentName = student?.full_name || student?.first_name || 'الطالب/ة'
    const genderSuffix = student?.first_name?.endsWith('ة') ? 'الطالبة' : 'الطالب'

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

    const navItems = [
        { to: '/parent/about', label: 'من نحن', icon: <HiOutlineInformationCircle /> },
        { to: '/parent/teachers', label: 'الأساتذة', icon: <HiOutlineAcademicCap /> },
        { to: '/parent/performance', label: 'تقييم أدائي', icon: <HiOutlineChartBar /> },
        { to: '/parent/weekly-exams', label: 'الامتحانات الأسبوعية', icon: <HiOutlineClipboardDocumentCheck /> },
    ]

    return (
        <div className="parent-portal">
            <aside className={`parent-sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="parent-sidebar-header">
                    <h2>بوابة أولياء الأمور</h2>
                    <p>
                        أهلاً بولي أمر {genderSuffix}
                        <br />
                        <strong style={{ color: '#38bdf8' }}>{studentName}</strong>
                    </p>
                    {userChildren.length > 1 && (
                        <button type="button" className="parent-switch-student" onClick={handleSwitchStudent}>
                            تبديل الطالب
                        </button>
                    )}
                </div>

                <nav>
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) => `parent-nav-link ${isActive ? 'active' : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {item.icon}
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <button type="button" className="parent-logout-btn" onClick={handleLogout}>
                    <HiOutlineArrowRightOnRectangle />
                    تسجيل الخروج
                </button>
            </aside>

            <div className="parent-main">
                <div className="parent-topbar">
                    <button
                        type="button"
                        onClick={() => setSidebarOpen(v => !v)}
                        style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                    >
                        {sidebarOpen ? <HiOutlineXMark /> : <HiOutlineBars3 />}
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>ولي أمر {studentName}</span>
                </div>

                <div className="parent-main-inner">
                    <Outlet />
                </div>
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
