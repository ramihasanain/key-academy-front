import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlineUsers,
    HiOutlineArrowRightOnRectangle,
    HiOutlineAcademicCap,
    HiOutlinePencilSquare,
    HiOutlineNoSymbol,
    HiOutlineClock
} from 'react-icons/hi2'
import '../hq/Admin.css'

export const TALayout = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [newPwd, setNewPwd] = useState('')
    const [pwdMsg, setPwdMsg] = useState('')

    useEffect(() => {
        const fetchProfile = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
            try {
                // For simplicity, using the HQ profile endpoint. If they are staff, they can access it.
                const res = await fetch(API + '/api/hq/me/', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setProfile(data)
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
        if (sessionStorage.getItem('spy_token')) {
            sessionStorage.removeItem('spy_token')
            window.close() // Close the spy tab if possible
            navigate('/') // Or fallback to home
            return
        }
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
        { path: '', icon: <HiOutlineAcademicCap />, label: 'إحصائيات وأداء الطلاب' },
        { path: 'qa', icon: <HiOutlineChatBubbleLeftRight />, label: 'سؤال وجواب' },
        { path: 'groups', icon: <HiOutlineUsers />, label: 'إدارة مجموعات الدردشة' },
        { path: 'notes', icon: <HiOutlinePencilSquare />, label: 'دفتر المهام والملاحظات' },
        { path: 'muted', icon: <HiOutlineNoSymbol />, label: 'قائمة الطلاب المحظورين' },
        { path: 'moderation-history', icon: <HiOutlineClock />, label: 'سجل الرقابة' },
    ]

    if (isLoading) return <div className="hq-loading">جاري مصادقة الدخول...</div>

    return (
        <div className="hq-layout ta-layout" style={{
            '--hq-primary': '#832a96',
            '--hq-primary-hover': '#5e1d6d',
            '--hq-primary-bg': 'rgba(131, 42, 150, 0.08)',
            '--pink-main': '#ec3665',
            '--blue-main': '#832a96'
        }}>
            {/* Sidebar */}
            <aside className="hq-sidebar open">
                <div className="hq-sb-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/new-logo.png" alt="Key Academy" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <nav className="hq-sb-nav">
                    {navItems.map(item => {
                        const isActive = item.path === ''
                            ? location.pathname === '/ta'
                            : location.pathname.startsWith(`/ta/${item.path}`)

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
                    <span className="hq-version">إصدار المساعد v1.0</span>
                </div>
            </aside>

            {/* Main Content */}
            <div className="hq-main">
                <header className="hq-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px' }}>
                    <div className="hq-tb-left" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        {profile?.ta_info?.teacher_image ? (
                            <img
                                src={profile.ta_info.teacher_image}
                                alt="Teacher"
                                style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--hq-primary)' }}
                            />
                        ) : (
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--hq-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                                👨‍🏫
                            </div>
                        )}
                        <div>
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--hq-primary)' }}>مساعدي : {profile?.ta_info?.teacher_name || '...'}</h2>
                            <p style={{ margin: 0, color: 'var(--hq-text-muted)', fontSize: '13px' }}>كادر المتابعة والتقييم</p>
                        </div>
                    </div>
                    <div className="hq-tb-right">
                        <div className="hq-admin-profile" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div className="hq-ap-info" style={{ textAlign: 'left' }}>
                                <strong>{profile ? profile.first_name || profile.username : 'المساعد'}</strong>
                                <span>{sessionStorage.getItem('spy_token') ? '🔍 وضع المراقبة (الإدارة)' : 'صلاحية مساعد المدرس'}</span>
                            </div>
                            {!sessionStorage.getItem('spy_token') && (
                                <div onClick={() => setShowPwdModal(true)} className="hq-ap-av" style={{ background: 'var(--hq-primary)', cursor: 'pointer' }} title="تغيير كلمة المرور">TA</div>
                            )}
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
