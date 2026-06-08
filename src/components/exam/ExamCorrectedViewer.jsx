import React, { useMemo } from 'react'
import { ExamPaperAnnotator } from './ExamPaperAnnotator'
import '../../pages/ta/TAExamGrading.css'

export const ExamCorrectedViewer = ({ pages = [], gradingData = {}, correctedUrl = null, authToken = null }) => {
    const hasAnnotations = useMemo(() => {
        const p = gradingData?.pages || gradingData || {}
        return Object.values(p).some((arr) => Array.isArray(arr) && arr.length > 0)
    }, [gradingData])

    if (pages.length && hasAnnotations) {
        return (
            <ExamPaperAnnotator
                pages={pages}
                gradingData={gradingData}
                readOnly
                authToken={authToken}
            />
        )
    }

    if (correctedUrl) {
        const isPdf = correctedUrl.toLowerCase().includes('.pdf')
        return (
            <div className="exam-corrected-viewer">
                {isPdf ? (
                    <iframe
                        title="الورقة المصححة"
                        src={correctedUrl}
                        style={{ width: '100%', minHeight: '600px', border: 'none', borderRadius: '12px' }}
                    />
                ) : (
                    <img
                        src={correctedUrl}
                        alt="الورقة المصححة"
                        style={{ width: '100%', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    />
                )}
            </div>
        )
    }

    return <p style={{ color: '#64748b', textAlign: 'center' }}>لا تتوفر ورقة مصححة بعد.</p>
}
