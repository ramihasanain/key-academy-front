import React from 'react'
import { ExamPaperAnnotator } from './ExamPaperAnnotator'
import { hasGradingAnnotations } from './examAnnotatorUtils'
import '../../pages/ta/TAExamGrading.css'

/**
 * عرض الورقة المصححة للطالب — يدعم PDF/صور/ZIP متعدد + تعليقات المساعد.
 * الأولوية: تعليقات على أوراق الطالب → نسخة مصوّرة مرفوعة → رابط احتياطي.
 */
export const ExamCorrectedViewer = ({
    pages = [],
    correctedPages = [],
    gradingData = {},
    correctedUrl = null,
    authToken = null,
}) => {
    const hasAnnotations = hasGradingAnnotations(gradingData)

    if (pages?.length) {
        return (
            <ExamPaperAnnotator
                pages={pages}
                gradingData={hasAnnotations ? gradingData : {}}
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
