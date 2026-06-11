import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { HiOutlineClipboardDocumentCheck, HiOutlineAcademicCap } from 'react-icons/hi2'
import { API } from '../../config'
import { getParentSelectedStudent } from '../../components/ParentProtectedRoute'
import EmptyState from '../../components/core/EmptyState'
import './ParentWeeklyExams.css'

const ParentWeeklyExams = () => {
    const student = getParentSelectedStudent()
    const [loading, setLoading] = useState(true)
    const [courseExams, setCourseExams] = useState([])

    useEffect(() => {
        if (!student?.id) return

        const token = localStorage.getItem('access_token')
        const headers = { Authorization: `Bearer ${token}` }

        const load = async () => {
            setLoading(true)
            try {
                const res = await fetch(
                    `${API}/api/v1/parent/students/${student.id}/weekly-exams/`,
                    { headers },
                )
                const data = await res.json()
                setCourseExams(res.ok ? (data.courses || []) : [])
            } catch {
                setCourseExams([])
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [student?.id])

    if (!student) {
        return <EmptyState title="لم يتم اختيار طالب" message="ارجع واختر الطالب أولاً" />
    }

    const totalExams = courseExams.reduce((sum, c) => sum + c.exams.length, 0)
    const gradedExams = courseExams.reduce(
        (sum, c) => sum + c.exams.filter(e => e.is_graded).length,
        0,
    )

    return (
        <div className="parent-weekly-page">
            <div className="parent-weekly-header">
                <h2><HiOutlineClipboardDocumentCheck style={{ verticalAlign: 'middle', marginLeft: 8 }} />الامتحانات الأسبوعية</h2>
                <p>نتائج امتحانات {student.full_name || student.first_name} الأسبوعية</p>
            </div>

            {!loading && totalExams > 0 && (
                <div className="parent-weekly-stats">
                    <div className="parent-weekly-stat">
                        <span className="num">{totalExams}</span>
                        <span className="lbl">إجمالي الامتحانات</span>
                    </div>
                    <div className="parent-weekly-stat graded">
                        <span className="num">{gradedExams}</span>
                        <span className="lbl">مصحّحة</span>
                    </div>
                    <div className="parent-weekly-stat pending">
                        <span className="num">{totalExams - gradedExams}</span>
                        <span className="lbl">بانتظار التصحيح</span>
                    </div>
                </div>
            )}

            {loading ? (
                <EmptyState isLoading title="جاري تحميل الامتحانات..." message="" />
            ) : totalExams === 0 ? (
                <EmptyState
                    title="لا توجد امتحانات أسبوعية"
                    message="لم يُجرَ أي امتحان أسبوعي بعد في الدورات المسجّل بها."
                />
            ) : (
                <div className="parent-weekly-courses">
                    {courseExams.map((course) => (
                        course.exams.length > 0 && (
                            <motion.div
                                key={course.course_id}
                                className="parent-weekly-course-block"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="parent-weekly-course-head">
                                    {course.hero_image ? (
                                        <img src={course.hero_image} alt="" className="parent-weekly-thumb" />
                                    ) : (
                                        <div className="parent-weekly-thumb placeholder">
                                            <HiOutlineAcademicCap />
                                        </div>
                                    )}
                                    <div>
                                        <h3>{course.course_title}</h3>
                                        <span>{course.teacher_name}</span>
                                    </div>
                                </div>

                                <div className="parent-weekly-exam-list">
                                    {course.exams.map((exam) => (
                                        <div
                                            key={exam.exam_id}
                                            className={`parent-weekly-exam-row ${exam.is_graded ? 'graded' : 'pending'}`}
                                        >
                                            <div className="exam-info">
                                                <strong>{exam.module_title || exam.title || 'امتحان أسبوعي'}</strong>
                                                {exam.submitted_at && (
                                                    <span className="exam-date">
                                                        {new Date(exam.submitted_at).toLocaleDateString('ar-IQ')}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="exam-score">
                                                {exam.is_graded ? (
                                                    <>
                                                        <span className="score-value">{exam.grade}</span>
                                                        <span className="score-total">/ {exam.total_mark}</span>
                                                        {exam.total_mark > 0 && exam.grade != null && (
                                                            <span className="score-pct">
                                                                {Math.round((exam.grade / exam.total_mark) * 100)}%
                                                            </span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="pending-label">بانتظار التصحيح</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )
                    ))}
                </div>
            )}
        </div>
    )
}

export default ParentWeeklyExams
