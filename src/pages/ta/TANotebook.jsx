import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import {
    HiOutlinePlus,
    HiOutlinePencilSquare,
    HiOutlineTrash,
    HiOutlineMapPin,
    HiOutlineCheckCircle,
    HiOutlineCircleStack,
    HiOutlineMagnifyingGlass,
    HiOutlineHashtag,
    HiOutlineBookmark,
    HiMiniCheckCircle
} from 'react-icons/hi2'

/* 
  TANotebook.jsx - 'Savage' Notebook for TAs
  Features: Glassmorphism UI, Task Toggling, Color Coding, Pinning
*/

export const TANotebook = () => {
    const [notes, setNotes] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('all') // 'all' | 'tasks' | 'notes'

    // Modal State
    const [showModal, setShowModal] = useState(false)
    const [editingNote, setEditingNote] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        is_task: false,
        is_pinned: false,
        color: 'default'
    })

    const fetchNotes = async () => {
        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(API + '/api/interactions/ta-notes/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setNotes(data.results || data)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => { fetchNotes() }, [])

    const handleSave = async () => {
        const tk = localStorage.getItem('access_token')
        const url = editingNote
            ? `${API}/api/interactions/ta-notes/${editingNote.id}/`
            : API + '/api/interactions/ta-notes/'

        const method = editingNote ? 'PATCH' : 'POST'

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify(formData)
            })
            if (res.ok) {
                fetchNotes()
                setShowModal(false)
                setEditingNote(null)
                setFormData({ title: '', content: '', is_task: false, is_pinned: false, color: 'default' })
            }
        } catch (e) { console.error(e) }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return
        const tk = localStorage.getItem('access_token')
        try {
            await fetch(`${API}/api/interactions/ta-notes/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            fetchNotes()
        } catch (e) { console.error(e) }
    }

    const toggleStatus = async (note, field) => {
        const tk = localStorage.getItem('access_token')
        try {
            await fetch(`${API}/api/interactions/ta-notes/${note.id}/`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify({ [field]: !note[field] })
            })
            fetchNotes()
        } catch (e) { console.error(e) }
    }

    const filteredNotes = notes.filter(n => {
        const matchesSearch = (n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.content?.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesFilter = filterType === 'all' ||
            (filterType === 'tasks' && n.is_task) ||
            (filterType === 'notes' && !n.is_task)
        return matchesSearch && matchesFilter
    })

    const getColorStyle = (color) => {
        const colors = {
            default: '#ffffff',
            blue: '#e0f2fe',
            green: '#dcfce7',
            yellow: '#fef9c3',
            red: '#fee2e2',
            purple: '#f3e8ff'
        }
        return colors[color] || colors.default
    }

    const getBorderColor = (color) => {
        const colors = {
            default: 'var(--hq-border)',
            blue: '#3b82f6',
            green: '#10b981',
            yellow: '#f59e0b',
            red: '#ef4444',
            purple: 'var(--hq-primary)'
        }
        return colors[color] || colors.default
    }

    return (
        <div style={{ padding: '20px', minHeight: '100%', color: 'var(--hq-text-main)' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', margin: 0, fontWeight: '800', background: 'linear-gradient(45deg, var(--hq-primary), #ec3665)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>دفتر المهام والملاحظات</h1>
                    <p style={{ color: 'var(--hq-text-muted)', margin: '5px 0 0 0' }}>نظّم مهامك، ملاحظاتك، وخططك التوجيهية في مكان واحد.</p>
                </div>
                <button
                    onClick={() => { setEditingNote(null); setFormData({ title: '', content: '', is_task: false, is_pinned: false, color: 'default' }); setShowModal(true); }}
                    style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(131, 42, 150, 0.3)' }}
                >
                    <HiOutlinePlus size={20} /> إضافة جديدة
                </button>
            </div>

            {/* Controls Area */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', alignItems: 'center' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <HiOutlineMagnifyingGlass style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hq-text-muted)' }} />
                    <input
                        type="text"
                        placeholder="ابحث في ملاحظاتك..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', padding: '12px 45px 12px 15px', borderRadius: '14px', border: '1px solid var(--hq-border)', background: 'var(--hq-surface)', color: 'white' }}
                    />
                </div>
                <div style={{ display: 'flex', background: 'var(--hq-surface)', padding: '5px', borderRadius: '12px', border: '1px solid var(--hq-border)' }}>
                    <button onClick={() => setFilterType('all')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'all' ? 'var(--hq-primary)' : 'transparent', color: filterType === 'all' ? 'white' : 'var(--hq-text-muted)', transition: '0.3s' }}>الكل</button>
                    <button onClick={() => setFilterType('tasks')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'tasks' ? 'var(--hq-primary)' : 'transparent', color: filterType === 'tasks' ? 'white' : 'var(--hq-text-muted)', transition: '0.3s' }}>المهام</button>
                    <button onClick={() => setFilterType('notes')} style={{ padding: '8px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterType === 'notes' ? 'var(--hq-primary)' : 'transparent', color: filterType === 'notes' ? 'white' : 'var(--hq-text-muted)', transition: '0.3s' }}>ملاحظات</button>
                </div>
            </div>

            {/* Notes Grid */}
            {isLoading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>جاري تحميل الملاحظات...</div>
            ) : filteredNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '100px', border: '2px dashed var(--hq-border)', borderRadius: '20px', color: 'var(--hq-text-muted)' }}>
                    <HiOutlineCircleStack size={50} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <h3>لا يوجد شيء هنا بعد!</h3>
                    <p>ابدأ بكتابة خطتك أو قائمة المهام اليومية للمتابعة.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {filteredNotes.map(n => (
                        <div
                            key={n.id}
                            style={{
                                background: getColorStyle(n.color),
                                backdropFilter: 'blur(10px)',
                                border: `1px solid ${getBorderColor(n.color)}`,
                                borderRadius: '18px',
                                padding: '20px',
                                position: 'relative',
                                transition: '0.3s',
                                opacity: n.is_completed ? 0.6 : 1,
                                transform: n.is_completed ? 'scale(0.98)' : 'scale(1)',
                                boxShadow: n.is_pinned ? `0 0 20px ${getBorderColor(n.color)}44` : 'none'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {n.is_task ? <HiOutlineBookmark color={getBorderColor(n.color)} /> : <HiOutlineHashtag color={getBorderColor(n.color)} />}
                                    <h3 style={{ margin: 0, fontSize: '18px', color: '#1a1a1a', textDecoration: n.is_completed ? 'line-through' : 'none' }}>{n.title || (n.is_task ? 'مهمة' : 'ملاحظة')}</h3>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => toggleStatus(n, 'is_pinned')} title="تثبيت" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: n.is_pinned ? 'var(--hq-primary)' : 'var(--hq-text-muted)' }}>
                                        <HiOutlineMapPin size={18} />
                                    </button>
                                    <button
                                        onClick={() => { setEditingNote(n); setFormData(n); setShowModal(true); }}
                                        title="تعديل" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--hq-text-muted)' }}
                                    >
                                        <HiOutlinePencilSquare size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(n.id)} title="حذف" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                                        <HiOutlineTrash size={18} />
                                    </button>
                                </div>
                            </div>

                            <div style={{
                                fontSize: '14px',
                                lineHeight: '1.6',
                                color: '#4b5563',
                                minHeight: '60px',
                                textDecoration: n.is_completed ? 'line-through' : 'none',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {n.content}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '15px', borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
                                <span style={{ fontSize: '11px', color: '#9ca3af' }}>{new Date(n.updated_at).toLocaleDateString('ar-IQ')}</span>
                                {n.is_task && (
                                    <button
                                        onClick={() => toggleStatus(n, 'is_completed')}
                                        style={{
                                            background: n.is_completed ? '#10b981' : 'transparent',
                                            color: n.is_completed ? 'white' : '#10b981',
                                            border: `1px solid #10b981`,
                                            padding: '5px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        {n.is_completed ? <HiMiniCheckCircle /> : <HiOutlineCheckCircle />}
                                        {n.is_completed ? 'مكتمل' : 'بانتظار الإنجاز'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'white', border: '1px solid var(--hq-border)', borderRadius: '24px', padding: '30px', width: '500px', maxWidth: '90%', color: '#1a1a1a' }}>
                        <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#1a1a1a' }}>{editingNote ? 'تعديل الملاحظة' : 'إضافة ملاحظة/مهمة جديدة'}</h2>

                        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                            <button
                                onClick={() => setFormData({ ...formData, is_task: false })}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--hq-border)', cursor: 'pointer', background: !formData.is_task ? 'var(--hq-primary-bg)' : 'transparent', color: !formData.is_task ? 'var(--hq-primary)' : 'var(--hq-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <HiOutlineBookmark /> ملاحظة سريعة
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, is_task: true })}
                                style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--hq-border)', cursor: 'pointer', background: formData.is_task ? 'var(--hq-primary-bg)' : 'transparent', color: formData.is_task ? 'var(--hq-primary)' : 'var(--hq-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                            >
                                <HiOutlineCheckCircle /> مهمة عمل
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="عنوان الملاحظة (اختياري)"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid var(--hq-border)', background: 'transparent', color: '#1a1a1a', marginBottom: '15px' }}
                        />
                        <textarea
                            placeholder="اكتب المحتوى هنا..."
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            rows={5}
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '1px solid var(--hq-border)', background: 'transparent', color: '#1a1a1a', marginBottom: '15px', resize: 'none' }}
                        />

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '13px', color: 'var(--hq-text-muted)', display: 'block', marginBottom: '10px' }}>اختر لون التمييز:</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {['default', 'blue', 'green', 'yellow', 'red', 'purple'].map(c => (
                                    <div
                                        key={c}
                                        onClick={() => setFormData({ ...formData, color: c })}
                                        style={{
                                            width: '30px', height: '30px', borderRadius: '8px', cursor: 'pointer',
                                            background: getBorderColor(c),
                                            border: formData.color === c ? '2px solid white' : 'none',
                                            boxShadow: formData.color === c ? '0 0 10px white' : 'none'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                                <input type="checkbox" checked={formData.is_pinned} onChange={e => setFormData({ ...formData, is_pinned: e.target.checked })} /> تثبيت في الأعلى 📌
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
                            <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--hq-border)', background: 'transparent', color: '#1a1a1a', cursor: 'pointer' }}>إلغاء</button>
                            <button onClick={handleSave} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: 'var(--hq-primary)', color: 'white', cursor: 'pointer', fontWeight: 'bold' }}>حفظ الملاحظة</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Animations */}
            <style>{`
                @keyframes pulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                    100% { transform: scale(1); }
                }
            `}</style>
        </div>
    )
}
