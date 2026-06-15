import React, { useState, useEffect } from 'react'
import { useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineDocumentText,
    HiOutlineArrowDownTray,
    HiOutlinePencilSquare,
    HiOutlineClipboardDocumentCheck,
    HiOutlineCheckCircle,
    HiOutlineXCircle,
    HiOutlineExclamationTriangle,
} from 'react-icons/hi2'
import './TAExamGrading.css'

const STATUS_BADGE = {
    pending: { label: 'بانتظار التصحيح', bg: '#fef3c7', color: '#b45309' },
    in_review: { label: 'قيد التصحيح', bg: '#dbeafe', color: '#1d4ed8' },
    graded: { label: 'تم التصحيح', bg: '#d1fae5', color: '#047857' },
}

export const TAExams = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { activeGroupId } = useOutletContext() || {}
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedExam, setSelectedExam] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [notSubmittedStudents, setNotSubmittedStudents] = useState([])
    const [loadingSubs, setLoadingSubs] = useState(false)
    const [reopeningId, setReopeningId] = useState(null)
    const [activeStatList, setActiveStatList] = useState(null)
    const [markingAbsentId, setMarkingAbsentId] = useState(null)

    useEffect(() => {
        const fetchExams = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
            const groupQs = activeGroupId ? `?group_id=${activeGroupId}` : ''
            try {
                const res = await fetch(API + '/api/interactions/exams/ta-list/' + groupQs, {
                    headers: { 'Authorization': `Bearer ${tk}` },
                })
                if (res.ok) setExams(await res.json())
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchExams()
    }, [activeGroupId])

    const fetchSubmissions = async (examId) => {
        setLoadingSubs(true)
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        const groupQs = activeGroupId ? `?group_id=${activeGroupId}` : ''
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-submissions/${examId}/${groupQs}`, {
                headers: { 'Authorization': `Bearer ${tk}` },
            })
            if (res.ok) {
                const data = await res.json()
                setSubmissions(data.submissions)
                setNotSubmittedStudents(data.not_submitted_students || [])
                setSelectedExam(data.exam)
                setActiveStatList(null)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSubs(false)
        }
    }

    useEffect(() => {
        if (selectedExam?.id && location.pathname.endsWith('/ta/exams')) {
            fetchSubmissions(selectedExam.id)
        }
    }, [location.pathname])

    const reopenGrading = async (subId) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        setReopeningId(subId)
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-reopen-grading/${subId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tk}` },
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'تعذر إعادة فتح التصحيح')
                return
            }
            navigate(`/ta/exams/grade/${subId}`)
        } catch {
            alert('حدث خطأ')
        } finally {
            setReopeningId(null)
        }
    }

    const markAbsent = async (student) => {
        if (!window.confirm(`هل تريد تأكيد غياب "${student.student_name}" عن الامتحان؟\nسيتم تسجيل علامة 0 تلقائياً.`)) return
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        setMarkingAbsentId(student.student_id)
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-mark-absent/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ exam_id: selectedExam.id, student_id: student.student_id }),
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                alert(err.error || 'حدث خطأ')
                return
            }
            await fetchSubmissions(selectedExam.id)
        } catch {
            alert('حدث خطأ في الاتصال')
        } finally {
            setMarkingAbsentId(null)
        }
    }

    const isGraded = (sub) => sub.grading_status === 'graded' || sub.grade != null

    const statLists = {
        submitted: {
            title: 'الطلاب الذين سلّموا',
            names: submissions.map((s) => s.student_name).sort((a, b) => a.localeCompare(b, 'ar')),
        },
        not_submitted: {
            title: 'الطلاب الذين لم يسلّموا',
            names: notSubmittedStudents.map((s) => s.student_name),
        },
        graded: {
            title: 'الطلاب الذين تم تصحيحهم',
            names: submissions
                .filter((s) => s.grade != null)
                .map((s) => s.student_name)
                .sort((a, b) => a.localeCompare(b, 'ar')),
        },
    }

    const toggleStatList = (key) => {
        setActiveStatList((prev) => (prev === key ? null : key))
    }

    if (loading) return <div className="ta-loading">جاري جلب قائمة الامتحانات...</div>

    return (
        <div className="ta-exams-page">
            <div className="ta-exams-header">
                <h2><HiOutlineClipboardDocumentCheck /> الامتحانات الأسبوعية</h2>
                <p>اختر امتحاناً ← صحّح أونلاين من داخل الورقة ← أو من التطبيق — بعد الحفظ تظهر العلامة و«إعادة تصحيح»</p>
            </div>

            <div className="ta-exams-grid">
                {exams.map((exam) => (
                    <button
                        key={exam.id}
                        type="button"
                        className={`ta-exam-card ${selectedExam?.id === exam.id ? 'active' : ''}`}
                        onClick={() => fetchSubmissions(exam.id)}
                    >
                        <HiOutlineDocumentText size={28} />
                        <h4>{exam.title}</h4>
                        <span>{exam.module_str}</span>
                        <span>{exam.course_str}</span>
                        <strong>العلامة العظمى: {exam.total_mark}</strong>
                    </button>
                ))}
                {exams.length === 0 && <p>لا يوجد امتحانات متاحة.</p>}
            </div>

            {loadingSubs && <div className="ta-exams-loading">جاري تحميل أوراق الطلاب...</div>}

            {selectedExam && !loadingSubs && (
                <div className="ta-exams-detail">
                    <h3>تفاصيل التسليم — {selectedExam.title}</h3>

                    <div className="ta-exams-stats">
                        <div className="stat blue"><b>{selectedExam.total_students || 0}</b><span>إجمالي الطلاب</span></div>
                        <button
                            type="button"
                            className={`stat green clickable ${activeStatList === 'submitted' ? 'active' : ''}`}
                            onClick={() => toggleStatList('submitted')}
                        >
                            <b>{submissions.length}</b>
                            <span>تم التسليم</span>
                        </button>
                        <button
                            type="button"
                            className={`stat red clickable ${activeStatList === 'not_submitted' ? 'active' : ''}`}
                            onClick={() => toggleStatList('not_submitted')}
                        >
                            <b>{notSubmittedStudents.length}</b>
                            <span>لم يسلم</span>
                        </button>
                        <button
                            type="button"
                            className={`stat yellow clickable ${activeStatList === 'graded' ? 'active' : ''}`}
                            onClick={() => toggleStatList('graded')}
                        >
                            <b>{submissions.filter((s) => s.grade != null).length}</b>
                            <span>تم التصحيح</span>
                        </button>
                    </div>

                    {activeStatList && (
                        <div className={`ta-exams-stat-list ta-exams-stat-list--${activeStatList}`}>
                            <div className="ta-exams-stat-list-head">
                                <strong>{statLists[activeStatList].title}</strong>
                                <span>{statLists[activeStatList].names.length} طالب</span>
                            </div>
                            {statLists[activeStatList].names.length === 0 ? (
                                <p className="ta-exams-stat-list-empty">لا يوجد طلاب في هذه القائمة.</p>
                            ) : (
                                <ul className="ta-exams-stat-list-names">
                                    {statLists[activeStatList].names.map((name, idx) => (
                                        <li key={`${activeStatList}-${name}-${idx}`}>{name}</li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {submissions.length === 0 && notSubmittedStudents.length === 0 ? (
                        <p className="ta-exams-empty">لا يوجد تسليمات بعد.</p>
                    ) : (
                        <div className="ta-submissions-list">
                            {submissions.map((sub) => {
                                const st = STATUS_BADGE[sub.grading_status] || STATUS_BADGE.pending
                                return (
                                    <div key={sub.id} className="ta-submission-card">
                                        <div className="ta-submission-top">
                                            <div>
                                                <h4>{sub.student_name}</h4>
                                                <p>{new Date(sub.submitted_at).toLocaleString('ar-EG')}</p>
                                            </div>
                                            <span className="ta-submission-status" style={{ background: st.bg, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </div>

                                        {isGraded(sub) ? (
                                            sub.is_absent ? (
                                                <div className="ta-grade-absent-panel">
                                                    <HiOutlineXCircle size={36} />
                                                    <span className="ta-grade-absent-label">متغيب عن الامتحان</span>
                                                    <span className="ta-grade-absent-score">العلامة: 0 / {selectedExam.total_mark}</span>
                                                </div>
                                            ) : (
                                            <div className="ta-grade-done-panel">
                                                <div className="ta-grade-done-main">
                                                    <HiOutlineCheckCircle size={28} />
                                                    <div>
                                                        <strong>تم التصحيح</strong>
                                                        <span className="ta-grade-done-score">
                                                            العلامة: <b>{sub.grade}</b> / {selectedExam.total_mark}
                                                        </span>
                                                        {sub.feedback_note && (
                                                            <span className="ta-grade-done-note">{sub.feedback_note}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="ta-grade-done-actions">
                                                    <button
                                                        type="button"
                                                        className="ta-regrade-btn"
                                                        onClick={() => reopenGrading(sub.id)}
                                                        disabled={reopeningId === sub.id}
                                                    >
                                                        <HiOutlinePencilSquare size={18} />
                                                        {reopeningId === sub.id ? 'جاري الفتح...' : 'إعادة تصحيح'}
                                                    </button>
                                                    {sub.file_url && (
                                                        <a href={sub.file_url} target="_blank" rel="noreferrer" className="ta-download-btn">
                                                            <HiOutlineArrowDownTray size={16} /> تحميل
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            )
                                        ) : (
                                            <button
                                                type="button"
                                                className="ta-grade-online-btn"
                                                onClick={() => navigate(`/ta/exams/grade/${sub.id}`)}
                                            >
                                                <HiOutlinePencilSquare size={24} />
                                                تصحيح الورقة أونلاين
                                                <small>افتح PDF أو الصورة وارسم التعليقات مباشرة</small>
                                            </button>
                                        )}
                                    </div>
                                )
                            })}

                            {notSubmittedStudents.map((student) => (
                                <div key={`absent-${student.student_id}`} className="ta-submission-card ta-submission-card--absent">
                                    <div className="ta-submission-top">
                                        <div>
                                            <h4>{student.student_name}</h4>
                                            <p className="ta-absent-hint">لم يرفع ورقة الامتحان</p>
                                        </div>
                                        <span className="ta-submission-status ta-submission-status--absent">
                                            <HiOutlineXCircle size={14} style={{ verticalAlign: 'middle', marginLeft: 4 }} />
                                            لم يسلّم
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="ta-absent-btn"
                                        onClick={() => markAbsent(student)}
                                        disabled={markingAbsentId === student.student_id}
                                    >
                                        <HiOutlineExclamationTriangle size={18} />
                                        {markingAbsentId === student.student_id ? 'جاري التسجيل...' : 'تأكيد التغيب — علامة 0'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
