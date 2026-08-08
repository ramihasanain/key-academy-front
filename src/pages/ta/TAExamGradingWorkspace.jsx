import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { API } from '../../config'
import { ExamPaperAnnotator, exportAnnotatedPages } from '../../components/exam/ExamPaperAnnotator'
import { exportPdfWithAnnotations, hasGradingAnnotations } from '../../components/exam/examAnnotatorUtils'
import { CollapsibleSection } from '../../components/CollapsibleSection'
import '../../components/CollapsibleSection.css'
import {
    HiOutlineArrowRight,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineCloudArrowUp,
    HiOutlineLockClosed,
    HiOutlinePencilSquare,
    HiOutlineXMark,
    HiOutlineClipboardDocumentCheck,
    HiOutlineChevronDown,
} from 'react-icons/hi2'
import './TAExamGrading.css'

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

const STATUS_LABELS = {
    pending: 'بانتظار التصحيح',
    in_review: 'قيد التصحيح',
    graded: 'تم التصحيح',
}

function authHeaders(json = false) {
    const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
    const headers = { Authorization: `Bearer ${tk}` }
    if (json) headers['Content-Type'] = 'application/json'
    return headers
}

export const TAExamGradingWorkspace = () => {
    const { submissionId } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    // نفس الواجهة تُستخدم للمساعد (/ta) وللأستاذ (/teacher) — مسار العودة يُشتق من العنوان
    const examsPath = location.pathname.startsWith('/teacher') ? '/teacher/exams' : '/ta/exams'
    const [workspace, setWorkspace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [grade, setGrade] = useState('')
    const [note, setNote] = useState('')
    const [gradingData, setGradingData] = useState({ version: 1, pages: {} })
    const [saving, setSaving] = useState(false)
    const [savingAnnotations, setSavingAnnotations] = useState(false)
    const [message, setMessage] = useState('')
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [headerOpen, setHeaderOpen] = useState(false)
    const isMobile = useMediaQuery('(max-width: 768px)')
    const [isReEditing, setIsReEditing] = useState(false)
    const [reopening, setReopening] = useState(false)
    const pageRefsRef = useRef([])
    const gradePanelRef = useRef(null)
    const saveTimerRef = useRef(null)
    const gradingDataRef = useRef(null)
    const authToken = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')

    useEffect(() => { gradingDataRef.current = gradingData }, [gradingData])

    const loadWorkspace = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-workspace/${submissionId}/`, {
                headers: authHeaders(),
            })
            if (!res.ok) throw new Error('فشل تحميل بيانات التصحيح')
            const data = await res.json()
            setWorkspace(data)
            setGrade(data.submission.grade ?? '')
            setNote(data.submission.feedback_note || '')
            setGradingData(data.grading_data?.pages ? data.grading_data : { version: 1, pages: data.grading_data || {} })
            if (data.submission?.grading_status !== 'graded') {
                setIsReEditing(false)
            }
        } catch (err) {
            setMessage(err.message || 'حدث خطأ')
        } finally {
            setLoading(false)
        }
    }, [submissionId])

    useEffect(() => {
        loadWorkspace()
    }, [loadWorkspace])

    const saveAnnotations = useCallback(async (data) => {
        setSavingAnnotations(true)
        try {
            await fetch(`${API}/api/interactions/exams/ta-grading-data/${submissionId}/`, {
                method: 'PUT',
                headers: authHeaders(true),
                body: JSON.stringify({ grading_data: data }),
            })
        } catch (err) {
            console.error(err)
        } finally {
            setSavingAnnotations(false)
        }
    }, [submissionId])

    const handleGradingChange = (data) => {
        if (workspace?.submission?.grading_status === 'graded' && !isReEditing) return
        setGradingData(data)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveAnnotations(data), 1200)
    }

    // تدوير صورة مقلوبة رفعها الطالب — السيرفر يعدّل الملف نفسه ويدوّر التعليقات معه
    const handleRotatePage = useCallback(async (page, direction) => {
        // نحفظ أي تعليقات معلّقة أولاً حتى يدوّرها السيرفر مع الصورة ولا تضيع
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        await saveAnnotations(gradingDataRef.current)

        const res = await fetch(`${API}/api/interactions/exams/ta-rotate-page/${submissionId}/`, {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify({ page_index: page.index, direction }),
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'فشل تدوير الصفحة')
        }
        const data = await res.json()
        setWorkspace((prev) => (prev ? { ...prev, pages: data.pages } : prev))
        const gd = data.grading_data || {}
        setGradingData(gd.pages ? gd : { version: 1, pages: gd })
    }, [submissionId, saveAnnotations])

    const reopenGrading = async () => {
        if (!window.confirm('إعادة فتح الورقة للتعديل؟')) return
        setReopening(true)
        setMessage('')
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-reopen-grading/${submissionId}/`, {
                method: 'POST',
                headers: authHeaders(),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error || 'تعذر إعادة فتح الورقة')
            }
            setIsReEditing(true)
            setWorkspace((prev) => prev ? {
                ...prev,
                submission: { ...prev.submission, grading_status: 'in_review' },
            } : prev)
            setMessage('تم فتح الورقة للتعديل')
        } catch (err) {
            setMessage(err.message || 'حدث خطأ')
        } finally {
            setReopening(false)
        }
    }

    const uploadCorrectedBlob = async (blob, filename = `corrected_${submissionId}.png`) => {
        const fd = new FormData()
        fd.append('file', blob, filename)
        const res = await fetch(`${API}/api/interactions/exams/ta-upload-corrected/${submissionId}/`, {
            method: 'POST',
            headers: authHeaders(),
            body: fd,
        })
        if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'فشل رفع الورقة المصححة')
        }
    }

    const exportAndUploadCorrected = async (pagesList, data) => {
        const pdfPage = pagesList?.find((p) => p.type === 'pdf')
        if (pdfPage) {
            const blobs = await exportPdfWithAnnotations({
                url: pdfPage.url,
                token: authToken,
                fileIndex: pdfPage.index,
                gradingData: data,
            })
            if (blobs[0]) {
                await uploadCorrectedBlob(blobs[0])
            }
            return
        }

        const refs = pageRefsRef.current.filter((r) => r?.wrap)
        if (!refs.length) return
        const blobs = await exportAnnotatedPages(refs)
        const first = blobs.find(Boolean)
        if (first) await uploadCorrectedBlob(first)
    }

    const saveGrade = async () => {
        if (grade === '' || grade === null) {
            setMessage('يرجى إدخال العلامة')
            return
        }
        const total = workspace?.exam?.total_mark || 100
        if (Number(grade) < 0 || Number(grade) > total) {
            setMessage(`العلامة يجب أن تكون بين 0 و ${total}`)
            return
        }

        setSaving(true)
        setMessage('')
        try {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
            await saveAnnotations(gradingData)

            if (hasGradingAnnotations(gradingData)) {
                await exportAndUploadCorrected(pages, gradingData)
            }

            const res = await fetch(`${API}/api/interactions/exams/ta-grade/${submissionId}/`, {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify({
                    grade: Number(grade),
                    feedback_note: note,
                    note,
                }),
            })
            if (!res.ok) throw new Error('فشل حفظ العلامة')
            setMessage('تم حفظ التصحيح والعلامة بنجاح')
            setIsReEditing(false)
            await loadWorkspace()
        } catch (err) {
            setMessage(err.message || 'حدث خطأ أثناء الحفظ')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="exam-grading-page"><div className="ta-loading">جاري تحميل واجهة التصحيح...</div></div>
    }

    if (!workspace) {
        return (
            <div className="exam-grading-page">
                <p style={{ color: '#ef4444' }}>{message || 'تعذر تحميل الورقة'}</p>
                <button type="button" className="exam-grading-back" onClick={() => navigate(examsPath)}>العودة</button>
            </div>
        )
    }

    const { submission, exam, pages } = workspace
    const statusClass = submission.grading_status || 'pending'
    const isLocked = submission.grading_status === 'graded' && !isReEditing

    const scrollToGradePanel = () => {
        gradePanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    const openGradePanel = () => {
        setSidebarOpen(true)
        requestAnimationFrame(() => scrollToGradePanel())
    }

    const fileLinks = (
        <div className="exam-grade-links">
            {exam.question_file_url && (
                <a href={exam.question_file_url} target="_blank" rel="noreferrer">
                    <HiOutlineDocumentText size={18} /> ورقة الأسئلة
                </a>
            )}
            {exam.model_answer_file_url && (
                <a href={exam.model_answer_file_url} target="_blank" rel="noreferrer">
                    <HiOutlineCheckCircle size={18} /> الإجابة النموذجية
                </a>
            )}
            {submission.file_url && (
                <a href={submission.file_url} target="_blank" rel="noreferrer">
                    <HiOutlineCloudArrowUp size={18} /> ملف الطالب الأصلي
                </a>
            )}
        </div>
    )

    const gradeFields = (
        <>
            <div className="exam-grade-field">
                <label>العلامة</label>
                <div className="exam-grade-row">
                    <input
                        type="number"
                        min="0"
                        max={exam.total_mark}
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        placeholder="0"
                        disabled={isLocked}
                        readOnly={isLocked}
                    />
                    <span>/ {exam.total_mark}</span>
                </div>
            </div>

            <div className="exam-grade-field">
                <label>ملاحظات للطالب</label>
                <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="اكتب ملاحظاتك وتوجيهاتك للطالب..."
                    disabled={isLocked}
                    readOnly={isLocked}
                />
            </div>
        </>
    )

    const saveActions = (
        <div className="exam-grade-actions">
            {isLocked ? (
                <button
                    type="button"
                    className="exam-grade-save reopen"
                    onClick={reopenGrading}
                    disabled={reopening}
                >
                    <HiOutlinePencilSquare size={20} style={{ verticalAlign: 'middle', marginLeft: 8 }} />
                    {reopening ? 'جاري الفتح...' : 'إعادة تصحيح'}
                </button>
            ) : (
                <>
                    <button
                        type="button"
                        className="exam-grade-save"
                        onClick={saveGrade}
                        disabled={saving}
                    >
                        {saving ? 'جاري الحفظ...' : 'حفظ التصحيح والعلامة'}
                    </button>

                    <button
                        type="button"
                        className="exam-grade-save secondary"
                        onClick={async () => {
                            setSavingAnnotations(true)
                            await saveAnnotations(gradingData)
                            setSavingAnnotations(false)
                            setMessage('تم حفظ التعليقات')
                        }}
                    >
                        حفظ التعليقات فقط
                    </button>
                </>
            )}
        </div>
    )

    const gradePanelBody = (
        <>
            <div className="exam-grade-sidebar-head">
                <h3>لوحة التصحيح</h3>
                <button
                    type="button"
                    className="exam-grade-sidebar-close"
                    onClick={() => setSidebarOpen(false)}
                    aria-label="إغلاق"
                >
                    <HiOutlineXMark size={22} />
                </button>
            </div>

            {isLocked && (
                <div className="exam-grade-locked-banner">
                    <HiOutlineLockClosed size={20} style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                    تم تصحيح هذه الورقة. للتعديل اضغط «إعادة تصحيح».
                </div>
            )}

            {isMobile ? (
                <div className="exam-grade-mobile-sections">
                    <CollapsibleSection title="الملفات والمراجع" subtitle="أسئلة · نموذج · ملف الطالب">
                        {fileLinks}
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="العلامة والملاحظات"
                        subtitle={grade !== '' && grade !== null ? `العلامة: ${grade}/${exam.total_mark}` : 'أدخل العلامة والملاحظات'}
                        badge={grade !== '' && grade !== null ? `${grade}/${exam.total_mark}` : null}
                        defaultOpen
                    >
                        {gradeFields}
                    </CollapsibleSection>

                    {message && (
                        <p className={`exam-grade-message ${message.includes('نجاح') || message.includes('فتح') ? 'success' : 'error'}`}>
                            {message}
                        </p>
                    )}

                    {saveActions}
                </div>
            ) : (
                <>
                    {fileLinks}
                    {gradeFields}
                    {message && (
                        <p className={`exam-grade-message ${message.includes('نجاح') || message.includes('فتح') ? 'success' : 'error'}`}>
                            {message}
                        </p>
                    )}
                    {saveActions}
                </>
            )}
        </>
    )

    return (
        <div className={`exam-grading-page exam-grading-page--annotator ${isMobile ? 'is-mobile' : ''}`}>
            <div className={`exam-grading-header ${headerOpen ? 'expanded' : 'collapsed'}`}>
                {isMobile ? (
                    <>
                        <button
                            type="button"
                            className="exam-grading-header-compact"
                            onClick={() => setHeaderOpen((o) => !o)}
                            aria-expanded={headerOpen}
                        >
                            <span className="exam-grading-header-compact-main">
                                <strong>{submission.student_name}</strong>
                                <span>{exam.title}</span>
                            </span>
                            <span className={`exam-grade-status ${statusClass}`}>
                                {STATUS_LABELS[statusClass] || statusClass}
                            </span>
                            <HiOutlineChevronDown className="exam-grading-header-chevron" />
                        </button>
                        {headerOpen && (
                            <div className="exam-grading-header-details">
                                <button type="button" className="exam-grading-back" onClick={() => navigate(examsPath)}>
                                    <HiOutlineArrowRight size={18} /> العودة للامتحانات
                                </button>
                                <p className="exam-grading-header-meta">{exam.module_title}</p>
                                {savingAnnotations && <p className="exam-grading-saving-hint">جاري حفظ التعليقات...</p>}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div>
                            <button type="button" className="exam-grading-back" onClick={() => navigate(examsPath)}>
                                <HiOutlineArrowRight size={18} /> العودة
                            </button>
                            <h1 style={{ marginTop: '14px' }}>تصحيح — {submission.student_name}</h1>
                            <p>{exam.title} · {exam.module_title}</p>
                        </div>
                        <div className="exam-grading-header-actions">
                            <span className={`exam-grade-status ${statusClass}`}>
                                {STATUS_LABELS[statusClass] || statusClass}
                                {savingAnnotations && ' · جاري الحفظ...'}
                            </span>
                            <button
                                type="button"
                                className="exam-grade-panel-toggle"
                                onClick={() => (sidebarOpen ? setSidebarOpen(false) : openGradePanel())}
                            >
                                {sidebarOpen ? 'إخفاء العلامة' : 'العلامة والحفظ'}
                            </button>
                        </div>
                    </>
                )}
            </div>

            {sidebarOpen && (
                <button
                    type="button"
                    className="exam-grade-backdrop"
                    aria-label="إغلاق لوحة التصحيح"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {!sidebarOpen && (
                <button
                    type="button"
                    className="exam-grade-mobile-fab"
                    onClick={openGradePanel}
                >
                    <HiOutlineClipboardDocumentCheck size={22} />
                    <span>لوحة التصحيح</span>
                    {grade !== '' && grade !== null && (
                        <strong className="exam-grade-mobile-fab-score">{grade}/{exam.total_mark}</strong>
                    )}
                </button>
            )}

            <div className="exam-grading-layout">
                <div className="exam-grading-main">
                    <ExamPaperAnnotator
                        pages={pages}
                        gradingData={gradingData}
                        onChange={handleGradingChange}
                        readOnly={isLocked}
                        onPageRefsReady={(refs) => { pageRefsRef.current = refs }}
                        authToken={authToken}
                        onRotatePage={handleRotatePage}
                    />
                </div>

                <aside
                    ref={gradePanelRef}
                    id="exam-grade-panel"
                    className={`exam-grading-sidebar ${sidebarOpen ? 'open' : ''}`}
                >
                    {gradePanelBody}
                </aside>
            </div>
        </div>
    )
}
