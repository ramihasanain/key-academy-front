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
} from 'react-icons/hi2'

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`

const TOOLS = {
    pen: 'pen',
    text: 'text',
    check: 'check',
    cross: 'cross',
    eraser: 'eraser',
}

const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#0f172a']

function normalizePages(data) {
    if (!data || typeof data !== 'object') return {}
    if (data.pages && typeof data.pages === 'object') return data.pages
    return data
}

function drawAnnotation(ctx, ann, scale = 1) {
    if (!ann) return
    const s = scale
    if (ann.type === 'pen' && ann.points?.length > 1) {
        ctx.strokeStyle = ann.color || '#ef4444'
        ctx.lineWidth = (ann.width || 3) * s
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ann.points.forEach(([x, y], i) => {
            if (i === 0) ctx.moveTo(x * s, y * s)
            else ctx.lineTo(x * s, y * s)
        })
        ctx.stroke()
    }
    if (ann.type === 'text' && ann.text) {
        ctx.fillStyle = ann.color || '#ef4444'
        ctx.font = `bold ${(ann.fontSize || 18) * s}px Tajawal, Cairo, sans-serif`
        ctx.fillText(ann.text, ann.x * s, ann.y * s)
    }
    if (ann.type === 'check') {
        const size = (ann.size || 28) * s
        const x = ann.x * s
        const y = ann.y * s
        ctx.strokeStyle = ann.color || '#10b981'
        ctx.lineWidth = 4 * s
        ctx.beginPath()
        ctx.moveTo(x, y + size * 0.5)
        ctx.lineTo(x + size * 0.35, y + size)
        ctx.lineTo(x + size, y)
        ctx.stroke()
    }
    if (ann.type === 'cross') {
        const size = (ann.size || 28) * s
        const x = ann.x * s
        const y = ann.y * s
        ctx.strokeStyle = ann.color || '#ef4444'
        ctx.lineWidth = 4 * s
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + size, y + size)
        ctx.moveTo(x + size, y)
        ctx.lineTo(x, y + size)
        ctx.stroke()
    }
}

function redrawCanvas(canvas, annotations, scale) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ;(annotations || []).forEach((ann) => drawAnnotation(ctx, ann, scale))
}

export function exportAnnotatedPages(pageElements) {
    return Promise.all(
        pageElements.map(async ({ wrap, canvas, type }) => {
            const rect = wrap.getBoundingClientRect()
            const out = document.createElement('canvas')
            out.width = rect.width * 2
            out.height = rect.height * 2
            const ctx = out.getContext('2d')
            ctx.scale(2, 2)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, rect.width, rect.height)

            if (type === 'image') {
                const img = wrap.querySelector('img')
                if (img?.complete) {
                    ctx.drawImage(img, 0, 0, rect.width, rect.height)
                }
            } else if (type === 'pdf') {
                const pdfCanvas = wrap.querySelector('canvas')
                if (pdfCanvas) {
                    ctx.drawImage(pdfCanvas, 0, 0, rect.width, rect.height)
                }
            }

            if (canvas) {
                ctx.drawImage(canvas, 0, 0, rect.width, rect.height)
            }

            return new Promise((resolve) => {
                out.toBlob((blob) => resolve(blob), 'image/png', 0.92)
            })
        }),
    )
}

export const ExamPaperAnnotator = ({
    pages = [],
    gradingData = {},
    onChange,
    readOnly = false,
    onPageRefsReady,
}) {
    const [activeTool, setActiveTool] = useState(TOOLS.pen)
    const [activeColor, setActiveColor] = useState(COLORS[0])
    const [scale, setScale] = useState(1)
    const [currentPage, setCurrentPage] = useState(0)
    const [localPages, setLocalPages] = useState(() => normalizePages(gradingData))
    const [pdfPages, setPdfPages] = useState({})
    const [textPrompt, setTextPrompt] = useState(null)

    const wrapRefs = useRef({})
    const canvasRefs = useRef({})
    const drawingRef = useRef(null)

    useEffect(() => {
        setLocalPages(normalizePages(gradingData))
    }, [gradingData])

    const pageKey = String(pages[currentPage]?.index ?? currentPage)
    const pageAnnotations = localPages[pageKey] || []

    const emitChange = useCallback(
        (nextPages) => {
            setLocalPages(nextPages)
            onChange?.({ version: 1, pages: nextPages })
        },
        [onChange],
    )

    const updatePageAnnotations = useCallback(
        (key, annotations) => {
            const next = { ...localPages, [key]: annotations }
            emitChange(next)
        },
        [localPages, emitChange],
    )

    const syncCanvasSize = useCallback(() => {
        const wrap = wrapRefs.current[pageKey]
        const canvas = canvasRefs.current[pageKey]
        if (!wrap || !canvas) return
        const rect = wrap.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
            canvas.width = rect.width
            canvas.height = rect.height
            redrawCanvas(canvas, pageAnnotations, 1)
        }
    }, [pageKey, pageAnnotations])

    useEffect(() => {
        syncCanvasSize()
        const wrap = wrapRefs.current[pageKey]
        if (!wrap || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(syncCanvasSize)
        observer.observe(wrap)
        return () => observer.disconnect()
    }, [pageKey, pageAnnotations, syncCanvasSize, currentPage, scale])

    useEffect(() => {
        if (!onPageRefsReady) return
        const refs = pages.map((p) => {
            const key = String(p.index)
            return {
                wrap: wrapRefs.current[key],
                canvas: canvasRefs.current[key],
                type: p.type,
            }
        })
        onPageRefsReady(refs)
    }, [pages, localPages, onPageRefsReady])

    const getCanvasPos = (e, canvas) => {
        const rect = canvas.getBoundingClientRect()
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        }
    }

    const handlePointerDown = (e) => {
        if (readOnly) return
        const canvas = canvasRefs.current[pageKey]
        if (!canvas) return
        const pos = getCanvasPos(e, canvas)

        if (activeTool === TOOLS.pen) {
            drawingRef.current = {
                type: 'pen',
                color: activeColor,
                width: 3,
                points: [[pos.x, pos.y]],
            }
        } else if (activeTool === TOOLS.check) {
            const ann = { id: Date.now(), type: 'check', x: pos.x, y: pos.y, size: 28, color: '#10b981' }
            updatePageAnnotations(pageKey, [...pageAnnotations, ann])
        } else if (activeTool === TOOLS.cross) {
            const ann = { id: Date.now(), type: 'cross', x: pos.x, y: pos.y, size: 28, color: '#ef4444' }
            updatePageAnnotations(pageKey, [...pageAnnotations, ann])
        } else if (activeTool === TOOLS.text) {
            setTextPrompt({ x: pos.x, y: pos.y })
        } else if (activeTool === TOOLS.eraser) {
            const hit = pageAnnotations.findLast?.((ann) => {
                if (ann.type === 'text') {
                    return Math.abs(ann.x - pos.x) < 80 && Math.abs(ann.y - pos.y) < 20
                }
                if (ann.points?.length) {
                    const last = ann.points[ann.points.length - 1]
                    return Math.hypot(last[0] - pos.x, last[1] - pos.y) < 25
                }
                return Math.hypot((ann.x || 0) - pos.x, (ann.y || 0) - pos.y) < 30
            }) || pageAnnotations.slice().reverse().find((ann) => {
                if (ann.type === 'text') return Math.abs(ann.x - pos.x) < 80 && Math.abs(ann.y - pos.y) < 20
                if (ann.points?.length) {
                    const last = ann.points[ann.points.length - 1]
                    return Math.hypot(last[0] - pos.x, last[1] - pos.y) < 25
                }
                return Math.hypot((ann.x || 0) - pos.x, (ann.y || 0) - pos.y) < 30
            })
            if (hit) {
                updatePageAnnotations(pageKey, pageAnnotations.filter((a) => a !== hit))
            }
        }
    }

    const handlePointerMove = (e) => {
        if (readOnly || !drawingRef.current) return
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

    const handlePointerUp = () => {
        if (!drawingRef.current) return
        const stroke = { ...drawingRef.current, id: Date.now() }
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
        if (!textPrompt?.value?.trim()) {
            setTextPrompt(null)
            return
        }
        const ann = {
            id: Date.now(),
            type: 'text',
            x: textPrompt.x,
            y: textPrompt.y,
            text: textPrompt.value.trim(),
            color: activeColor,
            fontSize: 18,
        }
        updatePageAnnotations(pageKey, [...pageAnnotations, ann])
        setTextPrompt(null)
    }

    const renderPageContent = (page) => {
        const key = String(page.index)
        if (page.type === 'pdf') {
            const numPages = pdfPages[key] || 1
            return (
                <Document
                    file={page.url}
                    loading={<div className="exam-annotator-loading">جاري تحميل PDF...</div>}
                    onLoadSuccess={({ numPages: n }) => setPdfPages((p) => ({ ...p, [key]: n }))}
                >
                    <Page
                        pageNumber={1}
                        scale={scale}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                    />
                </Document>
            )
        }
        if (page.type === 'image') {
            return <img src={page.url} alt={page.label} draggable={false} style={{ width: '100%', display: 'block' }} />
        }
        return (
            <div className="exam-annotator-fallback">
                <a href={page.url} target="_blank" rel="noreferrer">فتح الملف في تبويب جديد</a>
            </div>
        )
    }

    if (!pages.length) {
        return <div className="exam-annotator-empty">لا توجد صفحات لعرضها</div>
    }

    const activePage = pages[currentPage]

    return (
        <div className="exam-annotator">
            {!readOnly && (
                <div className="exam-annotator-toolbar">
                    <div className="exam-annotator-tools">
                        {[
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
                                <Icon size={18} />
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                    <div className="exam-annotator-colors">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                className={activeColor === c ? 'active' : ''}
                                style={{ background: c }}
                                onClick={() => setActiveColor(c)}
                            />
                        ))}
                    </div>
                    <div className="exam-annotator-actions">
                        <button type="button" onClick={undoLast} title="تراجع"><HiOutlineArrowUturnLeft size={18} /></button>
                        <button type="button" onClick={clearPage} title="مسح الصفحة"><HiOutlineTrash size={18} /></button>
                        <button type="button" onClick={() => setScale((s) => Math.max(0.6, s - 0.15))}><HiOutlineMagnifyingGlassMinus size={18} /></button>
                        <span>{Math.round(scale * 100)}%</span>
                        <button type="button" onClick={() => setScale((s) => Math.min(2.2, s + 0.15))}><HiOutlineMagnifyingGlassPlus size={18} /></button>
                    </div>
                </div>
            )}

            {pages.length > 1 && (
                <div className="exam-annotator-pager">
                    {pages.map((p, i) => (
                        <button
                            key={p.index}
                            type="button"
                            className={currentPage === i ? 'active' : ''}
                            onClick={() => setCurrentPage(i)}
                        >
                            {p.label || `صفحة ${i + 1}`}
                        </button>
                    ))}
                </div>
            )}

            <div className="exam-annotator-stage">
                <div
                    className="exam-annotator-page-wrap"
                    ref={(el) => { wrapRefs.current[pageKey] = el }}
                >
                    {renderPageContent(activePage)}
                    <canvas
                        ref={(el) => { canvasRefs.current[pageKey] = el }}
                        className={`exam-annotator-canvas ${readOnly ? 'readonly' : ''}`}
                        width={900}
                        height={1200}
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                    {textPrompt && (
                        <div
                            className="exam-annotator-text-popup"
                            style={{ left: textPrompt.x, top: textPrompt.y }}
                        >
                            <input
                                autoFocus
                                value={textPrompt.value || ''}
                                onChange={(e) => setTextPrompt({ ...textPrompt, value: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && submitText()}
                                placeholder="اكتب ملاحظة..."
                            />
                            <button type="button" onClick={submitText}>إضافة</button>
                            <button type="button" onClick={() => setTextPrompt(null)}>إلغاء</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
