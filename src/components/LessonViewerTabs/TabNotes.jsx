import { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineComputerDesktop, HiOutlineGlobeAlt } from 'react-icons/hi2'
import '../../pages/LessonViewer.css'

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
    const [loading, setLoading] = useState(true)

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

    const handleSave = () => {
        if (!input.trim()) return
        const t = localStorage.getItem('access_token')
        fetch(`${API}/api/interactions/notes/`, {
            method: 'POST', headers: { 'Authorization': `Bearer ${t}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson: lessonId, content: input, source: 'web' })
        }).then(r => r.json()).then(d => { setNotes([d, ...notes]); setInput('') })
    }

    const fmt = (s) => {
        if(!s && sh !== 0) return '0:00';
        const m = Math.floor(s/60);
        const sec = s%60;
        return `${m}:${sec.toString().padStart(2,'0')}`;
    }

    return (
        <div className="lv-tab-pane lv-fade">
            <div className="lv-notes-editor">
                <div className="lv-ne-toolbar"><button className="lv-tb-b"><b>B</b></button><button className="lv-tb-b"><i>I</i></button><button className="lv-tb-b"><u>U</u></button></div>
                <textarea className="lv-ne-area" rows="5" placeholder="اكتب ملاحظاتك الخاصة هنا... هذي الملاحظات بس انت تشوفها." value={input} onChange={e => setInput(e.target.value)}></textarea>
                <div className="lv-ne-foot"><button className="premium-btn exact-btn-purple lv-sm-btn" onClick={handleSave}>احفظ الملاحظة</button></div>
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
                        <span className="lv-nc-date" style={{fontSize: '0.75rem', marginBottom: 0}}>يوم: {new Date(n.created_at).toLocaleDateString('ar-IQ')}</span>
                    </div>
                    <p>{n.content}</p>
                </div>
            ))}
        </div>
    )
}

export default TabNotes
