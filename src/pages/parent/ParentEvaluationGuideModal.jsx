import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
    HiOutlineXMark,
    HiOutlinePlayCircle,
    HiOutlineCpuChip,
    HiOutlineClipboardDocumentCheck,
    HiOutlineSparkles,
    HiOutlineInformationCircle,
} from 'react-icons/hi2'
import './ParentEvaluationGuideModal.css'

const PILLARS = [
    {
        icon: HiOutlinePlayCircle,
        color: 'blue',
        title: 'اختبارات التفاعل اللحظي (في قلب المحاضرة)',
        body: 'لضمان أعلى مستويات التركيز، قمنا بدمج أسئلة تفاعلية تظهر تلقائياً أثناء مشاهدة المحاضرات. مكونة من ثلاث اسئلة من شرح الاستاذ هذه الأسئلة مبنية على المعلومات التي تم طرحها للتو، ولا يمكن تخطيها، مما يضمن استيعاب الطالب للمحتوى في لحظته. يتم اعتماد النتيجة الأولى للطالب وتوثيقها مباشرةً في "سجل الأداء" الخاص به تحت بند (أسئلة الفيديو).',
    },
    {
        icon: HiOutlineCpuChip,
        color: 'green',
        title: 'تحليل الأداء بواسطة الذكاء الاصطناعي',
        body: 'بعد كل درس، يخضع الطالب لتقييم ذكي يحلل مستوى استيعابه بعمق. عبر خانة اختبار الذكاء الاصطناعي نزودكم بتقرير دقيق يوضح دقة الإجابات، عدد المحاولات، وأعلى درجة حققها الطالب، لنساعده على تطوير نقاط قوته ومعالجة جوانب الضعف بذكاء.',
    },
    {
        icon: HiOutlineClipboardDocumentCheck,
        color: 'amber',
        title: 'شفافية النتائج الدورية',
        body: 'نوفر لوحة تحكم تفاعلية تستعرض نتائج الامتحانات الأسبوعية فور صدورها، مع توضيح التصحيح النموذجي، ليكون ولي الأمر شريكاً حقيقياً في رحلة نجاح ابنه.',
    },
]

const ParentEvaluationGuideModal = ({ open, onClose }) => {
    useEffect(() => {
        if (!open) return undefined
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (e) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = prev
            window.removeEventListener('keydown', onKey)
        }
    }, [open, onClose])

    return createPortal(
        <AnimatePresence>
            {open && (
                <motion.div
                    className="parent-eval-guide-overlay"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="parent-eval-guide-title"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="parent-eval-guide-modal"
                        initial={{ opacity: 0, y: 32, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 24, scale: 0.97 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            className="parent-eval-guide-close"
                            onClick={onClose}
                            aria-label="إغلاق"
                        >
                            <HiOutlineXMark />
                        </button>

                        <div className="parent-eval-guide-hero">
                            <div className="parent-eval-guide-hero-icon">
                                <HiOutlineSparkles />
                            </div>
                            <h2 id="parent-eval-guide-title">
                                نظام التقييم الذكي في &quot;كي أكاديمي&quot;
                            </h2>
                            <p className="parent-eval-guide-subtitle">
                                معايير عالمية.. لمستقبل أكاديمي متميز
                            </p>
                        </div>

                        <div className="parent-eval-guide-body">
                            <p className="parent-eval-guide-intro">
                                في &quot;كي أكاديمي&quot;، نؤمن بأن قياس الأداء هو حجر الزاوية في العملية التعليمية.
                                لذا، اعتمدنا نظام تقييمٍ رقمي متكامل يمنح كلاً من الطالب وولي الأمر رؤيةً واضحةً
                                وشاملة عن التطور الدراسي، وذلك عبر أربع ركائز أساسية:
                            </p>

                            <div className="parent-eval-guide-pillars">
                                {PILLARS.map((pillar, i) => {
                                    const Icon = pillar.icon
                                    return (
                                        <article
                                            key={pillar.title}
                                            className={`parent-eval-pillar parent-eval-pillar--${pillar.color}`}
                                        >
                                            <div className="parent-eval-pillar-head">
                                                <span className="parent-eval-pillar-num">{i + 1}</span>
                                                <span className="parent-eval-pillar-icon">
                                                    <Icon />
                                                </span>
                                                <h3>{pillar.title}</h3>
                                            </div>
                                            <p>{pillar.body}</p>
                                        </article>
                                    )
                                })}
                            </div>

                            <div className="parent-eval-guide-why">
                                <h3>لماذا نعتمد هذا النظام؟</h3>
                                <p>
                                    لأننا في &quot;كي أكاديمي&quot; لا نكتفي بتقديم المعلومة، بل نضمن ترسيخها عبر
                                    تقييمٍ مستمر، شفاف، ومبني على أسس علمية دقيقة تضع الطالب على المسار الصحيح
                                    للتميز الدائم.
                                </p>
                            </div>
                        </div>

                        <div className="parent-eval-guide-footer">
                            <button type="button" className="parent-eval-guide-btn" onClick={onClose}>
                                فهمت، شكراً
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    )
}

export const ParentEvaluationGuideTrigger = ({ onClick }) => (
    <button
        type="button"
        className="parent-eval-guide-trigger"
        onClick={onClick}
        aria-label="تعرف على نظام التقييم الذكي"
        title="تعرف على نظام التقييم الذكي"
    >
        <HiOutlineInformationCircle />
    </button>
)

export default ParentEvaluationGuideModal
