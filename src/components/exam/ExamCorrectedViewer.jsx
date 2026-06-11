import React from 'react'
import { ExamPaperAnnotator } from './ExamPaperAnnotator'
import { hasGradingAnnotations } from './examAnnotatorUtils'
import '../../pages/ta/TAExamGrading.css'

/**
 * عرض الورقة المصححة للطالب — يدعم PDF/صور/ZIP متعدد + تعليقات المساعد.
 * الأولوية: أوراق الطالب + grading_data → صور مصحّحة + grading_data → رابط احتياطي.
 */
export const ExamCorrectedViewer = ({
    pages = [],
    correctedPages = [],
    gradingData = {},
    correctedUrl = null,
    authToken = null,
}) => {
    const hasAnnotations = hasGradingAnnotations(gradingData)
    const overlayData = hasAnnotations ? gradingData : {}

    if (pages?.length) {
        return (
            <ExamPaperAnnotator
                pages={pages}
                gradingData={overlayData}
                readOnly
                authToken={authToken}
            />
        )
    }

  // صور من corrected_file — التصحيح مدمج في الصورة (لا نكرّر الـ overlay)
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
