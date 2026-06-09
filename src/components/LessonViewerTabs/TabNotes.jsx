import { useState, useEffect } from 'react'
import ReactQuill, { Quill } from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import { API } from '../../config'
import { HiOutlineComputerDesktop, HiOutlineGlobeAlt, HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2'
import '../../pages/LessonViewer.css'

const AlignFormat = Quill.import('formats/align')
AlignFormat.whitelist = ['left', 'center', 'right', 'justify']
Quill.register(AlignFormat, true)

const QuillIcons = Quill.import('ui/icons')
if (QuillIcons && QuillIcons.align && !QuillIcons.align.left) {
    QuillIcons.align.left = QuillIcons.align['']
}

const notesRequestCache = new Map()

const fetchNotesOnce = (key, url, options) => {
    if (notesRequestCache.has(key)) return notesRequestCache.get(key)
    const request = fetch(url, options).then(r => {
        if (!r.ok) throw new Error(`Failed to load notes: ${r.status}`)
        return r.json()
    }).finally(() => {
        notesRequestCache.delete(key)
    })
    notesRequestCache.set(key, request)
    return request
}

const TabNotes = ({ lessonId }) => {
    const [notes, setNotes] = useState([])
    const [input, setInput] = useState('')
    const [editingNote, setEditingNote] = useState(null)
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ align: 'left' }, { align: 'center' }, { align: 'right' }, { align: 'justify' }],
            ['blockquote'],
            ['clean'],
        ]
    }
    const quillFormats = [
        'header',
        'bold',
        'italic',
        'underline',
        'strike',
        'list',
        'bullet',
        'align',
        'link',
        'blockquote'
    ]

    useEffect(() => {
        const t = localStorage.getItem('access_token')
        if (!t || !lessonId) {
            setLoading(false)
            return
        }
        let isActive = true
        const requestKey = `${lessonId}:${t}`
        fetchNotesOnce(
            requestKey,
            `${API}/api/interactions/notes/?lesson=${lessonId}`,
            { headers: { 'Authorization': `Bearer ${t}` } }
        )
            .then(d => {
                if (!isActive) return
                setNotes(d)
                setLoading(false)
            })
            .catch(e => {
                if (!isActive) return
                console.log(e)
                setLoading(false)
            })
        return () => {
            isActive = false
        }
    }, [lessonId])

    const isQuillContentEmpty = (value) => {
        const plainText = (value || '').replace(/<(.|\n)*?>/g, '').replace(/&nbsp;/g, ' ').trim()
        return plainText.length === 0
    }
    const canSave = !isQuillContentEmpty(input)

    const handleCancelEdit = () => {
        setEditingNote(null)
        setInput('')
    }

    const handleEdit = (note) => {
        setEditingNote(note)
        setInput(note.content || '')
    }

    const handleDelete = async (id) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) return
        const t = localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/interactions/notes/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${t}` }
            })
            if (res.ok) {
                setNotes(notes.filter(n => n.id !== id))
                if (editingNote?.id === id) handleCancelEdit()
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleSave = async () => {
        if (!canSave || saving) return
        const t = localStorage.getItem('access_token')
        setSaving(true)
        try {
            if (editingNote) {
                const res = await fetch(`${API}/api/interactions/notes/${editingNote.id}/`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: input })
                })
                if (res.ok) {
                    const d = await res.json()
                    setNotes(notes.map(n => n.id === d.id ? d : n))
                    handleCancelEdit()
                }
            } else {
                const res = await fetch(`${API}/api/interactions/notes/`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lesson: lessonId, content: input, source: 'web' })
                })
                if (res.ok) {
                    const d = await res.json()
                    setNotes([d, ...notes])
                    setInput('')
                }
            }
        } catch (e) {
            console.error(e)
        } finally {
            setSaving(false)
        }
    }

    const fmt = (s) => {
        if(!s && s !== 0) return '0:00';
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec.toString().padStart(2,'0')}`;
    }

    return (
        <div className="lv-tab-pane lv-fade">
            <div className={`lv-notes-editor${editingNote ? ' lv-notes-editor--editing' : ''}`}>
                {editingNote && (
                    <div className="lv-ne-edit-banner">
                        <span>تعديل ملاحظة</span>
                        <button type="button" className="lv-ne-cancel-btn" onClick={handleCancelEdit}>إلغاء</button>
                    </div>
                )}
                <ReactQuill
                    className="lv-ne-area lv-ne-quill"
                    theme="snow"
                    value={input}
                    onChange={setInput}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="اكتب ملاحظاتك الخاصة هنا... هذي الملاحظات بس انت تشوفها."
                />
                <div className="lv-ne-foot">
                    <button className="premium-btn exact-btn-purple lv-sm-btn" onClick={handleSave} disabled={!canSave || saving}>
                        {saving ? 'جاري الحفظ...' : editingNote ? 'حفظ التعديل' : 'احفظ الملاحظة'}
                    </button>
                </div>
            </div>
            <h4 className="lv-section-label">ملاحظاتي السابقة</h4>
            {loading ? <p>جاري التحميل...</p> : notes.length === 0 ? <p style={{ color: '#94a3b8' }}>ماكو أي ملاحظات مسجلة.</p> : notes.map(n => (
                <div key={n.id} className="lv-note-card">
                    <div className="lv-nc-strip"></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="lv-nc-date" style={{ marginBottom: 0 }}>
                            {n.source === 'app' ? (
                                <span style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#8b5cf6', fontWeight: 'bold'}}><HiOutlineComputerDesktop /> كُتبت في الفيديو {n.video_time != null && `[${fmt(n.video_time)}]`}</span>
                            ) : (
                                <span style={{display: 'flex', alignItems: 'center', gap: '5px', color: '#64748b'}}><HiOutlineGlobeAlt /> كُتب من المنصة</span>
                            )}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span className="lv-nc-date" style={{fontSize: '0.75rem', marginBottom: 0}}>
                                يوم: {new Date(n.created_at).toLocaleDateString('ar-IQ')}
                                {n.updated_at && n.updated_at !== n.created_at && (
                                    <span style={{ marginRight: '6px', color: '#a78bfa' }}> (معدّلة)</span>
                                )}
                            </span>
                            <div className="lv-note-actions">
                                <button type="button" className="lv-note-action-btn" title="تعديل" onClick={() => handleEdit(n)}>
                                    <HiOutlinePencilSquare size={16} />
                                </button>
                                <button type="button" className="lv-note-action-btn lv-note-action-btn--danger" title="حذف" onClick={() => handleDelete(n.id)}>
                                    <HiOutlineTrash size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="lv-note-content" dangerouslySetInnerHTML={{ __html: n.content || '' }} />
                </div>
            ))}
        </div>
    )
}

export default TabNotes
