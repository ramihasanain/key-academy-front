import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlinePlus, HiOutlineTrash, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineDocumentText, HiOutlinePuzzlePiece, HiOutlineCog, HiOutlineVideoCamera, HiOutlinePaperClip, HiOutlineSparkles } from 'react-icons/hi2'
import './Admin.css'
import 'mathlive'

// ================== إصلاح فورمات الرياضيات (Bidi/RTL) ==================
// المشكلة: تعبير مثل "2√7" مخزَّن صح منطقياً، لكن خوارزمية Unicode Bidi
// تعكسه بصرياً داخل النص العربي (RTL) فيظهر "7√2". الحل: تغليف كل تعبير
// رياضي بمحارف العزل LTR (U+2066 … U+2069) فيُعرض من اليسار لليمين دائماً
// في المحرّر وشاشة الطالب معاً، دون تغيير المحتوى المنطقي.
const LRI = '\u2066' // LEFT-TO-RIGHT ISOLATE
const PDI = '\u2069' // POP DIRECTIONAL ISOLATE
// أي محارف عزل/علامات اتجاه سابقة (لجعل العملية قابلة للتكرار بدون تراكم)
const BIDI_MARKS_RE = /[\u2066\u2067\u2068\u2069\u200E\u200F؜]/g
// الرموز التي تُسبّب الانعكاس فعلياً (وجود أيٍّ منها يعني أن المقطع رياضي)
const MATH_OPS = '√∛∜^×÷/<>≤≥≠±∓∑∏∫'
// مقطع "قابل لأن يكون رياضياً": أرقام/حروف لاتينية/رموز رياضية — بدون حروف عربية
const MATH_RUN_RE = /[0-9A-Za-z٠-٩.,%°()\[\]{}\s√∛∜^\/×÷*+\-=<>≤≥≠±∓∑∏∫|]+/g

export const fixMathFormat = (input) => {
    if (!input || typeof input !== 'string') return input
    // 1) إزالة أي عزل/علامات سابقة حتى لا تتراكم عند إعادة التشغيل
    const clean = input.replace(BIDI_MARKS_RE, '')
    // 2) تغليف كل مقطع رياضي (يحتوي رمز عملية + مُعامل) بعزل LTR
    return clean.replace(MATH_RUN_RE, (m) => {
        const hasOp = [...MATH_OPS].some(c => m.includes(c))
        const hasOperand = /[0-9A-Za-z٠-٩]/.test(m)
        if (!hasOp || !hasOperand) return m // ليس تعبيراً رياضياً — اتركه كما هو
        const lead = m.match(/^\s*/)[0]
        const trail = m.match(/\s*$/)[0]
        const core = m.slice(lead.length, m.length - trail.length)
        return lead + LRI + core + PDI + trail
    })
}

// المادة رياضيات؟ (نص المادة يُحفظ عربياً حرّاً مثل "الرياضيات")
export const isMathSubject = (subject) => typeof subject === 'string' && /رياضيات|math/i.test(subject)
// =====================================================================

const MathInput = ({ value, onChange }) => {
    const mf = useRef(null);
    useEffect(() => {
        if (mf.current) {
            mf.current.value = value || '';
            const handleInput = (e) => onChange(e.target.value);
            mf.current.addEventListener('input', handleInput);
            return () => mf.current?.removeEventListener('input', handleInput);
        }
    }, [onChange]);
    useEffect(() => {
        if (mf.current && mf.current.value !== value) {
            mf.current.value = value || '';
        }
    }, [value]);
    return <math-field ref={mf} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid rgba(0,0,0,0.1)', fontSize: '1.5rem', background: '#f8fafc', minHeight: '60px', direction: 'ltr' }}></math-field>;
}

// --- Smart Visual Editor Components ---
const SmartImagePreview = ({ fileOrUrl }) => {
    if (!fileOrUrl) return null;
    const isFile = fileOrUrl instanceof File;
    const url = isFile ? URL.createObjectURL(fileOrUrl) : fileOrUrl;

    return (
        <div style={{ position: 'relative', width: '50px', height: '35px', borderRadius: '4px', overflow: 'hidden', border: '1px solid #cbd5e1', flexShrink: 0, marginLeft: '10px' }}>
            <img src={url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '0.45rem', textAlign: 'center', paddingTop: '1px' }}>
                {isFile ? 'جديد' : 'محفوظ'}
            </div>
        </div>
    )
}

export const AdminCourseBuilder = ({ id }) => {
    const navigate = useNavigate()
    const isNew = id === 'new'
    const docsInputRef = useRef(null)

    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [expandedModule, setExpandedModule] = useState(0)

    const [course, setCourse] = useState({
        title: '', description: '', price: '0',
        teacher: '', subject: '', grade: '', is_published: true, color: 'blue',
        students_per_group: 200, order: 0
    })

    const [courseDocs, setCourseDocs] = useState([]) // MinisterialDocs
    const [modules, setModules] = useState([])
    const [teachers, setTeachers] = useState([])

    // Copy Content State
    const [copyModalOpen, setCopyModalOpen] = useState(false)
    const [allCourses, setAllCourses] = useState([])
    const [sourceCourseId, setSourceCourseId] = useState('')
    const [copying, setCopying] = useState(false)
    const [copyJob, setCopyJob] = useState(null) // {state, log[], done_modules, total_modules, lessons_done, error, trace}
    // خيارات النسخ — الامتحانات الأسبوعية مستثناة افتراضياً (دورات الدفعات الجديدة تأخذ امتحاناتها لاحقاً)
    const [copyWeeklyExams, setCopyWeeklyExams] = useState(false)
    const [copyQuizzes, setCopyQuizzes] = useState(true)
    const [copyMinisterialDocs, setCopyMinisterialDocs] = useState(true)
    const [courseDirty, setCourseDirty] = useState(false)

    const FILE_FIELDS = ['doc_file', 'cover_image', 'hero_image', 'file', 'exam_file']

    const markCourseDirty = (updater) => {
        if (typeof updater === 'function') setCourse(prev => updater(prev))
        else setCourse(updater)
        setCourseDirty(true)
    }

    const itemNeedsSave = (item, extraFileFields = []) => {
        if (!item?.id) return true
        if (item._dirty) return true
        return [...FILE_FIELDS, ...extraFileFields].some(k => item[k] instanceof File)
    }

    const stripEntityForSave = (obj, extraRemove = []) => {
        const out = { ...obj }
        ;[
            'localId', '_dirty', '_heavyLoaded', 'showAdvanced', 'showBuilder', 'lessons', 'quizzes', 'questions',
            'is_exam', 'weekly_exams', 'exam_id', 'exam_file', 'exam_start_time', 'exam_end_time',
            'exam_total_mark', 'exam_instructions',
            ...extraRemove,
        ].forEach(k => delete out[k])
        FILE_FIELDS.forEach(k => {
            if (!(out[k] instanceof File)) delete out[k]
        })
        return out
    }

    // Trash Memory for intelligent deletion
    const [deletedItems, setDeletedItems] = useState({
        modules: [], lessons: [], quizzes: [], questions: [], ministerialdocs: [], weeklyexams: []
    })

    const trackDelete = (type, dbId) => {
        if (!dbId) return
        setDeletedItems(prev => ({ ...prev, [type]: [...prev[type], dbId] }))
    }

    const openCopyModal = async () => {
        if (!course.teacher) {
            return alert('يرجى تحديد الأستاذ للدورة أولاً قبل نسخ المحتوى.')
        }
        const tk = localStorage.getItem('access_token')
        const headers = { 'Authorization': `Bearer ${tk}` }
        try {
            const crsRes = await fetch(`${API}/api/hq/courses/?page_size=1000`, { headers })
            if (crsRes.ok) {
                const data = await crsRes.json()
                const sameTeacherCourses = (data.results || data).filter(c =>
                    String(c.id) !== String(id) && String(c.teacher) === String(course.teacher)
                )
                setAllCourses(sameTeacherCourses)
                setSourceCourseId('')
                setCopyModalOpen(true)
            }
        } catch (e) { console.error("Error fetching courses", e) }
    }

    // النسخ يعمل بالخلفية على السيرفر (Celery) — النافذة تعرض شريط تقدم
    // وسجلاً حياً بكل خطوة يرسله السيرفر؛ وعند أي فشل يظهر الخطأ الكامل
    // (traceback) مع زر ينسخه للحافظة لإرساله للمطور.
    const handleCopyContent = async () => {
        if (!sourceCourseId) return alert('يرجى اختيار الدورة المراد النسخ منها.')
        if (!window.confirm('تنبيه: هذا الإجراء سيقوم بحذف جميع المحتويات الحالية (الفصول، الدروس، الامتحانات) للدورة الحالية واستبدالها بمحتويات الدورة المحددة. هل أنت متأكد؟')) return

        setCopying(true)
        setCopyJob({ state: 'starting', log: ['⏳ جاري إرسال طلب النسخ للسيرفر...'] })
        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/hq/courses/${id}/copy-content/`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source_course_id: sourceCourseId,
                    copy_weekly_exams: copyWeeklyExams,
                    copy_quizzes: copyQuizzes,
                    copy_ministerial_docs: copyMinisterialDocs,
                })
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || `فشل بدء النسخ (HTTP ${res.status})`)
            if (!data.job_id) throw new Error('السيرفر لم يرجع رقم مهمة — تأكد من رفع آخر نسخة للباك اند.')

            const jobId = data.job_id
            const startedAt = Date.now()
            let unknownStreak = 0
            const poll = async () => {
                if (Date.now() - startedAt > 20 * 60 * 1000) {
                    setCopyJob(prev => ({ ...prev, state: 'failed', error: 'انتهت مهلة المتابعة (20 دقيقة) بلا نتيجة نهائية.' }))
                    return
                }
                let s = {}
                try {
                    const sRes = await fetch(`${API}/api/hq/copy-jobs/${jobId}/`, {
                        headers: { 'Authorization': `Bearer ${tk}` },
                    })
                    s = await sRes.json().catch(() => ({}))
                    if (sRes.status === 404) s.state = s.state || 'unknown'
                } catch (e) {
                    s = { state: 'poll_error', error: String(e) }
                }

                if (s.state === 'unknown') {
                    // الحالة اختفت من الكاش أو لم تُكتب بعد — نتسامح لثوانٍ قليلة
                    unknownStreak += 1
                    if (unknownStreak > 8) {
                        setCopyJob(prev => ({
                            ...prev, state: 'failed',
                            error: 'حالة المهمة غير موجودة على السيرفر — الغالب أن الـ worker لم يستلمها. تحقق من لوغ keyacademy-worker.',
                        }))
                        return
                    }
                } else {
                    unknownStreak = 0
                }

                if (s.state === 'done' || s.state === 'failed') {
                    setCopyJob({ ...s, jobId })
                    return
                }
                setCopyJob(prev => ({ ...(s.log ? s : prev), state: s.state || prev.state, jobId }))
                setTimeout(poll, 1500)
            }
            setTimeout(poll, 800)
        } catch (err) {
            console.error(err)
            setCopyJob({ state: 'failed', error: err.message, log: [] })
        }
    }

    const copyJobLogText = () => {
        const j = copyJob || {}
        return [
            `== لوغ نسخ الدورة ==`,
            `job: ${j.jobId || '؟'} | target course: ${id} | source: ${sourceCourseId}`,
            `state: ${j.state}`,
            ...(j.log || []),
            j.error ? `error: ${j.error}` : '',
            j.trace ? `--- traceback ---\n${j.trace}` : '',
        ].filter(Boolean).join('\n')
    }

    const copyLogToClipboard = () => {
        navigator.clipboard.writeText(copyJobLogText())
            .then(() => alert('انتسخ اللوغ — الصقه بالمحادثة.'))
            .catch(() => window.prompt('انسخ النص يدوياً:', copyJobLogText()))
    }

    useEffect(() => {
        const fetchOptions = async () => {
            const tk = localStorage.getItem('access_token')
            const headers = { 'Authorization': `Bearer ${tk}` }
            try {
                const tRes = await fetch(`${API}/api/hq/teachers/?page_size=1000`, { headers })
                if (tRes.ok) setTeachers(await tRes.json().then(d => d.results || d))
            } catch (e) { console.error("Error fetching options", e) }
        }

        const fetchTree = async () => {
            const tk = localStorage.getItem('access_token')
            const headers = { 'Authorization': `Bearer ${tk}` }
            try {
                const crsRes = await fetch(`${API}/api/hq/courses/${id}/`, { headers })
                if (crsRes.ok) setCourse(await crsRes.json())

                const [modRes, lessRes, quizRes, questRes, docsRes, examRes] = await Promise.all([
                    fetch(`${API}/api/hq/modules/?page_size=5000&course=${id}`, { headers }),
                    // omit: الحقول الثقيلة (نص الدرس وكود السلايدات) تُجلب عند فتح «متقدم» لكل درس
                    fetch(`${API}/api/hq/lessons/?page_size=5000&module__course=${id}&omit=lesson_text,interactive_html`, { headers }),
                    fetch(`${API}/api/hq/quizzes/?page_size=5000&lesson__module__course=${id}`, { headers }),
                    fetch(`${API}/api/hq/questions/?page_size=10000&quiz__lesson__module__course=${id}`, { headers }),
                    fetch(`${API}/api/hq/ministerialdocs/?page_size=1000&course=${id}`, { headers }),
                    fetch(`${API}/api/hq/weeklyexams/?page_size=5000&module__course=${id}`, { headers })
                ])

                const allModules = modRes.ok ? await modRes.json().then(d => d.results || d) : []
                const allLessons = lessRes.ok ? await lessRes.json().then(d => d.results || d) : []
                const allQuizzes = quizRes.ok ? await quizRes.json().then(d => d.results || d) : []
                const allQuestions = questRes.ok ? await questRes.json().then(d => d.results || d) : []
                const allDocs = docsRes.ok ? await docsRes.json().then(d => d.results || d) : []
                const allExams = examRes.ok ? await examRes.json().then(d => d.results || d) : []

                // Filter docs by course
                setCourseDocs(allDocs.filter(d => d.course == id).map(d => ({ ...d, localId: d.id })))

                const courseMods = allModules.filter(m => m.course == id).sort((a, b) => a.order - b.order)

                const mapExamFromApi = (ex) => ({
                    localId: ex.id,
                    id: ex.id,
                    exam_id: ex.id,
                    title: ex.title || '',
                    exam_start_time: ex.start_time ? ex.start_time.slice(0, 16) : '',
                    exam_end_time: ex.end_time ? ex.end_time.slice(0, 16) : '',
                    exam_total_mark: ex.total_mark,
                    exam_instructions: ex.instructions || '',
                    exam_file: ex.file,
                })

                const tree = courseMods.map(m => {
                    const moduleLessons = allLessons.filter(l => l.module == m.id).sort((a, b) => a.order - b.order)
                    const weekly_exams = allExams
                        .filter(ex => ex.module == m.id)
                        .sort((a, b) => new Date(a.start_time || 0) - new Date(b.start_time || 0))
                        .map(mapExamFromApi)

                    return {
                        ...m,
                        localId: m.id,
                        is_exam: moduleLessons.length === 0 && weekly_exams.length > 0,
                        weekly_exams,
                        lessons: moduleLessons.map(l => {
                            const lessonQuizzes = allQuizzes.filter(q => q.lesson == l.id)
                            return {
                                ...l, localId: l.id, showAdvanced: false, _heavyLoaded: false,
                                json_data: l.json_data || { ad_video_id: '', in_video_quizzes: [] },
                                quizzes: lessonQuizzes.map(qz => {
                                    const quizQuestions = allQuestions.filter(qs => qs.quiz == qz.id).sort((a, b) => a.order - b.order)
                                    return {
                                        ...qz, localId: qz.id, showBuilder: false,
                                        questions: quizQuestions.map(qs => ({
                                            ...qs, localId: qs.id
                                        }))
                                    }
                                })
                            }
                        })
                    }
                })

                setModules(tree)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchOptions()
        if (isNew) {
            setLoading(false)
        } else {
            fetchTree()
        }
    }, [id, isNew])

    // --- Module Operations ---
    const emptyWeeklyExam = (title = '') => ({
        localId: Date.now() + Math.random(),
        title,
        exam_start_time: '',
        exam_end_time: '',
        exam_total_mark: 100,
        exam_instructions: '',
        exam_file: null,
    })

    const addModule = (isExam = false) => {
        if (isExam) {
            setModules([...modules, {
                localId: Date.now(), title: '', order: modules.length + 1, is_free: false, is_exam: true,
                weekly_exams: [emptyWeeklyExam('')],
                lessons: []
            }])
        } else {
            setModules([...modules, { localId: Date.now(), title: '', order: modules.length + 1, is_free: false, is_exam: false, weekly_exams: [], lessons: [] }])
        }
        setExpandedModule(modules.length)
    }

    const removeModule = (mIndex) => {
        if (!window.confirm("متأكد من حذف هذه الوحدة بالكامل؟")) return
        const toDel = modules[mIndex]
        trackDelete('modules', toDel.id)
        ;(toDel.weekly_exams || []).forEach(ex => { if (ex.exam_id) trackDelete('weeklyexams', ex.exam_id) })
        setModules(modules.filter((_, i) => i !== mIndex))
    }

    const updateWeeklyExam = (mIndex, eIndex, field, val) => {
        const newMods = [...modules]
        newMods[mIndex].weekly_exams[eIndex][field] = val
        newMods[mIndex].weekly_exams[eIndex]._dirty = true
        newMods[mIndex]._dirty = true
        setModules(newMods)
    }

    const addWeeklyExam = (mIndex) => {
        const newMods = [...modules]
        const mod = newMods[mIndex]
        const count = (mod.weekly_exams?.length || 0) + 1
        mod.weekly_exams = [...(mod.weekly_exams || []), emptyWeeklyExam(`${mod.title || 'امتحان'} ${count}`)]
        mod._dirty = true
        setModules(newMods)
    }

    const removeWeeklyExam = (mIndex, eIndex) => {
        if (!window.confirm('حذف هذا الامتحان الأسبوعي؟')) return
        const newMods = [...modules]
        const ex = newMods[mIndex].weekly_exams[eIndex]
        if (ex.exam_id) trackDelete('weeklyexams', ex.exam_id)
        newMods[mIndex].weekly_exams = newMods[mIndex].weekly_exams.filter((_, i) => i !== eIndex)
        newMods[mIndex]._dirty = true
        setModules(newMods)
    }

    const updateModule = (mIndex, field, val) => {
        const newMods = [...modules]
        newMods[mIndex][field] = val
        newMods[mIndex]._dirty = true
        setModules(newMods)
    }

    // --- Lesson Operations ---
    const addLesson = (mIndex) => {
        const newMods = [...modules]
        newMods[mIndex].lessons.push({
            localId: Date.now(), title: '', video_url: '', cover_image: '', order: newMods[mIndex].lessons.length + 1, is_locked: true, is_published: false,
            interactive_html: '', lesson_text: '', virtual_lab_slug: '', doc_file: null, showAdvanced: true, _heavyLoaded: true, quizzes: [], json_data: { ad_video_id: '', in_video_quizzes: [
                { time: 0, hint: '', question: '', options: ['', ''], correct: 0, explanations: ['', ''] },
                { time: 0, hint: '', question: '', options: ['', ''], correct: 0, explanations: ['', ''] },
                { time: 0, hint: '', question: '', options: ['', ''], correct: 0, explanations: ['', ''] }
            ] }
        })
        setModules(newMods)
    }

    const removeLesson = (mIndex, lIndex) => {
        if (!window.confirm("حذف الدرس بكافة تفاصيله وملفاته؟")) return
        const newMods = [...modules]; const toDel = newMods[mIndex].lessons[lIndex]; trackDelete('lessons', toDel.id);
        newMods[mIndex].lessons = newMods[mIndex].lessons.filter((_, i) => i !== lIndex); setModules(newMods)
    }

    const updateLesson = (mIndex, lIndex, field, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex][field] = val
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }

    // الحقول الثقيلة (نص الدرس + كود السلايدات) لا تُحمّل مع القائمة (omit) —
    // تُجلب هنا عند أول فتح لقسم «متقدم» أو قبل توليد الأسئلة بالذكاء الاصطناعي.
    // ترجع نسخة الدرس بعد التحميل للاستخدام الفوري (تفادياً لقدم حالة الـ state).
    const ensureLessonHeavy = async (mIndex, lIndex) => {
        const less = modules[mIndex]?.lessons?.[lIndex]
        if (!less) return null
        if (less._heavyLoaded || !less.id) return less
        try {
            const tk = localStorage.getItem('access_token')
            const res = await fetch(`${API}/api/hq/lessons/${less.id}/`, { headers: { Authorization: `Bearer ${tk}` } })
            if (!res.ok) return less
            const full = await res.json()
            const mergedHtml = less.interactive_html || full.interactive_html || ''
            const mergedText = less.lesson_text || full.lesson_text || ''
            setModules(prev => {
                const copy = [...prev]
                const target = copy[mIndex]?.lessons?.[lIndex]
                if (!target || target.id !== full.id || target._heavyLoaded) return prev
                // دمج بلا تعليم الدرس كمعدَّل — هذه قراءة وليست تعديلاً،
                // ولا نمس قيمة كتبها المستخدم أثناء الجلب.
                if (!target.interactive_html) target.interactive_html = full.interactive_html || ''
                if (!target.lesson_text) target.lesson_text = full.lesson_text || ''
                target._heavyLoaded = true
                return copy
            })
            return { ...less, interactive_html: mergedHtml, lesson_text: mergedText, _heavyLoaded: true }
        } catch (e) {
            console.error('lazy lesson load failed', e)
            return less
        }
    }

    // تغيير ترتيب الدرس (تحريك للأعلى/الأسفل) — يعيد ترقيم order لكل دروس الفصل
    const moveLesson = (mIndex, lIndex, dir) => {
        const target = lIndex + dir
        const newMods = [...modules]
        const lessons = [...newMods[mIndex].lessons]
        if (target < 0 || target >= lessons.length) return
        const tmp = lessons[lIndex]; lessons[lIndex] = lessons[target]; lessons[target] = tmp
        lessons.forEach((l, i) => {
            if (l.order !== i + 1) { l.order = i + 1; l._dirty = true }
        })
        newMods[mIndex].lessons = lessons
        setModules(newMods)
    }

    const handleLessonPublishToggle = async (mIndex, lIndex, published) => {
        const less = modules[mIndex].lessons[lIndex]
        updateLesson(mIndex, lIndex, 'is_published', published)
        if (!less.id) return

        const tk = localStorage.getItem('access_token')
        try {
            const res = await fetch(`${API}/api/hq/lessons/${less.id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_published: published }),
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل تحديث حالة النشر')
            }
            const newMods = [...modules]
            newMods[mIndex].lessons[lIndex].is_published = published
            newMods[mIndex].lessons[lIndex]._dirty = false
            setModules(newMods)
        } catch (err) {
            updateLesson(mIndex, lIndex, 'is_published', !published)
            alert(err.message)
        }
    }

    // --- Quiz Operations ---
    const addQuiz = (mIndex, lIndex) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes.push({
            localId: Date.now(), title: 'الاختبار الأسبوعي السريع', duration_minutes: 15, showBuilder: true, questions: []
        })
        setModules(newMods)
    }

    const removeQuiz = (mIndex, lIndex, qzIndex) => {
        if (!window.confirm("موافق على حذف الاختبار كاملًا؟")) return
        const newMods = [...modules]; const toDel = newMods[mIndex].lessons[lIndex].quizzes[qzIndex]; trackDelete('quizzes', toDel.id);
        newMods[mIndex].lessons[lIndex].quizzes = newMods[mIndex].lessons[lIndex].quizzes.filter((_, i) => i !== qzIndex); setModules(newMods)
    }

    const updateQuiz = (mIndex, lIndex, qzIndex, field, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex][field] = val
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex]._dirty = true
        setModules(newMods)
    }

    // --- Question Operations ---
    const addQuestion = (mIndex, lIndex, qzIndex) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.push({
            localId: Date.now(), text: '', question_type: 'MCQ', model_answer: '', keywords: [], options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'], options_explanations: ['', '', '', ''], correct_index: 0, order: newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.length + 1
        })
        setModules(newMods)
    }

    const removeQuestion = (mIndex, lIndex, qzIndex, qsIndex) => {
        const newMods = [...modules]; const toDel = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]; trackDelete('questions', toDel.id);
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.filter((_, i) => i !== qsIndex); setModules(newMods)
    }

    const updateQuestion = (mIndex, lIndex, qzIndex, qsIndex, field, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex][field] = val
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]._dirty = true
        setModules(newMods)
    }

    const updateQuestionOption = (mIndex, lIndex, qzIndex, qsIndex, optIndex, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex].options[optIndex] = val
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]._dirty = true
        setModules(newMods)
    }

    const updateQuestionOptionExplanation = (mIndex, lIndex, qzIndex, qsIndex, optIndex, val) => {
        const newMods = [...modules]
        const qs = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]
        if (!qs.options_explanations) qs.options_explanations = ['', '', '', '']
        qs.options_explanations[optIndex] = val
        qs._dirty = true
        setModules(newMods)
    }

    const handleBulkQuestions = (mIndex, lIndex, qzIndex, rawText) => {
        if (!rawText.trim()) return
        const lines = rawText.split('\n').map(l => l.trim()).filter(l => l)
        const parsedQuestions = []
        let currentQ = null

        lines.forEach(line => {
            if (line.startsWith('-') || line.startsWith('*')) {
                if (currentQ) {
                    const isCorrect = line.startsWith('*')
                    let optText = line.substring(1).trim()

                    // check if there's an explanation e.g. "Text (Reason)"
                    let explanation = ''
                    const match = optText.match(/(.*)\((.*)\)$/)
                    if (match) {
                        optText = match[1].trim()
                        explanation = match[2].trim()
                    }

                    if (isCorrect) currentQ.correct_index = currentQ.options.length
                    currentQ.options.push(optText)
                    currentQ.options_explanations.push(explanation)
                }
            } else {
                if (currentQ && currentQ.options.length > 0) parsedQuestions.push(currentQ)
                currentQ = { localId: Date.now() + Math.random(), text: line, options: [], options_explanations: [], correct_index: 0 }
            }
        })
        if (currentQ && currentQ.options.length > 0) parsedQuestions.push(currentQ)

        if (parsedQuestions.length > 0) {
            const newMods = [...modules]
            const existing = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions
            parsedQuestions.forEach((pq, idx) => { pq.order = existing.length + idx + 1 })
            newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions = [...existing, ...parsedQuestions]
            newMods[mIndex].lessons[lIndex].quizzes[qzIndex]._dirty = true
            setModules(newMods)
            alert(`تم توليد ${parsedQuestions.length} سؤال بنجاح!`)
        } else {
            alert('لم يتم التعرف على أي أسئلة يرجى التأكد من الصيغة.')
        }
    }

    // "15:30" أو "1:15:30" أو "45" (دقائق) → ثواني
    const parseDurationToSeconds = (raw) => {
        if (!raw) return 0
        const parts = String(raw).trim().match(/\d+/g)
        if (!parts) return 0
        if (parts.length === 1) return parseInt(parts[0], 10) * 60
        if (parts.length === 2) return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10)
        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10)
    }

    const handleGenerateSurpriseQuestions = async (mIndex, lIndex) => {
        const less = (await ensureLessonHeavy(mIndex, lIndex)) || modules[mIndex].lessons[lIndex];
        if (!less.lesson_text || less.lesson_text.trim() === '') {
            alert('يجب إضافة نص للدرس أولاً لتتمكن من توليد الأسئلة.');
            return;
        }

        const confirmGen = window.confirm('سيتم توليد 3 أسئلة فجائية باستخدام الذكاء الاصطناعي (كل سؤال من ربعه الزمني: 0-25%، 25-50%، 50-75%) وسيتم مسح الأسئلة الفجائية الحالية. هل أنت متأكد؟');
        if (!confirmGen) return;

        try {
            const tk = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/hq/generate-ai-questions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify({
                    lesson_text: less.lesson_text,
                    type: 'surprise',
                    subject: [course.subject, course.title].filter(Boolean).join(' '),
                    video_duration_seconds: parseDurationToSeconds(less.duration)
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Network error');
            if (data.success && data.questions) {
                const newMods = [...modules];
                if(!newMods[mIndex].lessons[lIndex].json_data) newMods[mIndex].lessons[lIndex].json_data = {};
                newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes = data.questions.map(q => ({
                    time: 0,
                    question: q.question,
                    hint: q.hint,
                    options: q.options,
                    correct: q.correct_index,
                    explanations: q.explanations
                }));
                newMods[mIndex].lessons[lIndex]._dirty = true;
                setModules(newMods);
                if (data.timeline_detected) {
                    const ranges = data.questions
                        .map((q, i) => `${i + 1}) ${q.window_label || ''} → ${q.hint || ''}`)
                        .join('\n');
                    alert(`تم توليد الأسئلة الفجائية بنجاح!\nمدة الفيديو المستخرجة من النص: ${data.video_duration}\n${ranges}`);
                } else {
                    alert('تم توليد الأسئلة الفجائية بنجاح!\nتنبيه: لا توجد توقيتات (مثل 12:34) داخل نص الدرس، لذلك تم التقسيم حسب طول النص وليس حسب زمن الفيديو، والتلميحات فارغة. أضف التوقيتات للنص لتقسيم زمني دقيق.');
                }
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التوليد: ' + error.message);
        }
    };

    const handleGenerateTextQuestions = async (mIndex, lIndex, qzIndex) => {
        const less = (await ensureLessonHeavy(mIndex, lIndex)) || modules[mIndex].lessons[lIndex];
        if (!less.lesson_text || less.lesson_text.trim() === '') {
            alert('يجب إضافة نص للدرس أولاً لتتمكن من توليد الأسئلة.');
            return;
        }
        
        const confirmGen = window.confirm('سيتم توليد ما يصل إلى 100 سؤال ذكاء اصطناعي بناءً على النص وإضافتها للاختبار الحالي. هل أنت متأكد؟');
        if (!confirmGen) return;

        try {
            const tk = localStorage.getItem('access_token');
            const res = await fetch(`${API}/api/hq/generate-ai-questions/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tk}`
                },
                body: JSON.stringify({ lesson_text: less.lesson_text, type: 'text_100', subject: [course.subject, course.title].filter(Boolean).join(' ') })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Network error');
            if (data.success && data.questions) {
                const newMods = [...modules];
                const quiz = newMods[mIndex].lessons[lIndex].quizzes[qzIndex];
                data.questions.forEach(q => {
                    quiz.questions.push({
                        localId: Date.now() + Math.random(),
                        text: q.text,
                        question_type: 'MCQ',
                        options: q.options,
                        correct_index: q.correct_index,
                        options_explanations: q.options_explanations,
                        model_answer: '',
                        keywords: []
                    });
                });
                quiz._dirty = true;
                setModules(newMods);
                alert(`تم توليد ${data.questions.length} سؤال بنجاح!`);
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ أثناء التوليد: ' + error.message);
        }
    };


    const handleShuffleSurpriseQuizzes = (mIndex, lIndex) => {
        const newMods = [...modules];
        const quizzes = newMods[mIndex].lessons[lIndex].json_data?.in_video_quizzes || [];
        
        quizzes.forEach(quiz => {
            if (quiz.options && quiz.options.length > 0) {
                let indices = quiz.options.map((_, i) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                const newOptions = indices.map(i => quiz.options[i]);
                const newExplanations = quiz.explanations ? indices.map(i => quiz.explanations[i]) : [];
                const newCorrectIndex = indices.indexOf(quiz.correct);
                
                quiz.options = newOptions;
                quiz.explanations = newExplanations;
                quiz.correct = newCorrectIndex;
            }
        });
        setModules(newMods);
        alert('تم لخبطة الخيارات بنجاح!');
    };

    const handleShuffleSmartQuiz = (mIndex, lIndex, qzIndex) => {
        const newMods = [...modules];
        const quiz = newMods[mIndex].lessons[lIndex].quizzes[qzIndex];
        
        quiz.questions.forEach(qs => {
            if ((!qs.question_type || qs.question_type === 'MCQ') && qs.options && qs.options.length > 0) {
                let indices = qs.options.map((_, i) => i);
                for (let i = indices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [indices[i], indices[j]] = [indices[j], indices[i]];
                }
                const newOptions = indices.map(i => qs.options[i]);
                const newExplanations = qs.options_explanations ? indices.map(i => qs.options_explanations[i]) : [];
                const newCorrectIndex = indices.indexOf(qs.correct_index);
                
                qs.options = newOptions;
                qs.options_explanations = newExplanations;
                qs.correct_index = newCorrectIndex;
            }
        });
        setModules(newMods);
        alert('تم لخبطة خيارات جميع أسئلة هذا الاختبار بنجاح!');
    };

    // إصلاح فورمات الرياضيات لكامل الكورس: يغلّف كل تعبير رياضي بعزل LTR
    // فيُعرض صحيحاً (2√7 بدل 7√2) في المحرّر وعند الطالب. قابل للتكرار بأمان.
    const handleFixMathFormat = () => {
        const newMods = [...modules]
        let changed = 0
        const fixField = (obj, key) => {
            if (!obj || typeof obj[key] !== 'string') return
            const fixed = fixMathFormat(obj[key])
            if (fixed !== obj[key]) { obj[key] = fixed; changed++ }
        }
        const fixArray = (obj, key) => {
            if (!obj || !Array.isArray(obj[key])) return
            obj[key] = obj[key].map(v => {
                if (typeof v !== 'string') return v
                const fixed = fixMathFormat(v)
                if (fixed !== v) changed++
                return fixed
            })
        }
        newMods.forEach(mod => {
            (mod.lessons || []).forEach(less => {
                // 1) أسئلة اختبارات المحرّك الذكي (Quizzes)
                (less.quizzes || []).forEach(qz => {
                    (qz.questions || []).forEach(qs => {
                        fixField(qs, 'text')
                        fixArray(qs, 'options')
                        fixArray(qs, 'options_explanations')
                        // نتجاوز معادلات MATH_EQUATION لأنها LaTeX عبر mathlive
                        if (qs.question_type !== 'MATH_EQUATION') fixField(qs, 'model_answer')
                        qs._dirty = true
                    })
                })
                // 2) أسئلة داخل الفيديو (in-video quizzes)
                const ivqs = less.json_data?.in_video_quizzes
                if (Array.isArray(ivqs)) {
                    ivqs.forEach(ivq => {
                        fixField(ivq, 'question')
                        fixArray(ivq, 'options')
                        fixArray(ivq, 'explanations')
                    })
                    less._dirty = true
                }
            })
        })
        setModules(newMods)
        alert(changed > 0
            ? `تم إصلاح فورمات الرياضيات في ${changed} حقلاً. اضغط "حفظ التعديلات" لتثبيت التغييرات.`
            : 'كل التعابير الرياضية مضبوطة بالفعل — لا حاجة لأي إصلاح.')
    }

    const handleShuffleSingleSurprise = (mIndex, lIndex, qzIdx) => {
        const newMods = [...modules];
        const quiz = newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx];
        if (quiz.options && quiz.options.length > 0) {
            let indices = quiz.options.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const newOptions = indices.map(i => quiz.options[i]);
            const newExplanations = quiz.explanations ? indices.map(i => quiz.explanations[i]) : [];
            const newCorrectIndex = indices.indexOf(quiz.correct);
            
            quiz.options = newOptions;
            quiz.explanations = newExplanations;
            quiz.correct = newCorrectIndex;
            setModules(newMods);
        }
    };

    const handleShuffleSingleSmart = (mIndex, lIndex, qzIndex, qsIndex) => {
        const newMods = [...modules];
        const qs = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex];
        if ((!qs.question_type || qs.question_type === 'MCQ') && qs.options && qs.options.length > 0) {
            let indices = qs.options.map((_, i) => i);
            for (let i = indices.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [indices[i], indices[j]] = [indices[j], indices[i]];
            }
            const newOptions = indices.map(i => qs.options[i]);
            const newExplanations = qs.options_explanations ? indices.map(i => qs.options_explanations[i]) : [];
            const newCorrectIndex = indices.indexOf(qs.correct_index);
            
            qs.options = newOptions;
            qs.options_explanations = newExplanations;
            qs.correct_index = newCorrectIndex;
            qs._dirty = true;
            setModules(newMods);
        }
    };


    // --- In-Video Logic (JSON Data) ---
    const addInVideoQuiz = (mIndex, lIndex) => {
        // Obsolete, we now enforce 3 quizzes.
    }
    const removeInVideoQuiz = (mIndex, lIndex, qzIdx) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes.splice(qzIdx, 1)
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const updateInVideoQuiz = (mIndex, lIndex, qzIdx, field, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx][field] = val
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const updateInVideoQuizOption = (mIndex, lIndex, qzIdx, optIdx, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx].options[optIdx] = val
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const updateInVideoQuizExplanation = (mIndex, lIndex, qzIdx, optIdx, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx].explanations[optIdx] = val
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const addInVideoQuizOption = (mIndex, lIndex, qzIdx) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx].options.push('')
        newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx].explanations.push('')
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const removeInVideoQuizOption = (mIndex, lIndex, qzIdx, optIdx) => {
        const newMods = [...modules]
        const qz = newMods[mIndex].lessons[lIndex].json_data.in_video_quizzes[qzIdx]
        qz.options.splice(optIdx, 1)
        qz.explanations.splice(optIdx, 1)
        if (qz.correct >= qz.options.length) qz.correct = 0
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }
    const updateLessonJsonData = (mIndex, lIndex, field, val) => {
        const newMods = [...modules]
        if (!newMods[mIndex].lessons[lIndex].json_data) newMods[mIndex].lessons[lIndex].json_data = {}
        newMods[mIndex].lessons[lIndex].json_data[field] = val
        newMods[mIndex].lessons[lIndex]._dirty = true
        setModules(newMods)
    }

    // --- Course Docs Operations (Ministerial Docs) ---
    const addCourseDoc = () => {
        setCourseDocs([...courseDocs, { localId: Date.now(), title: '', file: null, doc_type: 'PDF' }])
    }
    const updateCourseDoc = (index, field, val) => {
        const newDocs = [...courseDocs]
        newDocs[index][field] = val
        newDocs[index]._dirty = true
        setCourseDocs(newDocs)
    }
    const removeCourseDoc = (index) => {
        const toDel = courseDocs[index]; trackDelete('ministerialdocs', toDel.id);
        setCourseDocs(courseDocs.filter((_, i) => i !== index));
    }

    // Payload Builder — يرفع الملفات الجديدة فقط (File)، ولا يعيد إرسال الروابط المحفوظة
    const buildPayload = (dataObj, extraRemove = []) => {
        const dataObjClean = stripEntityForSave(dataObj, extraRemove)
        const hasNewFile = FILE_FIELDS.some(k => dataObjClean[k] instanceof File)

        if (hasNewFile) {
            const fd = new FormData()
            Object.keys(dataObjClean).forEach(k => {
                const val = dataObjClean[k]
                if (val === null || val === undefined) return
                if (FILE_FIELDS.includes(k)) {
                    if (val instanceof File) fd.append(k, val)
                } else if (Array.isArray(val)) {
                    val.forEach(item => fd.append(k, item))
                } else if (typeof val === 'object') {
                    fd.append(k, JSON.stringify(val))
                } else {
                    if (val === '' && (k === 'grade' || k === 'subject' || k === 'teacher')) return
                    fd.append(k, val)
                }
            })
            return { body: fd, isMultipart: true }
        }

        const jsonObj = { ...dataObjClean }
        if (jsonObj.grade === '') jsonObj.grade = null
        if (jsonObj.subject === '') jsonObj.subject = null
        if (jsonObj.teacher === '') jsonObj.teacher = null
        return { body: JSON.stringify(jsonObj), isMultipart: false }
    }


    // --- SAVING LOGIC DEEP SYNC ---
    const handleSaveTree = async () => {
        // --- Detailed Validation ---
        if (!course.title?.trim()) { alert('خطأ: يجب إدخال "عنوان واسم الكورس" قبل الحفظ.'); return }
        if (!course.teacher) { alert('خطأ: يجب اختيار "الأستاذ للمادة" من القائمة.'); return }
        if (!course.price?.trim()) { alert('خطأ: يجب إدخال مسقلة "التسعيرة الإجمالية" أو وضع 0.'); return }

        for (let m = 0; m < modules.length; m++) {
            const mod = modules[m];
            if (!mod.title?.trim()) { alert(`خطأ: الوحدة رقم ${m + 1} لا تحتوي على عنوان!`); return }
            for (let l = 0; l < mod.lessons.length; l++) {
                const less = mod.lessons[l];
                if (!less.title?.trim()) { alert(`خطأ: الدرس رقم ${l + 1} داخل وحدة "${mod.title}" لا يحتوي على عنوان.`); return }
                for (let qzIdx = 0; qzIdx < less.quizzes.length; qzIdx++) {
                    const qz = less.quizzes[qzIdx];
                    if (!qz.title?.trim()) { alert(`خطأ: الاختبار داخل درس "${less.title}" بدون عنوان.`); return }
                    for (let qsIdx = 0; qsIdx < qz.questions.length; qsIdx++) {
                        const qs = qz.questions[qsIdx];
                        if (!qs.text?.trim()) { alert(`خطأ: السؤال رقم ${qsIdx + 1} في اختبار "${qz.title}" بدون نص سؤال.`); return }
                    }
                }
            }
        }
        // ---------------------------

        setSaving(true)
        const tk = localStorage.getItem('access_token')
        const headersJson = { 'Authorization': `Bearer ${tk}`, 'Content-Type': 'application/json' }
        const headersMulti = { 'Authorization': `Bearer ${tk}` } // fetch natively handles multipart boundary

        try {
            // 1. Process Trash Memory (Deletions) in precise order
            let deletedCount = 0
            for (const type of ['questions', 'quizzes', 'lessons', 'weeklyexams', 'modules', 'ministerialdocs']) {
                for (const dbId of deletedItems[type]) {
                    await fetch(`${API}/api/hq/${type}/${dbId}/`, { method: 'DELETE', headers: headersJson }).catch(() => { })
                    deletedCount++
                }
            }

            // 2. Clear trash cache locally
            setDeletedItems({ modules: [], lessons: [], quizzes: [], questions: [], ministerialdocs: [], weeklyexams: [] })

            // 3. Save Course Base — فقط إذا تغيّرت بيانات الدورة
            let courseId = isNew ? null : parseInt(id, 10)
            let savedCount = 0

            if (isNew || courseDirty || course.hero_image instanceof File) {
                const cPayload = buildPayload(course)
                const cHeaders = cPayload.isMultipart ? headersMulti : headersJson
                const cRes = await fetch(`${API}/api/hq/courses/${isNew ? '' : `${id}/`}`, {
                    method: isNew ? 'POST' : 'PATCH',
                    headers: cHeaders,
                    body: cPayload.body,
                })
                if (!cRes.ok) throw new Error('فشل اتصال أثناء حفظ بيانات الدورة')
                const savedCourse = await cRes.json()
                courseId = savedCourse.id
                savedCount++
                setCourseDirty(false)
            }

            // 4. Save Course Docs — جديد أو معدّل فقط
            for (const doc of courseDocs) {
                if (!itemNeedsSave(doc)) continue
                const dData = stripEntityForSave({ ...doc, course: courseId }, ['localId'])
                const pl = buildPayload(dData)
                const hdrs = pl.isMultipart ? headersMulti : headersJson
                if (doc.id) {
                    await fetch(`${API}/api/hq/ministerialdocs/${doc.id}/`, { method: 'PATCH', headers: hdrs, body: pl.body })
                } else {
                    const r = await fetch(`${API}/api/hq/ministerialdocs/`, { method: 'POST', headers: hdrs, body: pl.body })
                    const sd = await r.json()
                    doc.id = sd.id
                }
                doc._dirty = false
                savedCount++
            }

            // 5. Save Modules -> Lessons -> Quizzes -> Questions (المعدّل والجديد فقط)
            for (const mod of modules) {
                let moduleId = mod.id
                const modNeedsSave = itemNeedsSave(mod)

                if (modNeedsSave) {
                    const modData = stripEntityForSave({ ...mod, course: courseId })
                    const pLoad = buildPayload(modData)
                    const mHdrs = pLoad.isMultipart ? headersMulti : headersJson
                    let mRes
                    if (mod.id) {
                        mRes = await fetch(`${API}/api/hq/modules/${mod.id}/`, { method: 'PATCH', headers: mHdrs, body: pLoad.body })
                    } else {
                        mRes = await fetch(`${API}/api/hq/modules/`, { method: 'POST', headers: mHdrs, body: pLoad.body })
                    }
                    if (!mRes.ok) throw new Error(`فشل حفظ الوحدة "${mod.title}"`)
                    const savedMod = await mRes.json()
                    moduleId = savedMod.id
                    mod.id = savedMod.id
                    savedCount++
                    if (!mod.is_exam) mod._dirty = false
                }

                if (mod.is_exam) {
                    mod._dirty = false
                }

                for (const less of mod.lessons) {
                    let lessonId = less.id

                    if (itemNeedsSave(less)) {
                        const lessData = stripEntityForSave({ ...less, module: moduleId })
                        const pLoad = buildPayload(lessData)
                        const lHdrs = pLoad.isMultipart ? headersMulti : headersJson
                        let lRes
                        if (less.id) {
                            lRes = await fetch(`${API}/api/hq/lessons/${less.id}/`, { method: 'PATCH', headers: lHdrs, body: pLoad.body })
                        } else {
                            lRes = await fetch(`${API}/api/hq/lessons/`, { method: 'POST', headers: lHdrs, body: pLoad.body })
                        }
                        if (!lRes.ok) throw new Error(`فشل حفظ الدرس "${less.title}"`)
                        const savedLess = await lRes.json()
                        lessonId = savedLess.id
                        less.id = savedLess.id
                        less._dirty = false
                        savedCount++
                    }

                    for (const qz of less.quizzes) {
                        if (!itemNeedsSave(qz)) continue

                        const qzData = stripEntityForSave({ ...qz, lesson: lessonId }, ['questions', 'showBuilder'])
                        let qRes
                        if (qz.id) {
                            qRes = await fetch(`${API}/api/hq/quizzes/${qz.id}/`, { method: 'PATCH', headers: headersJson, body: JSON.stringify(qzData) })
                        } else {
                            qRes = await fetch(`${API}/api/hq/quizzes/`, { method: 'POST', headers: headersJson, body: JSON.stringify(qzData) })
                        }
                        if (!qRes.ok) throw new Error(`فشل حفظ الاختبار "${qz.title}"`)
                        const savedQz = await qRes.json()
                        qz.id = savedQz.id
                        qz._dirty = false
                        savedCount++

                        for (const qs of qz.questions) {
                            if (!itemNeedsSave(qs)) continue

                            const qsData = stripEntityForSave({ ...qs, quiz: savedQz.id })
                            let qsRes
                            if (qs.id) {
                                qsRes = await fetch(`${API}/api/hq/questions/${qs.id}/`, { method: 'PATCH', headers: headersJson, body: JSON.stringify(qsData) })
                            } else {
                                qsRes = await fetch(`${API}/api/hq/questions/`, { method: 'POST', headers: headersJson, body: JSON.stringify(qsData) })
                            }
                            if (!qsRes.ok) throw new Error('فشل حفظ أحد أسئلة الاختبار')
                            const savedQs = await qsRes.json()
                            qs.id = savedQs.id
                            qs._dirty = false
                            savedCount++
                        }
                    }
                }

                if (mod.weekly_exams?.length) {
                    for (const exam of mod.weekly_exams) {
                        const examNeedsSave = !exam.exam_id || exam._dirty || exam.exam_file instanceof File
                        if (!examNeedsSave) continue

                        const exData = {
                            module: moduleId,
                            title: exam.title || mod.title,
                            total_mark: exam.exam_total_mark || 100,
                            instructions: exam.exam_instructions || '',
                        }
                        if (exam.exam_start_time) exData.start_time = new Date(exam.exam_start_time).toISOString()
                        if (exam.exam_end_time) exData.end_time = new Date(exam.exam_end_time).toISOString()
                        if (exam.exam_file instanceof File) exData.file = exam.exam_file
                        const exPayload = buildPayload(exData)
                        const exHdrs = exPayload.isMultipart ? headersMulti : headersJson
                        if (exam.exam_id) {
                            await fetch(`${API}/api/hq/weeklyexams/${exam.exam_id}/`, { method: 'PATCH', headers: exHdrs, body: exPayload.body })
                        } else {
                            const exRes = await fetch(`${API}/api/hq/weeklyexams/`, { method: 'POST', headers: exHdrs, body: exPayload.body })
                            if (!exRes.ok) throw new Error(`فشل حفظ امتحان "${exam.title || mod.title}"`)
                            const savedEx = await exRes.json()
                            exam.exam_id = savedEx.id
                            exam.id = savedEx.id
                        }
                        exam._dirty = false
                        savedCount++
                    }
                }
            }

            const totalChanges = savedCount + deletedCount
            alert(totalChanges > 0 ? `تم حفظ التعديلات بنجاح (${totalChanges} عنصر)` : 'لا توجد تغييرات جديدة للحفظ')
            navigate('/hq/courses')
        } catch (err) {
            console.error(err)
            alert(err.message || 'واجهنا هبوط اضطراري 🛸، يرجى التأكد من اتصال الملفات والبيانات.')
        } finally { setSaving(false) }
    }

    if (loading) return <div className="hq-loading" style={{ padding: '50px' }}>تهيئة مساحة رفع المناهج والملفات...</div>

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '15px', borderBottom: '1px solid var(--hq-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button className="hq-back-btn" onClick={() => navigate(`/hq/courses`)}><HiOutlineArrowRight /></button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{isNew ? '(بناء كورس جديد) 🛠️' : '(تعديل وبناء الهيكل) 🏗️'}</h2>
                        <p style={{ margin: 0, color: 'var(--hq-text-muted)', fontSize: '0.9rem', marginTop: '5px' }}>بناء فيديوهات، ملازم، مستندات، واختبارات متقدمة في شاشة Control Panel واحدة.</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--hq-bg)', padding: '10px 15px', borderRadius: '10px', border: '1px solid var(--hq-border)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: '0.95rem', color: course.is_published ? '#34d399' : 'var(--hq-text-muted)' }}>{course.is_published ? 'منشور للطلاب بالمنصة' : 'مسودة مخفية حالياً'}</span>
                        <div className="hq-toggle-switch">
                            <input type="checkbox" id="crs-pub" checked={!!course.is_published} onChange={e => markCourseDirty({ ...course, is_published: e.target.checked })} />
                            <label htmlFor="crs-pub"></label>
                        </div>
                    </div>
                    {(isMathSubject(course.subject) || isMathSubject(course.title)) && (
                        <button className="hq-btn-secondary" onClick={handleFixMathFormat} title="يصلح انعكاس التعابير الرياضية (مثل ظهور 2√7 كـ 7√2) في كل الأسئلة والخيارات" style={{ background: '#0d9488', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '1.05rem', boxShadow: '0 4px 6px rgba(13, 148, 136, 0.3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <HiOutlineSparkles /> اصلاح فورمات الرياضيات
                        </button>
                    )}
                    {!isNew && (
                        <button className="hq-btn-secondary" onClick={openCopyModal} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '10px', fontSize: '1.05rem', boxShadow: '0 4px 6px rgba(59, 130, 246, 0.3)' }}>
                            نسخ محتوى دورة
                        </button>
                    )}
                    <button className="hq-btn-primary" onClick={handleSaveTree} disabled={saving} style={{ padding: '12px 25px', fontSize: '1.05rem', boxShadow: '0 5px 15px rgba(99, 102, 241, 0.4)' }}>
                        <HiOutlineCheckCircle /> {saving ? 'جاري الحفظ...' : (isNew ? 'إنشاء الدورة' : 'حفظ التعديلات')}
                    </button>
                </div>
            </div>

            {/* 1. Basic Settings */}
            <div className="hq-form-card" style={{ marginBottom: '20px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px', fontSize: '1.1rem', color: 'var(--hq-primary-text)' }}>1. الإعدادات والواجهة (Basic Attributes)</h3>
                <div className="hq-df-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div className="hq-df-group">
                        <label>عنوان واسم الكورس <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" value={course.title} onChange={e => markCourseDirty({ ...course, title: e.target.value })} placeholder="الفيزياء - السادس العلمي" />
                    </div>
                    <div className="hq-df-group">
                        <label>الأستاذ للمادة <span style={{ color: 'red' }}>*</span></label>
                        <select value={course.teacher || ''} onChange={e => {
                            const tId = e.target.value;
                            const t = teachers.find(x => x.id == tId);
                            markCourseDirty({
                                ...course,
                                teacher: tId,
                                subject: t && t.subjects && t.subjects.length > 0 ? t.subjects[0] : '',
                                grade: t && t.grades && t.grades.length > 0 ? t.grades[0] : '',
                                branches: t && t.branches ? t.branches : [],
                            })
                        }}>
                            <option value="">-- يرجى اختيار الأستاذ --</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>م. {t.name || t.user}</option>)}
                        </select>
                    </div>
                    <div className="hq-df-group">
                        <label>التسعيرة الإجمالية (د.ع) <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" value={course.price} onChange={e => markCourseDirty({ ...course, price: e.target.value })} />
                    </div>

                    <div className="hq-df-group">
                        <label>سعة مجموعة الشات للطلاب (للمساعد) <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" min="50" max="1000" value={course.students_per_group || 200} onChange={e => markCourseDirty({ ...course, students_per_group: parseInt(e.target.value) || 200 })} />
                    </div>

                    <div className="hq-df-group">
                        <label>لون الهوية البصرية (Theme)</label>
                        <select value={course.color || 'blue'} onChange={e => markCourseDirty({ ...course, color: e.target.value })}>
                            <option value="blue">أزرق سماوي</option>
                            <option value="red">أحمر ناري</option>
                            <option value="green">أخضر زمردي</option>
                            <option value="purple">رصاصي بنفسجي</option>
                            <option value="orange">برتقالي ملتهب</option>
                        </select>
                    </div>

                    <div className="hq-df-group">
                        <label>الترتيب (الأقل يظهر أولاً)</label>
                        <input type="number" value={course.order || 0} onChange={e => markCourseDirty({ ...course, order: parseInt(e.target.value) || 0 })} />
                    </div>

                    <div className="hq-df-group">
                        <label>جمهور الدورة (نظام الدفعات)</label>
                        <select value={course.audience || 'all'} onChange={e => markCourseDirty({ ...course, audience: e.target.value })}>
                            <option value="all">الكل (الوضع الحالي)</option>
                            <option value="new">الطلاب الجدد فقط</option>
                            <option value="legacy">الطلاب القدامى فقط</option>
                        </select>
                        <small style={{ color: '#94a3b8', fontSize: '0.75rem' }}>يعمل فقط عند تفعيل نظام الدفعات من إعدادات المنصة</small>
                    </div>

                    <div className="hq-df-group">
                        <label>نوع الدورة (مدفوعة / مجانية)</label>
                        <div
                            onClick={() => markCourseDirty({ ...course, is_free: !course.is_free })}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '8px', cursor: 'pointer', userSelect: 'none', background: course.is_free ? '#f0fdf4' : '#f8fafc', border: `1.5px solid ${course.is_free ? '#86efac' : '#e2e8f0'}` }}
                        >
                            <input type="checkbox" id="crs-free" checked={!!course.is_free} readOnly style={{ pointerEvents: 'none', width: '17px', height: '17px' }} />
                            <div style={{ margin: 0 }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: course.is_free ? '#16a34a' : '#334155' }}>
                                    {course.is_free ? '✅ مجانية بالكامل' : 'مدفوعة عادية (تُباع بكود)'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>
                                    {course.is_free
                                        ? 'تُضاف تلقائياً مجاناً في «دوراتي» لكل طالب من جمهورها'
                                        : 'علّم المربع لتحويلها إلى مجانية تُضاف تلقائياً للطلاب'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="hq-df-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
                    <div className="hq-df-group">
                        <label>صورة الغلاف الاحترافية للكورس (Hero Image) <HiOutlineSparkles style={{ color: '#10b981' }} /></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="file" accept="image/*, image/webp, .webp" onChange={e => {
                                if (e.target.files && e.target.files[0]) { markCourseDirty({ ...course, hero_image: e.target.files[0] }) }
                            }} style={{ flex: 1, fontSize: '0.9rem' }} />
                            <SmartImagePreview fileOrUrl={course.hero_image} />
                        </div>
                    </div>
                </div>
            </div>
            {/* 2. Modules & Tree */}
            <div className="hq-form-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0, marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem' }}>2. وحدات الكورس (Chapters & Modules)</h3>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button className="hq-btn-secondary" onClick={() => addModule(true)} style={{ background: '#f59e0b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(245, 158, 11, 0.3)' }}>
                            <HiOutlinePlus size={20} /> <span>إدراج امتحان أسبوعي</span>
                        </button>
                        <button className="hq-btn-secondary" onClick={() => addModule(false)} style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.3)' }}>
                            <HiOutlinePlus size={20} /> <span>إدراج فصل دراسي جديد</span>
                        </button>
                    </div>
                </div>

                {modules.map((mod, mIndex) => {
                    const isExpanded = expandedModule === mIndex;
                    return (
                        <div key={mod.localId} style={{ background: 'white', borderRadius: '16px', marginBottom: '24px', overflow: 'hidden', border: `1px solid ${isExpanded ? 'var(--hq-primary)' : 'var(--hq-border)'}`, transition: 'all 0.3s' }}>
                            <div
                                style={{ padding: '20px 24px', background: isExpanded ? 'rgba(99, 102, 241, 0.05)' : 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
                                onClick={() => setExpandedModule(isExpanded ? -1 : mIndex)}
                            >
                                <div style={{ display: 'flex', gap: '15px', width: '100%', alignItems: 'center' }}>
                                    <div style={{ width: '35px', height: '35px', background: 'var(--hq-primary)', color: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{mIndex + 1}</div>
                                    {isExpanded ? (
                                        <div style={{ display: 'flex', width: '100%', gap: '10px' }}>
                                            <input type="text" value={mod.title} onChange={e => updateModule(mIndex, 'title', e.target.value)} onClick={e => e.stopPropagation()} placeholder="أدخل اسم الفصل (مثال: الفصل الأول الأعداد المركبة)..." style={{ fontSize: '1.2rem', padding: '5px 15px', flex: 1, border: '2px solid rgba(99, 102, 241, 0.3)', borderRadius: '8px', outline: 'none', background: 'white' }} />
                                            <div style={{ width: '250px', background: 'white', borderRadius: '8px', border: '1px solid #cbd5e1', padding: '5px', display: 'flex', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                                                <input type="file" accept="image/*, image/webp, .webp" onChange={e => { if (e.target.files && e.target.files[0]) updateModule(mIndex, 'cover_image', e.target.files[0]) }} style={{ flex: 1, width: '1px', fontSize: '0.75rem' }} />
                                                <SmartImagePreview fileOrUrl={mod.cover_image} />
                                            </div>
                                        </div>
                                    ) : (
                                        <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{mod.title || 'وحدة دراسية جديدة بدون عنوان'}</h4>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {isExpanded && (
                                        <>
                                            {mod.is_exam && <span style={{ background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 'bold' }}>وحدة امتحان ({mod.weekly_exams?.length || 0})</span>}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)' }} onClick={e => e.stopPropagation()}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: mod.is_free ? '#10b981' : 'inherit' }}>مجانية (Preview)</span>
                                                <div className="hq-toggle-switch">
                                                    <input type="checkbox" id={`m-f-${mod.localId}`} checked={!!mod.is_free} onChange={e => updateModule(mIndex, 'is_free', e.target.checked)} />
                                                    <label htmlFor={`m-f-${mod.localId}`}></label>
                                                </div>
                                            </div>
                                            <button className="hq-action-btn delete" onClick={(e) => { e.stopPropagation(); removeModule(mIndex); }} title="حذف بالكامل مع دروسها"><HiOutlineTrash /></button>
                                        </>
                                    )}
                                    <div style={{ fontSize: '1.5rem', color: 'var(--hq-primary)' }}>{isExpanded ? <HiOutlineChevronUp /> : <HiOutlineChevronDown />}</div>
                                </div>
                            </div>

                            {/* EXAM OR Lessons Body Accordion */}
                            {isExpanded && mod.is_exam && (
                                <div style={{ padding: '24px', background: '#fffbeb', borderTop: '1px solid #fcd34d' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h5 style={{ margin: 0, fontSize: '1rem', color: '#b45309' }}>امتحانات أسبوعية لهذه الوحدة</h5>
                                        <button className="hq-btn-secondary" onClick={() => addWeeklyExam(mIndex)} style={{ padding: '8px 15px', fontSize: '0.9rem', color: '#b45309', borderColor: '#fcd34d', background: 'white', borderRadius: '8px' }}>
                                            + امتحان أسبوعي
                                        </button>
                                    </div>

                                    {(mod.weekly_exams || []).map((exam, eIndex) => (
                                        <div key={exam.localId} style={{ background: 'white', borderRadius: '12px', border: '1px solid #fcd34d', padding: '20px', marginBottom: eIndex < mod.weekly_exams.length - 1 ? '20px' : 0 }}>
                                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                                                <span style={{ fontWeight: 'bold', color: '#b45309', minWidth: '24px' }}>{eIndex + 1}.</span>
                                                <input type="text" placeholder="عنوان الامتحان..." value={exam.title || ''} onChange={e => updateWeeklyExam(mIndex, eIndex, 'title', e.target.value)} style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none', fontWeight: 'bold' }} />
                                                {(mod.weekly_exams?.length > 1) && (
                                                    <button className="hq-action-btn delete" onClick={() => removeWeeklyExam(mIndex, eIndex)} title="حذف الامتحان"><HiOutlineTrash /></button>
                                                )}
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>وقت بداية الامتحان (تاريخ ووقت)</label>
                                                    <input type="datetime-local" value={exam.exam_start_time || ''} onChange={e => updateWeeklyExam(mIndex, eIndex, 'exam_start_time', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>آخر موعد للتسليم (تاريخ ووقت النهاية)</label>
                                                    <input type="datetime-local" value={exam.exam_end_time || ''} onChange={e => updateWeeklyExam(mIndex, eIndex, 'exam_end_time', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>العلامة العظمى للامتحان</label>
                                                    <input type="number" value={exam.exam_total_mark || 100} onChange={e => updateWeeklyExam(mIndex, eIndex, 'exam_total_mark', parseInt(e.target.value))} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>طريقة الاستلام (رفع ملف PDF)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '5px 12px', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                                                        <input type="file" accept=".pdf" onChange={e => {
                                                            if (e.target.files && e.target.files[0]) updateWeeklyExam(mIndex, eIndex, 'exam_file', e.target.files[0])
                                                        }} style={{ flex: 1, fontSize: '0.85rem' }} />
                                                    </div>
                                                    {typeof exam.exam_file === 'string' && exam.exam_file && <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '5px' }}>يوجد ملف محفوظ.</div>}
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '16px' }}>
                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>تعليمات وإرشادات إضافية</label>
                                                <textarea value={exam.exam_instructions || ''} onChange={e => updateWeeklyExam(mIndex, eIndex, 'exam_instructions', e.target.value)} placeholder="مثال: يرجى كتابة الإجابة بخط واضح..." style={{ width: '100%', height: '70px', padding: '12px', borderRadius: '8px', border: '1px solid #fcd34d', outline: 'none', resize: 'vertical' }}></textarea>
                                            </div>
                                        </div>
                                    ))}

                                    <p style={{ fontSize: '0.8rem', color: '#92400e', marginTop: '15px' }}>يمكنك إضافة أكثر من امتحان أسبوعي لنفس الوحدة (مثلاً امتحان كل أسبوع).</p>
                                </div>
                            )}

                            {isExpanded && !mod.is_exam && (
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--hq-text-main)' }}>محتوى وملفات الفصل</h5>
                                        <button className="hq-btn-secondary" onClick={() => addLesson(mIndex)} style={{ padding: '8px 15px', fontSize: '0.9rem', color: '#10b981', borderColor: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '8px' }}>
                                            + درس محتوى جديد
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {mod.lessons.map((less, lIndex) => (
                                            <div key={less.localId} style={{ background: 'var(--hq-surface)', borderRadius: '12px', border: `1px solid ${less.is_published ? 'var(--hq-border)' : '#fca5a5'}`, padding: '15px' }}>
                                                {/* Lesson Generic Top Bar (Just Title & Video Link) */}
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: less.showAdvanced ? '15px' : '0' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <button onClick={() => moveLesson(mIndex, lIndex, -1)} disabled={lIndex === 0} title="تحريك للأعلى"
                                                            style={{ border: '1px solid #d1d5db', background: 'white', borderRadius: '5px', cursor: lIndex === 0 ? 'not-allowed' : 'pointer', opacity: lIndex === 0 ? 0.35 : 1, lineHeight: 0, padding: '2px', color: '#475569' }}>
                                                            <HiOutlineChevronUp size={13} />
                                                        </button>
                                                        <button onClick={() => moveLesson(mIndex, lIndex, 1)} disabled={lIndex === mod.lessons.length - 1} title="تحريك للأسفل"
                                                            style={{ border: '1px solid #d1d5db', background: 'white', borderRadius: '5px', cursor: lIndex === mod.lessons.length - 1 ? 'not-allowed' : 'pointer', opacity: lIndex === mod.lessons.length - 1 ? 0.35 : 1, lineHeight: 0, padding: '2px', color: '#475569' }}>
                                                            <HiOutlineChevronDown size={13} />
                                                        </button>
                                                    </div>
                                                    <div style={{ width: '24px', height: '24px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold', flexShrink: 0 }}>{lIndex + 1}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <input type="text" placeholder="عنوان الدرس..." value={less.title} onChange={e => updateLesson(mIndex, lIndex, 'title', e.target.value)} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: 'white', fontWeight: 'bold' }} />
                                                    </div>
                                                    <div style={{ flex: 1.5 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white' }}>
                                                            <span style={{ padding: '0 10px', color: '#94a3b8' }}><HiOutlineVideoCamera size={18} /></span>
                                                            <input type="text" placeholder="رابط الفيديو (Video URL)..." value={less.video_url} onChange={e => updateLesson(mIndex, lIndex, 'video_url', e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 0', border: 'none', background: 'transparent', outline: 'none', direction: 'ltr' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${less.is_published ? '#86efac' : '#fca5a5'}` }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold', color: less.is_published ? '#16a34a' : '#ef4444' }}>
                                                            {less.is_published ? 'منشور' : 'غير منشور'}
                                                        </span>
                                                        <div className="hq-toggle-switch publish-toggle">
                                                            <input
                                                                type="checkbox"
                                                                id={`l-pub-${less.localId}`}
                                                                checked={!!less.is_published}
                                                                onChange={e => handleLessonPublishToggle(mIndex, lIndex, e.target.checked)}
                                                            />
                                                            <label htmlFor={`l-pub-${less.localId}`}></label>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>مقبوض (مقفول)</span>
                                                        <div className="hq-toggle-switch">
                                                            <input type="checkbox" id={`l-lock-${less.localId}`} checked={!!less.is_locked} onChange={e => updateLesson(mIndex, lIndex, 'is_locked', e.target.checked)} />
                                                            <label htmlFor={`l-lock-${less.localId}`}></label>
                                                        </div>
                                                    </div>
                                                    <button className="hq-action-btn edit" onClick={() => { if (!less.showAdvanced) ensureLessonHeavy(mIndex, lIndex); updateLesson(mIndex, lIndex, 'showAdvanced', !less.showAdvanced) }} title="متقدم ومستندات" style={{ background: less.showAdvanced ? 'var(--hq-primary)' : 'white', color: less.showAdvanced ? 'white' : 'var(--hq-primary-text)' }}><HiOutlineCog /></button>
                                                    <button className="hq-action-btn delete" onClick={() => removeLesson(mIndex, lIndex)}><HiOutlineTrash /></button>
                                                </div>

                                                {/* Lesson Advanced Settings (Docs & Quizzes) */}
                                                {less.showAdvanced && (
                                                    <div style={{ background: 'white', padding: '20px', borderRadius: '10px', border: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                                            <div>
                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlinePaperClip size={16} /> إرفاق ملزمة / مستند للدرس (PDF)
                                                                </label>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                                    <input type="file" accept=".pdf,.doc,.docx" onChange={e => {
                                                                        if (e.target.files && e.target.files[0]) { updateLesson(mIndex, lIndex, 'doc_file', e.target.files[0]) }
                                                                    }} style={{ fontSize: '0.8rem', width: '100%' }} />
                                                                </div>
                                                                {typeof less.doc_file === 'string' && less.doc_file && <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', marginTop: '5px' }}>يوجد ملف مرفوع مسبقاً (سيتم الاحتفاظ به).</span>}

                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', margin: '15px 0 8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlineDocumentText size={16} /> إضافة سلايدات تفاعلية (HTML Iframe)
                                                                </label>
                                                                <textarea value={less.interactive_html || ''} onChange={e => updateLesson(mIndex, lIndex, 'interactive_html', e.target.value)} placeholder="كود Iframe للسلايدات إن وجد..." style={{ width: '100%', height: '50px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'none', outline: 'none', fontFamily: 'monospace', direction: 'ltr', background: '#f8fafc', fontSize: '0.9rem' }} />

                                                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', margin: '15px 0 8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlineDocumentText size={16} /> نص محتوى الدرس بالكامل (اختياري)
                                                                </label>
                                                                <textarea value={less.lesson_text || ''} onChange={e => updateLesson(mIndex, lIndex, 'lesson_text', e.target.value)} placeholder="أدخل محتوى نص الدرس بالكامل إن وجد للرجوع إليه لاحقاً..." style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical', outline: 'none', background: '#f8fafc', fontSize: '0.9rem' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlineCog /> صورة الغلاف للدرس (Upload Image)
                                                                </label>
                                                                <div style={{ background: '#white', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center' }}>
                                                                    <input type="file" accept="image/*, image/webp, .webp" onChange={e => {
                                                                        if (e.target.files && e.target.files[0]) updateLesson(mIndex, lIndex, 'cover_image', e.target.files[0])
                                                                    }} style={{ flex: 1, width: '1px', fontSize: '0.85rem' }} />
                                                                    <SmartImagePreview fileOrUrl={less.cover_image} />
                                                                </div>

                                                                <label style={{ display: 'block', fontSize: '0.85rem', margin: '14px 0 8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlineCog /> المعرف السري للمختبر الافتراضي (slug)
                                                                </label>
                                                                <input type="text" value={less.virtual_lab_slug || ''} onChange={e => updateLesson(mIndex, lIndex, 'virtual_lab_slug', e.target.value)} placeholder="مثال: biology-frog-dissection" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', direction: 'ltr', background: '#f8fafc', fontFamily: 'monospace' }} />

                                                                <label style={{ display: 'block', fontSize: '0.85rem', margin: '14px 0 8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>المدة الزمنية للدرس كاملاً</label>
                                                                <input type="text" value={less.duration || ''} onChange={e => updateLesson(mIndex, lIndex, 'duration', e.target.value)} placeholder="مثال: 15:30" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none' }} />
                                                            </div>
                                                        </div>

                                                        {/* IN-VIDEO QUIZZES & AD CONFIG (DESKTOP PLAYER ONLY) */}
                                                        <div style={{ borderTop: '2px dashed #93c5fd', paddingTop: '20px', marginTop: '10px', background: 'rgba(59, 130, 246, 0.03)', borderRadius: '10px', padding: '15px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                                <span style={{ fontWeight: 'bold', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem' }}><HiOutlineVideoCamera size={22} /> إعدادات المشغل المكتبي المندمجة</span>
                                                            </div>

                                                            <div style={{ marginBottom: '20px' }}>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>YouTube ID لإعلان نهاية الدرس (اختياري)</label>
                                                                <input type="text" value={less.json_data?.ad_video_id || ''} onChange={e => updateLessonJsonData(mIndex, lIndex, 'ad_video_id', e.target.value)} placeholder="مثال: dQw4w9WgXcQ (سيتم تشغيله تلقائياً بالنهاية)" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #93c5fd', outline: 'none', direction: 'ltr', background: '#eff6ff' }} />
                                                            </div>

                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>الأسئلة المفاجئة بمنتصف الفيديو (تظهر تلقائياً بنسب 25%، 50%، 75%)</span>
                                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                                    <button className="hq-btn-secondary" onClick={() => handleShuffleSurpriseQuizzes(mIndex, lIndex)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' }}>لخبطة الخيارات</button>
                                                                    <button className="hq-btn-primary" onClick={() => handleGenerateSurpriseQuestions(mIndex, lIndex)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', background: '#8b5cf6', borderColor: '#8b5cf6' }}><HiOutlineSparkles style={{ display: 'inline', marginRight: '4px' }} /> توليد الأسئلة الـ 3 بالذكاء الاصطناعي</button>
                                                                </div>
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                                {([0,1,2]).map((ivqIdx) => {
                                                                    // Ensure we have 3 quizzes
                                                                    if (!less.json_data) less.json_data = { ad_video_id: '', in_video_quizzes: [] };
                                                                    if (!less.json_data.in_video_quizzes) less.json_data.in_video_quizzes = [];
                                                                    while (less.json_data.in_video_quizzes.length < 3) {
                                                                        less.json_data.in_video_quizzes.push({ time: 0, hint: '', question: '', options: ['', ''], correct: 0, explanations: ['', ''] });
                                                                    }
                                                                    const ivq = less.json_data.in_video_quizzes[ivqIdx];
                                                                    
                                                                    const quizLabels = ["سؤال الـ 25% (يظهر في الربع الأول)", "سؤال الـ 50% (يظهر في المنتصف)", "سؤال الـ 75% (يظهر في الربع الأخير)"];
                                                                    
                                                                    return (
                                                                    <div key={`ivq-${ivqIdx}`} style={{ background: 'white', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '15px', position: 'relative' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2563eb' }}>{quizLabels[ivqIdx]}</div>
                                                                            <button onClick={() => handleShuffleSingleSurprise(mIndex, lIndex, ivqIdx)} style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                <HiOutlineSparkles /> لخبطة هذا السؤال
                                                                            </button>
                                                                        </div>
                                                                        
                                                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                                            <div style={{ flex: 1.5 }}>
                                                                                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>نص السؤال</label>
                                                                                <input type="text" value={ivq.question || ''} onChange={e => updateInVideoQuiz(mIndex, lIndex, ivqIdx, 'question', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: ivq.question ? '1px solid #cbd5e1' : '1px solid #ef4444', outline: ivq.question ? 'none' : '2px solid #fee2e2' }} placeholder="السؤال الموجه للطالب..." />
                                                                                {!ivq.question && <small style={{ color: '#ef4444', fontSize: '0.7rem' }}>يرجى إدخال السؤال حتى يظهر للطالب بشكل صحيح</small>}
                                                                            </div>
                                                                            <div style={{ flex: 1 }}>
                                                                                <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>التلميح (Hint)</label>
                                                                                <input type="text" value={ivq.hint || ''} onChange={e => updateInVideoQuiz(mIndex, lIndex, ivqIdx, 'hint', e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }} placeholder="تلميح: ذكرت هذه المعلومة بالدقيقة كذا..." />
                                                                            </div>
                                                                        </div>

                                                                        <div>
                                                                            <label style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>الخيارات</label>
                                                                            {(ivq.options || []).map((opt, optIdx) => (
                                                                                <div key={`opt-${optIdx}`} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                                                                                    <input type="radio" checked={ivq.correct === optIdx} onChange={() => updateInVideoQuiz(mIndex, lIndex, ivqIdx, 'correct', optIdx)} name={`ivq-corr-${lIndex}-${ivqIdx}`} style={{ accentColor: '#3b82f6' }} />
                                                                                    <input type="text" value={opt} onChange={e => updateInVideoQuizOption(mIndex, lIndex, ivqIdx, optIdx, e.target.value)} placeholder={`خيار ${optIdx+1}`} style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '0.85rem' }} />
                                                                                    <input type="text" value={(ivq.explanations && ivq.explanations[optIdx]) || ''} onChange={e => updateInVideoQuizExplanation(mIndex, lIndex, ivqIdx, optIdx, e.target.value)} placeholder="التفسير (إن وُجد)" style={{ flex: 1.5, padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', outline: 'none', fontSize: '0.85rem' }} />
                                                                                    <button onClick={() => removeInVideoQuizOption(mIndex, lIndex, ivqIdx, optIdx)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><HiOutlineTrash /></button>
                                                                                </div>
                                                                            ))}
                                                                            <button style={{ fontSize: '0.75rem', background: '#e2e8f0', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', marginTop: '5px' }} onClick={() => addInVideoQuizOption(mIndex, lIndex, ivqIdx)}>+ إضافة خيار</button>
                                                                        </div>
                                                                    </div>
                                                                )})}
                                                            </div>
                                                        </div>

                                                        {/* QUIZZ BUILDER ENGINE */}
                                                        <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '20px', marginTop: '10px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', padding: '0 5px' }}>
                                                                <span style={{ fontWeight: 'bold', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}><HiOutlinePuzzlePiece size={22} /> محرك الاختبارات الذكي</span>
                                                                {less.quizzes.length === 0 && <button className="hq-btn-primary" style={{ padding: '8px 15px', borderRadius: '20px', fontSize: '0.85rem' }} onClick={() => addQuiz(mIndex, lIndex)}>+ إرفاق اختبار</button>}
                                                            </div>

                                                            {less.quizzes.map((qz, qzIndex) => (
                                                                <div key={qz.localId} style={{ background: '#fdfdfd', border: '1px solid var(--hq-primary)', borderRadius: '12px', padding: '15px' }}>
                                                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: qz.showBuilder ? '25px' : '0' }}>
                                                                        <input type="text" value={qz.title} onChange={e => updateQuiz(mIndex, lIndex, qzIndex, 'title', e.target.value)} placeholder="عنوان الاختبار الذكي (مثال: اختبار الفهم العميق)..." style={{ flex: 2, padding: '10px 15px', border: '1px solid #ccc', borderRadius: '8px', outline: 'none', fontWeight: 'bold', fontSize: '0.95rem' }} />
                                                                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f1f5f9', borderRadius: '8px', padding: '5px 15px', border: '1px solid #e2e8f0' }}>
                                                                            <span style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 'bold' }}>المدة(د):</span>
                                                                            <input type="number" value={qz.duration_minutes} onChange={e => updateQuiz(mIndex, lIndex, qzIndex, 'duration_minutes', parseInt(e.target.value) || 15)} style={{ width: '60px', padding: '5px', border: 'none', background: 'transparent', outline: 'none', textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem' }} />
                                                                        </div>
                                                                        <button className="hq-action-btn edit" onClick={() => updateQuiz(mIndex, lIndex, qzIndex, 'showBuilder', !qz.showBuilder)} style={{ background: qz.showBuilder ? 'var(--hq-primary)' : '#e2e8f0', color: qz.showBuilder ? 'white' : '#475569', padding: '0 20px', borderRadius: '8px' }}>{qz.showBuilder ? 'إخفاء أسئلة' : 'الأسئلة والإجابات'}</button>
                                                                        {qz.questions.length === 0 && <button className="hq-action-btn delete" onClick={() => removeQuiz(mIndex, lIndex, qzIndex)}><HiOutlineTrash /></button>}
                                                                    </div>

                                                                    {qz.showBuilder && (
                                                                        <div style={{ padding: '25px', background: 'white', borderRadius: '10px', boxShadow: '0 5px 25px rgba(0,0,0,0.04)', border: '1px solid #e2e8f0' }}>
                                                                            {qz.questions.map((qs, qsIndex) => (
                                                                                <div key={qs.localId} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '20px', borderBottom: '1px dashed #e2e8f0', position: 'relative', background: '#fafafa', borderRadius: '10px', marginBottom: '15px' }}>
                                                                                    <div style={{ position: 'absolute', left: '15px', top: '20px', display: 'flex', gap: '8px' }}>
                                                                                        {(!qs.question_type || qs.question_type === 'MCQ') && (
                                                                                            <button onClick={() => handleShuffleSingleSmart(mIndex, lIndex, qzIndex, qsIndex)} style={{ background: 'white', padding: '5px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} title="لخبطة الخيارات"><HiOutlineSparkles size={14} /> لخبطة</button>
                                                                                        )}
                                                                                        <button onClick={() => removeQuestion(mIndex, lIndex, qzIndex, qsIndex)} style={{ background: 'white', padding: '5px', border: '1px solid #ffccd5', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }} title="حذف السؤال"><HiOutlineTrash size={18} /></button>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                                                                        <span style={{ background: 'var(--hq-primary)', color: 'white', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{qsIndex + 1}</span>
                                                                                        <div style={{ flex: 1 }}>
                                                                                            <textarea value={qs.text} onChange={e => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'text', e.target.value)} placeholder={`نص السؤال الجوهري رقم ${qsIndex + 1}...`} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', resize: 'none', minHeight: '60px', fontFamily: 'inherit' }} />
                                                                                        </div>
                                                                                        <div style={{ width: '200px' }}>
                                                                                            <select value={qs.question_type || 'MCQ'} onChange={e => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'question_type', e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', background: 'white' }}>
                                                                                                <option value="MCQ">اختيار من متعدد</option>
                                                                                                <option value="MATH_EQUATION">معادلة رياضية</option>
                                                                                                <option value="SCIENCE_TEXT">سؤال نصي علمي</option>
                                                                                            </select>
                                                                                        </div>
                                                                                    </div>
                                                                                    
                                                                                    {(!qs.question_type || qs.question_type === 'MCQ') ? (
                                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', paddingRight: '45px', marginTop: '5px' }}>
                                                                                            {qs.options.map((opt, optIndex) => (
                                                                                                <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `2px solid ${qs.correct_index === optIndex ? '#10b981' : '#f1f5f9'}`, borderRadius: '8px', padding: '8px 12px', background: qs.correct_index === optIndex ? 'rgba(16,185,129,0.05)' : 'white', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'correct_index', optIndex)}>
                                                                                                    <input type="radio" name={`qs-${qs.localId}`} checked={qs.correct_index === optIndex} onChange={() => { }} style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer' }} />
                                                                                                    <input type="text" value={opt} onChange={e => updateQuestionOption(mIndex, lIndex, qzIndex, qsIndex, optIndex, e.target.value)} placeholder={`خيار ${optIndex + 1}`} onClick={e => e.stopPropagation()} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.95rem', fontWeight: qs.correct_index === optIndex ? 'bold' : 'normal' }} />
                                                                                                    <input type="text" value={qs.options_explanations ? qs.options_explanations[optIndex] : ''} onChange={e => updateQuestionOptionExplanation(mIndex, lIndex, qzIndex, qsIndex, optIndex, e.target.value)} placeholder="شرح مبسط للإجابة (لماذا خطأ/صح)" onClick={e => e.stopPropagation()} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', flex: 1.5, fontSize: '0.85rem', padding: '6px 10px', borderRadius: '6px' }} />
                                                                                                </div>
                                                                                            ))}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '45px', marginTop: '5px' }}>
                                                                                            <div>
                                                                                                <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>الإجابة النموذجية (المعادلة أو النص الأساسي)</label>
                                                                                                {qs.question_type === 'MATH_EQUATION' ? (
                                                                                                    <MathInput value={qs.model_answer || ''} onChange={(val) => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'model_answer', val)} />
                                                                                                ) : (
                                                                                                    <textarea value={qs.model_answer || ''} onChange={e => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'model_answer', e.target.value)} placeholder="اكتب الإجابة النموذجية هنا..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', resize: 'vertical' }} />
                                                                                                )}
                                                                                            </div>
                                                                                            
                                                                                            {qs.question_type === 'SCIENCE_TEXT' && (
                                                                                                <div>
                                                                                                    <label style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '5px' }}>الكلمات المفتاحية (افصل بينها بفاصلة)</label>
                                                                                                    <input type="text" value={Array.isArray(qs.keywords) ? qs.keywords.join(', ') : qs.keywords || ''} onChange={e => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'keywords', e.target.value.split(',').map(k => k.trim()).filter(k => k))} placeholder="مثال: طاقة، حرارة، تفاعل..." style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                            <div style={{ marginTop: '20px', padding: '20px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '10px' }}>
                                                                                <h5 style={{ margin: 0, marginBottom: '10px', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}><HiOutlineSparkles /> عجلة التوليد الذكي (ألصق الأسئلة لتوليدها دفعة واحدة)</h5>
                                                                                <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '10px' }}>الصيغة: السؤال، ثم (* إجابة صحيحة)، ثم (- إجابة خاطئة). ويمكنك إضافة شرح للخيار بين قوسين في النهاية (الشرح).</p>
                                                                                <textarea
                                                                                    id={`bulk-${qz.localId}`}
                                                                                    placeholder="مثال:&#10;ماهي عاصمة العراق؟&#10;* بغداد (مركز الدولة)&#10;- الموصل (محافظة عادية)&#10;- البصرة"
                                                                                    style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
                                                                                />
                                                                                <div style={{ textAlign: 'right', marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                                                        <button className="hq-btn-secondary" onClick={() => addQuestion(mIndex, lIndex, qzIndex)} style={{ background: '#eff6ff', color: '#3b82f6', borderColor: '#3b82f6', padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>+ سؤال يدوي واحد</button>
                                                                                        <button className="hq-btn-secondary" onClick={() => handleShuffleSmartQuiz(mIndex, lIndex, qzIndex)} style={{ background: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1', padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>لخبطة كل الخيارات</button>
                                                                                    </div>
                                                                                    <div style={{ display: 'flex', gap: '10px' }}>
                                                                                        <button className="hq-btn-primary" onClick={() => handleGenerateTextQuestions(mIndex, lIndex, qzIndex)} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', background: '#8b5cf6', borderColor: '#8b5cf6' }}><HiOutlineSparkles style={{ display: 'inline', marginRight: '4px' }} /> توليد 100 سؤال من النص (AI)</button>
                                                                                        <button className="hq-btn-primary" onClick={() => {
                                                                                            const val = document.getElementById(`bulk-${qz.localId}`).value;
                                                                                            handleBulkQuestions(mIndex, lIndex, qzIndex, val);
                                                                                            document.getElementById(`bulk-${qz.localId}`).value = '';
                                                                                        }} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem' }}>توليد الأسئلة سحرياً سับ</button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {mod.lessons.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', background: 'white', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>المحتوى فارغ حالياً. اضغط على أضف درس محتوى جديد لتجهيز أول محاضرة في هذا الفصل.</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* 3. Course-Level Ministerial Docs */}
            <div className="hq-form-card" style={{ background: 'transparent', boxShadow: 'none', padding: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <HiOutlineDocumentText size={22} color="var(--hq-primary)" />
                        3. المستندات الدورة الآمنة (Course Library)
                    </h3>
                    <button className="hq-btn-secondary" onClick={addCourseDoc} style={{ background: '#f8fafc', color: 'var(--hq-primary)', border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '10px' }}>
                        <HiOutlinePlus size={20} /> <span>إضافة ملف PDF للدورة</span>
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', background: 'white', borderRadius: '16px', padding: '20px', border: '1px solid var(--hq-border)' }}>
                    {courseDocs.map((doc, dIndex) => (
                        <div key={doc.localId} style={{ display: 'flex', alignItems: 'center', gap: '15px', background: '#f8fafc', padding: '15px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                            <div style={{ flex: 1 }}>
                                <input type="text" placeholder="عنوان الملزمة أو الأسئلة الوزارية..." value={doc.title} onChange={e => updateCourseDoc(dIndex, 'title', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', outline: 'none', fontWeight: 'bold' }} />
                            </div>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                <input type="file" accept=".pdf,.doc" onChange={e => {
                                    if (e.target.files && e.target.files[0]) updateCourseDoc(dIndex, 'file', e.target.files[0])
                                }} style={{ width: '100%', fontSize: '0.85rem' }} />
                            </div>
                            {typeof doc.file === 'string' && doc.file && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>ملف محفوظ</span>}
                            <div style={{ width: '150px' }}>
                                <select value={doc.doc_type} onChange={e => updateCourseDoc(dIndex, 'doc_type', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ccc' }}>
                                    <option value="PDF">ملزمة PDF</option>
                                    <option value="DOC">ملف نصي DOC</option>
                                    <option value="EXAM">نموذج وزاري</option>
                                </select>
                            </div>
                            <button className="hq-action-btn delete" onClick={() => removeCourseDoc(dIndex)}><HiOutlineTrash size={18} /></button>
                        </div>
                    ))}
                    {courseDocs.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>لا توجد أي مستندات مرفقة بكامل الدورة حالياً. استخدم هذا القسم لرفع أسئلة وزارية أو ملف شامل.</p>}
                </div>
            </div>

            <div style={{ height: '50px' }}></div>

            {/* Copy Course Modal */}
            {copyModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999 }}>
                    <div style={{ background: 'white', borderRadius: '16px', padding: '30px', width: '90%', maxWidth: '500px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        <h3 style={{ margin: '0 0 20px 0', fontSize: '1.3rem', color: '#1e293b' }}>استنساخ محتويات من دورة أخرى</h3>
                        <p style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '20px', fontWeight: 'bold' }}>تنبيه: سيتم مسح جميع المحتويات (دروس، امتحانات، ملفات) الحالية الخاصة بهذه الدورة واستبدالها بنسخة من الدورة المختارة أدناه.</p>
                        
                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>اختر الدورة المصدر:</label>
                            <select value={sourceCourseId} onChange={e => setSourceCourseId(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', fontSize: '1rem' }}>
                                <option value="">-- يرجى اختيار الدورة --</option>
                                {allCourses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                            {allCourses.length === 0 && (
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>
                                    لا توجد دورات أخرى لنفس الأستاذ يمكن النسخ منها.
                                </p>
                            )}
                        </div>

                        <div style={{ marginBottom: '25px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>ماذا يُنسخ مع الدروس؟</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer', color: '#1e293b' }}>
                                <input type="checkbox" checked={copyWeeklyExams} onChange={e => setCopyWeeklyExams(e.target.checked)} />
                                <span>الامتحانات الأسبوعية</span>
                                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>(مستثناة افتراضياً — نزّلها يدوياً لاحقاً)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer', color: '#1e293b' }}>
                                <input type="checkbox" checked={copyQuizzes} onChange={e => setCopyQuizzes(e.target.checked)} />
                                <span>كويزات الدروس وأسئلتها</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#1e293b' }}>
                                <input type="checkbox" checked={copyMinisterialDocs} onChange={e => setCopyMinisterialDocs(e.target.checked)} />
                                <span>ملفات الدورة (الملزمات والوزاريات القديمة)</span>
                            </label>
                        </div>

                        {/* لوحة التقدم والسجل الحي — تظهر بعد بدء النسخ */}
                        {copyJob && (
                            <div style={{ marginBottom: '20px' }}>
                                {copyJob.state === 'running' && copyJob.total_modules > 0 && (
                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', color: '#334155', marginBottom: '5px' }}>
                                            <span>الوحدة {copyJob.done_modules}/{copyJob.total_modules}</span>
                                            <span>{copyJob.lessons_done} درس</span>
                                        </div>
                                        <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '999px', overflow: 'hidden' }}>
                                            <div style={{ height: '100%', width: `${Math.round((copyJob.done_modules / copyJob.total_modules) * 100)}%`, background: '#3b82f6', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                )}
                                {copyJob.state === 'done' && (
                                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '10px', padding: '12px', color: '#16a34a', fontWeight: 'bold', marginBottom: '10px' }}>
                                        ✅ اكتمل النسخ بنجاح — {copyJob.copied?.modules ?? '؟'} وحدة، {copyJob.copied?.lessons ?? '؟'} درس
                                    </div>
                                )}
                                {copyJob.state === 'failed' && (
                                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px', color: '#dc2626', fontWeight: 'bold', marginBottom: '10px' }}>
                                        ❌ فشل النسخ: {copyJob.error || 'خطأ غير معروف'}
                                    </div>
                                )}
                                <div style={{ background: '#0f172a', color: '#e2e8f0', borderRadius: '10px', padding: '12px', maxHeight: '220px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.78rem', direction: 'rtl', textAlign: 'right', whiteSpace: 'pre-wrap' }}>
                                    {(copyJob.log || []).map((line, i) => <div key={i}>{line}</div>)}
                                    {copyJob.trace && (
                                        <div style={{ color: '#fca5a5', marginTop: '8px', direction: 'ltr', textAlign: 'left' }}>{copyJob.trace}</div>
                                    )}
                                    {(!copyJob.log || copyJob.log.length === 0) && !copyJob.trace && <div>بانتظار أول تحديث من السيرفر...</div>}
                                </div>
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            {copyJob && (copyJob.state === 'failed' || copyJob.trace) && (
                                <button onClick={copyLogToClipboard} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#b45309', fontWeight: 'bold', cursor: 'pointer', marginLeft: 'auto' }}>
                                    📋 انسخ اللوغ لإرساله
                                </button>
                            )}
                            {copyJob?.state === 'done' ? (
                                <button onClick={() => window.location.reload()} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                                    تحديث الصفحة وعرض المحتوى
                                </button>
                            ) : (
                                <>
                                    <button onClick={() => { setCopyModalOpen(false); if (copyJob?.state === 'failed') { setCopying(false); setCopyJob(null) } }} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'white', color: '#64748b', cursor: 'pointer' }}>
                                        {copying && copyJob?.state !== 'failed' ? 'إخفاء (النسخ مستمر بالخلفية)' : 'إلغاء'}
                                    </button>
                                    <button onClick={handleCopyContent} disabled={(copying && copyJob?.state !== 'failed') || !sourceCourseId} style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ef4444', color: 'white', fontWeight: 'bold', cursor: ((copying && copyJob?.state !== 'failed') || !sourceCourseId) ? 'not-allowed' : 'pointer' }}>
                                        {copying && copyJob?.state !== 'failed' ? 'جاري النسخ...' : (copyJob?.state === 'failed' ? 'إعادة المحاولة' : 'موافق، ابدأ الاستنساخ')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
