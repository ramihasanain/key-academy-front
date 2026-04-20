import React, { useState, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`

const SecurePDFViewer = ({ url, isFullscreen }) => {
    const [numPages, setNumPages] = useState(null)
    const [scale, setScale] = useState(1.2)
    const containerRef = useRef(null)

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    useEffect(() => {
        const preventContextMenu = (e) => e.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef) currentRef.addEventListener("contextmenu", preventContextMenu);
        return () => {
            if (currentRef) currentRef.removeEventListener("contextmenu", preventContextMenu);
        };
    }, []);

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#e2e8f0', userSelect: 'none' }} className="lv-secure-pdf">
            <div style={{ position: 'sticky', top: 0, background: 'rgba(0,0,0,0.7)', color: 'white', padding: '10px 20px', zIndex: 100, display: 'flex', gap: '15px', borderRadius: '0 0 10px 10px', backdropFilter: 'blur(5px)' }}>
                <button onClick={() => setScale(s => Math.max(0.5, s - 0.2))} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>- تصغير</button>
                <span style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold', direction: 'ltr' }}>{(scale * 100).toFixed(0)}%</span>
                <button onClick={() => setScale(s => Math.min(3, s + 0.2))} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '5px', cursor: 'pointer' }}>+ تكبير</button>
            </div>
            
            <Document
                file={url}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div style={{ padding: '50px', fontSize: '1.2rem', color: '#64748b' }}>جاري تحميل المستند المشفّر... ⏳</div>}
                error={<div style={{ padding: '50px', fontSize: '1.2rem', color: '#ef4444' }}>حدث خطأ أثناء تحميل المستند. يرجى التأكد من الرابط.</div>}
            >
                {Array.from({ length: numPages || 0 }, (_, i) => i + 1).map((pageNumber) => (
                    <div key={pageNumber} style={{ margin: '20px 0', boxShadow: '0 5px 15px rgba(0,0,0,0.15)', position: 'relative' }}>
                        <Page 
                            pageNumber={pageNumber} 
                            scale={isFullscreen ? scale * 1.5 : scale}
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                        />
                        <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 10 }} />
                    </div>
                ))}
            </Document>
        </div>
    )
}

export default SecurePDFViewer;
