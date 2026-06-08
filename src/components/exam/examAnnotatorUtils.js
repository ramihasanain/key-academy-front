/**
 * أدوات التصحيح — إحداثيات نسبية (0–1) لتعمل على الويب والموبايل.
 */

import { ensureSecureUrl } from '../../config'

export const GRADING_DATA_VERSION = 2

export function normalizePages(data) {
    if (!data || typeof data !== 'object') return {}
    if (data.pages && typeof data.pages === 'object') return data.pages
    return data
}

export function isNormalizedAnnotation(ann) {
    if (!ann) return false
    if (ann.type === 'pen' && ann.points?.length) {
        return ann.points.every(([x, y]) => x <= 1.5 && y <= 1.5)
    }
    if (ann.x != null && ann.y != null) {
        return ann.x <= 1.5 && ann.y <= 1.5
    }
    return false
}

export function toRelativePoint(x, y, width, height) {
    if (!width || !height) return [x, y]
    return [x / width, y / height]
}

export function toAbsolutePoint(x, y, width, height, normalized) {
    if (normalized) return [x * width, y * height]
    return [x, y]
}

export function drawAnnotation(ctx, ann, width, height) {
    if (!ann || !width || !height) return
    const norm = isNormalizedAnnotation(ann)

    if (ann.type === 'pen' && ann.points?.length > 1) {
        ctx.strokeStyle = ann.color || '#ef4444'
        ctx.lineWidth = ann.width || 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.beginPath()
        ann.points.forEach(([x, y], i) => {
            const [ax, ay] = toAbsolutePoint(x, y, width, height, norm)
            if (i === 0) ctx.moveTo(ax, ay)
            else ctx.lineTo(ax, ay)
        })
        ctx.stroke()
    }

    if (ann.type === 'text' && ann.text) {
        const [ax, ay] = toAbsolutePoint(ann.x, ann.y, width, height, norm)
        ctx.fillStyle = ann.color || '#ef4444'
        ctx.font = `bold ${ann.fontSize || 18}px Tajawal, Cairo, sans-serif`
        ctx.fillText(ann.text, ax, ay)
    }

    if (ann.type === 'check' || ann.type === 'cross') {
        const [ax, ay] = toAbsolutePoint(ann.x, ann.y, width, height, norm)
        const size = ann.size || 28
        ctx.lineWidth = 4
        ctx.strokeStyle = ann.color || (ann.type === 'check' ? '#10b981' : '#ef4444')
        ctx.beginPath()
        if (ann.type === 'check') {
            ctx.moveTo(ax, ay + size * 0.5)
            ctx.lineTo(ax + size * 0.35, ay + size)
            ctx.lineTo(ax + size, ay)
        } else {
            ctx.moveTo(ax, ay)
            ctx.lineTo(ax + size, ay + size)
            ctx.moveTo(ax + size, ay)
            ctx.lineTo(ax, ay + size)
        }
        ctx.stroke()
    }
}

export function redrawCanvas(canvas, annotations) {
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ;(annotations || []).forEach((ann) => drawAnnotation(ctx, ann, canvas.width, canvas.height))
}

export function normalizeStrokeForSave(stroke, width, height) {
    if (stroke.type !== 'pen') return stroke
    return {
        ...stroke,
        points: stroke.points.map(([x, y]) => toRelativePoint(x, y, width, height)),
    }
}

export function normalizeMarkForSave(ann, width, height) {
    const [rx, ry] = toRelativePoint(ann.x, ann.y, width, height)
    return { ...ann, x: rx, y: ry }
}

export function hitTestAnnotation(annotations, x, y, width, height) {
    const list = [...annotations].reverse()
    for (const ann of list) {
        const norm = isNormalizedAnnotation(ann)
        if (ann.type === 'text') {
            const [ax, ay] = toAbsolutePoint(ann.x, ann.y, width, height, norm)
            if (Math.abs(ax - x) < 80 && Math.abs(ay - y) < 20) return ann
        }
        if (ann.type === 'pen' && ann.points?.length) {
            const near = ann.points.some(([px, py]) => {
                const [ax, ay] = toAbsolutePoint(px, py, width, height, norm)
                return Math.hypot(ax - x, ay - y) < 22
            })
            if (near) return ann
        }
        if (ann.x != null) {
            const [ax, ay] = toAbsolutePoint(ann.x, ann.y, width, height, norm)
            if (Math.hypot(ax - x, ay - y) < 32) return ann
        }
    }
    return null
}

export async function loadFileForViewer(url, token) {
    if (!url) return null
    if (url.startsWith('data:') || url.startsWith('blob:')) return { url }

    const fetchUrl = ensureSecureUrl(url)

    try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {}
        const res = await fetch(fetchUrl, { headers, credentials: 'include' })
        if (!res.ok) return null
        const blob = await res.blob()
        const blobUrl = URL.createObjectURL(blob)
        const buffer = await blob.arrayBuffer()
        return { url: blobUrl, data: buffer, mime: blob.type }
    } catch {
        return null
    }
}

/** @deprecated use loadFileForViewer */
export async function loadFileAsBlobUrl(url, token) {
    const loaded = await loadFileForViewer(url, token)
    return loaded?.url || url
}

export function exportAnnotatedPages(pageElements) {
    return Promise.all(
        pageElements.map(async ({ wrap, canvas, type }) => {
            if (!wrap) return null
            const rect = wrap.getBoundingClientRect()
            const out = document.createElement('canvas')
            out.width = Math.max(1, Math.floor(rect.width * 2))
            out.height = Math.max(1, Math.floor(rect.height * 2))
            const ctx = out.getContext('2d')
            ctx.scale(2, 2)
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, rect.width, rect.height)

            if (type === 'image') {
                const img = wrap.querySelector('img')
                if (img?.complete && img.naturalWidth) {
                    ctx.drawImage(img, 0, 0, rect.width, rect.height)
                }
            } else if (type === 'pdf') {
                const pdfCanvas = wrap.querySelector('.react-pdf__Page canvas')
                if (pdfCanvas) {
                    ctx.drawImage(pdfCanvas, 0, 0, rect.width, rect.height)
                }
            }

            if (canvas?.width) {
                ctx.drawImage(canvas, 0, 0, rect.width, rect.height)
            }

            return new Promise((resolve) => {
                out.toBlob((blob) => resolve(blob), 'image/png', 0.92)
            })
        }),
    )
}
