import React from 'react'
import { ExamPaperAnnotator } from './ExamPaperAnnotator'
import { hasGradingAnnotations } from './examAnnotatorUtils'
import '../../pages/ta/TAExamGrading.css'

function useMediaQuery(query) {
    const [matches, setMatches] = React.useState(() =>
        typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
    )
    React.useEffect(() => {
        const mq = window.matchMedia(query)
        const handler = () => setMatches(mq.matches)
        handler()
        mq.addEventListener('change', handler)
        return () => mq.removeEventListener('change', handler)
    }, [query])
    return matches
}

/**
 * عرض الورقة المصححة للطالب — يدعم PDF/صور/ZIP متعدد + تعليقات المساعد.
 */
export const ExamCorrectedViewer = ({
    pages = [],
    correctedPages = [],
    gradingData = {},
    correctedUrl = null,
    authToken = null,
}) => {
    const isMobile = useMediaQuery('(max-width: 768px)')
    const hasAnnotations = hasGradingAnnotations(gradingData)
    const hasBakedCorrected = correctedPages?.some((p) => p.type === 'image')

    // نسخة مصوّرة مرفوعة — احتياط للموبايل عند PDF أحادي الصفحة
    const isSinglePdfSubmission = pages.length === 1 && pages[0]?.type === 'pdf'
    if (isMobile && isSinglePdfSubmission && hasBakedCorrected && correctedPages.length === 1) {
        return (
            <ExamPaperAnnotator
                pages={correctedPages}
                readOnly
                authToken={authToken}
            />
        )
    }

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
