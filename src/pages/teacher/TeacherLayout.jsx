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
    HiOutlineClock
} from 'react-icons/hi2'
import '../hq/Admin.css'

export const TeacherLayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [newPwd, setNewPwd] = useState('')
    const [pwdMsg, setPwdMsg] = useState('')

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
        { path: 'qa', icon: <HiOutlineChatBubbleLeftRight />, label: 'الأسئلة والنقاشات' },
        { path: 'groups', icon: <HiOutlineUserGroup />, label: 'مجموعات الدردشة' },
        { path: 'muted', icon: <HiOutlineNoSymbol />, label: 'قائمة الحظر للطلاب' },
        { path: 'moderation-history', icon: <HiOutlineClock />, label: 'سجل الرقابة' },
    ]

    if (isLoading) return <div className="hq-loading">جاري المصادقة كأستاذ...</div>

    return (
        <div className="hq-layout ta-layout" style={{
            '--hq-primary': '#1e3a8a',
            '--hq-primary-hover': '#1e40af',
            '--hq-primary-bg': 'rgba(30, 58, 138, 0.08)',
        }}>
            {/* Sidebar */}
            <aside className="hq-sidebar open">
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

            {/* Main Content */}
            <div className="hq-main">
                <header className="hq-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px' }}>
                    <div className="hq-tb-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--hq-primary)' }}>أهلاً بالأستاذ {profile?.teacher_name || profile?.first_name || profile?.username}</h2>
                            <p style={{ margin: 0, color: 'var(--hq-text-muted)', fontSize: '13px' }}>إدارة شاملة للمحتوى والمساعدين</p>
                        </div>
                    </div>
                    <div className="hq-tb-right">
                        <div className="hq-admin-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="hq-ap-info" style={{ textAlign: 'left' }}>
                                <strong>{profile ? profile.teacher_name || profile.first_name || profile.username : 'الأستاذ'}</strong>
                                <span>صلاحية أستاذ مادة</span>
                            </div>
                            <div onClick={() => setShowPwdModal(true)} className="hq-ap-av" style={{ background: 'var(--hq-primary)', cursor: 'pointer' }} title="تغيير كلمة المرور">T</div>
                        </div>
                    </div>
                </header>

                <div className="hq-content">
                    <Outlet context={{ profile }} />
                </div>
            </div>

            {/* Password Change Modal */}
            {showPwdModal && (
                <div className="hq-modal-overlay" onClick={() => setShowPwdModal(false)}>
                    <div className="hq-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="hq-modal-header">
                            <h3>تغيير كلمة المرور الخاصة بك</h3>
                            <button onClick={() => setShowPwdModal(false)} className="hq-modal-close">&times;</button>
                        </div>
                        <div className="hq-modal-body">
                            <label className="hq-label">كلمة المرور الجديدة</label>
                            <input
                                type="text"
                                className="hq-input"
                                value={newPwd}
                                onChange={e => setNewPwd(e.target.value)}
                                placeholder="اكتب كلمة المرور..."
                            />
                            {pwdMsg && <div style={{ marginTop: '10px', color: pwdMsg.includes('بنجاح') ? '#10b981' : '#ef4444' }}>{pwdMsg}</div>}
                        </div>
                        <div className="hq-modal-footer">
                            <button className="hq-btn primary" onClick={handleChangePwd}>حفظ التغيير</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
