import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../../config'
import {
    HiOutlineArrowRight, HiOutlineArrowLeft, HiOutlineCheck,
    HiOutlineUsers, HiOutlineAcademicCap, HiOutlineArrowPath
} from 'react-icons/hi2'
import './Admin.css'

const STEPS = ['بيانات المساعد', 'اختيار الأساتذة', 'حجم المجموعات', 'معاينة وتأكيد']

export const AssistantWizard = () => {
    const navigate = useNavigate()
    const [step, setStep] = useState(0)
    const [teachers, setTeachers] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [preview, setPreview] = useState(null)
    const [seed, setSeed] = useState(null)

    const [form, setForm] = useState({
        name: '',
        phone: '',
        creation_password: '',
        is_active: true,
    })
    const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
    const [teacherConfigs, setTeacherConfigs] = useState({})
    const [unassignedCounts, setUnassignedCounts] = useState({})

    const tk = localStorage.getItem('access_token')

    useEffect(() => {
        fetch(`${API}/api/hq/teachers/?page_size=500`, {
            headers: { Authorization: `Bearer ${tk}` },
        })
            .then(r => r.json())
            .then(data => setTeachers(data.results || data || []))
            .catch(() => setError('فشل تحميل قائمة الأساتذة'))
    }, [tk])

    const fetchUnassignedCount = async (teacherId) => {
        const res = await fetch(`${API}/api/hq/teachers/${teacherId}/unassigned-students/`, {
            headers: { Authorization: `Bearer ${tk}` },
        })
        if (res.ok) {
            const data = await res.json()
            setUnassignedCounts(prev => ({ ...prev, [teacherId]: data.count }))
        }
    }

    useEffect(() => {
        selectedTeacherIds.forEach(id => {
            if (unassignedCounts[id] === undefined) fetchUnassignedCount(id)
        })
    }, [selectedTeacherIds])

    const toggleTeacher = (id) => {
        setSelectedTeacherIds(prev => {
            if (prev.includes(id)) {
                const next = prev.filter(x => x !== id)
                return next
            }
            setTeacherConfigs(cfg => ({ ...cfg, [id]: cfg[id] || 50 }))
            return [...prev, id]
        })
    }

    const runPreview = async (newSeed = null) => {
        setLoading(true)
        setError('')
        try {
            const body = {
                teachers: selectedTeacherIds.map(id => ({
                    teacher_id: id,
                    students_per_group: teacherConfigs[id] || 50,
                })),
            }
            if (newSeed !== null) body.seed = newSeed

            const res = await fetch(`${API}/api/hq/teacherassistants/preview-groups/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tk}`,
                },
                body: JSON.stringify(body),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل المعاينة')
            setPreview(data)
            setSeed(data.seed)
            setStep(3)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        setLoading(true)
        setError('')
        try {
            const res = await fetch(`${API}/api/hq/teacherassistants/create-with-groups/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tk}`,
                },
                body: JSON.stringify({
                    ...form,
                    teachers: selectedTeacherIds.map(id => ({
                        teacher_id: id,
                        students_per_group: teacherConfigs[id] || 50,
                    })),
                    seed,
                    confirmed: true,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'فشل الحفظ')
            navigate('/hq/teacherassistants')
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const canNext = () => {
        if (step === 0) return form.name && form.phone && form.creation_password
        if (step === 1) return selectedTeacherIds.length > 0
        if (step === 2) return selectedTeacherIds.every(id => (teacherConfigs[id] || 0) >= 1)
        return true
    }

    return (
        <div className="hq-content" style={{ maxWidth: '900px', margin: '0 auto', padding: '30px' }}>
            <div style={{ marginBottom: '30px' }}>
                <button className="hq-btn" onClick={() => navigate('/hq/teacherassistants')} style={{ marginBottom: '15px' }}>
                    <HiOutlineArrowRight /> العودة للقائمة
                </button>
                <h1 style={{ margin: 0, color: 'var(--hq-primary)' }}>
                    <HiOutlineAcademicCap style={{ verticalAlign: 'middle' }} /> إنشاء مساعد جديد
                </h1>
                <p style={{ color: 'var(--hq-text-muted)', marginTop: '8px' }}>
                    معالج التوزيع على مستوى الأستاذ والمجموعات
                </p>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '30px', flexWrap: 'wrap' }}>
                {STEPS.map((label, i) => (
                    <div
                        key={label}
                        style={{
                            flex: 1, minWidth: '120px', padding: '10px', borderRadius: '8px', textAlign: 'center',
                            background: i <= step ? 'var(--hq-primary-bg)' : 'rgba(0,0,0,0.05)',
                            border: i === step ? '2px solid var(--hq-primary)' : '1px solid #ddd',
                            fontWeight: i === step ? 'bold' : 'normal',
                            fontSize: '13px',
                        }}
                    >
                        {i + 1}. {label}
                    </div>
                ))}
            </div>

            {error && (
                <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '12px', borderRadius: '8px', marginBottom: '20px' }}>
                    {error}
                </div>
            )}

            {step === 0 && (
                <div className="hq-form-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <label className="hq-label">اسم المساعد *</label>
                    <input className="hq-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    <label className="hq-label">رقم الهاتف (اسم المستخدم) *</label>
                    <input className="hq-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    <label className="hq-label">كلمة المرور *</label>
                    <input className="hq-input" type="text" value={form.creation_password} onChange={e => setForm({ ...form, creation_password: e.target.value })} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
                        حساب فعال
                    </label>
                </div>
            )}

            {step === 1 && (
                <div className="hq-form-card">
                    <p style={{ marginBottom: '16px', color: 'var(--hq-text-muted)' }}>
                        اختر الأساتذة الذين سيعمل المساعد معهم (يمكن اختيار أكثر من أستاذ)
                    </p>
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {teachers.map(t => (
                            <label
                                key={t.id}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                                    border: selectedTeacherIds.includes(t.id) ? '2px solid var(--hq-primary)' : '1px solid #ddd',
                                    borderRadius: '8px', cursor: 'pointer',
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedTeacherIds.includes(t.id)}
                                    onChange={() => toggleTeacher(t.id)}
                                />
                                <span style={{ fontWeight: '600' }}>{t.name}</span>
                                {unassignedCounts[t.id] !== undefined && (
                                    <span style={{ marginRight: 'auto', fontSize: '12px', color: '#666' }}>
                                        {unassignedCounts[t.id]} طالب غير موزّع
                                    </span>
                                )}
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="hq-form-card">
                    <p style={{ marginBottom: '16px', color: 'var(--hq-text-muted)' }}>
                        حدد عدد الطلاب في كل مجموعة لكل أستاذ (يتم توزيع الطلاب غير الموزّعين فقط)
                    </p>
                    {selectedTeacherIds.map(id => {
                        const teacher = teachers.find(t => t.id === id)
                        return (
                            <div key={id} style={{ marginBottom: '20px', padding: '16px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <strong>{teacher?.name}</strong>
                                <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <label>طلاب لكل مجموعة:</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="hq-input"
                                        style={{ width: '100px' }}
                                        value={teacherConfigs[id] || 50}
                                        onChange={e => setTeacherConfigs({ ...teacherConfigs, [id]: parseInt(e.target.value, 10) || 50 })}
                                    />
                                    <span style={{ fontSize: '13px', color: '#888' }}>
                                        ({unassignedCounts[id] ?? '...'} طالب متاح للتوزيع)
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {step === 3 && preview && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>معاينة التوزيع — تأكد قبل الحفظ</h3>
                        <button
                            className="hq-btn"
                            onClick={() => runPreview(Math.floor(Math.random() * 2 ** 32))}
                            disabled={loading}
                        >
                            <HiOutlineArrowPath /> إعادة توزيع عشوائي
                        </button>
                    </div>
                    {(preview.teachers || []).map(t => (
                        <div key={t.teacher_id} style={{ marginBottom: '24px' }}>
                            <h4 style={{ color: 'var(--hq-primary)' }}>
                                {t.teacher_name} — {t.total_unassigned} طالب ({t.groups?.length || 0} مجموعة)
                            </h4>
                            {(t.groups || []).map(g => (
                                <div
                                    key={g.index}
                                    style={{
                                        border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px',
                                        marginBottom: '12px', background: '#fafafa',
                                    }}
                                >
                                    <div style={{ fontWeight: 'bold', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <HiOutlineUsers /> مجموعة {g.index} — {g.students_count} طالب
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {(g.students || []).map(s => (
                                            <span
                                                key={s.id}
                                                style={{
                                                    background: 'white', border: '1px solid #ddd', padding: '4px 10px',
                                                    borderRadius: '20px', fontSize: '13px',
                                                }}
                                            >
                                                {s.full_name}
                                            </span>
                                        ))}
                                        {g.students_count === 0 && (
                                            <span style={{ color: '#999' }}>لا يوجد طلاب للتوزيع</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', gap: '12px' }}>
                <button
                    className="hq-btn"
                    disabled={step === 0 || loading}
                    onClick={() => setStep(s => s - 1)}
                >
                    <HiOutlineArrowRight /> السابق
                </button>

                {step < 2 && (
                    <button
                        className="hq-btn primary"
                        disabled={!canNext() || loading}
                        onClick={() => setStep(s => s + 1)}
                    >
                        التالي <HiOutlineArrowLeft />
                    </button>
                )}
                {step === 2 && (
                    <button
                        className="hq-btn primary"
                        disabled={!canNext() || loading}
                        onClick={() => runPreview()}
                    >
                        {loading ? 'جاري المعاينة...' : 'معاينة التوزيع'}
                    </button>
                )}
                {step === 3 && (
                    <button
                        className="hq-btn primary"
                        disabled={loading}
                        onClick={handleSubmit}
                        style={{ background: '#10b981' }}
                    >
                        <HiOutlineCheck /> {loading ? 'جاري الحفظ...' : 'تأكيد وإنشاء المساعد'}
                    </button>
                )}
            </div>
        </div>
    )
}
