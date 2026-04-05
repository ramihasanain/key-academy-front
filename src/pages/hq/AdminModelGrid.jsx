import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useOutletContext, useLocation } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineMagnifyingGlass, HiOutlineEye, HiOutlineUsers, HiOutlineNoSymbol, HiOutlinePlay, HiOutlineCheck, HiOutlineExclamationCircle } from 'react-icons/hi2'
import './Admin.css'

// Configuration for models
const SCHEMAS = {
    users: { title: 'المستخدمين (مدراء النظام)', endpoint: 'users', columns: [{ key: 'username', label: 'الاسم' }, { key: 'email', label: 'البريد' }, { key: 'is_superuser', label: 'Super Admin', type: 'boolean' }] },
    students: {
        title: 'الطلاب المسجلين',
        endpoint: 'students',
        columns: [
            { key: 'first_name', label: 'الاسم الأول' },
            { key: 'last_name', label: 'الاسم الأخير' },
            { key: 'phone', label: 'الهاتف' },
            { key: 'parent_phone', label: 'هاتف الوالد' },
            { key: 'city', label: 'المدينة' },
            { key: 'grade', label: 'المرحلة' },
            { key: 'branch', label: 'الفرع' },
            { key: 'date_joined', label: 'الإنضمام', type: 'datetime' }
        ]
    },
    courses: { title: 'الدورات المجانية والمدفوعة', endpoint: 'courses', columns: [{ key: 'title', label: 'اسم الدورة' }, { key: 'price', label: 'السعر', type: 'currency' }, { key: 'enrollments_count', label: 'عدد الطلاب', type: 'number_badge' }, { key: 'is_published', label: 'فعالة', type: 'boolean' }] },
    teachers: { title: 'الأساتذة', endpoint: 'teachers', columns: [{ key: 'name', label: 'الاسم ' }, { key: 'subject', label: 'المادة' }, { key: 'grade', label: 'الصف' }, { key: 'enrollments_count', label: 'الطلاب المسجلين', type: 'number_badge' }, { key: 'is_active', label: 'مفعل', type: 'boolean' }] },
    teacherassistants: {
        title: 'مساعدين الأساتذة', endpoint: 'teacherassistants',
        columns: [
            { key: 'name', label: 'اسم المساعد' },
            { key: 'teacher', label: 'التابع للأستاذ' },
            { key: 'phone', label: 'رقم الهاتف' },
            { key: 'total_replies', label: 'إجابات الأسئلة', type: 'number_badge' },
            { key: 'total_messages', label: 'رسائل التوجيه', type: 'number_badge' },
            { key: 'avg_response_time_min', label: 'سرعة الرد (دقائق)', type: 'number_badge' },
            { key: 'is_active', label: 'مفعل', type: 'boolean' }
        ]
    },
    enrollments: { title: 'الطلاب المشتركين بالدورات', endpoint: 'enrollments', columns: [{ key: 'student', label: 'الطالب' }, { key: 'student_username', label: 'اليوزر (@)' }, { key: 'course', label: 'اسم الدورة' }, { key: 'chat_shard', label: 'المجموعة (الشات)' }, { key: 'is_completed', label: 'مكتمل', type: 'boolean' }, { key: 'is_active', label: 'مفعل', type: 'boolean' }] },
    contactmessages: { title: 'الاستفسارات وتواصل معنا', endpoint: 'contactmessages', columns: [{ key: 'name', label: 'الاسم' }, { key: 'subject', label: 'الموضوع' }, { key: 'created_at', label: 'التاريخ', type: 'datetime' }, { key: 'is_read', label: 'محلولة', type: 'boolean' }] },
    faqs: { title: 'الأسئلة الشائعة', endpoint: 'faqs', columns: [{ key: 'question', label: 'السؤال' }, { key: 'category', label: 'التصنيف' }, { key: 'order', label: 'الترتيب' }] },
    subjects: { title: 'المواد الدراسية', endpoint: 'subjects', columns: [{ key: 'name', label: 'اسم المادة' }, { key: 'grade', label: 'الصف' }] },
    grades: { title: 'الصفوف والمراحل', endpoint: 'grades', columns: [{ key: 'title', label: 'العنوان' }, { key: 'branch', label: 'الفرع' }] },
    qaposts: { title: 'التفاعلات والأسئلة', endpoint: 'qaposts', columns: [{ key: 'content', label: 'نص السؤال' }, { key: 'student', label: 'رقم الطالب' }, { key: 'created_at', label: 'تاريخ النشر', type: 'datetime' }] },
    lessons: { title: 'الدروس ومحتوى الفيديو', endpoint: 'lessons', columns: [{ key: 'title', label: 'العنوان' }, { key: 'module', label: 'الفصل الدراسي' }, { key: 'is_free', label: 'مجاني', type: 'boolean' }, { key: 'order', label: 'الترتيب' }] },
    notes: { title: 'مذكرات الطلاب الخاصة', endpoint: 'notes', columns: [{ key: 'student', label: 'الطالب' }, { key: 'lesson', label: 'الدرس' }, { key: 'content', label: 'المحتوى' }, { key: 'updated_at', label: 'تاريخ التحديث', type: 'datetime' }] },
    activationcards: { title: 'كروت تفعيل الرصيد', endpoint: 'activationcards', columns: [{ key: 'code', label: 'الكود' }, { key: 'course', label: 'الدورة المرتبطة' }, { key: 'is_used', label: 'مستخدم', type: 'boolean' }] },
    virtuallabs: { title: 'المختبرات الافتراضية 3D', endpoint: 'virtuallabs', columns: [{ key: 'title', label: 'المختبر' }, { key: 'subject', label: 'المادة' }, { key: 'url', label: 'الرابط المضمن (IFrame)' }] },
    modules: { title: 'الفصول والوحدات', endpoint: 'modules', columns: [{ key: 'title', label: 'عنوان الوحدة' }, { key: 'course', label: 'الدورة الأم' }, { key: 'order', label: 'ترتيب العرض' }] },
    coursegroups: { title: 'المجموعات الطلابية المنفصلة', endpoint: 'coursegroups', columns: [{ key: 'course', label: 'رقم الدورة' }, { key: 'index', label: 'رقم المجموعة (الخلية)' }, { key: 'assistant', label: 'رقم المساعد (المشرف)' }] }
}

export const AdminModelGrid = () => {
    const { model } = useParams()
    const navigate = useNavigate()
    const { profile } = useOutletContext()
    const location = useLocation()
    const schema = SCHEMAS[model]

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Filters State
    const [filterOptions, setFilterOptions] = useState({ teachers: [], subjects: [], grades: [] })
    const [activeFilters, setActiveFilters] = useState({})

    // Contact Modal State
    const [previewContact, setPreviewContact] = useState(null)
    const [resolutionNote, setResolutionNote] = useState('')
    const [resolving, setResolving] = useState(false)

    const pathMap = {
        'users': 'user', 'students': 'user', 'courses': 'course',
        'teachers': 'teacher', 'enrollments': 'enrollment',
        'contactmessages': 'contactmessage', 'faqs': 'faqitem',
        'activationcards': 'activationcard', 'subjects': 'subject',
        'grades': 'grade', 'modules': 'module', 'lessons': 'lesson'
    }
    const needed = pathMap[model] || model?.slice(0, -1)

    const canAdd = (profile?.is_superuser || profile?.permissions?.some(p => p.endsWith(`.add_${needed}`))) && model !== 'students'
    const canChange = profile?.is_superuser || profile?.permissions?.some(p => p.endsWith(`.change_${needed}`))
    const canDelete = profile?.is_superuser || profile?.permissions?.some(p => p.endsWith(`.delete_${needed}`))

    // Fetch filter data options dynamically
    useEffect(() => {
        const fetchFilters = async () => {
            if (model !== 'enrollments' && model !== 'courses') return;
            const tk = localStorage.getItem('access_token');
            const h = { 'Authorization': `Bearer ${tk}` };
            try {
                const [tRes, sRes, gRes] = await Promise.all([
                    fetch(API + '/api/hq/teachers/?page_size=100', { headers: h }),
                    fetch(API + '/api/hq/subjects/?page_size=100', { headers: h }),
                    fetch(API + '/api/hq/grades/?page_size=100', { headers: h })
                ]);
                const tData = tRes.ok ? await tRes.json() : { results: [] };
                const sData = sRes.ok ? await sRes.json() : { results: [] };
                const gData = gRes.ok ? await gRes.json() : { results: [] };

                setFilterOptions({
                    teachers: tData.results || tData || [],
                    subjects: sData.results || sData || [],
                    grades: gData.results || gData || []
                });
            } catch (err) { }
        };
        fetchFilters();
        setActiveFilters({});
    }, [model]);

    useEffect(() => {
        if (!schema) return

        const delayDebounceFn = setTimeout(async () => {
            setLoading(true)
            const tk = localStorage.getItem('access_token')
            try {
                const url = new URL(`${API}/api/hq/${schema.endpoint}/`)
                if (searchTerm) {
                    url.searchParams.append('search', searchTerm)
                }
                const queryParams = new URLSearchParams(location.search);
                queryParams.forEach((value, key) => {
                    if (key !== 'search') url.searchParams.append(key, value);
                });

                // Add active filters from dropdowns
                Object.entries(activeFilters).forEach(([k, v]) => {
                    if (v) url.searchParams.append(k, v);
                });
                const res = await fetch(url, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const d = await res.json()
                    setData(d.results || d)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }, 300)

        return () => clearTimeout(delayDebounceFn)
    }, [model, searchTerm, location.search])

    const handleDelete = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا العنصر نهائياً؟ لا يمكن التراجع عن هذه الخطوة.")) return;
        const tk = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/hq/${schema.endpoint}/${id}/`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            if (res.ok) {
                setData(data.filter(item => item.id !== id));
            } else {
                alert("تعذر الحذف، قد يكون هذا العنصر مرتبطاً ببيانات أخرى.");
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الاتصال بالخادم.");
        }
    };

    const handleToggleBoolean = async (id, field, currentValue) => {
        const tk = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/hq/${schema.endpoint}/${id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${tk}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [field]: !currentValue })
            });
            if (res.ok) {
                setData(prev => prev.map(item => item.id === id ? { ...item, [field]: !currentValue } : item));
                if (model === 'contactmessages') {
                    // Update badge by triggering focus event or simple refresh
                    window.dispatchEvent(new Event('focus'));
                }
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleResolveContact = async (e) => {
        e.preventDefault();
        if (!previewContact) return;
        setResolving(true);
        const tk = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/hq/contactmessages/${previewContact.id}/`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${tk}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ is_read: true, resolution_note: resolutionNote })
            });
            if (res.ok) {
                const updatedObj = await res.json();
                setData(data.map(item => item.id === previewContact.id ? updatedObj : item));
                setPreviewContact(null);
                setResolutionNote('');
                window.dispatchEvent(new Event('focus'));
            } else {
                alert("تعذر الحفظ. الرجاء المحاولة مجدداً.");
            }
        } catch (err) {
            console.error(err);
            alert("حدث خطأ أثناء الاتصال بالخادم.");
        } finally {
            setResolving(false);
        }
    };

    if (!schema) return <div className="hq-loading">لم يتم العثور على إعدادات لهذا القسم.</div>

    return (
        <div className="hq-grid-wrap">
            <div className="hq-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>إدارة {schema.title}</h2>
                    <p>عرض، إضافة وتعديل البيانات</p>
                </div>
                {canAdd && (
                    <button className="hq-btn-primary" onClick={() => navigate(`/hq/${model}/new`)}>
                        <HiOutlinePlus /> إضافة جديد
                    </button>
                )}
            </div>

            <div className="hq-filters-bar" style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '20px', background: '#1e293b', padding: '20px', borderRadius: '16px', border: '1px solid var(--hq-border)' }}>
                <div className="hq-tc-search" style={{ flex: '1 1 250px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 15px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineMagnifyingGlass size={20} color="#94a3b8" />
                    <input
                        type="text"
                        placeholder={`بحث ذكي في ${schema.title}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '15px' }}
                    />
                </div>
                
                {/* Dynamic Filters */}
                {(model === 'enrollments' || model === 'courses') && (
                    <>
                        <select
                            className="hq-input"
                            value={activeFilters[model === 'enrollments' ? 'course__teacher' : 'teacher'] || ''}
                            onChange={(e) => setActiveFilters(p => ({ ...p, [model === 'enrollments' ? 'course__teacher' : 'teacher']: e.target.value }))}
                            style={{ flex: '1 1 180px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 15px', color: 'white' }}
                        >
                            <option value="">جميع الأساتذة</option>
                            {filterOptions.teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                        <select
                            className="hq-input"
                            value={activeFilters[model === 'enrollments' ? 'course__subject' : 'subject'] || ''}
                            onChange={(e) => setActiveFilters(p => ({ ...p, [model === 'enrollments' ? 'course__subject' : 'subject']: e.target.value }))}
                            style={{ flex: '1 1 180px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 15px', color: 'white' }}
                        >
                            <option value="">كل المواد</option>
                            {filterOptions.subjects.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                        <select
                            className="hq-input"
                            value={activeFilters[model === 'enrollments' ? 'course__grade' : 'grade'] || ''}
                            onChange={(e) => setActiveFilters(p => ({ ...p, [model === 'enrollments' ? 'course__grade' : 'grade']: e.target.value }))}
                            style={{ flex: '1 1 180px', background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '10px 15px', color: 'white' }}
                        >
                            <option value="">جميع الصفوف</option>
                            {filterOptions.grades.map(t => <option key={t.id} value={t.title}>{t.title}</option>)}
                        </select>
                        
                        {(Object.keys(activeFilters).length > 0) && (
                            <button 
                                onClick={() => setActiveFilters({})} 
                                style={{ padding: '10px 20px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                تفريغ الفلاتر
                            </button>
                        )}
                    </>
                )}
            </div>

            <div className="hq-table-card">

                <div className="hq-table-container">
                    {loading ? <div className="hq-loading" style={{ padding: '40px' }}>جاري تحميل البيانات...</div> : (
                        <table className="hq-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    {schema.columns.map(c => <th key={c.key}>{c.label}</th>)}
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length === 0 ? (
                                    <tr><td colSpan={schema.columns.length + 2} style={{ textAlign: 'center', padding: '30px', color: 'var(--hq-text-muted)' }}>لا توجد بيانات حالياً</td></tr>
                                ) : (
                                    data.map((row, i) => (
                                        <tr key={row.id}>
                                            <td>{i + 1}</td>
                                            {schema.columns.map(c => (
                                                <td key={c.key}>
                                                    {c.type === 'boolean' ? (row[c.key] ? <span className="hq-badge-green">نعم</span> : <span className="hq-badge-red">لا</span>) :
                                                        c.type === 'currency' ? `${row[c.key] || 0}` :
                                                            c.type === 'datetime' ? (row[c.key] ? new Date(row[c.key]).toLocaleDateString('ar-EG') : '-') :
                                                                c.type === 'number_badge' ? <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(56,189,248,0.15)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold' }}>{row[c.key] || 0}</span> :
                                                                    row[`${c.key}_str`] ? row[`${c.key}_str`] :
                                                                        c.key.includes('course') || c.key.includes('student') || c.key.includes('user') ? `#${row[c.key] || 'غير محدد'}` :
                                                                            row[c.key]?.toString().substring(0, 40) || '-'}
                                                </td>
                                            ))}
                                            <td className="hq-actions-cell">
                                                {model === 'students' ? (
                                                    <button className="hq-action-btn edit" style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', borderColor: '#38bdf8' }} onClick={() => navigate(`/hq/${model}/${row.id}`)} title="عرض الملف الثلاثي الأبعاد"><HiOutlineEye /></button>
                                                ) : (
                                                    canChange && <button className="hq-action-btn edit" onClick={() => navigate(`/hq/${model}/${row.id}`)}><HiOutlinePencilSquare /></button>
                                                )}
                                                {model === 'teachers' && (
                                                    <button className="hq-action-btn edit" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderColor: '#8b5cf6' }} onClick={() => navigate(`/hq/teacherassistants?teacher=${row.id}`)} title="عرض المساعدين لهذا الأستاذ"><HiOutlineUsers /></button>
                                                )}
                                                {model === 'courses' && (
                                                    <button className="hq-action-btn edit" style={{ color: '#6366f1', background: 'rgba(99,102,241,0.1)', borderColor: '#6366f1' }} onClick={() => navigate(`/hq/enrollments?course=${row.id}`)} title="عرض الطلبة المشتركين"><HiOutlineUsers /></button>
                                                )}
                                                {model === 'enrollments' && (
                                                    <button className="hq-action-btn edit" style={{ color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', borderColor: '#8b5cf6' }} onClick={() => navigate(`/hq/students/${row.student}`)} title="عرض ملف الطالب"><HiOutlineEye /></button>
                                                )}
                                                {model === 'enrollments' && (
                                                    <button className="hq-action-btn edit"
                                                        style={{ color: row.is_active !== false ? '#ef4444' : '#10b981', background: row.is_active !== false ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', borderColor: row.is_active !== false ? '#ef4444' : '#10b981' }}
                                                        onClick={() => handleToggleBoolean(row.id, 'is_active', row.is_active !== false ? true : false)}
                                                        title={row.is_active !== false ? "تجميد الاشتراك" : "تفعيل الاشتراك"}
                                                    >
                                                        {row.is_active !== false ? <HiOutlineNoSymbol /> : <HiOutlinePlay />}
                                                    </button>
                                                )}
                                                {model === 'contactmessages' && (
                                                    <button className="hq-action-btn edit"
                                                        style={{ color: '#38bdf8', background: 'rgba(56,189,248,0.1)', borderColor: '#38bdf8' }}
                                                        onClick={() => {
                                                            setPreviewContact(row);
                                                            setResolutionNote(row.resolution_note || '');
                                                        }}
                                                        title="استعراض التفاصيل وحل المشكلة"
                                                    >
                                                        <HiOutlineEye />
                                                    </button>
                                                )}
                                                {model === 'courses' && (
                                                    <button className="hq-action-btn edit" style={{ color: '#10b981', background: 'rgba(16,185,129,0.1)', borderColor: '#10b981' }} onClick={() => window.open(`/course/${row.id}`, '_blank')} title="عرض الدورة للطلاب"><HiOutlineEye /></button>
                                                )}
                                                {canDelete && <button className="hq-action-btn delete" onClick={() => handleDelete(row.id)}><HiOutlineTrash /></button>}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Contact Resolution Modal */}
            {previewContact && (
                <div className="hq-modal-overlay" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="hq-modal-content glass-card" style={{ width: '600px', maxWidth: '90%', padding: '30px', borderRadius: '15px', position: 'relative' }}>
                        <button onClick={() => setPreviewContact(null)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--hq-text)', cursor: 'pointer', fontSize: '20px' }}>✕</button>

                        <h2 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <span style={{
                                padding: '8px 16px', borderRadius: '30px', fontSize: '14px', fontWeight: 'bold',
                                background: previewContact.is_read ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                                color: previewContact.is_read ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '8px'
                            }}>
                                {previewContact.is_read ? <><HiOutlineCheck /> محلولة</> : <><HiOutlineExclamationCircle /> قيد الانتظار</>}
                            </span>
                            التفاصيل الكاملة
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', padding: '20px', borderRadius: '12px' }}>
                            <div><strong style={{ color: 'var(--hq-text-muted)', display: 'block', marginBottom: '5px', fontSize: '13px' }}>الاسم</strong> <div style={{ fontSize: '15px' }}>{previewContact.name}</div></div>
                            <div><strong style={{ color: 'var(--hq-text-muted)', display: 'block', marginBottom: '5px', fontSize: '13px' }}>رقم الهاتف</strong> <div style={{ fontSize: '15px', direction: 'ltr', textAlign: 'right' }}>{previewContact.phone || '-'}</div></div>
                            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--hq-text-muted)', display: 'block', marginBottom: '5px', fontSize: '13px' }}>البريد الإلكتروني</strong> <div style={{ fontSize: '15px' }}>{previewContact.email}</div></div>
                            <div style={{ gridColumn: '1 / -1' }}><strong style={{ color: 'var(--hq-text-muted)', display: 'block', marginBottom: '5px', fontSize: '13px' }}>الموضوع</strong> <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{previewContact.subject}</div></div>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <strong style={{ color: 'var(--hq-text-muted)', display: 'block', marginBottom: '10px', fontSize: '14px' }}>نص الرسالة المرسلة:</strong>
                            <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', minHeight: '100px', lineHeight: '1.8', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
                                {previewContact.message}
                            </div>
                        </div>

                        {previewContact.is_read ? (
                            <div style={{ borderRight: '4px solid #10b981', padding: '20px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '12px', marginTop: '20px' }}>
                                <h4 style={{ color: '#10b981', marginBottom: '10px', fontSize: '16px' }}>ملاحظة الإدارة:</h4>
                                <p style={{ margin: '0 0 15px 0', lineHeight: '1.6', fontSize: '15px' }}>{previewContact.resolution_note || 'لا توجد ملاحظة مدونة.'}</p>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
                                    <small style={{ color: 'var(--hq-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <HiOutlineUsers /> تم الحل المشرف: <strong>{previewContact.resolved_by_str || 'النظام'}</strong>
                                    </small>
                                    <small style={{ color: 'var(--hq-text-muted)' }}>
                                        {new Date(previewContact.resolved_at || previewContact.created_at).toLocaleString('ar-EG')}
                                    </small>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleResolveContact} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ color: 'var(--hq-text-muted)', fontSize: '14px', fontWeight: 'bold' }}>ملاحظة الحل (للأرشيف الداخلي)</label>
                                    <textarea
                                        rows="4"
                                        required
                                        placeholder="اكتب الإجراء الذي اتخذته لحل هذا الاستفسار..."
                                        value={resolutionNote}
                                        onChange={(e) => setResolutionNote(e.target.value)}
                                        style={{
                                            resize: 'vertical', width: '100%', padding: '15px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none',
                                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#8b5cf6'}
                                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    ></textarea>
                                </div>
                                <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                                    <button type="submit" disabled={resolving} style={{
                                        flex: 1, padding: '14px', fontSize: '16px',
                                        background: 'linear-gradient(90deg, #8b5cf6, #d946ef)',
                                        border: 'none', borderRadius: '12px', color: 'white',
                                        cursor: resolving ? 'not-allowed' : 'pointer', fontWeight: 'bold',
                                        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.3)',
                                        opacity: resolving ? 0.7 : 1, transition: 'all 0.3s'
                                    }}>
                                        {resolving ? 'جاري الحفظ...' : 'اعتماد كـ "تم الحل" ✔'}
                                    </button>
                                    <button type="button" onClick={() => setPreviewContact(null)} style={{
                                        padding: '14px 30px', background: 'transparent',
                                        border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
                                        color: '#fff', cursor: 'pointer', transition: 'all 0.3s'
                                    }} onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={(e) => e.target.style.background = 'transparent'}>إلغاء</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
