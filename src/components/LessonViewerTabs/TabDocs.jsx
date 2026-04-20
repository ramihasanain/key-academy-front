import { useState, useEffect, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { API } from '../../config'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineDocumentText, HiOutlineXMark } from 'react-icons/hi2'
import '../../pages/LessonViewer.css'

const SecurePDFViewer = lazy(() => import('../SecurePDFViewer'))

const TabDocs = ({ lessonInfo, courseId, userData }) => {
    const [courseDocs, setCourseDocs] = useState([])
    const [viewedDoc, setViewedDoc] = useState(null)

    useEffect(() => {
        if (!courseId) return
        fetch(`${API}/api/courses/${courseId}/`)
            .then(res => res.json())
            .then(data => {
                if (data.ministerial_docs) {
                    setCourseDocs(data.ministerial_docs)
                }
            })
            .catch(console.error)
    }, [courseId])

    const getExt = (url) => url ? url.split('?')[0].split('.').pop().toUpperCase() : 'DOC'
    let docsList = []
    if (lessonInfo?.doc_file) {
        docsList.push({ name: 'ملزمة الدرس الحالية', url: lessonInfo.doc_file, size: 'ملف PDF', type: getExt(lessonInfo.doc_file), color: '#dc2626', icon: '📄' })
    }
    courseDocs.forEach(d => {
        docsList.push({ name: d.title, url: d.file, size: 'مرفق وزاري', type: d.doc_type || 'PDF', color: '#2563eb', icon: '📘' })
    })

    return (
        <div className="lv-tab-pane lv-fade">
            <h4 className="lv-section-label">ملازم ومرفقات الدرس</h4>
            {docsList.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>لا توجد ملفات مرفقة بهذا الدرس حالياً.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                    {docsList.map((doc, index) => (
                        <div key={index} className="lv-doc-card">
                            <span className="lv-doc-icon" style={{ background: doc.color + '1A', color: doc.color }}>{doc.icon}</span>
                            <div className="lv-doc-info">
                                <strong>{doc.name}</strong>
                                <span>{doc.type} • {doc.size}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="lv-doc-btn" onClick={() => setViewedDoc(doc)}>استعراض ومذاكرة</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Document Viewer Modal */}
            {createPortal(
                <AnimatePresence>
                    {viewedDoc && (
                        <motion.div
                            style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewedDoc(null)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: '95%', height: '95%', maxWidth: '1200px', background: '#fff', borderRadius: '20px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
                            >
                                <div style={{ padding: '16px 24px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <HiOutlineDocumentText size={22} style={{ color: 'var(--purple-light)' }} />
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>{viewedDoc.name || 'مستند الدورة'}</h3>
                                    </div>
                                    <button onClick={() => setViewedDoc(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', padding: '6px', borderRadius: '50%', transition: 'background 0.3s' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}>
                                        <HiOutlineXMark size={24} />
                                    </button>
                                </div>
                                <div style={{ flex: 1, position: 'relative', backgroundColor: '#e2e8f0', overflow: 'hidden' }} onContextMenu={(e) => e.preventDefault()}>
                                    <Suspense fallback={<div style={{padding:'40px', textAlign:'center', color:'#94a3b8'}}>جاري جلب وعرض المستند...</div>}>
                                        <SecurePDFViewer url={viewedDoc.url} isFullscreen={false} />
                                    </Suspense>
                                    
                                    {/* Watermark Overlay */}
                                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', overflow: 'hidden', display: 'flex', flexWrap: 'wrap', gap: '50px', justifyContent: 'center', alignContent: 'center', opacity: 0.08, mixBlendMode: 'difference', zIndex: 5 }}>
                                        {Array.from({ length: 40 }).map((_, i) => (
                                            <div key={i} style={{ transform: 'rotate(-35deg)', fontSize: '24px', fontWeight: 'bold', color: '#fff', whiteSpace: 'nowrap', userSelect: 'none' }}>
                                                {userData?.username || 'Student'}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Security Overlay */}
                                    <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)', zIndex: 6 }}></div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    )
}

export default TabDocs
