import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import {
    HiOutlinePencil,
    HiOutlineChatBubbleBottomCenterText,
    HiOutlineCheck,
    HiOutlineXMark,
    HiOutlineTrash,
    HiOutlineArrowUturnLeft,
    HiOutlineMagnifyingGlassPlus,
    HiOutlineMagnifyingGlassMinus,
    HiOutlineArrowsPointingOut,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineHandRaised,
} from 'react-icons/hi2'
import {
    GRADING_DATA_VERSION,
    normalizePages,
    redrawCanvas,
    normalizeStrokeForSave,
    normalizeMarkForSave,
    hitTestAnnotation,
    loadFileForViewer,
    exportAnnotatedPages,
} from './examAnnotatorUtils'
import { CollapsibleSection } from '../CollapsibleSection'
import '../CollapsibleSection.css'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export { exportAnnotatedPages }

const TOOLS = {
    pan: 'pan',
    pen: 'pen',
    text: 'text',
    check: 'check',
    cross: 'cross',
    eraser: 'eraser',
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#0f172a']

function useMediaQuery(query) {
    const [matches, setMatches] = useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
    )
    useEffect(() => {
        const mq = window.matchMedia(query)
        const handler = () => setMatches(mq.matches)
        handler()
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [query])
    return matches
}

function PdfPageView({ url, pageNumber, scale, token, onNumPages, onRenderSuccess }) {
    const [pdfSource, setPdfSource] = useState(null)
    const [loadError, setLoadError] = useState(false)

    useEffect(() => {
        let revoked = null
        let cancelled = false
        setLoadError(false)
        setPdfSource(null)

        loadFileForViewer(url, token).then((loaded) => {
            if (cancelled) return
            if (!loaded) {
                setLoadError(true)
                return
            }
            if (loaded.url?.startsWith('blob:')) revoked = loaded.url
            if (loaded.data) {
                setPdfSource({ data: loaded.data })
            } else {
                setPdfSource(loaded.url)
            }
        })

        return () => {
            cancelled = true
            if (revoked) URL.revokeObjectURL(revoked)
        }
    }, [url, token])

    if (loadError) {
        return (
            <div className="exam-annotator-fallback">
                <p>تعذر تحميل PDF داخل الصفحة</p>
                <a href={url} target="_blank" rel="noreferrer">فتح PDF في تبويب جديد</a>
            </div>
        )
    }

    if (!pdfSource) {
        return <div className="exam-annotator-loading">جاري تحميل الملف...</div>
    }

    return (
        <Document
            file={pdfSource}
            loading={<div className="exam-annotator-loading">جاري عرض PDF...</div>}
            error={
                <div className="exam-annotator-fallback">
                    <p>تعذر عرض PDF</p>
                    <a href={url} target="_blank" rel="noreferrer">فتح خارجياً</a>
                </div>
            }
            onLoadSuccess={({ numPages }) => onNumPages?.(numPages)}
            onLoadError={() => setLoadError(true)}
        >
            <Page
                pageNumber={pageNumber}
                width={Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 900, 900) * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={onRenderSuccess}
            />
        </Document>
    )
}

export const ExamPaperAnnotator = ({
    pages = [],
    gradingData = {},
    onChange,
    readOnly = false,
    onPageRefsReady,
    authToken = null,
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [activeTool, setActiveTool] = useState(() => (
        typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
            ? TOOLS.pan
            : TOOLS.pen
    ))
    const [activeColor, setActiveColor] = useState(COLORS[0])
    const [scale, setScale] = useState(1)
    const [currentPage, setCurrentPage] = useState(0)
    const [pdfSubPage, setPdfSubPage] = useState(1)
    const [pdfNumPages, setPdfNumPages] = useState(1)
    const [localPages, setLocalPages] = useState(() => normalizePages(gradingData))
    const [textPrompt, setTextPrompt] = useState(null)
    const [fullscreen, setFullscreen] = useState(false)
    const [imageBlobUrls, setImageBlobUrls] = useState({})

    const wrapRefs = useRef({})
    const canvasRefs = useRef({})
    const drawingRef = useRef(null)
    const stageRef = useRef(null)
    const pinchRef = useRef({ distance: 0, scale: 1 })
    const isPinchingRef = useRef(false)

    useEffect(() => {
        setLocalPages(normalizePages(gradingData))
    }, [gradingData])

    const activePage = pages[currentPage]
    const isPdf = activePage?.type === 'pdf'
    const pageKey = isPdf
        ? `${activePage.index}-p${pdfSubPage}`
        : String(activePage?.index ?? currentPage)
    const pageAnnotations = localPages[pageKey] || []

    useEffect(() => {
        setPdfSubPage(1)
        setPdfNumPages(1)
    }, [currentPage])

    useEffect(() => {
        pages.forEach((p) => {
            if (p.type !== 'image' || p.url.startsWith('data:')) return
            loadFileForViewer(p.url, authToken).then((loaded) => {
                if (!loaded?.url) return
                setImageBlobUrls((prev) => {
                    if (prev[p.index]) return prev
                    return { ...prev, [p.index]: loaded.url }
                })
            })
        })
    }, [pages, authToken])

    const emitChange = useCallback(
        (nextPages) => {
            setLocalPages(nextPages)
            onChange?.({ version: GRADING_DATA_VERSION, pages: nextPages })
        },
        [onChange],
    )

    const updatePageAnnotations = useCallback(
        (key, annotations) => {
            emitChange({ ...localPages, [key]: annotations })
        },
        [localPages, emitChange],
    )

    const syncCanvasSize = useCallback(() => {
        const wrap = wrapRefs.current[pageKey]
        const canvas = canvasRefs.current[pageKey]
        if (!wrap || !canvas) return
        const rect = wrap.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = Math.floor(rect.width)
            canvas.height = Math.floor(rect.height)
            redrawCanvas(canvas, pageAnnotations)
        }
    }, [pageKey, pageAnnotations])

    useEffect(() => {
        const t = setTimeout(syncCanvasSize, 80)
        return () => clearTimeout(t)
    }, [syncCanvasSize, currentPage, pdfSubPage, scale, fullscreen])

    useEffect(() => {
        const wrap = wrapRefs.current[pageKey]
        if (!wrap || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(() => syncCanvasSize())
        observer.observe(wrap)
        return () => observer.disconnect()
    }, [pageKey, syncCanvasSize])

    useEffect(() => {
        const stage = stageRef.current
        if (!stage || !isMobile) return undefined

        const touchDistance = (touches) => {
            const dx = touches[0].clientX - touches[1].clientX
            const dy = touches[0].clientY - touches[1].clientY
            return Math.hypot(dx, dy)
        }

        const onTouchStart = (e) => {
            if (e.touches.length === 2) {
                isPinchingRef.current = true
                pinchRef.current = {
                    distance: touchDistance(e.touches),
                    scale,
                }
            }
        }

        const onTouchMove = (e) => {
            if (e.touches.length !== 2 || !pinchRef.current.distance) return
            e.preventDefault()
            const ratio = touchDistance(e.touches) / pinchRef.current.distance
            const next = Math.min(3, Math.max(0.4, pinchRef.current.scale * ratio))
            setScale(next)
        }

        const onTouchEnd = (e) => {
            if (e.touches.length < 2) {
                isPinchingRef.current = false
                pinchRef.current = { distance: 0, scale: 1 }
            }
        }

        stage.addEventListener('touchstart', onTouchStart, { passive: true })
        stage.addEventListener('touchmove', onTouchMove, { passive: false })
        stage.addEventListener('touchend', onTouchEnd, { passive: true })
        stage.addEventListener('touchcancel', onTouchEnd, { passive: true })

        return () => {
            stage.removeEventListener('touchstart', onTouchStart)
            stage.removeEventListener('touchmove', onTouchMove)
            stage.removeEventListener('touchend', onTouchEnd)
            stage.removeEventListener('touchcancel', onTouchEnd)
        }
    }, [isMobile, scale])

    useEffect(() => {
        if (!onPageRefsReady) return
        const refs = pages.flatMap((p) => {
            if (p.type === 'pdf') {
                const count = pdfNumPages || 1
                return Array.from({ length: count }, (_, i) => {
                    const key = `${p.index}-p${i + 1}`
                    return {
                        wrap: wrapRefs.current[key],
                        canvas: canvasRefs.current[key],
                        type: 'pdf',
                    }
                })
            }
            const key = String(p.index)
            return [{
                wrap: wrapRefs.current[key],
                canvas: canvasRefs.current[key],
                type: p.type,
            }]
        })
        onPageRefsReady(refs.filter((r) => r.wrap))
    }, [pages, localPages, onPageRefsReady, pdfNumPages])

    const getCanvasPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect()
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
        return {
            x: clientX - rect.left,
            y: clientY - rect.top,
        }
    }

    const handlePointerDown = (e) => {
        if (readOnly || isPinchingRef.current || activeTool === TOOLS.pan) return
        e.preventDefault()
        const canvas = canvasRefs.current[pageKey]
        if (!canvas) return
        canvas.setPointerCapture?.(e.pointerId)
        const pos = getCanvasPos(e, canvas)

        if (activeTool === TOOLS.pen) {
            drawingRef.current = {
                type: 'pen',
                color: activeColor,
                width: isMobile ? 4 : 3,
                points: [[pos.x, pos.y]],
            }
        } else if (activeTool === TOOLS.check) {
            updatePageAnnotations(pageKey, [
                ...pageAnnotations,
                normalizeMarkForSave(
                    { id: Date.now(), type: 'check', x: pos.x, y: pos.y, size: isMobile ? 34 : 28, color: '#10b981' },
                    canvas.width,
                    canvas.height,
                ),
            ])
        } else if (activeTool === TOOLS.cross) {
            updatePageAnnotations(pageKey, [
                ...pageAnnotations,
                normalizeMarkForSave(
                    { id: Date.now(), type: 'cross', x: pos.x, y: pos.y, size: isMobile ? 34 : 28, color: '#ef4444' },
                    canvas.width,
                    canvas.height,
                ),
            ])
        } else if (activeTool === TOOLS.text) {
            setTextPrompt({ x: pos.x, y: pos.y })
        } else if (activeTool === TOOLS.eraser) {
            const hit = hitTestAnnotation(pageAnnotations, pos.x, pos.y, canvas.width, canvas.height)
            if (hit) updatePageAnnotations(pageKey, pageAnnotations.filter((a) => a !== hit))
        }
    }

    const handlePointerMove = (e) => {
        if (readOnly || !drawingRef.current) return
        e.preventDefault()
        const canvas = canvasRefs.current[pageKey]
        if (!canvas) return
        const pos = getCanvasPos(e, canvas)
        drawingRef.current.points.push([pos.x, pos.y])
        const ctx = canvas.getContext('2d')
        const pts = drawingRef.current.points
        if (pts.length >= 2) {
            const [px, py] = pts[pts.length - 2]
            ctx.strokeStyle = drawingRef.current.color
            ctx.lineWidth = drawingRef.current.width
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(px, py)
            ctx.lineTo(pos.x, pos.y)
            ctx.stroke()
        }
    }

    const handlePointerUp = (e) => {
        const canvas = canvasRefs.current[pageKey]
        if (!drawingRef.current || !canvas) return
        e?.preventDefault?.()
        canvas.releasePointerCapture?.(e?.pointerId)
        const stroke = normalizeStrokeForSave(
            { ...drawingRef.current, id: Date.now() },
            canvas.width,
            canvas.height,
        )
        drawingRef.current = null
        updatePageAnnotations(pageKey, [...pageAnnotations, stroke])
    }

    const undoLast = () => {
        if (!pageAnnotations.length) return
        updatePageAnnotations(pageKey, pageAnnotations.slice(0, -1))
    }

    const clearPage = () => {
        if (!window.confirm('مسح كل التعليقات على هذه الصفحة؟')) return
        updatePageAnnotations(pageKey, [])
    }

    const submitText = () => {
        const canvas = canvasRefs.current[pageKey]
        if (!canvas || !textPrompt?.value?.trim()) {
            setTextPrompt(null)
            return
        }
        const ann = normalizeMarkForSave({
            id: Date.now(),
            type: 'text',
            x: textPrompt.x,
            y: textPrompt.y,
            text: textPrompt.value.trim(),
            color: activeColor,
            fontSize: isMobile ? 20 : 18,
        }, canvas.width, canvas.height)
        updatePageAnnotations(pageKey, [...pageAnnotations, ann])
        setTextPrompt(null)
    }

    const renderPageContent = (page) => {
        if (page.type === 'pdf') {
            return (
                <PdfPageView
                    url={page.url}
                    pageNumber={pdfSubPage}
                    scale={scale}
                    token={authToken}
                    onNumPages={setPdfNumPages}
                    onRenderSuccess={syncCanvasSize}
                />
            )
        }
        if (page.type === 'image') {
            const src = imageBlobUrls[page.index] || page.url
            return (
                <img
                    src={src}
                    alt={page.label}
                    draggable={false}
                    className="exam-annotator-image"
                    style={{ width: `${scale * 100}%`, maxWidth: 'none' }}
                    onLoad={syncCanvasSize}
                />
            )
        }
        return (
            <div className="exam-annotator-fallback">
                <a href={page.url} target="_blank" rel="noreferrer">فتح الملف في تبويب جديد</a>
            </div>
        )
    }

    const showPager = pages.length > 1 || (isPdf && pdfNumPages > 1)
    const toolLabels = {
        [TOOLS.pan]: 'تحريك',
        [TOOLS.pen]: 'قلم',
        [TOOLS.text]: 'نص',
        [TOOLS.check]: 'صح',
        [TOOLS.cross]: 'خطأ',
        [TOOLS.eraser]: 'محو',
    }
    const isPanMode = activeTool === TOOLS.pan
    const activeToolLabel = toolLabels[activeTool] || 'أدوات'

    const toolButtons = !readOnly && (
        <div className="exam-annotator-tools">
            {[
                [TOOLS.pan, HiOutlineHandRaised, 'تحريك'],
                [TOOLS.pen, HiOutlinePencil, 'قلم'],
                [TOOLS.text, HiOutlineChatBubbleBottomCenterText, 'نص'],
                [TOOLS.check, HiOutlineCheck, 'صح'],
                [TOOLS.cross, HiOutlineXMark, 'خطأ'],
                [TOOLS.eraser, HiOutlineTrash, 'محو'],
            ].map(([tool, Icon, label]) => (
                <button
                    key={tool}
                    type="button"
                    className={activeTool === tool ? 'active' : ''}
                    onClick={() => setActiveTool(tool)}
                    title={label}
                >
                    <Icon size={isMobile ? 22 : 18} />
                    {!isMobile && <span>{label}</span>}
                </button>
            ))}
        </div>
    )

    const colorButtons = !readOnly && (
        <div className="exam-annotator-colors">
            {COLORS.map((c) => (
                <button
                    key={c}
                    type="button"
                    className={activeColor === c ? 'active' : ''}
                    style={{ background: c }}
                    onClick={() => setActiveColor(c)}
                    aria-label="لون"
                />
            ))}
        </div>
    )

    const zoomControls = (
        <div className="exam-annotator-zoom-row">
            <button type="button" className="exam-annotator-zoom-btn" onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}>
                <HiOutlineMagnifyingGlassMinus size={20} />
            </button>
            <span className="exam-annotator-zoom">{Math.round(scale * 100)}%</span>
            <button type="button" className="exam-annotator-zoom-btn" onClick={() => setScale((s) => Math.min(3, s + 0.15))}>
                <HiOutlineMagnifyingGlassPlus size={20} />
            </button>
            <button type="button" className="exam-annotator-zoom-btn" onClick={() => setScale(1)} title="الحجم الأصلي">
                1:1
            </button>
            <button type="button" className="exam-annotator-zoom-btn" onClick={() => setFullscreen((f) => !f)} title="ملء الشاشة">
                <HiOutlineArrowsPointingOut size={20} />
            </button>
        </div>
    )

    const actionButtons = !readOnly && (
        <div className="exam-annotator-actions">
            <button type="button" onClick={undoLast} title="تراجع"><HiOutlineArrowUturnLeft size={18} /> تراجع</button>
            <button type="button" onClick={clearPage} title="مسح"><HiOutlineTrash size={18} /> مسح الصفحة</button>
        </div>
    )

    const pagerBlock = showPager && (
        <div className="exam-annotator-pager">
            {pages.length > 1 && pages.map((p, i) => (
                <button
                    key={p.index}
                    type="button"
                    className={currentPage === i ? 'active' : ''}
                    onClick={() => setCurrentPage(i)}
                >
                    {p.label || `ملف ${i + 1}`}
                </button>
            ))}
            {isPdf && pdfNumPages > 1 && (
                <div className="exam-annotator-pdf-nav">
                    <button
                        type="button"
                        disabled={pdfSubPage <= 1}
                        onClick={() => setPdfSubPage((p) => Math.max(1, p - 1))}
                    >
                        <HiOutlineChevronRight size={18} />
                    </button>
                    <span>صفحة {pdfSubPage} / {pdfNumPages}</span>
                    <button
                        type="button"
                        disabled={pdfSubPage >= pdfNumPages}
                        onClick={() => setPdfSubPage((p) => Math.min(pdfNumPages, p + 1))}
                    >
                        <HiOutlineChevronLeft size={18} />
                    </button>
                </div>
            )}
        </div>
    )

    if (!pages.length) {
        return <div className="exam-annotator-empty">لا توجد صفحات — تأكد من رفع الطالب ملف PDF أو صورة</div>
    }

    return (
        <div className={`exam-annotator ${fullscreen ? 'fullscreen' : ''} ${isMobile ? 'is-mobile' : ''}`}>
            <div className="exam-annotator-sticky-head">
                {isMobile ? (
                    <div className={`exam-annotator-mobile-panels ${readOnly ? 'readonly' : ''}`}>
                        {readOnly ? (
                            <div className="exam-annotator-locked-banner-mobile">
                                <HiOutlineCheck size={18} />
                                <span>الورقة مقفلة — للعرض فقط</span>
                            </div>
                        ) : (
                            <CollapsibleSection
                                className="collapsible-section--dark"
                                title="أدوات التصحيح"
                                subtitle={activeToolLabel}
                                badge={activeToolLabel}
                            >
                                {toolButtons}
                                {colorButtons}
                                {actionButtons}
                            </CollapsibleSection>
                        )}

                        <CollapsibleSection
                            className="collapsible-section--dark"
                            title="تكبير الورقة"
                            subtitle="قرّب بإصبعين أو استخدم الأزرار"
                            badge={`${Math.round(scale * 100)}%`}
                            defaultOpen
                        >
                            {zoomControls}
                        </CollapsibleSection>

                        {showPager && (
                            <CollapsibleSection
                                className="collapsible-section--dark"
                                title="التنقل بين الصفحات"
                                subtitle={
                                    isPdf && pdfNumPages > 1
                                        ? `${activePage?.label || 'ملف'} · ص ${pdfSubPage}/${pdfNumPages}`
                                        : (activePage?.label || `ملف ${currentPage + 1}`)
                                }
                            >
                                {pagerBlock}
                            </CollapsibleSection>
                        )}
                    </div>
                ) : (
                    <>
                        <div className={`exam-annotator-toolbar ${readOnly ? 'readonly' : ''}`}>
                            {readOnly ? (
                                <div className="exam-annotator-locked-label">
                                    <HiOutlineCheck size={18} />
                                    <span>الورقة مقفلة — للعرض فقط</span>
                                </div>
                            ) : (
                                <>
                                    {toolButtons}
                                    {colorButtons}
                                </>
                            )}
                            <div className="exam-annotator-actions exam-annotator-actions--desktop">
                                {!readOnly && (
                                    <>
                                        <button type="button" onClick={undoLast} title="تراجع"><HiOutlineArrowUturnLeft size={18} /></button>
                                        <button type="button" onClick={clearPage} title="مسح"><HiOutlineTrash size={18} /></button>
                                    </>
                                )}
                                <button type="button" onClick={() => setScale((s) => Math.max(0.4, s - 0.15))}><HiOutlineMagnifyingGlassMinus size={18} /></button>
                                <span className="exam-annotator-zoom">{Math.round(scale * 100)}%</span>
                                <button type="button" onClick={() => setScale((s) => Math.min(3, s + 0.15))}><HiOutlineMagnifyingGlassPlus size={18} /></button>
                                <button type="button" onClick={() => setFullscreen((f) => !f)} title="ملء الشاشة">
                                    <HiOutlineArrowsPointingOut size={18} />
                                </button>
                            </div>
                        </div>
                        {pagerBlock}
                    </>
                )}
            </div>

            <div className={`exam-annotator-stage ${isPanMode ? 'pan-active' : ''}`} ref={stageRef}>
                <div
                    className="exam-annotator-page-wrap"
                    ref={(el) => { wrapRefs.current[pageKey] = el }}
                >
                    {activePage && renderPageContent(activePage)}
                    <canvas
                        ref={(el) => { canvasRefs.current[pageKey] = el }}
                        className={`exam-annotator-canvas ${readOnly ? 'readonly' : ''} ${isPanMode ? 'pan-mode' : ''}`}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                    {textPrompt && !readOnly && (
                        <div
                            className="exam-annotator-text-popup"
                            style={{ left: textPrompt.x, top: textPrompt.y }}
                        >
                            <input
                                autoFocus
                                value={textPrompt.value || ''}
                                onChange={(e) => setTextPrompt({ ...textPrompt, value: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && submitText()}
                                placeholder="ملاحظة..."
                            />
                            <button type="button" onClick={submitText}>إضافة</button>
                            <button type="button" onClick={() => setTextPrompt(null)}>×</button>
                        </div>
                    )}
                </div>
            </div>

            {isMobile && (
                <p className="exam-annotator-hint">
                    {readOnly
                        ? 'اسحب الورقة للتنقل — قرّب بإصبعين للتكبير'
                        : isPanMode
                            ? 'وضع التحريك: اسحب وقرّب بدون رسم — اختر القلم للتصحيح'
                            : 'ارسم بإصبع واحد · قرّب بإصبعين · اختر «تحريك» للتنقل بدون رسم'}
                </p>
            )}
        </div>
    )
}
