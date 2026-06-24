import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineArrowRightOnRectangle,
    HiOutlineAcademicCap,
    HiOutlineUsers,
    HiOutlinePresentationChartLine,
    HiOutlineChatBubbleLeftRight,
    HiOutlineUserGroup,
    HiOutlineIdentification,
    HiOutlineNoSymbol,
    HiOutlineClock,
    HiOutlineVideoCamera,
    HiOutlineClipboardDocumentCheck
} from 'react-icons/hi2'
import '../hq/Admin.css'
import '../ta/TAResponsive.css'
import './TeacherResponsive.css'

export const TeacherLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [newPwd, setNewPwd] = useState('')
    const [pwdMsg, setPwdMsg] = useState('')
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    useEffect(() => {
        setIsMobileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        const fetchProfile = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(API + '/api/hq/me/', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    if (data.role !== 'teacher' && data.role !== 'admin') {
                        navigate('/')
                    } else {
                        setProfile(data)
                    }
                } else {
                    navigate('/login')
                }
            } catch (err) {
                console.error(err)
            } finally {
                setIsLoading(false)
            }
        }
        fetchProfile()
    }, [navigate])

    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigate('/login')
    }

    const handleChangePwd = async () => {
        if (!newPwd) return
        try {
            const res = await fetch(API + '/api/hq/users/' + profile.id + '/change_password/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                },
                body: JSON.stringify({ password: newPwd })
            })
            if (res.ok) {
                setPwdMsg('تم تغيير كلمة المرور بنجاح!')
                setNewPwd('')
                setTimeout(() => { setShowPwdModal(false); setPwdMsg('') }, 2000)
            } else setPwdMsg('حدث خطأ أثناء التغيير')
        } catch (e) { setPwdMsg('خطأ بالاتصال') }
    }

    const navItems = [
        { path: '', icon: <HiOutlineAcademicCap />, label: 'لوحة القياس الشاملة' },
        { path: 'courses', icon: <HiOutlinePresentationChartLine />, label: 'إدارة الدورات والحصص' },
        { path: 'assistants', icon: <HiOutlineUsers />, label: 'أداء كادر المساعدين' },
        { path: 'students', icon: <HiOutlineIdentification />, label: 'بيانات الطلاب وتقييمهم' },
        { path: 'exams', icon: <HiOutlineClipboardDocumentCheck />, label: 'تصحيح الامتحانات' },
        { path: 'qa', icon: <HiOutlineChatBubbleLeftRight />, label: 'الأسئلة والنقاشات' },
        { path: 'groups', icon: <HiOutlineUserGroup />, label: 'مجموعات الدردشة' },
        { path: 'lectures', icon: <HiOutlineVideoCamera />, label: 'محاضرات المنهاج' },
        { path: 'muted', icon: <HiOutlineNoSymbol />, label: 'قائمة الحظر للطلاب' },
        { path: 'moderation-history', icon: <HiOutlineClock />, label: 'سجل الرقابة' },
    ]

    if (isLoading) return <div className="hq-loading">جاري المصادقة كأستاذ...</div>

    return (
        <div className="hq-layout ta-layout teacher-layout" style={{
            '--hq-primary': '#1e3a8a',
            '--hq-primary-hover': '#1e40af',
            '--hq-primary-bg': 'rgba(30, 58, 138, 0.08)',
        }}>
            {/* Sidebar */}
            <aside className={`hq-sidebar ${isMobileOpen ? 'mobile-open open' : 'open'}`}>
                <div className="hq-sb-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/new-logo.png" alt="Key Academy" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <nav className="hq-sb-nav">
                    {navItems.map(item => {
                        const isActive = item.path === ''
                            ? location.pathname === '/teacher'
                            : location.pathname.startsWith(`/teacher/${item.path}`)

                        return (
                            <NavLink
                                key={item.path}
                                end={item.path === ''}
                                to={item.path}
                                className={`hq-nav-link ${isActive ? 'active' : ''}`}
                            >
                                <span className="hq-icon">{item.icon}</span>
                                <span className="hq-label">{item.label}</span>
                            </NavLink>
                        )
                    })}
                </nav>
                <div className="hq-sb-footer">
                    <button className="hq-logout-btn" onClick={handleLogout}>
                        <HiOutlineArrowRightOnRectangle /> تسجيل الخروج
                    </button>
                    <span className="hq-version">بوابة الأستاذ v1.0</span>
                </div>
            </aside>
            <div className={`hq-mobile-overlay ${isMobileOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileOpen(false)}></div>

            {/* Main Content */}
            <div className="hq-main">
                <header className="hq-topbar ta-topbar teacher-topbar">
                    <div className="teacher-topbar-row">
                        <button type="button" className="hq-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)} aria-label="فتح القائمة">☰</button>
                        <div className="teacher-topbar-meta">
                            <h2>أهلاً بالأستاذ {profile?.teacher_name || profile?.first_name || profile?.username}</h2>
                            <p className="teacher-topbar-sub">إدارة شاملة للمحتوى والمساعدين</p>
                        </div>
                        <div className="hq-tb-right teacher-topbar-actions">
                            <div className="hq-admin-profile">
                                <div className="hq-ap-info">
                                    <strong>{profile ? profile.teacher_name || profile.first_name || profile.username : 'الأستاذ'}</strong>
                                    <span>صلاحية أستاذ مادة</span>
                                </div>
                                <div onClick={() => setShowPwdModal(true)} className="hq-ap-av" style={{ background: 'var(--hq-primary)', cursor: 'pointer' }} title="تغيير كلمة المرور" role="button" tabIndex={0}>T</div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="hq-content">
                    <Outlet context={{ profile }} />
                </div>
            </div>

            {/* Password Change Modal */}
            {showPwdModal && (
                <div className="teacher-pwd-overlay" onClick={() => setShowPwdModal(false)} role="presentation">
                    <div
                        className="teacher-pwd-modal"
                        onClick={e => e.stopPropagation()}
                        role="dialog"
                        aria-labelledby="teacher-pwd-title"
                    >
                        <div className="teacher-pwd-modal-header">
                            <h3 id="teacher-pwd-title">تغيير كلمة المرور الخاصة بك</h3>
                            <button type="button" onClick={() => setShowPwdModal(false)} className="teacher-pwd-modal-close" aria-label="إغلاق">&times;</button>
                        </div>
                        <div className="teacher-pwd-modal-body">
                            <label className="teacher-pwd-label" htmlFor="teacher-new-pwd">كلمة المرور الجديدة</label>
                            <input
                                id="teacher-new-pwd"
                                type="password"
                                autoComplete="new-password"
                                className="teacher-pwd-input"
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                placeholder="اكتب كلمة المرور..."
                            />
                            {pwdMsg && (
                                <p className={`teacher-pwd-msg ${pwdMsg.includes('بنجاح') ? 'is-success' : 'is-error'}`}>{pwdMsg}</p>
                            )}
                        </div>
                        <div className="teacher-pwd-modal-footer">
                            <button type="button" className="teacher-pwd-submit" onClick={handleChangePwd}>حفظ التغيير</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
