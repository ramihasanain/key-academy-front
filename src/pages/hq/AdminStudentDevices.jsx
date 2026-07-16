import React, { useCallback, useEffect, useState } from 'react'
import { API } from '../../config'
import './Admin.css'
import './AdminStudentDevices.css'

const authHeaders = () => {
    const tk = localStorage.getItem('access_token')
    return { Authorization: `Bearer ${tk}`, 'Content-Type': 'application/json' }
}

const GRADES = [
    { value: '', label: 'كل الصفوف' },
    { value: 'الصف السادس الإعدادي', label: 'السادس الإعدادي' },
    { value: 'الثالث المتوسط', label: 'الثالث المتوسط' },
]

const DEVICE_FILTERS = [
    { value: '', label: 'الكل' },
    { value: 'android', label: 'أندرويد' },
    { value: 'ios', label: 'آيفون' },
    { value: 'both', label: 'الاثنين معاً' },
    { value: 'multi', label: 'أكثر من جهاز' },
    { value: 'none', label: 'بلا جهاز' },
]

const CODE_FILTERS = [
    { value: '', label: 'الكل' },
    { value: '1', label: 'عنده كود' },
    { value: '0', label: 'بلا كود' },
]

const formatDate = (iso) => {
    if (!iso) return '—'
    try {
        return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
    } catch {
        return '—'
    }
}

const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

const Tile = ({ label, value, sub, tone }) => (
    <div className={`sdev-tile${tone ? ` sdev-tile--${tone}` : ''}`}>
        <span className="sdev-tile-label">{label}</span>
        <b className="sdev-tile-value">{value?.toLocaleString('en-US') ?? '—'}</b>
        {sub && <span className="sdev-tile-sub">{sub}</span>}
    </div>
)

export const AdminStudentDevices = () => {
    const [rows, setRows] = useState([])
    const [summary, setSummary] = useState(null)
    const [count, setCount] = useState(0)
    const [page, setPage] = useState(1)
    const [hasNext, setHasNext] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [grade, setGrade] = useState('')
    const [device, setDevice] = useState('')
    const [hasCode, setHasCode] = useState('')
    const [search, setSearch] = useState('')
    const [debouncedSearch, setDebouncedSearch] = useState('')

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 400)
        return () => clearTimeout(t)
    }, [search])

    // أي تغيير بالفلاتر يرجّعنا للصفحة الأولى — وإلا بقينا على صفحة غير موجودة
    useEffect(() => {
        setPage(1)
    }, [grade, device, hasCode, debouncedSearch])

    const fetchRows = useCallback(async () => {
        setLoading(true)
        setError('')
        try {
            const qs = new URLSearchParams({ page: String(page), page_size: '50' })
            if (grade) qs.set('grade', grade)
            if (device) qs.set('device', device)
            if (hasCode) qs.set('has_code', hasCode)
            if (debouncedSearch.trim()) qs.set('search', debouncedSearch.trim())

            const res = await fetch(`${API}/api/hq/student-devices/?${qs}`, { headers: authHeaders() })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.detail || data.error || 'فشل تحميل البيانات')
            }
            const data = await res.json()
            setRows(data.results || [])
            setSummary(data.summary || null)
            setCount(data.count || 0)
            setHasNext(Boolean(data.next))
        } catch (err) {
            setError(err.message)
            setRows([])
        } finally {
            setLoading(false)
        }
    }, [page, grade, device, hasCode, debouncedSearch])

    useEffect(() => {
        fetchRows()
    }, [fetchRows])

    const s = summary
    const totalStudents = s?.students || 0

    return (
        <div className="sdev-page">
            <div className="sdev-head">
                <div>
                    <h1>أجهزة الطلاب</h1>
                    <p>
                        توزيع الطلاب حسب الجهاز، عدد الأجهزة لكل طالب، وهل عنده كود تفعيل.
                    </p>
                </div>
                <button type="button" className="sdev-refresh" onClick={fetchRows} disabled={loading}>
                    تحديث
                </button>
            </div>

            <div className="sdev-note">
                <b>اقرأ هذا قبل ما تعتمد الأرقام:</b> مصدر بيانات الجهاز هو تسجيل الإشعارات بالتطبيق،
                وهو يعكس <b>الأجهزة المسجّلة حالياً</b> لا سجلاً تاريخياً — الجهاز يُحذف عند تسجيل الخروج.
                والويب لا يسجّل أجهزة إطلاقاً، فـ«بلا جهاز» تعني «ما عنده تطبيق مسجّل» وليس «ما دخل المنصة».
            </div>

            {s && (
                <div className="sdev-tiles">
                    <Tile label="طلاب" value={s.students} sub={`${s.devices?.toLocaleString('en-US')} جهاز مسجّل`} />
                    <Tile label="أندرويد" value={s.android} sub={`${pct(s.android, totalStudents)}٪ من الطلاب`} tone="android" />
                    <Tile label="آيفون" value={s.ios} sub={`${pct(s.ios, totalStudents)}٪ من الطلاب`} tone="ios" />
                    <Tile label="الاثنين معاً" value={s.both} sub="أندرويد وآيفون" />
                    <Tile label="أكثر من جهاز" value={s.multi_device} sub={`${pct(s.multi_device, totalStudents)}٪ من الطلاب`} />
                    <Tile label="بلا جهاز مسجّل" value={s.no_device} sub={`${pct(s.no_device, totalStudents)}٪ من الطلاب`} tone="muted" />
                    <Tile label="عنده كود" value={s.with_code} sub={`${pct(s.with_code, totalStudents)}٪ من الطلاب`} tone="code" />
                </div>
            )}

            {s && (
                <p className="sdev-facet-hint">
                    التوزيع أعلاه محسوب على الصف/البحث/الكود المختار — لا يتأثر بفلتر الجهاز، حتى يبقى ظاهراً كاملاً وأنت تنقّل بين الأجهزة.
                </p>
            )}

            <div className="sdev-toolbar">
                <label className="sdev-field">
                    <span>الصف</span>
                    <select value={grade} onChange={e => setGrade(e.target.value)}>
                        {GRADES.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                </label>
                <label className="sdev-field">
                    <span>الجهاز</span>
                    <select value={device} onChange={e => setDevice(e.target.value)}>
                        {DEVICE_FILTERS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </label>
                <label className="sdev-field">
                    <span>الكود</span>
                    <select value={hasCode} onChange={e => setHasCode(e.target.value)}>
                        {CODE_FILTERS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                </label>
                <label className="sdev-field sdev-field--grow">
                    <span>بحث</span>
                    <input
                        type="search"
                        placeholder="الاسم أو المعرّف أو رقم الهاتف..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </label>
            </div>

            {error ? (
                <div className="sdev-empty sdev-empty--error">{error}</div>
            ) : loading ? (
                <div className="sdev-empty">جاري التحميل...</div>
            ) : rows.length === 0 ? (
                <div className="sdev-empty">لا نتائج مطابقة للفلاتر المختارة.</div>
            ) : (
                <>
                    <div className="sdev-table-wrap">
                        <table className="sdev-table">
                            <thead>
                                <tr>
                                    <th>الطالب</th>
                                    <th>الصف</th>
                                    <th>الجهاز</th>
                                    <th className="sdev-num">عدد الأجهزة</th>
                                    <th>الكود</th>
                                    <th>آخر تسجيل جهاز</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map(r => (
                                    <tr key={r.id}>
                                        <td>
                                            <div className="sdev-student">
                                                <strong>{r.name}</strong>
                                                <span>@{r.username} · {r.phone}</span>
                                            </div>
                                        </td>
                                        <td className="sdev-grade">{r.grade || '—'}</td>
                                        <td>
                                            <div className="sdev-badges">
                                                {r.android_count > 0 && (
                                                    <span className="sdev-badge sdev-badge--android">
                                                        أندرويد{r.android_count > 1 ? ` ×${r.android_count}` : ''}
                                                    </span>
                                                )}
                                                {r.ios_count > 0 && (
                                                    <span className="sdev-badge sdev-badge--ios">
                                                        آيفون{r.ios_count > 1 ? ` ×${r.ios_count}` : ''}
                                                    </span>
                                                )}
                                                {r.device_count === 0 && (
                                                    <span className="sdev-badge sdev-badge--none">بلا جهاز</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="sdev-num">{r.device_count}</td>
                                        <td>
                                            <span className={`sdev-code ${r.has_code ? 'sdev-code--yes' : 'sdev-code--no'}`}>
                                                {r.has_code ? 'عنده كود' : 'بلا كود'}
                                            </span>
                                        </td>
                                        <td className="sdev-date">{formatDate(r.last_device_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="sdev-pager">
                        <button type="button" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                            السابق
                        </button>
                        <span>صفحة {page} — {count.toLocaleString('en-US')} طالب بالنتيجة</span>
                        <button type="button" onClick={() => setPage(p => p + 1)} disabled={!hasNext || loading}>
                            التالي
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
