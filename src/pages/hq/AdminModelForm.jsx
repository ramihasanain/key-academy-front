import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { API } from '../../config'
import { HiOutlineArrowRight, HiOutlineCheckCircle } from 'react-icons/hi2'
import './Admin.css'

// Schemas matching the grid
const SCHEMAS = {
    users: {
        title: 'مدير نظام', endpoint: 'users',
        fields: [
            { key: 'phone', label: 'رقم الهاتف (لتسجيل الدخول)', type: 'text', required: true },
            { key: 'username', label: 'اسم المستخدم (المعرف باللغة الإنجليزية)', type: 'text', required: true },
            { key: 'password', label: 'كلمة المرور (دخول لوحة التحكم)', type: 'text' },
            { key: 'first_name', label: 'الاسم الأول', type: 'text' },
            { key: 'last_name', label: 'الاسم الأخير', type: 'text' },
            { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
            { key: 'is_staff', label: 'صلاحيات الموظفين (دخول لوحة التحكم)', type: 'boolean' },
            { key: 'is_superuser', label: 'صلاحيات كاملة', type: 'boolean' }
        ]
    },
    students: {
        title: 'طالب', endpoint: 'students',
        fields: [
            { key: 'username', label: 'اسم المستخدم (الرقم أو المعرف)', type: 'text', required: true },
            { key: 'first_name', label: 'الاسم الأول', type: 'text' },
            { key: 'last_name', label: 'الاسم الأخير', type: 'text' },
            { key: 'email', label: 'البريد الإلكتروني', type: 'text' },
            { key: 'password', label: 'تغيير كلمة المرور (أتركه فارغاً إذا لم ترغب بالتغيير)', type: 'text' }
        ]
    },
    courses: {
        title: 'دورة', endpoint: 'courses',
        fields: [
            { key: 'title', label: 'اسم الدورة', type: 'text', required: true },
            { key: 'description', label: 'الوصف', type: 'textarea' },
            { key: 'price', label: 'السعر (د.ع)', type: 'number' },
            { key: 'is_active', label: 'الدورة فعالة ومتاحة للطلاب؟', type: 'boolean' }
        ]
    },
    teachers: {
        title: 'أستاذ', endpoint: 'teachers',
        fields: [
            { key: 'user', label: 'رقم حساب المنصة (ID) - اختياري لربط الحساب', type: 'number' },
            { key: 'phone', label: 'رقم هاتف الأستاذ (سيستخدم لتسجيل الدخول لبوابة الأستاذ)', type: 'text' },
            { key: 'creation_password', label: 'كلمة المرور للدخول للداشبورد (تستخدم فقط للإنشاء، يمكن تركها فارغة لاحقاً)', type: 'text' },
            { key: 'name', label: 'اسم الأستاذ', type: 'text', required: true },
            { key: 'subjects', label: 'المواد التي يدرّسها', type: 'multiselect', endpoint: 'subjects', labelField: 'name', valueField: 'id', required: true },
            { key: 'grades', label: 'الصفوف التي يدرسها', type: 'multiselect', endpoint: 'grades', labelField: 'title', valueField: 'id', required: true },
            { key: 'branches', label: 'الفروع (اختر واحد أو أكثر)', type: 'multiselect', endpoint: 'branches', labelField: 'name', valueField: 'id' },
            { key: 'image', label: 'الصورة الشخصية', type: 'file' },
            { key: 'subtitle', label: 'كلمات مفتاحية / وصف صغير تحت الاسم', type: 'text' },
            { key: 'bio', label: 'النبذة التعريفية', type: 'textarea' },
            { key: 'education', label: 'الشهادات وتاريخها (اكتب كل شهادة بسطر جديد)', type: 'textarea' },
            { key: 'experience', label: 'الخبرات العلمية (اكتب كل خبرة بسطر جديد)', type: 'textarea' },
            { key: 'achievements', label: 'الإنجازات (اكتب كل إنجاز بسطر جديد)', type: 'textarea' },
            { key: 'color', label: 'لون بطاقة الأستاذ (HEX أو لون)', type: 'text', placeholder: '#FFFFFF' },
            { key: 'initials', label: 'اسم رمزي (رمز الدورة)', type: 'text' },
            { key: 'rating', label: 'التقييم الظاهري (مثال: 4.8)', type: 'text' },
            { key: 'students_count', label: 'عدد الطلاب الوهمي/البدائي', type: 'number' },
            { key: 'is_active', label: 'حساب الأستاذ فعال؟', type: 'boolean' }
        ]
    },
    teacherassistants: {
        title: 'مساعد', endpoint: 'teacherassistants',
        fields: [
            { key: 'name', label: 'اسم المساعد الكامل', type: 'text', required: true },
            { key: 'phone', label: 'رقم الهاتف (سيكون اسم المستخدم للدخول)', type: 'text', required: true },
            { key: 'creation_password', label: 'كلمة المرور (دخول لوحة التحكم)', type: 'text' },
            { key: 'teacher', label: 'تعيين ضمن أستاذ', type: 'select', endpoint: 'teachers', labelField: 'name', valueField: 'id', required: true },
            { key: 'courses', label: 'الصلاحية على دورات محددة (إلزامي)', type: 'multiselect', endpoint: 'courses', labelField: 'title', valueField: 'id', required: true },
            { key: 'is_active', label: 'فعال', type: 'boolean' }
        ]
    },
    activationcards: {
        title: 'كارت تفعيل', endpoint: 'activationcards',
        fields: [
            { key: 'code', label: 'كود الكارت (14 رقم)', type: 'text', required: true },
            { key: 'course', label: 'رقم الدورة المرتبطة بالـ ID', type: 'number', required: true },
            { key: 'is_used', label: 'تم الاستخدام؟', type: 'boolean' }
        ]
    },
    enrollments: {
        title: 'اشتراك (Enrollment)', endpoint: 'enrollments',
        fields: [
            { key: 'student', label: 'رقم الطالب (ID)', type: 'number', required: true },
            { key: 'course', label: 'رقم الدورة (ID)', type: 'number', required: true },
            { key: 'chat_shard', label: 'المجموعة (رقم الـ ID للخلية)', type: 'number' },
            { key: 'is_completed', label: 'أكمل الدورة؟', type: 'boolean' },
            { key: 'is_active', label: 'الاشتراك فعال (غير مجمد)؟', type: 'boolean' }
        ]
    },
    contactmessages: {
        title: 'الاستفسارات وتواصل معنا', endpoint: 'contactmessages',
        fields: [
            { key: 'name', label: 'الاسم', type: 'text', required: true },
            { key: 'phone', label: 'رقم الهاتف', type: 'text' },
            { key: 'subject', label: 'الموضوع', type: 'text', required: true },
            { key: 'message', label: 'نص الرسالة', type: 'textarea', required: true },
            { key: 'is_read', label: 'تم الحل وإغلاق التنبيه؟', type: 'boolean' }
        ]
    },
    faqs: {
        title: 'سؤال شائع', endpoint: 'faqs',
        fields: [
            { key: 'question', label: 'السؤال', type: 'text', required: true },
            { key: 'answer', label: 'الجواب', type: 'textarea', required: true },
            { key: 'category', label: 'القسم (عام/الدفع/تقني)', type: 'text' },
            { key: 'order', label: 'الترتيب', type: 'number' }
        ]
    },
    subjects: {
        title: 'مادة دراسية', endpoint: 'subjects',
        fields: [
            { key: 'name', label: 'اسم المادة', type: 'text', required: true },
            { key: 'grade', label: 'رقم الصف المشرف (ID)', type: 'number', required: true },
            { key: 'branches', label: 'الفروع', type: 'multiselect', endpoint: 'branches', labelField: 'name', valueField: 'id', required: true },
            { key: 'order', label: 'الترتيب', type: 'number' }
        ]
    },
    branches: {
        title: 'فرع دراسي', endpoint: 'branches',
        fields: [
            { key: 'name', label: 'اسم الفرع', type: 'text', required: true },
            { key: 'order', label: 'الترتيب', type: 'number' }
        ]
    },
    grades: {
        title: 'صف / مرحلة', endpoint: 'grades',
        fields: [
            { key: 'slug', label: 'المعرف (إنجليزي فقط مثل class-6)', type: 'text', required: true },
            { key: 'title', label: 'العنوان الكامل', type: 'text', required: true },
            { key: 'grade_name', label: 'اسم الصف', type: 'text', required: true },
            { key: 'branches', label: 'الفروع', type: 'multiselect', endpoint: 'branches', labelField: 'name', valueField: 'id', required: true }
        ]
    },
    coursegroups: {
        title: 'مجموعة طلابية', endpoint: 'coursegroups',
        fields: [
            { key: 'course', label: 'الدورة', type: 'select', endpoint: 'courses', labelField: 'title', valueField: 'id', required: true },
            { key: 'index', label: 'رقم الخلية (المجموعة)', type: 'number', required: true },
            { key: 'assistant', label: 'المساعد المشرف (اختياري)', type: 'select', endpoint: 'teacherassistants', labelField: 'name', valueField: 'id' }
        ]
    }
}

import { AdminCourseBuilder } from './AdminCourseBuilder'
import { Student360View } from './Student360View'
import { TA360View } from './TA360View'
import { Teacher360View } from './Teacher360View'

export const AdminModelForm = () => {
    const { model, id } = useParams()
    const navigate = useNavigate()

    // 🌟 INTERCEPT COURSES -> USE TREE BUILDER 🌟
    if (model === 'courses') {
        return <AdminCourseBuilder id={id} />
    }

    const schema = SCHEMAS[model]

    const isNew = id === 'new'
    const [formData, setFormData] = useState({})
    const [loading, setLoading] = useState(!isNew)
    const [saving, setSaving] = useState(false)
    const [dynamicOptions, setDynamicOptions] = useState({})

    useEffect(() => {
        if (!schema) return;
        const fetchDynamicOptions = async () => {
            const tk = localStorage.getItem('access_token');
            const opts = {};
            for (const field of (schema.fields || [])) {
                if (field.endpoint && (field.type === 'select' || field.type === 'multiselect')) {
                    try {
                        const res = await fetch(`${API}/api/hq/${field.endpoint}/?page_size=5000`, {
                            headers: { 'Authorization': `Bearer ${tk}` }
                        });
                        const data = await res.json();
                        opts[field.key] = (data.results || data).map(item => ({
                            value: item[field.valueField || 'id'],
                            label: item[field.labelField || 'title'],
                            raw: item // Useful for advanced dynamic filtering
                        }));
                    } catch (e) {
                        console.error("Failed to load options for", field.key);
                    }
                }
            }
            // Add custom non-empty check string logic
            setDynamicOptions(opts);
        }
        fetchDynamicOptions();
    }, [schema]);

    useEffect(() => {
        if (!schema || isNew) return

        const fetchItem = async () => {
            const tk = localStorage.getItem('access_token')
            try {
                const res = await fetch(`${API}/api/hq/${schema.endpoint}/${id}/`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setFormData(data)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchItem()
    }, [model, id, isNew])

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }))
    }

    const PERM_GROUPS = [
        { key: 'user', label: 'الموظفين والإدارة' },
        { key: 'course', label: 'الدورات' },
        { key: 'module', label: 'الوحدات' },
        { key: 'lesson', label: 'الدروس' },
        { key: 'teacher', label: 'الأساتذة' },
        { key: 'enrollment', label: 'الاشتراكات' },
        { key: 'qapost', label: 'الأسئلة' },
        { key: 'faqitem', label: 'الشائعة' }
    ]

    const PERM_ACTIONS = [
        { action: 'add', label: 'إضافة' },
        { action: 'change', label: 'تعديل' },
        { action: 'delete', label: 'حذف' },
        { action: 'view', label: 'عرض' }
    ]

    const handlePermToggle = (permCode) => {
        setFormData(prev => {
            const list = prev.permissions_list || []
            const hasPerm = list.some(p => p === permCode || p.endsWith('.' + permCode))
            let newList
            if (hasPerm) {
                newList = list.filter(p => p !== permCode && !p.endsWith('.' + permCode))
            } else {
                newList = [...list, permCode]
            }
            return { ...prev, permissions_list: newList }
        })
    }

    const hasPerm = (permCode) => {
        const list = formData.permissions_list || []
        return list.some(p => p === permCode || p.endsWith('.' + permCode))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setSaving(true)
        const tk = localStorage.getItem('access_token')
        const method = isNew ? 'POST' : 'PUT'
        const url = `${API}/api/hq/${schema.endpoint}/${isNew ? '' : `${id}/`}`

        try {
            let hasFile = false;
            const fd = new FormData();
            Object.keys(formData).forEach(k => {
                if (formData[k] instanceof File) {
                    hasFile = true;
                    fd.append(k, formData[k]);
                } else if (typeof formData[k] === 'string' && schema.fields?.find(f => f.key === k)?.type === 'file') {
                    // Do not append string URLs back to file inputs
                } else if (Array.isArray(formData[k])) {
                    formData[k].forEach(val => fd.append(JSON.stringify(k), val))
                } else {
                    fd.append(k, formData[k] === null ? '' : formData[k]);
                }
            });

            let fetchOptions = {
                method,
                headers: { 'Authorization': `Bearer ${tk}` },
                body: fd
            };

            if (!hasFile) {
                fetchOptions.headers['Content-Type'] = 'application/json';
                const jsonBody = { ...formData };
                schema.fields?.filter(f => f.type === 'file').forEach(f => {
                    if (typeof jsonBody[f.key] === 'string') {
                        delete jsonBody[f.key];
                    }
                });
                fetchOptions.body = JSON.stringify(jsonBody);
            }

            const res = await fetch(url, fetchOptions)
            if (res.ok) {
                navigate(`/hq/${model}`)
            } else {
                alert('حدث خطأ أثناء الحفظ. يرجى التأكد من البيانات أو الصلاحيات.')
            }
        } catch (err) {
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (!schema) return <div className="hq-loading">إعدادات غير صالحة.</div>

    return (
        <div className="hq-form-wrap">
            <div className="hq-page-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <button className="hq-back-btn" onClick={() => navigate(`/hq/${model}`)}>
                    <HiOutlineArrowRight />
                </button>
                <div>
                    <h2>{isNew ? `إضافة ${schema.title} جديد` : `تعديل بيانات ${schema.title}`}</h2>
                    <p>يرجى تعبئة الحقول المطلوبة بدقة</p>
                </div>
            </div>
            <div className="hq-form-card">
                {loading ? <div className="hq-loading" style={{ padding: '50px' }}>جاري جلب البيانات...</div> : (
                    <form onSubmit={handleSubmit} className="hq-dynamic-form">
                        <div className="hq-df-grid">
                            {schema.fields.map(f => (
                                <div key={f.key} className={`hq-df-group ${f.type === 'textarea' ? 'full-width' : ''}`}>
                                    <label>{f.label} {f.required && <span style={{ color: 'red' }}>*</span>}</label>

                                    {f.type === 'textarea' ? (
                                        <textarea
                                            value={formData[f.key] || ''}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            required={f.required}
                                            rows={4}
                                        />
                                    ) : f.type === 'boolean' ? (
                                        <div className="hq-toggle-switch">
                                            <input
                                                type="checkbox"
                                                id={`tg-${f.key}`}
                                                checked={!!formData[f.key]}
                                                onChange={e => handleChange(f.key, e.target.checked)}
                                            />
                                            <label htmlFor={`tg-${f.key}`}></label>
                                        </div>
                                    ) : f.type === 'file' ? (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px', borderRadius: '8px', border: '1px solid var(--hq-border)' }}>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={e => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        handleChange(f.key, e.target.files[0])
                                                    }
                                                }}
                                            />
                                            {typeof formData[f.key] === 'string' && formData[f.key] && <span style={{ fontSize: '0.8rem', color: '#10b981' }}>صورة محفوظة ✅</span>}
                                        </div>
                                    ) : f.type === 'select' ? (
                                        <select
                                            value={formData[f.key] || ''}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            required={f.required}
                                        >
                                            <option value="">-- يرجى الاختيار --</option>

                                            {/* Smart fallback to display legacy/mismatched data */}
                                            {formData[f.key] && !(dynamicOptions[f.key] || f.options || []).some(o => o.value == formData[f.key]) && (
                                                <option value={formData[f.key]}>{formData[f.key]} (تم اختيار هذا سابقاً)</option>
                                            )}

                                            {(dynamicOptions[f.key] || f.options || []).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    ) : f.type === 'multiselect' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto', background: 'var(--hq-surface)', padding: '10px', border: '1px solid var(--hq-border)', borderRadius: '12px' }}>
                                            {model === 'teacherassistants' && f.key === 'courses' && !formData['teacher'] ? (
                                                <div style={{ color: 'var(--hq-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>يرجى اختيار الأستاذ أولاً لتظهر دوراته.</div>
                                            ) : model === 'teacherassistants' && f.key === 'courses' && (dynamicOptions[f.key] || f.options || []).filter(opt => opt.raw && opt.raw.teacher == formData['teacher']).length === 0 ? (
                                                <div style={{ color: 'var(--hq-text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>الأستاذ المختار لا يملك أي دورات حالياً.</div>
                                            ) : (
                                                ((model === 'teacherassistants' && f.key === 'courses') 
                                                    ? (dynamicOptions[f.key] || f.options || []).filter(opt => opt.raw && opt.raw.teacher == formData['teacher'])
                                                    : (dynamicOptions[f.key] || f.options || [])
                                                ).map(opt => {
                                                    const currentVals = Array.isArray(formData[f.key]) ? formData[f.key] : [];
                                                    const isChecked = currentVals.includes(opt.value);
                                                    return (
                                                        <label key={opt.value} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked}
                                                                onChange={(e) => {
                                                                    if (e.target.checked) handleChange(f.key, [...currentVals, opt.value]);
                                                                    else handleChange(f.key, currentVals.filter(v => v !== opt.value));
                                                                }}
                                                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                            />
                                                            {opt.label}
                                                        </label>
                                                    )
                                                })
                                            )}
                                        </div>
                                    ) : (
                                        <input
                                            type={f.type === 'number' ? 'number' : 'text'}
                                            value={formData[f.key] || ''}
                                            onChange={e => handleChange(f.key, e.target.value)}
                                            required={f.required}
                                        />
                                    )}
                                </div>
                            ))}
                        </div>

                        {model === 'users' && !formData.is_superuser && formData.is_staff && (
                            <div className="hq-permissions-matrix" style={{ marginTop: '30px', borderTop: '1px solid var(--hq-border)', paddingTop: '20px' }}>
                                <h3>صلاحيات موظف الإدارة المخصصة</h3>
                                <p style={{ color: 'var(--hq-text-muted)', marginBottom: '20px' }}>حدد بدقة مسموحيات هذا الموظف بتعديل النظام. الصلاحيات لا تنطبق إلا إذا كان الموظف مفعل كـ (إداري). المدير العام العلوي يتخطى كل هذا.</p>

                                <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--hq-border)' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)' }}>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>القسم / الصفحة</th>
                                            {PERM_ACTIONS.map(a => <th key={a.action} style={{ padding: '12px', textAlign: 'center' }}>{a.label}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {PERM_GROUPS.map((group, idx) => (
                                            <tr key={group.key} style={{ borderTop: '1px solid var(--hq-border)', background: idx % 2 === 0 ? 'var(--hq-bg)' : 'transparent' }}>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{group.label}</td>
                                                {PERM_ACTIONS.map(a => {
                                                    const pcode = `${a.action}_${group.key}`
                                                    return (
                                                        <td key={a.action} style={{ padding: '12px', textAlign: 'center' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={hasPerm(pcode)}
                                                                onChange={() => handlePermToggle(pcode)}
                                                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--hq-primary)' }}
                                                            />
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="hq-df-footer" style={{ marginTop: '30px' }}>
                            <button type="submit" className="hq-btn-primary" disabled={saving}>
                                <HiOutlineCheckCircle /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    )
}
