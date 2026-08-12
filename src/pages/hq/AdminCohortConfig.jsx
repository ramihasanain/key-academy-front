import React, { useEffect, useState } from 'react'
import { API } from '../../config'
import './Admin.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

// ISO ← → حقل datetime-local بالتوقيت المحلي
const isoToLocalInput = (iso) => {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const localInputToIso = (val) => {
    if (!val) return null
    const d = new Date(val)
    return isNaN(d.getTime()) ? null : d.toISOString()
}

const DEFAULT_SPLIT_LOCAL = '2026-08-01T00:00'

export const AdminCohortConfig = () => {
    const [recordId, setRecordId] = useState(null)
    const [isEnabled, setIsEnabled] = useState(false)
    const [splitAt, setSplitAt] = useState(DEFAULT_SPLIT_LOCAL)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dirty, setDirty] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(`${API}/api/hq/cohortconfig/?page_size=1`, { headers: authHeaders() })
                if (res.ok) {
                    const data = await res.json()
                    const row = (data.results || data)[0]
                    if (row) {
                        setRecordId(row.id)
                        setIsEnabled(!!row.is_enabled)
                        setSplitAt(isoToLocalInput(row.new_cohort_start_at) || DEFAULT_SPLIT_LOCAL)
                    }
                }
            } catch (e) { console.error('load cohort config failed', e) }
            finally { setLoading(false) }
        }
        load()
    }, [])

    const handleSave = async () => {
        const iso = localInputToIso(splitAt)
        if (!iso) return alert('حدد تاريخ الفصل بصيغة صحيحة.')
        if (isEnabled && !window.confirm(
            'تأكيد التفعيل:\n\n' +
            '- الطالب المسجّل بعد تاريخ الفصل سيرى دورات «الجدد فقط» في تصفح.\n' +
            '- الطالب الأقدم سيختفي عنه كل ما هو معلّم «للجدد فقط» (ولا يتأثر بغير ذلك).\n' +
            '- اشتراكات الجميع الفعلية تبقى كما هي.\n\n' +
            'هل أنت متأكد؟'
        )) return

        setSaving(true)
        try {
            const body = JSON.stringify({ is_enabled: isEnabled, new_cohort_start_at: iso })
            const url = recordId
                ? `${API}/api/hq/cohortconfig/${recordId}/`
                : `${API}/api/hq/cohortconfig/`
            const res = await fetch(url, {
                method: recordId ? 'PATCH' : 'POST',
                headers: authHeaders(),
                body,
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || data.detail || 'فشل الحفظ')
            setRecordId(data.id)
            setDirty(false)
            alert(isEnabled ? 'تم الحفظ — نظام الدفعات مفعّل الآن ✅ (يسري خلال دقيقة)' : 'تم الحفظ — نظام الدفعات موقوف.')
        } catch (e) {
            alert('حدث خطأ: ' + e.message)
        } finally { setSaving(false) }
    }

    if (loading) return <div className="hq-loading" style={{ padding: '50px' }}>جاري تحميل إعدادات نظام الدفعات...</div>

    return (
        <div className="hq-form-wrap" style={{ maxWidth: '760px' }}>
            <div className="hq-page-header" style={{ paddingBottom: '15px', borderBottom: '1px solid var(--hq-border)' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem' }}>نظام الدفعات (جديد / قديم) 🎓</h2>
                <p style={{ margin: '5px 0 0', color: 'var(--hq-text-muted)', fontSize: '0.9rem' }}>
                    عند التفعيل: الطالب المسجّل بعد تاريخ الفصل يرى دورات «الجدد فقط»، والطالب الأقدم لا يراها ويبقى على دوراته كما هي.
                </p>
            </div>

            {/* المفتاح الرئيسي */}
            <div className="hq-form-card" style={{ marginTop: '25px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '25px', border: `2px solid ${isEnabled ? '#86efac' : 'var(--hq-border)'}`, background: isEnabled ? '#f0fdf4' : 'white', borderRadius: '16px' }}>
                <div>
                    <div style={{ fontWeight: 'bold', fontSize: '1.15rem', color: isEnabled ? '#16a34a' : '#334155' }}>
                        {isEnabled ? 'النظام مفعّل ✅' : 'النظام موقوف'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '5px' }}>
                        {isEnabled
                            ? 'فلترة الدورات حسب دفعة الطالب تعمل الآن في التطبيق والموقع.'
                            : 'المنصة تعمل بسلوكها المعتاد — كل الطلاب يرون كل الدورات المنشورة.'}
                    </div>
                </div>
                <div className="hq-toggle-switch" style={{ transform: 'scale(1.3)' }}>
                    <input type="checkbox" id="cohort-toggle" checked={isEnabled} onChange={e => { setIsEnabled(e.target.checked); setDirty(true) }} />
                    <label htmlFor="cohort-toggle"></label>
                </div>
            </div>

            {/* تاريخ الفصل */}
            <div className="hq-form-card" style={{ marginTop: '20px', padding: '25px', borderRadius: '16px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#475569' }}>
                    تاريخ فصل الدفعة الجديدة
                </label>
                <input
                    type="datetime-local"
                    value={splitAt}
                    onChange={e => { setSplitAt(e.target.value); setDirty(true) }}
                    style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '1rem' }}
                />
                <p style={{ margin: '12px 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>
                    من سجّل حسابه بعد هذا التاريخ يُعد من «الطلاب الجدد». الافتراضي: 1/8/2026.
                </p>
            </div>

            {/* تنبيه قبل التفعيل */}
            {!isEnabled && (
                <div style={{ marginTop: '20px', background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '15px', fontSize: '0.85rem', color: '#92400e' }}>
                    ⚠️ قبل التفعيل تأكد أن دورات «الجدد فقط» جاهزة ومنشورة — وإلا سيرى الطالب الجديد صفحة تصفح فارغة.
                </div>
            )}

            <div style={{ marginTop: '25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {dirty && <span style={{ alignSelf: 'center', color: '#f59e0b', fontSize: '0.85rem', fontWeight: 'bold' }}>تعديلات غير محفوظة</span>}
                <button onClick={handleSave} disabled={saving || !dirty} style={{ padding: '12px 35px', borderRadius: '10px', border: 'none', background: dirty ? 'var(--hq-primary)' : '#cbd5e1', color: 'white', fontWeight: 'bold', fontSize: '1rem', cursor: (saving || !dirty) ? 'not-allowed' : 'pointer' }}>
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </button>
            </div>
        </div>
    )
}
