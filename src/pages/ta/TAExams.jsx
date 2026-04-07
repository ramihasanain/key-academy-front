import React, { useState, useEffect } from 'react'
import { API } from '../../config'
import { HiOutlineDocumentText, HiOutlineArrowDownTray, HiOutlineCheck, HiOutlinePencilSquare } from 'react-icons/hi2'
import './TA.css'

export const TAExams = () => {
    const [exams, setExams] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedExam, setSelectedExam] = useState(null)
    const [submissions, setSubmissions] = useState([])
    const [loadingSubs, setLoadingSubs] = useState(false)
    const [gradeInput, setGradeInput] = useState({})

    useEffect(() => {
        const fetchExams = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
            try {
                const res = await fetch(API + '/api/interactions/exams/ta-list/', {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setExams(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchExams()
    }, [])

    const fetchSubmissions = async (examId) => {
        setLoadingSubs(true)
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-submissions/${examId}/`, {
                headers: { 'Authorization': `Bearer ${tk}` }
            })
            if (res.ok) {
                const data = await res.json()
                setSubmissions(data.submissions)
                setSelectedExam(data.exam)
                const gInputs = {}
                data.submissions.forEach(s => {
                    gInputs[s.id] = { grade: s.grade || '', note: s.feedback_note || '' }
                })
                setGradeInput(gInputs)
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoadingSubs(false)
        }
    }

    const saveGrade = async (subId) => {
        const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/interactions/exams/ta-grade/${subId}/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tk}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gradeInput[subId])
            })
            if (res.ok) {
                alert('تم حفظ العلامة بنجاح')
            }
        } catch (err) {
            alert('حدث خطأ أثناء الحفظ')
        }
    }

    if (loading) return <div className="ta-loading">جاري جلب قائمة الامتحانات...</div>

    return (
        <div style={{ padding: '20px' }}>
            <h2 style={{ marginBottom: '20px', color: '#0f172a' }}>الامتحانات الأسبوعية - التصحيح والمتابعة</h2>

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {exams.map(exam => (
                    <div 
                        key={exam.id} 
                        style={{ background: 'white', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', minWidth: '300px', flex: '1', cursor: 'pointer', border: selectedExam?.id === exam.id ? '2px solid var(--purple)' : '2px solid transparent' }}
                        onClick={() => fetchSubmissions(exam.id)}
                    >
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}><HiOutlineDocumentText /> {exam.title}</h4>
                        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '10px' }}>الوحدة: {exam.module_str}</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>الدورة: {exam.course_str}</div>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', color: '#10b981', fontWeight: 'bold' }}>العلامة العظمى: {exam.total_mark}</div>
                    </div>
                ))}
                {exams.length === 0 && <p>لا يوجد امتحانات متاحة للوحدات.</p>}
            </div>

            {loadingSubs && <div style={{ marginTop: '40px', textAlign: 'center' }}>جاري تحميل أوراق الطلاب...</div>}

            {selectedExam && !loadingSubs && (
                <div style={{ marginTop: '40px', background: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <h3 style={{ marginBottom: '20px' }}>أوراق طلابك - {selectedExam.title}</h3>
                    
                    {submissions.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8fafc' }}>
                                    <th style={{ padding: '15px' }}>الطالب</th>
                                    <th style={{ padding: '15px' }}>تاريخ التسليم</th>
                                    <th style={{ padding: '15px' }}>ورقة الإجابة</th>
                                    <th style={{ padding: '15px', width: '300px' }}>التقييم والعلامة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {submissions.map(sub => (
                                    <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{sub.student_name}</td>
                                        <td style={{ padding: '15px', color: '#64748b', fontSize: '0.9rem' }}>{new Date(sub.submitted_at).toLocaleString('ar-EG')}</td>
                                        <td style={{ padding: '15px' }}>
                                            {sub.file_url ? (
                                                <a href={sub.file_url} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#e0f2fe', color: '#0284c7', padding: '6px 12px', borderRadius: '20px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    <HiOutlineArrowDownTray /> تحميل الورقة
                                                </a>
                                            ) : 'لا يوجد ملف'}
                                        </td>
                                        <td style={{ padding: '15px' }}>
                                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                <input 
                                                    type="number" 
                                                    placeholder="العلامة"
                                                    value={gradeInput[sub.id]?.grade || ''}
                                                    onChange={e => setGradeInput({...gradeInput, [sub.id]: {...gradeInput[sub.id], grade: e.target.value}})}
                                                    style={{ width: '80px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                />
                                                <span style={{ color: '#94a3b8' }}>/ {selectedExam.total_mark}</span>
                                                
                                                <input 
                                                    type="text" 
                                                    placeholder="ملاحظات (اختياري)"
                                                    value={gradeInput[sub.id]?.note || ''}
                                                    onChange={e => setGradeInput({...gradeInput, [sub.id]: {...gradeInput[sub.id], note: e.target.value}})}
                                                    style={{ flexGrow: 1, padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                                                />
                                                
                                                <button 
                                                    onClick={() => saveGrade(sub.id)}
                                                    style={{ background: '#10b981', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <HiOutlineCheck /> حفظ
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p style={{ textAlign: 'center', color: '#64748b' }}>لا يوجد أي تسليم من طلاب مجموعتك لهذا الامتحان بعد.</p>
                    )}
                </div>
            )}
        </div>
    )
}
