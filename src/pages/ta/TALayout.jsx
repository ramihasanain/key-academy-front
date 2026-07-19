import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { API } from '../../config'
import { TAActiveGroupProvider, useTAActiveGroup } from '../../contexts/TAActiveGroupContext'
import {
    HiOutlineChatBubbleLeftRight,
    HiOutlineUsers,
    HiOutlineArrowRightOnRectangle,
    HiOutlineAcademicCap,
    HiOutlinePencilSquare,
    HiOutlineNoSymbol,
    HiOutlineClock,
    HiOutlineClipboardDocumentCheck,
    HiOutlineVideoCamera
} from 'react-icons/hi2'
import '../hq/Admin.css'
import './TAResponsive.css'

const TALayoutShell = ({ profile }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [showPwdModal, setShowPwdModal] = useState(false)
    const [newPwd, setNewPwd] = useState('')
    const [pwdMsg, setPwdMsg] = useState('')
    const [isMobileOpen, setIsMobileOpen] = useState(false)
    const { groups, activeGroupId, activeGroup, setActiveGroupId } = useTAActiveGroup()

    useEffect(() => {
        setIsMobileOpen(false)
    }, [location.pathname])

    useEffect(() => {
        if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
            Notification.requestPermission()
        }

        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        if (tk) {
            const wsUrl = API.replace(/^http/, 'ws')
            const baseUrl = wsUrl.endsWith('/') ? wsUrl.slice(0, -1) : wsUrl
            const ws = new WebSocket(`${baseUrl}/ws/ta-notifications/?token=${tk}`)

            const playNotificationSound = () => {
                try {
                    const ctx = new (window.AudioContext || window.webkitAudioContext)()
                    const osc = ctx.createOscillator()
                    const gainNode = ctx.createGain()
                    osc.connect(gainNode)
                    gainNode.connect(ctx.destination)
                    osc.type = 'sine'
                    osc.frequency.setValueAtTime(880, ctx.currentTime)
                    osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.1)
                    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
                    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
                    osc.start(ctx.currentTime)
                    osc.stop(ctx.currentTime + 0.1)
                } catch (e) { console.error('Audio Notification failed', e) }
            }

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data)
                if (data.message && (data.message.sender_role === 'student' || data.message.sender_role === 'user')) {
                    playNotificationSound()
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('رسالة جديدة - أكاديمية مفتاح', {
                            body: data.message.content || 'يوجد مرفق جديد'
                        })
                    }
                }
            }

            return () => ws.close()
        }
    }, [])

    const handleLogout = () => {
        if (sessionStorage.getItem('spy_token')) {
            sessionStorage.removeItem('spy_token')
            window.close()
            navigate('/')
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
        { path: 'students', icon: <HiOutlineUsers />, label: 'إدارة قوائم الطلاب' },
        { path: 'qa', icon: <HiOutlineChatBubbleLeftRight />, label: 'سؤال وجواب' },
        { path: 'groups', icon: <HiOutlineUsers />, label: 'إدارة مجموعات الدردشة' },
        { path: 'notes', icon: <HiOutlinePencilSquare />, label: 'دفتر المهام والملاحظات' },
        { path: 'exams', icon: <HiOutlineClipboardDocumentCheck />, label: 'الامتحانات الأسبوعية' },
        { path: 'lectures', icon: <HiOutlineVideoCamera />, label: 'محاضرات المنهاج' },
        { path: 'muted', icon: <HiOutlineNoSymbol />, label: 'قائمة الطلاب المحظورين' },
        { path: 'moderation-history', icon: <HiOutlineClock />, label: 'سجل الرقابة' },
    ]

    const headerTeacher = activeGroup?.teacher_name || profile?.ta_info?.teacher_name || '...'
    const headerGroup = activeGroup?.name || ''

    return (
        <div className="hq-layout ta-layout" style={{
            '--hq-primary': '#832a96',
            '--hq-primary-hover': '#5e1d6d',
            '--hq-primary-bg': 'rgba(131, 42, 150, 0.08)',
            '--pink-main': '#ec3665',
            '--blue-main': '#832a96'
        }}>
            <aside className={`hq-sidebar ${isMobileOpen ? 'mobile-open open' : 'open'}`}>
                <div className="hq-sb-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/new-logo.png" alt="Key Academy" style={{ height: '40px', objectFit: 'contain' }} />
                </div>
                <nav className="hq-sb-nav">
                    {navItems.map(item => {
                        const isActive = item.path === ''
                            ? location.pathname === '/ta'
                            : location.pathname.startsWith(`/ta/${item.path}`)
                        return (
                            <NavLink key={item.path} end={item.path === ''} to={item.path} className={`hq-nav-link ${isActive ? 'active' : ''}`}>
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
                    <span className="hq-version">إصدار المساعد v2.0</span>
                </div>
            </aside>
            <div className={`hq-mobile-overlay ${isMobileOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileOpen(false)}></div>

            <div className="hq-main">
                <header className="hq-topbar ta-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', flexWrap: 'wrap', gap: '12px' }}>
                    <div className="hq-tb-left" style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <button className="hq-mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>☰</button>
                        {(activeGroup?.teacher_image || profile?.ta_info?.teacher_image) ? (
                            <img src={activeGroup?.teacher_image || profile.ta_info.teacher_image} alt="Teacher" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--hq-primary)' }} />
                        ) : (
                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--hq-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>👨‍🏫</div>
                        )}
                        <div className="ta-teacher-meta">
                            <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--hq-primary)' }}>
                                مساعدي: {headerTeacher}{headerGroup ? ` — ${headerGroup}` : ''}
                            </h2>
                            <p style={{ margin: 0, color: 'var(--hq-text-muted)', fontSize: '13px' }}>كادر المتابعة والتقييم</p>
                        </div>
                        {(groups.length > 1 || (profile?.ta_info?.teachers?.length || 0) > 1) && groups.length > 0 && (
                            <select
                                className="ta-group-select"
                                value={activeGroupId || ''}
                                onChange={e => setActiveGroupId(parseInt(e.target.value, 10))}
                            >
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.teacher_name ? `${g.teacher_name} — ` : ''}{g.name || `مجموعة ${g.index}`} ({g.students_count} طالب)
                                    </option>
                                ))}
                            </select>
                        )}
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
                    <Outlet context={{ profile, activeGroupId, activeGroup }} key={activeGroupId || 'all'} />
                </div>
            </div>

            {showPwdModal && (
                <div className="hq-modal-overlay" onClick={() => setShowPwdModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div className="hq-modal-content" onClick={e => e.stopPropagation()} style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                        <div className="hq-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                            <h3 style={{ margin: 0, color: 'var(--hq-primary)', fontSize: '18px' }}>تغيير كلمة المرور الخاصة بك</h3>
                            <button onClick={() => setShowPwdModal(false)} className="hq-modal-close" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#888' }}>&times;</button>
                        </div>
                        <div className="hq-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                            <label className="hq-label" style={{ fontWeight: 'bold', fontSize: '14px', color: '#555', textAlign: 'right' }}>كلمة المرور الجديدة</label>
                            <input type="text" className="hq-input" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="اكتب كلمة المرور..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' }} />
                            {pwdMsg && <div style={{ marginTop: '10px', color: pwdMsg.includes('بنجاح') ? '#10b981' : '#ef4444', fontSize: '14px', textAlign: 'right' }}>{pwdMsg}</div>}
                        </div>
                        <div className="hq-modal-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="hq-btn primary" onClick={handleChangePwd} style={{ background: 'var(--hq-primary)', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>حفظ التغيير</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export const TALayout = () => {
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
            try {
                const res = await fetch(API + '/api/hq/me/', {
                    headers: { Authorization: `Bearer ${tk}` }
                })
                if (res.ok) {
                    setProfile(await res.json())
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

    if (isLoading) return <div className="hq-loading">جاري مصادقة الدخول...</div>

    return (
        <TAActiveGroupProvider initialGroups={profile?.ta_info?.groups || []}>
            <TALayoutShell profile={profile} />
        </TAActiveGroupProvider>
    )
}
