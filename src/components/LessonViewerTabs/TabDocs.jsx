import { useState, useEffect, Suspense, lazy } from 'react'
import { createPortal } from 'react-dom'
import { API } from '../../config'
import { motion, AnimatePresence } from 'framer-motion'
import { HiOutlineDocumentText, HiOutlineXMark, HiOutlineBookOpen, HiOutlineEye } from 'react-icons/hi2'
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
        docsList.push({ 
            name: 'ملزمة الدرس الحالية', 
            url: lessonInfo.doc_file, 
            size: 'ملزمة المادة', 
            type: getExt(lessonInfo.doc_file), 
            color: '#db3672', 
            bg: 'linear-gradient(135deg, rgba(219, 54, 114, 0.2), rgba(131, 42, 150, 0.1))',
            icon: <HiOutlineBookOpen /> 
        })
    }
    courseDocs.forEach(d => {
        docsList.push({ 
            name: d.title, 
            url: d.file, 
            size: 'مرفق وزاري', 
            type: d.doc_type || 'PDF', 
            color: '#832a96', 
            bg: 'linear-gradient(135deg, rgba(131, 42, 150, 0.2), rgba(219, 54, 114, 0.1))',
            icon: <HiOutlineDocumentText /> 
        })
    })

    return (
        <div className="lv-tab-pane lv-fade">
            <h4 className="lv-section-label">ملازم ومرفقات الدرس</h4>
            {docsList.length === 0 ? (
                <p style={{ color: '#94a3b8' }}>لا توجد ملفات مرفقة بهذا الدرس حالياً.</p>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                    {docsList.map((doc, index) => (
                        <motion.div 
                            key={index} 
                            style={{
                                background: 'rgba(255,255,255,0.7)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: '16px',
                                border: '1px solid rgba(131, 42, 150, 0.12)',
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '20px',
                                boxShadow: '0 10px 30px rgba(131, 42, 150, 0.05)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1, type: "spring" }}
                            whileHover={{ y: -5, boxShadow: '0 15px 40px rgba(131, 42, 150, 0.1)', borderColor: 'rgba(131, 42, 150, 0.3)' }}
                        >
                            <div style={{
                                position: 'absolute', top: 0, right: 0, width: '120px', height: '120px',
                                background: doc.bg, borderRadius: '50%', filter: 'blur(30px)', zIndex: 0, transform: 'translate(30%, -30%)'
                            }}></div>
                            
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', zIndex: 1 }}>
                                <div style={{ 
                                    width: '56px', height: '56px', borderRadius: '14px', 
                                    background: doc.bg, color: doc.color, 
                                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                                    fontSize: '1.8rem', flexShrink: 0, border: `1px solid ${doc.color}22`
                                }}>
                                    {doc.icon}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <strong style={{ fontSize: '1.15rem', color: '#1e293b', fontWeight: 800 }}>{doc.name}</strong>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.05)', color: '#475569' }}>{doc.type}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>{doc.size}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setViewedDoc(doc)}
                                style={{
                                    zIndex: 1, width: '100%', padding: '12px', borderRadius: '12px',
                                    background: 'linear-gradient(90deg, #db3672, #832a96)', color: 'white',
                                    border: 'none', fontFamily: 'var(--font-ar)', fontWeight: 700, fontSize: '1rem',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                                    cursor: 'pointer', boxShadow: '0 4px 15px rgba(219, 54, 114, 0.3)', transition: 'all 0.3s'
                                }}
                                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <HiOutlineEye size={20} /> استعراض المذكرة والمذاكرة
                            </button>
                        </motion.div>
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
