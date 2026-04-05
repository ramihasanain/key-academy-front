import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineArrowRight, HiOutlineCheckCircle, HiOutlinePlus, HiOutlineTrash, HiOutlineChevronDown, HiOutlineChevronUp, HiOutlineDocumentText, HiOutlinePuzzlePiece, HiOutlineCog, HiOutlineVideoCamera, HiOutlinePaperClip, HiOutlineSparkles } from 'react-icons/hi2'
import './Admin.css'

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
        students_per_group: 200
    })

    const [courseDocs, setCourseDocs] = useState([]) // MinisterialDocs
    const [modules, setModules] = useState([])
    const [teachers, setTeachers] = useState([])

    // Trash Memory for intelligent deletion
    const [deletedItems, setDeletedItems] = useState({
        modules: [], lessons: [], quizzes: [], questions: [], ministerialdocs: []
    })

    const trackDelete = (type, dbId) => {
        if (!dbId) return
        setDeletedItems(prev => ({ ...prev, [type]: [...prev[type], dbId] }))
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

                const [modRes, lessRes, quizRes, questRes, docsRes] = await Promise.all([
                    fetch(`${API}/api/hq/modules/?page_size=5000`, { headers }),
                    fetch(`${API}/api/hq/lessons/?page_size=5000`, { headers }),
                    fetch(`${API}/api/hq/quizzes/?page_size=5000`, { headers }),
                    fetch(`${API}/api/hq/questions/?page_size=10000`, { headers }),
                    fetch(`${API}/api/hq/ministerialdocs/?page_size=1000`, { headers })
                ])

                const allModules = modRes.ok ? await modRes.json().then(d => d.results || d) : []
                const allLessons = lessRes.ok ? await lessRes.json().then(d => d.results || d) : []
                const allQuizzes = quizRes.ok ? await quizRes.json().then(d => d.results || d) : []
                const allQuestions = questRes.ok ? await questRes.json().then(d => d.results || d) : []
                const allDocs = docsRes.ok ? await docsRes.json().then(d => d.results || d) : []

                // Filter docs by course
                setCourseDocs(allDocs.filter(d => d.course == id).map(d => ({ ...d, localId: d.id })))

                const courseMods = allModules.filter(m => m.course == id).sort((a, b) => a.order - b.order)

                const tree = courseMods.map(m => {
                    const moduleLessons = allLessons.filter(l => l.module == m.id).sort((a, b) => a.order - b.order)
                    return {
                        ...m, localId: m.id,
                        lessons: moduleLessons.map(l => {
                            const lessonQuizzes = allQuizzes.filter(q => q.lesson == l.id)
                            return {
                                ...l, localId: l.id, showAdvanced: false,
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
    const addModule = () => {
        setModules([...modules, { localId: Date.now(), title: '', order: modules.length + 1, is_free: false, lessons: [] }])
        setExpandedModule(modules.length)
    }

    const removeModule = (mIndex) => {
        if (!window.confirm("متأكد من حذف هذه الوحدة بالكامل؟")) return
        const toDel = modules[mIndex]
        trackDelete('modules', toDel.id)
        setModules(modules.filter((_, i) => i !== mIndex))
    }

    const updateModule = (mIndex, field, val) => {
        const newMods = [...modules]; newMods[mIndex][field] = val; setModules(newMods)
    }

    // --- Lesson Operations ---
    const addLesson = (mIndex) => {
        const newMods = [...modules]
        newMods[mIndex].lessons.push({
            localId: Date.now(), title: '', video_url: '', cover_image: '', order: newMods[mIndex].lessons.length + 1, is_locked: true,
            interactive_html: '', virtual_lab_slug: '', doc_file: null, showAdvanced: true, quizzes: []
        })
        setModules(newMods)
    }

    const removeLesson = (mIndex, lIndex) => {
        if (!window.confirm("حذف الدرس بكافة تفاصيله وملفاته؟")) return
        const newMods = [...modules]; const toDel = newMods[mIndex].lessons[lIndex]; trackDelete('lessons', toDel.id);
        newMods[mIndex].lessons = newMods[mIndex].lessons.filter((_, i) => i !== lIndex); setModules(newMods)
    }

    const updateLesson = (mIndex, lIndex, field, val) => {
        const newMods = [...modules]; newMods[mIndex].lessons[lIndex][field] = val; setModules(newMods)
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
        const newMods = [...modules]; newMods[mIndex].lessons[lIndex].quizzes[qzIndex][field] = val; setModules(newMods)
    }

    // --- Question Operations ---
    const addQuestion = (mIndex, lIndex, qzIndex) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.push({
            localId: Date.now(), text: '', options: ['خيار 1', 'خيار 2', 'خيار 3', 'خيار 4'], options_explanations: ['', '', '', ''], correct_index: 0, order: newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.length + 1
        })
        setModules(newMods)
    }

    const removeQuestion = (mIndex, lIndex, qzIndex, qsIndex) => {
        const newMods = [...modules]; const toDel = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]; trackDelete('questions', toDel.id);
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions.filter((_, i) => i !== qsIndex); setModules(newMods)
    }

    const updateQuestion = (mIndex, lIndex, qzIndex, qsIndex, field, val) => {
        const newMods = [...modules]; newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex][field] = val; setModules(newMods)
    }

    const updateQuestionOption = (mIndex, lIndex, qzIndex, qsIndex, optIndex, val) => {
        const newMods = [...modules]
        newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex].options[optIndex] = val
        setModules(newMods)
    }

    const updateQuestionOptionExplanation = (mIndex, lIndex, qzIndex, qsIndex, optIndex, val) => {
        const newMods = [...modules]
        const qs = newMods[mIndex].lessons[lIndex].quizzes[qzIndex].questions[qsIndex]
        if (!qs.options_explanations) qs.options_explanations = ['', '', '', '']
        qs.options_explanations[optIndex] = val
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
            setModules(newMods)
            alert(`تم توليد ${parsedQuestions.length} سؤال بنجاح!`)
        } else {
            alert('لم يتم التعرف على أي أسئلة يرجى التأكد من الصيغة.')
        }
    }

    // --- Course Docs Operations (Ministerial Docs) ---
    const addCourseDoc = () => {
        setCourseDocs([...courseDocs, { localId: Date.now(), title: '', file: null, doc_type: 'PDF' }])
    }
    const updateCourseDoc = (index, field, val) => {
        const newDocs = [...courseDocs]; newDocs[index][field] = val; setCourseDocs(newDocs);
    }
    const removeCourseDoc = (index) => {
        const toDel = courseDocs[index]; trackDelete('ministerialdocs', toDel.id);
        setCourseDocs(courseDocs.filter((_, i) => i !== index));
    }

    // Payload Builder for safe File Upload vs JSON
    const buildPayload = (dataObj) => {
        const fileFields = ['doc_file', 'cover_image', 'hero_image', 'file'];
        let hasFile = false;

        for (const k of fileFields) {
            if (dataObj[k] instanceof File) hasFile = true;
        }

        if (hasFile) {
            const fd = new FormData();
            Object.keys(dataObj).forEach(k => {
                if (dataObj[k] !== null && dataObj[k] !== undefined) {
                    if (fileFields.includes(k)) {
                        if (dataObj[k] instanceof File) {
                            fd.append(k, dataObj[k]);
                        }
                    } else {
                        fd.append(k, dataObj[k]);
                    }
                }
            });
            return { body: fd, isMultipart: true };
        } else {
            const jsonObj = { ...dataObj };
            fileFields.forEach(k => {
                if (typeof jsonObj[k] === 'string') delete jsonObj[k];
            });
            return { body: JSON.stringify(jsonObj), isMultipart: false };
        }
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
            for (const type of ['questions', 'quizzes', 'lessons', 'modules', 'ministerialdocs']) {
                for (const dbId of deletedItems[type]) {
                    await fetch(`${API}/api/hq/${type}/${dbId}/`, { method: 'DELETE', headers: headersJson }).catch(() => { })
                }
            }

            // 2. Clear trash cache locally
            setDeletedItems({ modules: [], lessons: [], quizzes: [], questions: [], ministerialdocs: [] })

            // 3. Save Course Base
            const cPayload = buildPayload(course)
            let cHeaders = cPayload.isMultipart ? headersMulti : headersJson;

            const cRes = await fetch(`${API}/api/hq/courses/${isNew ? '' : `${id}/`}`, {
                method: isNew ? 'POST' : 'PUT', headers: cHeaders, body: cPayload.body
            })
            if (!cRes.ok) throw new Error("فشل اتصال أثناء حفظ بيانات الدورة")
            const savedCourse = await cRes.json()
            const courseId = savedCourse.id

            // 4. Save Course Docs (Ministerial)
            for (const doc of courseDocs) {
                const dData = { ...doc, course: courseId }
                delete dData.localId;
                const pl = buildPayload(dData)
                let hdrs = pl.isMultipart ? headersMulti : headersJson;

                if (doc.id) await fetch(`${API}/api/hq/ministerialdocs/${doc.id}/`, { method: 'PUT', headers: hdrs, body: pl.body })
                else {
                    const r = await fetch(`${API}/api/hq/ministerialdocs/`, { method: 'POST', headers: hdrs, body: pl.body });
                    const sd = await r.json(); doc.id = sd.id;
                }
            }

            // 5. Save Modules -> Lessons -> Quizzes -> Questions (Deep Hierarchy Integration)
            for (const mod of modules) {
                const modData = { ...mod, course: courseId }
                delete modData.lessons; delete modData.localId;

                const pLoad = buildPayload(modData)
                let mHdrs = pLoad.isMultipart ? headersMulti : headersJson;

                let mRes;
                if (mod.id) mRes = await fetch(`${API}/api/hq/modules/${mod.id}/`, { method: 'PUT', headers: mHdrs, body: pLoad.body })
                else mRes = await fetch(`${API}/api/hq/modules/`, { method: 'POST', headers: mHdrs, body: pLoad.body })
                const savedMod = await mRes.json()

                mod.id = savedMod.id

                for (const less of mod.lessons) {
                    const lessData = { ...less, module: savedMod.id }
                    delete lessData.quizzes; delete lessData.localId; delete lessData.showAdvanced;

                    const pLoad = buildPayload(lessData)
                    let lHdrs = pLoad.isMultipart ? headersMulti : headersJson;

                    let lRes;
                    if (less.id) lRes = await fetch(`${API}/api/hq/lessons/${less.id}/`, { method: 'PUT', headers: lHdrs, body: pLoad.body })
                    else lRes = await fetch(`${API}/api/hq/lessons/`, { method: 'POST', headers: lHdrs, body: pLoad.body })
                    const savedLess = await lRes.json()

                    less.id = savedLess.id

                    for (const qz of less.quizzes) {
                        const qzData = { ...qz, lesson: savedLess.id }
                        delete qzData.questions; delete qzData.localId; delete qzData.showBuilder;

                        let qRes;
                        if (qz.id) qRes = await fetch(`${API}/api/hq/quizzes/${qz.id}/`, { method: 'PUT', headers: headersJson, body: JSON.stringify(qzData) })
                        else qRes = await fetch(`${API}/api/hq/quizzes/`, { method: 'POST', headers: headersJson, body: JSON.stringify(qzData) })
                        const savedQz = await qRes.json()

                        qz.id = savedQz.id

                        for (const qs of qz.questions) {
                            const qsData = { ...qs, quiz: savedQz.id }
                            delete qsData.localId;

                            let qsRes;
                            if (qs.id) qsRes = await fetch(`${API}/api/hq/questions/${qs.id}/`, { method: 'PUT', headers: headersJson, body: JSON.stringify(qsData) })
                            else qsRes = await fetch(`${API}/api/hq/questions/`, { method: 'POST', headers: headersJson, body: JSON.stringify(qsData) })

                            const savedQs = await qsRes.json()
                            qs.id = savedQs.id
                        }
                    }
                }
            }

            alert('تم النشر بنجاح')
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
                            <input type="checkbox" id="crs-pub" checked={!!course.is_published} onChange={e => setCourse({ ...course, is_published: e.target.checked })} />
                            <label htmlFor="crs-pub"></label>
                        </div>
                    </div>
                    <button className="hq-btn-primary" onClick={handleSaveTree} disabled={saving} style={{ padding: '12px 25px', fontSize: '1.05rem', boxShadow: '0 5px 15px rgba(99, 102, 241, 0.4)' }}>
                        <HiOutlineCheckCircle /> {saving ? 'جاري الرفع والضخ...' : 'الحفظ والنشر الشامل'}
                    </button>
                </div>
            </div>

            {/* 1. Basic Settings */}
            <div className="hq-form-card" style={{ marginBottom: '20px', marginTop: '20px' }}>
                <h3 style={{ marginBottom: '15px', borderBottom: '1px dashed #eee', paddingBottom: '10px', fontSize: '1.1rem', color: 'var(--hq-primary-text)' }}>1. الإعدادات والواجهة (Basic Attributes)</h3>
                <div className="hq-df-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                    <div className="hq-df-group">
                        <label>عنوان واسم الكورس <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" value={course.title} onChange={e => setCourse({ ...course, title: e.target.value })} placeholder="الفيزياء - السادس العلمي" />
                    </div>
                    <div className="hq-df-group">
                        <label>الأستاذ للمادة <span style={{ color: 'red' }}>*</span></label>
                        <select value={course.teacher || ''} onChange={e => {
                            const tId = e.target.value;
                            const t = teachers.find(x => x.id == tId);
                            setCourse({ 
                                ...course, 
                                teacher: tId, 
                                subject: t && t.subjects && t.subjects.length > 0 ? t.subjects[0] : '', 
                                grade: t && t.grades && t.grades.length > 0 ? t.grades[0] : '', 
                                branches: t && t.branches ? t.branches : [] 
                            })
                        }}>
                            <option value="">-- يرجى اختيار الأستاذ --</option>
                            {teachers.map(t => <option key={t.id} value={t.id}>م. {t.name || t.user}</option>)}
                        </select>
                    </div>
                    <div className="hq-df-group">
                        <label>التسعيرة الإجمالية (د.ع) <span style={{ color: 'red' }}>*</span></label>
                        <input type="text" value={course.price} onChange={e => setCourse({ ...course, price: e.target.value })} />
                    </div>

                    <div className="hq-df-group">
                        <label>سعة مجموعة الشات للطلاب (للمساعد) <span style={{ color: 'red' }}>*</span></label>
                        <input type="number" min="50" max="1000" value={course.students_per_group || 200} onChange={e => setCourse({ ...course, students_per_group: parseInt(e.target.value) || 200 })} />
                    </div>

                    <div className="hq-df-group">
                        <label>لون الهوية البصرية (Theme)</label>
                        <select value={course.color || 'blue'} onChange={e => setCourse({ ...course, color: e.target.value })}>
                            <option value="blue">أزرق سماوي</option>
                            <option value="red">أحمر ناري</option>
                            <option value="green">أخضر زمردي</option>
                            <option value="purple">رصاصي بنفسجي</option>
                            <option value="orange">برتقالي ملتهب</option>
                        </select>
                    </div>
                </div>

                <div className="hq-df-grid" style={{ gridTemplateColumns: '1fr', marginTop: '20px' }}>
                    <div className="hq-df-group">
                        <label>صورة الغلاف الاحترافية للكورس (Hero Image) <HiOutlineSparkles style={{ color: '#10b981' }} /></label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <input type="file" accept="image/*" onChange={e => {
                                if (e.target.files && e.target.files[0]) { setCourse({ ...course, hero_image: e.target.files[0] }) }
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
                    <button className="hq-btn-secondary" onClick={addModule} style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px' }}>
                        <HiOutlinePlus size={20} /> <span>إدراج فصل دراسي جديد</span>
                    </button>
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
                                                <input type="file" accept="image/*" onChange={e => { if (e.target.files && e.target.files[0]) updateModule(mIndex, 'cover_image', e.target.files[0]) }} style={{ flex: 1, width: '1px', fontSize: '0.75rem' }} />
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

                            {/* Lessons Body Accordion */}
                            {isExpanded && (
                                <div style={{ padding: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--hq-text-main)' }}>محتوى وملفات الفصل</h5>
                                        <button className="hq-btn-secondary" onClick={() => addLesson(mIndex)} style={{ padding: '8px 15px', fontSize: '0.9rem', color: '#10b981', borderColor: '#10b981', background: 'rgba(16,185,129,0.05)', borderRadius: '8px' }}>
                                            + درس محتوى جديد
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {mod.lessons.map((less, lIndex) => (
                                            <div key={less.localId} style={{ background: 'var(--hq-surface)', borderRadius: '12px', border: '1px solid var(--hq-border)', padding: '15px' }}>
                                                {/* Lesson Generic Top Bar (Just Title & Video Link) */}
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: less.showAdvanced ? '15px' : '0' }}>
                                                    <div style={{ width: '24px', height: '24px', background: '#e2e8f0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}>{lIndex + 1}</div>
                                                    <div style={{ flex: 1 }}>
                                                        <input type="text" placeholder="عنوان الدرس..." value={less.title} onChange={e => updateLesson(mIndex, lIndex, 'title', e.target.value)} style={{ width: '100%', padding: '10px 15px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', background: 'white', fontWeight: 'bold' }} />
                                                    </div>
                                                    <div style={{ flex: 1.5 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #d1d5db', borderRadius: '8px', background: 'white' }}>
                                                            <span style={{ padding: '0 10px', color: '#94a3b8' }}><HiOutlineVideoCamera size={18} /></span>
                                                            <input type="text" placeholder="رابط الفيديو (Video URL)..." value={less.video_url} onChange={e => updateLesson(mIndex, lIndex, 'video_url', e.target.value)} style={{ width: '100%', padding: '10px 15px 10px 0', border: 'none', background: 'transparent', outline: 'none', direction: 'ltr' }} />
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'white', padding: '8px 12px', borderRadius: '8px', border: '1px solid #d1d5db' }}>
                                                        <span style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>مقبوض (مقفول)</span>
                                                        <div className="hq-toggle-switch">
                                                            <input type="checkbox" id={`l-lock-${less.localId}`} checked={!!less.is_locked} onChange={e => updateLesson(mIndex, lIndex, 'is_locked', e.target.checked)} />
                                                            <label htmlFor={`l-lock-${less.localId}`}></label>
                                                        </div>
                                                    </div>
                                                    <button className="hq-action-btn edit" onClick={() => updateLesson(mIndex, lIndex, 'showAdvanced', !less.showAdvanced)} title="متقدم ومستندات" style={{ background: less.showAdvanced ? 'var(--hq-primary)' : 'white', color: less.showAdvanced ? 'white' : 'var(--hq-primary-text)' }}><HiOutlineCog /></button>
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
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '8px', color: 'var(--hq-text-main)', fontWeight: 'bold' }}>
                                                                    <HiOutlineCog /> صورة الغلاف للدرس (Upload Image)
                                                                </label>
                                                                <div style={{ background: '#white', padding: '8px', borderRadius: '8px', border: '1px solid #d1d5db', display: 'flex', alignItems: 'center' }}>
                                                                    <input type="file" accept="image/*" onChange={e => {
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
                                                                                    <button onClick={() => removeQuestion(mIndex, lIndex, qzIndex, qsIndex)} style={{ position: 'absolute', left: '15px', top: '20px', background: 'white', padding: '5px', border: '1px solid #ffccd5', borderRadius: '6px', color: '#ef4444', cursor: 'pointer' }} title="حذف السؤال"><HiOutlineTrash size={18} /></button>
                                                                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                                                                                        <span style={{ background: 'var(--hq-primary)', color: 'white', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>{qsIndex + 1}</span>
                                                                                        <div style={{ flex: 1 }}>
                                                                                            <textarea value={qs.text} onChange={e => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'text', e.target.value)} placeholder={`نص السؤال الجوهري رقم ${qsIndex + 1}...`} style={{ width: '100%', padding: '12px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none', resize: 'none', minHeight: '60px', fontFamily: 'inherit' }} />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', paddingRight: '45px', marginTop: '5px' }}>
                                                                                        {qs.options.map((opt, optIndex) => (
                                                                                            <div key={optIndex} style={{ display: 'flex', alignItems: 'center', gap: '10px', border: `2px solid ${qs.correct_index === optIndex ? '#10b981' : '#f1f5f9'}`, borderRadius: '8px', padding: '8px 12px', background: qs.correct_index === optIndex ? 'rgba(16,185,129,0.05)' : 'white', transition: 'all 0.2s', cursor: 'pointer' }} onClick={() => updateQuestion(mIndex, lIndex, qzIndex, qsIndex, 'correct_index', optIndex)}>
                                                                                                <input type="radio" name={`qs-${qs.localId}`} checked={qs.correct_index === optIndex} onChange={() => { }} style={{ width: '20px', height: '20px', accentColor: '#10b981', cursor: 'pointer' }} />
                                                                                                <input type="text" value={opt} onChange={e => updateQuestionOption(mIndex, lIndex, qzIndex, qsIndex, optIndex, e.target.value)} placeholder={`خيار ${optIndex + 1}`} onClick={e => e.stopPropagation()} style={{ border: 'none', background: 'transparent', outline: 'none', flex: 1, fontSize: '0.95rem', fontWeight: qs.correct_index === optIndex ? 'bold' : 'normal' }} />
                                                                                                <input type="text" value={qs.options_explanations ? qs.options_explanations[optIndex] : ''} onChange={e => updateQuestionOptionExplanation(mIndex, lIndex, qzIndex, qsIndex, optIndex, e.target.value)} placeholder="شرح مبسط للإجابة (لماذا خطأ/صح)" onClick={e => e.stopPropagation()} style={{ border: '1px solid #e2e8f0', background: '#f8fafc', outline: 'none', flex: 1.5, fontSize: '0.85rem', padding: '6px 10px', borderRadius: '6px' }} />
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
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
                                                                                <div style={{ textAlign: 'right', marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <button className="hq-btn-secondary" onClick={() => addQuestion(mIndex, lIndex, qzIndex)} style={{ background: '#eff6ff', color: '#3b82f6', borderColor: '#3b82f6', padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 'bold' }}>+ سؤال يدوي واحد</button>
                                                                                    <button className="hq-btn-primary" onClick={() => {
                                                                                        const val = document.getElementById(`bulk-${qz.localId}`).value;
                                                                                        handleBulkQuestions(mIndex, lIndex, qzIndex, val);
                                                                                        document.getElementById(`bulk-${qz.localId}`).value = '';
                                                                                    }} style={{ padding: '8px 20px', borderRadius: '8px', fontSize: '0.9rem' }}>توليد الأسئلة سحرياً سับ</button>
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
                        3. الملازم ومستندات الدورة الآمنة (Course Library)
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
                    {courseDocs.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', margin: 0 }}>لا توجد أي ملازم مرفقة بكامل الدورة حالياً. استخدم هذا القسم لرفع أسئلة وزارية أو ملف شامل.</p>}
                </div>
            </div>

            <div style={{ height: '50px' }}></div>
        </div>
    )
}
