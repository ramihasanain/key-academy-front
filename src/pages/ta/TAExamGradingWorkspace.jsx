import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { API } from '../../config'
import { ExamPaperAnnotator, exportAnnotatedPages } from '../../components/exam/ExamPaperAnnotator'
import {
    HiOutlineArrowRight,
    HiOutlineDocumentText,
    HiOutlineCheckCircle,
    HiOutlineCloudArrowUp,
} from 'react-icons/hi2'
import './TAExamGrading.css'

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
    const [workspace, setWorkspace] = useState(null)
    const [loading, setLoading] = useState(true)
    const [grade, setGrade] = useState('')
    const [note, setNote] = useState('')
    const [gradingData, setGradingData] = useState({ version: 1, pages: {} })
    const [saving, setSaving] = useState(false)
    const [savingAnnotations, setSavingAnnotations] = useState(false)
    const [message, setMessage] = useState('')
    const pageRefsRef = useRef([])
    const saveTimerRef = useRef(null)

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
        setGradingData(data)
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
        saveTimerRef.current = setTimeout(() => saveAnnotations(data), 1200)
    }

    const uploadCorrectedBlob = async (blob) => {
        const fd = new FormData()
        fd.append('file', blob, `corrected_${submissionId}.png`)
        await fetch(`${API}/api/interactions/exams/ta-upload-corrected/${submissionId}/`, {
            method: 'POST',
            headers: authHeaders(),
            body: fd,
        })
    }

    const exportAndUploadCorrected = async () => {
        const refs = pageRefsRef.current.filter((r) => r?.wrap)
        if (!refs.length) return
        const blobs = await exportAnnotatedPages(refs)
        if (blobs.length === 1 && blobs[0]) {
            await uploadCorrectedBlob(blobs[0])
            return
        }
        if (blobs.length > 1) {
            await uploadCorrectedBlob(blobs[0])
        }
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

            const refs = pageRefsRef.current.filter((r) => r?.wrap)
            const hasAnnotations = Object.values(gradingData.pages || {}).some((arr) => arr?.length)
            if (hasAnnotations && refs.length) {
                await exportAndUploadCorrected()
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
                <button type="button" className="exam-grading-back" onClick={() => navigate('/ta/exams')}>العودة</button>
            </div>
        )
    }

    const { submission, exam, pages } = workspace
    const statusClass = submission.grading_status || 'pending'

    return (
        <div className="exam-grading-page">
            <div className="exam-grading-header">
                <div>
                    <button type="button" className="exam-grading-back" onClick={() => navigate('/ta/exams')}>
                        <HiOutlineArrowRight size={18} /> العودة للامتحانات
                    </button>
                    <h1 style={{ marginTop: '14px' }}>تصحيح أونلاين — {submission.student_name}</h1>
                    <p>{exam.title} · {exam.module_title}</p>
                </div>
                <span className={`exam-grade-status ${statusClass}`}>
                    {STATUS_LABELS[statusClass] || statusClass}
                    {savingAnnotations && ' · جاري الحفظ...'}
                </span>
            </div>

            <div className="exam-grading-layout">
                <div className="exam-grading-main">
                    <ExamPaperAnnotator
                        pages={pages}
                        gradingData={gradingData}
                        onChange={handleGradingChange}
                        onPageRefsReady={(refs) => { pageRefsRef.current = refs }}
                    />
                </div>

                <aside className="exam-grading-sidebar">
                    <h3>لوحة التصحيح</h3>

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
                        />
                    </div>

                    {message && (
                        <p style={{
                            fontSize: '0.88rem',
                            color: message.includes('نجاح') ? '#059669' : '#dc2626',
                            marginBottom: '10px',
                            fontWeight: 700,
                        }}>
                            {message}
                        </p>
                    )}

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
                </aside>
            </div>
        </div>
    )
}
