import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineUsers, HiOutlineMagnifyingGlass, HiOutlineArrowLeft, HiOutlineNoSymbol } from 'react-icons/hi2'
import '../hq/Admin.css'

export const TAStudentsList = () => {
    const navigate = useNavigate()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const fetchStudents = async (q = '') => {
        setLoading(true)
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/interactions/ta-students/?q=${q}`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                setStudents(await res.json())
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStudents()
    }, [])

    const handleSearch = (e) => {
        e.preventDefault()
        fetchStudents(searchQuery)
    }

    return (
        <div style={{ padding: '20px 30px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', margin: 0, color: 'var(--hq-primary-text)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineUsers color="var(--hq-primary)" /> إدارة قوائم الطلاب
                    </h1>
                    <p style={{ color: 'var(--hq-text-muted)', marginTop: '5px', fontSize: '0.95rem' }}>بحث وفلترة جميع الطلاب المسجلين بصلاحيتك.</p>
                </div>
                
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '400px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <span style={{ position: 'absolute', top: '50%', right: '15px', transform: 'translateY(-50%)', color: 'var(--hq-text-muted)' }}>
                            <HiOutlineMagnifyingGlass size={20} />
                        </span>
                        <input 
                            type="text" 
                            className="hq-input" 
                            placeholder="ابحث بالاسم، الإيميل، الهاتف..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ paddingRight: '45px', width: '100%' }}
                        />
                    </div>
                    <button type="submit" className="hq-btn primary" style={{ minWidth: '80px' }}>بحث</button>
                    {searchQuery && (
                        <button type="button" onClick={() => { setSearchQuery(''); fetchStudents(''); }} className="hq-btn outline">إلغاء</button>
                    )}
                </form>
            </div>

            <div className="hq-card" style={{ padding: 0, overflow: 'hidden' }}>
                {loading ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>جاري تحميل قائمة الطلاب...</div>
                ) : students.length === 0 ? (
                    <div style={{ padding: '50px', textAlign: 'center', color: 'var(--hq-text-muted)' }}>لا يوجد طلاب يتطابقون مع بحثك.</div>
                ) : (
                    <div className="table-responsive">
                        <table style={{ width: '100%', textAlign: 'right', borderCollapse: 'collapse' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--hq-border)' }}>
                                <tr>
                                    <th style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>الطالب</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>الهاتف</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>الحالة</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontWeight: 'bold' }}>الانضمام</th>
                                    <th style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontWeight: 'bold', width: '150px' }}>الإجراء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => (
                                    <tr key={student.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', ':hover': { background: 'rgba(255,255,255,0.01)' } }}>
                                        <td style={{ padding: '15px 20px' }}>
                                            <div style={{ color: 'var(--hq-primary-text)', fontWeight: 'bold', fontSize: '1.05rem' }}>{student.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--hq-text-muted)', marginTop: '2px' }}>@{student.username}</div>
                                        </td>
                                        <td style={{ padding: '15px 20px', color: 'var(--hq-primary-text)' }}>{student.phone}</td>
                                        <td style={{ padding: '15px 20px' }}>
                                            {student.muted_until && new Date(student.muted_until) > new Date() ? (
                                                <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><HiOutlineNoSymbol /> محظور</span>
                                            ) : student.is_active ? (
                                                <span style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>نشط ✨</span>
                                            ) : (
                                                <span style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.85rem' }}>مجمد ❄️</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '15px 20px', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(student.date_joined).toLocaleDateString('ar-EG')}
                                        </td>
                                        <td style={{ padding: '15px 20px' }}>
                                            <button 
                                                onClick={() => navigate(`/ta/student/${student.id}/360`)}
                                                style={{ background: 'rgba(131, 42, 150, 0.1)', color: 'var(--hq-primary)', border: '1px solid rgba(131, 42, 150, 0.2)', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold', transition: 'all 0.2s', ':hover': { background: 'var(--hq-primary)', color: 'white' } }}
                                            >
                                                ملف 360 <HiOutlineArrowLeft />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
