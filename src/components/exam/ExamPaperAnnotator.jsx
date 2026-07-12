import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
    HiOutlineChevronDown,
    HiOutlineHandRaised,
    HiOutlineMapPin,
    HiOutlineEye,
    HiOutlineEyeSlash,
} from 'react-icons/hi2'
import {
    GRADING_DATA_VERSION,
    normalizePages,
    resolvePageAnnotations,
    redrawCanvas,
    normalizeStrokeForSave,
    normalizeMarkForSave,
    hitTestAnnotation,
    loadFileForViewer,
    rasterizePdfPage,
    exportAnnotatedPages,
} from './examAnnotatorUtils'

pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`

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

function PdfPageView({ url, pageNumber, scale, token, baseWidth, onNumPages, onRenderSuccess, onRenderSchedule }) {
    const [pdfSource, setPdfSource] = useState(null)
    const [loadError, setLoadError] = useState(false)
    const fallbackWidth = Math.min(typeof window !== 'undefined' ? window.innerWidth - 48 : 900, 900)
    const renderWidth = (baseWidth || fallbackWidth) * scale

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
                setPdfSource({ data: new Uint8Array(loaded.data) })
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
                width={renderWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={() => {
                    onRenderSuccess?.()
                    onRenderSchedule?.()
                }}
            />
        </Document>
    )
}

/** عرض PDF كصورة على الموبايل — نفس مسار الصور التي تعمل للطالب. */
function RasterPdfPageView({ url, pageNumber, scale, token, onNumPages, onRenderSuccess, onRenderSchedule }) {
    const [src, setSrc] = useState(null)
    const [loadError, setLoadError] = useState(false)
    const renderCbRef = useRef({ onNumPages, onRenderSuccess, onRenderSchedule })
    renderCbRef.current = { onNumPages, onRenderSuccess, onRenderSchedule }

    useEffect(() => {
        let cancelled = false
        setSrc(null)
        setLoadError(false)

        rasterizePdfPage({ url, token, pageNumber, scale })
            .then((result) => {
                if (cancelled) return
                renderCbRef.current.onNumPages?.(result.numPages)
                setSrc(result.dataUrl)
                renderCbRef.current.onRenderSuccess?.()
                renderCbRef.current.onRenderSchedule?.()
            })
            .catch(() => {
                if (!cancelled) setLoadError(true)
            })

        return () => { cancelled = true }
    }, [url, token, pageNumber, scale])

    if (loadError) {
        return (
            <div className="exam-annotator-fallback">
                <p>تعذر عرض PDF على الموبايل</p>
                <a href={url} target="_blank" rel="noreferrer">فتح الملف في تبويب جديد</a>
            </div>
        )
    }

    if (!src) {
        return <div className="exam-annotator-loading">جاري تحميل الورقة...</div>
    }

    return (
        <img
            src={src}
            alt="صفحة PDF"
            draggable={false}
            className="exam-annotator-image exam-annotator-image--raster"
            onLoad={() => {
                onRenderSuccess?.()
                onRenderSchedule?.()
            }}
        />
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
    // العرض الأساسي للورقة عند تكبير 100% — يُقاس من منطقة العرض ليبقى الكانفس مطابقاً للصورة عند أي تكبير
    const [baseWidth, setBaseWidth] = useState(0)
    const [imageBlobUrls, setImageBlobUrls] = useState({})
    // ── الدوك العائم على الموبايل: يظهر/يختفي بنعومة + إمكانية التثبيت ──
    const [dockVisible, setDockVisible] = useState(true)
    const [dockPinned, setDockPinned] = useState(false)
    const [dockCollapsed, setDockCollapsed] = useState(false) // إخفاء يدوي بزر التبديل
    const [colorsOpen, setColorsOpen] = useState(false)
    const [pagerOpen, setPagerOpen] = useState(false)

    const wrapRefs = useRef({})
    const canvasRefs = useRef({})
    const drawingRef = useRef(null)
    const stageRef = useRef(null)
    const pinchRef = useRef({ distance: 0, scale: 1 })
    const isPinchingRef = useRef(false)
    const dockHideTimerRef = useRef(null)

    const revealDock = useCallback(() => {
        if (dockHideTimerRef.current) {
            clearTimeout(dockHideTimerRef.current)
            dockHideTimerRef.current = null
        }
        setDockVisible(true)
    }, [])

    const hideDock = useCallback(() => {
        if (dockPinned) return
        setColorsOpen(false)
        setDockVisible(false)
    }, [dockPinned])

    const scheduleReveal = useCallback((delay = 320) => {
        if (dockHideTimerRef.current) clearTimeout(dockHideTimerRef.current)
        dockHideTimerRef.current = setTimeout(() => setDockVisible(true), delay)
    }, [])

    const toggleDockPinned = useCallback(() => {
        setDockPinned((prev) => {
            const next = !prev
            if (next) revealDock()
            return next
        })
    }, [revealDock])

    const toggleDockCollapsed = useCallback(() => {
        setColorsOpen(false)
        setPagerOpen(false)
        setDockCollapsed((prev) => {
            const next = !prev
            if (!next) revealDock()
            return next
        })
    }, [revealDock])

    useEffect(() => {
        setLocalPages(normalizePages(gradingData))
    }, [gradingData])

    const activePage = pages[currentPage]
    const isPdf = activePage?.type === 'pdf'
    const pageKey = isPdf
        ? `${activePage.index}-p${pdfSubPage}`
        : String(activePage?.index ?? currentPage)
    const pageAnnotations = useMemo(
        () => resolvePageAnnotations(localPages, pageKey, {
            fileIndex: activePage?.index,
            pdfSubPage,
            isPdf,
        }),
        [localPages, pageKey, activePage?.index, pdfSubPage, isPdf],
    )

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

    // قياس العرض المتاح لمنطقة العرض (بدون الحشوة) — الأساس الذي يُضرب بنسبة التكبير
    useEffect(() => {
        const stage = stageRef.current
        if (!stage) return undefined
        const measure = () => {
            const cs = window.getComputedStyle(stage)
            const padX = (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0)
            const avail = stage.clientWidth - padX
            if (avail > 0) setBaseWidth(Math.round(Math.min(avail, 900)))
        }
        measure()
        const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null
        ro?.observe(stage)
        window.addEventListener('resize', measure)
        return () => {
            ro?.disconnect()
            window.removeEventListener('resize', measure)
        }
    }, [fullscreen])

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

    const scheduleCanvasSync = useCallback(() => {
        const delays = [0, 80, 200, 500, 1000]
        const timers = delays.map((ms) => setTimeout(syncCanvasSize, ms))
        return () => timers.forEach(clearTimeout)
    }, [syncCanvasSize])

    useEffect(() => scheduleCanvasSync(), [scheduleCanvasSync, currentPage, pdfSubPage, scale, fullscreen, pageAnnotations])

    useEffect(() => {
        const wrap = wrapRefs.current[pageKey]
        if (!wrap || typeof ResizeObserver === 'undefined') return undefined
        const observer = new ResizeObserver(() => syncCanvasSize())
        observer.observe(wrap)
        const pdfCanvas = wrap.querySelector('.react-pdf__Page canvas')
        if (pdfCanvas) observer.observe(pdfCanvas)
        return () => observer.disconnect()
    }, [pageKey, syncCanvasSize, isPdf, pdfNumPages])

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

    // إخفاء الدوك أثناء سحب/تمرير الورقة، وإرجاعه بعد التوقف
    useEffect(() => {
        const stage = stageRef.current
        if (!stage || !isMobile) return undefined
        let idleTimer = null
        const onScroll = () => {
            if (!dockPinned) {
                setColorsOpen(false)
                setPagerOpen(false)
                setDockVisible(false)
            }
            if (idleTimer) clearTimeout(idleTimer)
            idleTimer = setTimeout(() => setDockVisible(true), 650)
        }
        stage.addEventListener('scroll', onScroll, { passive: true })
        return () => {
            stage.removeEventListener('scroll', onScroll)
            if (idleTimer) clearTimeout(idleTimer)
        }
    }, [isMobile, dockPinned])

    useEffect(() => () => {
        if (dockHideTimerRef.current) clearTimeout(dockHideTimerRef.current)
    }, [])

    // قائمة الملفات تنغلق بالضغط خارجها أو بـ Escape — لا تبقى مفتوحة فوق الورقة
    useEffect(() => {
        if (!pagerOpen) return undefined
        const onPointerDown = (e) => {
            const inside = e.target?.closest?.('.exam-annotator-files, .annotator-pagerdock')
            if (!inside) setPagerOpen(false)
        }
        const onKeyDown = (e) => {
            if (e.key === 'Escape') setPagerOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('keydown', onKeyDown)
        return () => {
            document.removeEventListener('pointerdown', onPointerDown)
            document.removeEventListener('keydown', onKeyDown)
        }
    }, [pagerOpen])

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
        // تحويل من بكسلات العرض إلى بكسلات الكانفس (مهم عند اختلاف الحجم بسبب التكبير/التقريب)
        const scaleX = rect.width ? canvas.width / rect.width : 1
        const scaleY = rect.height ? canvas.height / rect.height : 1
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY,
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
            if (isMobile) hideDock()
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
        if (isMobile && !dockPinned) scheduleReveal(280)
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

    const useRasterPdf = isMobile && readOnly

    const renderPageContent = (page) => {
        if (page.type === 'pdf') {
            if (useRasterPdf) {
                return (
                    <RasterPdfPageView
                        url={page.url}
                        pageNumber={pdfSubPage}
                        scale={scale}
                        token={authToken}
                        onNumPages={setPdfNumPages}
                        onRenderSuccess={syncCanvasSize}
                        onRenderSchedule={scheduleCanvasSync}
                    />
                )
            }
            return (
                <PdfPageView
                    url={page.url}
                    pageNumber={pdfSubPage}
                    scale={scale}
                    token={authToken}
                    baseWidth={baseWidth}
                    onNumPages={setPdfNumPages}
                    onRenderSuccess={syncCanvasSize}
                    onRenderSchedule={scheduleCanvasSync}
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
    const isPanMode = activeTool === TOOLS.pan

    const toolItems = [
        [TOOLS.pan, HiOutlineHandRaised, 'تحريك'],
        [TOOLS.pen, HiOutlinePencil, 'قلم'],
        [TOOLS.text, HiOutlineChatBubbleBottomCenterText, 'نص'],
        [TOOLS.check, HiOutlineCheck, 'صح'],
        [TOOLS.cross, HiOutlineXMark, 'خطأ'],
        [TOOLS.eraser, HiOutlineTrash, 'محو'],
    ]

    const toolButtons = !readOnly && (
        <div className="exam-annotator-tools">
            {toolItems.map(([tool, Icon, label]) => (
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

    const pagerBlock = showPager && (
        <div className="exam-annotator-pager">
            {pages.length > 1 && (
                <div className="exam-annotator-files">
                    <button
                        type="button"
                        className="exam-annotator-files-trigger"
                        onClick={() => setPagerOpen((o) => !o)}
                        aria-expanded={pagerOpen}
                        title={activePage?.label || `ملف ${currentPage + 1}`}
                    >
                        <span className="exam-annotator-files-count">{currentPage + 1} / {pages.length}</span>
                        <span className="exam-annotator-files-name">
                            {activePage?.label || `ملف ${currentPage + 1}`}
                        </span>
                        <HiOutlineChevronDown size={16} className={pagerOpen ? 'is-open' : ''} />
                    </button>
                    {pagerOpen && (
                        <div className="exam-annotator-files-menu">
                            {pages.map((p, i) => (
                                <button
                                    key={p.index}
                                    type="button"
                                    className={currentPage === i ? 'is-active' : ''}
                                    onClick={() => { setCurrentPage(i); setPagerOpen(false) }}
                                    title={p.label || `ملف ${i + 1}`}
                                >
                                    {p.label || `ملف ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
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

    const docksShown = dockVisible && !dockCollapsed

    const mobileFloating = isMobile && (
        <>
            <button
                type="button"
                className={`annotator-toggle-fab ${dockCollapsed ? 'is-collapsed' : ''}`}
                onClick={toggleDockCollapsed}
                aria-label={dockCollapsed ? 'إظهار القوائم' : 'إخفاء القوائم'}
                title={dockCollapsed ? 'إظهار القوائم' : 'إخفاء القوائم'}
            >
                {dockCollapsed ? <HiOutlineEye size={24} /> : <HiOutlineEyeSlash size={24} />}
            </button>

            {readOnly && (
                <div className={`annotator-locked-chip ${docksShown ? '' : 'is-hidden'}`}>
                    <HiOutlineCheck size={16} />
                    <span>مقفلة — عرض فقط</span>
                </div>
            )}

            {!readOnly && (
                <div className={`annotator-dock ${docksShown ? '' : 'annotator-dock--hidden'}`}>
                    <button
                        type="button"
                        className={`annotator-dock-btn pin ${dockPinned ? 'is-on' : ''}`}
                        onClick={toggleDockPinned}
                        aria-label={dockPinned ? 'إلغاء التثبيت' : 'تثبيت الأدوات'}
                        title={dockPinned ? 'الأدوات مثبتة' : 'تثبيت الأدوات'}
                    >
                        <HiOutlineMapPin size={20} />
                    </button>
                    <div className="annotator-dock-divider" />
                    {toolItems.map(([tool, Icon, label]) => (
                        <button
                            key={tool}
                            type="button"
                            className={`annotator-dock-btn ${activeTool === tool ? 'is-active' : ''}`}
                            onClick={() => { setActiveTool(tool); setColorsOpen(false) }}
                            aria-label={label}
                            title={label}
                        >
                            <Icon size={22} />
                        </button>
                    ))}
                    <div className="annotator-dock-divider" />
                    <button
                        type="button"
                        className={`annotator-dock-btn color ${colorsOpen ? 'is-active' : ''}`}
                        onClick={() => setColorsOpen((o) => !o)}
                        aria-label="اللون"
                        title="اللون"
                    >
                        <span className="annotator-dock-color-dot" style={{ background: activeColor }} />
                    </button>
                    <button type="button" className="annotator-dock-btn" onClick={undoLast} aria-label="تراجع" title="تراجع">
                        <HiOutlineArrowUturnLeft size={20} />
                    </button>
                    <button type="button" className="annotator-dock-btn" onClick={clearPage} aria-label="مسح الصفحة" title="مسح الصفحة">
                        <HiOutlineTrash size={20} />
                    </button>

                    {colorsOpen && (
                        <div className="annotator-dock-colors">
                            {COLORS.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    className={activeColor === c ? 'is-active' : ''}
                                    style={{ background: c }}
                                    onClick={() => { setActiveColor(c); setColorsOpen(false) }}
                                    aria-label="لون"
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className={`annotator-zoomdock ${docksShown ? '' : 'annotator-zoomdock--hidden'}`}>
                <button type="button" className="annotator-dock-btn" onClick={() => setScale((s) => Math.min(3, s + 0.15))} aria-label="تكبير">
                    <HiOutlineMagnifyingGlassPlus size={20} />
                </button>
                <span className="annotator-zoomdock-val">{Math.round(scale * 100)}%</span>
                <button type="button" className="annotator-dock-btn" onClick={() => setScale((s) => Math.max(0.4, s - 0.15))} aria-label="تصغير">
                    <HiOutlineMagnifyingGlassMinus size={20} />
                </button>
                <button type="button" className="annotator-dock-btn" onClick={() => setScale(1)} aria-label="الحجم الأصلي" title="الحجم الأصلي">
                    <span className="annotator-zoomdock-reset">1:1</span>
                </button>
                <button type="button" className="annotator-dock-btn" onClick={() => setFullscreen((f) => !f)} aria-label="ملء الشاشة">
                    <HiOutlineArrowsPointingOut size={20} />
                </button>
            </div>

            {showPager && (
                <div className={`annotator-pagerdock ${docksShown ? '' : 'annotator-pagerdock--hidden'}`}>
                    {isPdf && pdfNumPages > 1 && (
                        <div className="annotator-pagerdock-nav">
                            <button type="button" disabled={pdfSubPage <= 1} onClick={() => setPdfSubPage((p) => Math.max(1, p - 1))} aria-label="الصفحة السابقة">
                                <HiOutlineChevronRight size={18} />
                            </button>
                            <span>{pdfSubPage} / {pdfNumPages}</span>
                            <button type="button" disabled={pdfSubPage >= pdfNumPages} onClick={() => setPdfSubPage((p) => Math.min(pdfNumPages, p + 1))} aria-label="الصفحة التالية">
                                <HiOutlineChevronLeft size={18} />
                            </button>
                        </div>
                    )}
                    {pages.length > 1 && (
                        <button
                            type="button"
                            className="annotator-pagerdock-files"
                            onClick={() => setPagerOpen((o) => !o)}
                        >
                            {activePage?.label || `ملف ${currentPage + 1}`}
                            <HiOutlineChevronDown size={16} className={pagerOpen ? 'is-open' : ''} />
                        </button>
                    )}
                    {pagerOpen && pages.length > 1 && (
                        <div className="annotator-pagerdock-sheet">
                            {pages.map((p, i) => (
                                <button
                                    key={p.index}
                                    type="button"
                                    className={currentPage === i ? 'is-active' : ''}
                                    onClick={() => { setCurrentPage(i); setPagerOpen(false) }}
                                >
                                    {p.label || `ملف ${i + 1}`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </>
    )

    if (!pages.length) {
        return <div className="exam-annotator-empty">لا توجد صفحات — تأكد من رفع الطالب ملف PDF أو صورة</div>
    }

    return (
        <div className={`exam-annotator ${fullscreen ? 'fullscreen' : ''} ${isMobile ? 'is-mobile' : ''}`}>
            {!isMobile && (
                <div className="exam-annotator-sticky-head">
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
                </div>
            )}

            <div className={`exam-annotator-stage ${isPanMode ? 'pan-active' : ''}`} ref={stageRef}>
                <div
                    className="exam-annotator-page-wrap"
                    ref={(el) => { wrapRefs.current[pageKey] = el }}
                    style={baseWidth ? { width: `${baseWidth * scale}px`, maxWidth: 'none' } : undefined}
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

            {mobileFloating}
        </div>
    )
}
