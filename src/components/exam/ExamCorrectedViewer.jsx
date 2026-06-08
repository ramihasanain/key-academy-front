import React from 'react'
import { ExamPaperAnnotator } from './ExamPaperAnnotator'
import '../../pages/ta/TAExamGrading.css'

/**
 * عرض الورقة المصححة للطالب — يدعم PDF/صور/ZIP متعدد + تعليقات المساعد.
 * الأولوية: submission_pages + grading_data → corrected_pages → رابط احتياطي.
 */
export const ExamCorrectedViewer = ({
    pages = [],
    correctedPages = [],
    gradingData = {},
    correctedUrl = null,
    authToken = null,
}) => {
    if (pages?.length) {
        return (
            <ExamPaperAnnotator
                pages={pages}
                gradingData={gradingData || {}}
                readOnly
                authToken={authToken}
            />
        )
    }

    if (correctedPages?.length) {
        return (
            <ExamPaperAnnotator
                pages={correctedPages}
                readOnly
                authToken={authToken}
            />
        )
    }

    if (correctedUrl) {
        return (
            <div className="exam-corrected-viewer">
                <a
                    href={correctedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="exam-student-file-link"
                >
                    عرض الورقة المصححة
                </a>
            </div>
        )
    }

    return <p className="exam-student-empty">لا تتوفر ورقة مصححة بعد.</p>
}

/**
 * عرض الإجابة النموذجية — داخل المتصفح مع دعم ملفات متعددة.
 */
export const ExamModelAnswerViewer = ({ pages = [], url = null, authToken = null }) => {
    if (pages?.length) {
        return (
            <ExamPaperAnnotator
                pages={pages}
                readOnly
                authToken={authToken}
            />
        )
    }

    if (url) {
        return (
            <a href={url} target="_blank" rel="noreferrer" className="exam-student-file-link">
                عرض الإجابة النموذجية
            </a>
        )
    }

    return null
}
