import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { HiOutlineClock } from 'react-icons/hi2'
import EmptyState from '../core/EmptyState'

const TabMyNotes = ({ myNotes }) => {
    const hasNotes = Array.isArray(myNotes) && myNotes.length > 0

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
            <div className="section-header-row">
                <h2 className="dash-section-title">ملاحظاتي السابقة 📝</h2>
            </div>
            <div className="dash-courses-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {!hasNotes ? (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <EmptyState
                            title="ما عندك ملاحظات بعد"
                            message="لهسه ما مسجل أي ملاحظة. أول ما تكتب ملاحظة أثناء الدرس راح تظهر هنا مباشرة."
                        />
                    </div>
                ) : (
                    myNotes.map((note, i) => (
                        <motion.div key={note.id} className="dash-course-card glass-panel premium-card hover-lift" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '4px', background: 'var(--primary)', borderRadius: '0 12px 12px 0' }}></div>
                            <Link to={`/lesson/${note.lesson}?course=${note.course_id || ''}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><HiOutlineClock style={{ display: 'inline', marginBottom: '-2px' }} /> {new Date(note.created_at).toLocaleDateString('ar-IQ')}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {note.course_title && <span style={{ fontSize: '0.75rem', background: 'rgba(236, 54, 101, 0.1)', color: 'var(--pink)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.course_title}</span>}
                                        {note.module_title && <span style={{ fontSize: '0.75rem', background: 'rgba(253, 186, 1, 0.1)', color: 'var(--orange)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.module_title}</span>}
                                        {note.lesson_title && <span style={{ fontSize: '0.75rem', background: 'rgba(131, 42, 150, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>{note.lesson_title}</span>}
                                    </div>
                                </div>
                                <p style={{ margin: '15px 0', lineHeight: '1.6', color: 'var(--text-main)', fontSize: '1.05rem', whiteSpace: 'pre-wrap', flexGrow: 1 }}>{note.content}</p>
                                {note.lesson && (
                                    <div className="dash-btn-secondary premium-btn" style={{ marginTop: 'auto', textAlign: 'center', padding: '10px' }}>
                                        الذهاب للدرس المنشورة فيه
                                    </div>
                                )}
                            </Link>
                        </motion.div>
                    ))
                )}
            </div>
        </motion.div>
    )
}

export default TabMyNotes
