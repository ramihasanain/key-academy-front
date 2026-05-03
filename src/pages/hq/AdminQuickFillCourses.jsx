import React, { useState, useEffect } from 'react';
import { API } from '../../config';
import './Admin.css';

export const AdminQuickFillCourses = () => {
    const [teachers, setTeachers] = useState([]);
    const [rows, setRows] = useState([
        { id: Date.now(), title: '', teacher: '', is_free: 'paid', price: '', hero_image: null, status: 'idle' } // status: idle | loading | success | error
    ]);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const tk = localStorage.getItem('access_token');
            // Assuming pagination exists, we might need a large limit
            const res = await fetch(API + '/api/hq/teachers/?limit=1000', {
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTeachers(data.results || data);
            }
        } catch (err) {
            console.error('Error fetching teachers', err);
        }
    };

    const addRow = () => {
        setRows([...rows, { id: Date.now(), title: '', teacher: '', is_free: 'paid', price: '', hero_image: null, status: 'idle' }]);
    };

    const removeRow = (id) => {
        setRows(rows.filter(r => r.id !== id));
    };

    const handleRowChange = (id, field, value) => {
        setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
    };

    const handleImageChange = (id, e) => {
        const file = e.target.files[0];
        setRows(rows.map(r => r.id === id ? { ...r, hero_image: file } : r));
    };

    const saveAll = async () => {
        setIsSaving(true);
        const tk = localStorage.getItem('access_token');
        
        const newRows = [...rows];
        
        for (let i = 0; i < newRows.length; i++) {
            const row = newRows[i];
            if (!row.title || !row.teacher) continue; // skip empty or incomplete rows
            if (row.status === 'success') continue; // already saved
            
            newRows[i].status = 'loading';
            setRows([...newRows]);

            try {
                const formData = new FormData();
                formData.append('title', row.title);
                formData.append('teacher', row.teacher);
                
                // Determine price based on is_free choice
                const finalPrice = row.is_free === 'free' ? '0' : (row.price || '0');
                formData.append('price', finalPrice);
                
                if (row.hero_image) {
                    formData.append('hero_image', row.hero_image);
                }

                const res = await fetch(API + '/api/hq/courses/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${tk}`
                    },
                    body: formData
                });

                if (res.ok) {
                    newRows[i].status = 'success';
                } else {
                    newRows[i].status = 'error';
                    console.error('Failed to save row', row, await res.text());
                }
            } catch (err) {
                newRows[i].status = 'error';
                console.error('Exception saving row', row, err);
            }
            setRows([...newRows]);
        }
        setIsSaving(false);
    };

    return (
        <div className="hq-overview">
            <div className="hq-page-header">
                <h3>التعبئة السريعة للدورات</h3>
                <p>إضافة عدة دورات في وقت واحد بطريقة سريعة (مثل Excel)</p>
            </div>

            <div className="hq-card" style={{ padding: '20px', overflowX: 'auto' }}>
                <table className="hq-grid-table" style={{ width: '100%', minWidth: '800px' }}>
                    <thead>
                        <tr>
                            <th>اسم الدورة</th>
                            <th>الأستاذ</th>
                            <th>النوع</th>
                            <th>السعر</th>
                            <th>غلاف الدورة</th>
                            <th>الحالة</th>
                            <th>إجراء</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} style={{ background: row.status === 'success' ? '#dcfce7' : row.status === 'error' ? '#fee2e2' : 'transparent' }}>
                                <td>
                                    <input 
                                        type="text" 
                                        className="hq-input" 
                                        placeholder="اسم الدورة..." 
                                        value={row.title}
                                        onChange={(e) => handleRowChange(row.id, 'title', e.target.value)}
                                        disabled={row.status === 'loading' || row.status === 'success'}
                                    />
                                </td>
                                <td>
                                    <select 
                                        className="hq-input" 
                                        value={row.teacher} 
                                        onChange={(e) => handleRowChange(row.id, 'teacher', e.target.value)}
                                        disabled={row.status === 'loading' || row.status === 'success'}
                                    >
                                        <option value="">اختر الأستاذ...</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.name || t.user?.username || `أستاذ ${t.id}`}</option>
                                        ))}
                                    </select>
                                </td>
                                <td>
                                    <select 
                                        className="hq-input" 
                                        value={row.is_free} 
                                        onChange={(e) => handleRowChange(row.id, 'is_free', e.target.value)}
                                        disabled={row.status === 'loading' || row.status === 'success'}
                                    >
                                        <option value="paid">مدفوعة</option>
                                        <option value="free">مجانية</option>
                                    </select>
                                </td>
                                <td>
                                    <input 
                                        type="text" 
                                        className="hq-input" 
                                        placeholder="السعر..." 
                                        value={row.price}
                                        onChange={(e) => handleRowChange(row.id, 'price', e.target.value)}
                                        disabled={row.is_free === 'free' || row.status === 'loading' || row.status === 'success'}
                                        style={{ opacity: row.is_free === 'free' ? 0.5 : 1 }}
                                    />
                                </td>
                                <td>
                                    <input 
                                        type="file" 
                                        className="hq-input" 
                                        accept="image/*"
                                        onChange={(e) => handleImageChange(row.id, e)}
                                        disabled={row.status === 'loading' || row.status === 'success'}
                                    />
                                </td>
                                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                                    {row.status === 'idle' && <span style={{ color: '#6b7280' }}>قيد الانتظار</span>}
                                    {row.status === 'loading' && <span style={{ color: '#3b82f6' }}>جاري الحفظ...</span>}
                                    {row.status === 'success' && <span style={{ color: '#10b981' }}>✓ تم الحفظ</span>}
                                    {row.status === 'error' && <span style={{ color: '#ef4444' }}>✗ خطأ</span>}
                                </td>
                                <td>
                                    <button 
                                        className="hq-action-btn delete"
                                        onClick={() => removeRow(row.id)}
                                        disabled={row.status === 'loading'}
                                    >
                                        حذف
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                    <button className="hq-btn-outline" onClick={addRow}>
                        + إضافة صف جديد
                    </button>
                    
                    <button 
                        className="hq-btn-primary" 
                        onClick={saveAll}
                        disabled={isSaving}
                    >
                        {isSaving ? 'جاري الحفظ...' : 'حفظ جميع الدورات'}
                    </button>
                </div>
            </div>
        </div>
    );
};
