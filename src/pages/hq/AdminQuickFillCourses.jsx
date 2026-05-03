import React, { useState, useEffect } from 'react';
import { API } from '../../config';
import './Admin.css';

export const AdminQuickFillCourses = () => {
    const [teachers, setTeachers] = useState([]);
    const [globalTeacher, setGlobalTeacher] = useState('');
    const [courseNames, setCourseNames] = useState('');
    const [step, setStep] = useState(1);
    const [rows, setRows] = useState([]);
    const [isSaving, setIsSaving] = useState(false);

    // Pre-defined price options based on your request
    const PRICE_OPTIONS = [
        { label: '200 الف', value: '200000' },
        { label: '250 الف', value: '250000' },
        { label: '300 الف', value: '300000' },
        { label: '350 الف', value: '350000' },
        { label: '400 الف', value: '400000' },
    ];

    useEffect(() => {
        fetchTeachers();
    }, []);

    const fetchTeachers = async () => {
        try {
            const tk = localStorage.getItem('access_token');
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

    const handleNextStep = () => {
        if (!globalTeacher) {
            alert('الرجاء اختيار الأستاذ أولاً');
            return;
        }
        
        const names = courseNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (names.length === 0) {
            alert('الرجاء إدخال أسماء الدورات');
            return;
        }

        // Generate rows from the pasted names
        const generatedRows = names.map((name, index) => ({
            id: Date.now() + index,
            title: name,
            price: PRICE_OPTIONS[0].value, // Default to first price option
            hero_image: null,
            status: 'idle'
        }));

        setRows(generatedRows);
        setStep(2);
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
            if (row.status === 'success') continue; 
            
            newRows[i].status = 'loading';
            setRows([...newRows]);

            try {
                const formData = new FormData();
                formData.append('title', row.title);
                formData.append('teacher', globalTeacher);
                formData.append('price', row.price);
                formData.append('is_published', 'true');
                
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
                }
            } catch (err) {
                newRows[i].status = 'error';
            }
            // Trigger re-render to show progress row by row
            setRows([...newRows]);
        }
        setIsSaving(false);
    };

    return (
        <div className="hq-overview">
            <div className="hq-page-header">
                <h3>التعبئة السريعة للدورات (خطوتين)</h3>
                <p>قم بلصق أسماء الدورات واختيار الأستاذ، ثم قم بتحديد غلاف وسعر لكل دورة على حدة.</p>
            </div>

            <div className="hq-card" style={{ padding: '20px' }}>
                
                {/* الخطوة الأولى: الأستاذ موحد والنص المنسوخ */}
                {step === 1 && (
                    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>الأستاذ (موحد لجميع هذه الدورات)</label>
                            <select 
                                className="hq-input" 
                                value={globalTeacher} 
                                onChange={(e) => setGlobalTeacher(e.target.value)}
                            >
                                <option value="">اختر الأستاذ...</option>
                                {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.name || t.user?.username || `أستاذ ${t.id}`}</option>
                                ))}
                            </select>
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>أسماء الدورات (انسخ والصق - كل دورة في سطر)</label>
                            <textarea 
                                className="hq-input" 
                                rows="15"
                                placeholder="دورة الفيزياء الفصل الأول&#10;دورة الكيمياء العضوية..."
                                value={courseNames}
                                onChange={(e) => setCourseNames(e.target.value)}
                                style={{ height: 'auto', resize: 'vertical' }}
                            ></textarea>
                        </div>
                        
                        <button 
                            className="hq-btn-primary" 
                            onClick={handleNextStep}
                            style={{ width: '100%', padding: '15px', fontSize: '18px' }}
                        >
                            التالي: تعيين الأسعار والأغلفة
                        </button>
                    </div>
                )}


                {/* الخطوة الثانية: تخصيص السعر والغلاف لكل دورة */}
                {step === 2 && (
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button className="hq-btn-outline" onClick={() => setStep(1)} disabled={isSaving}>
                                &rarr; رجوع للأسماء
                            </button>
                            <strong style={{ fontSize: '18px' }}>الأستاذ المختار: {teachers.find(t => t.id == globalTeacher)?.name || ''}</strong>
                        </div>

                        <table className="hq-grid-table" style={{ width: '100%', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th>اسم الدورة</th>
                                    <th>السعر</th>
                                    <th>غلاف الدورة</th>
                                    <th>الحالة</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} style={{ background: row.status === 'success' ? '#dcfce7' : row.status === 'error' ? '#fee2e2' : 'transparent' }}>
                                        <td>
                                            <input 
                                                type="text" 
                                                className="hq-input" 
                                                value={row.title}
                                                onChange={(e) => handleRowChange(row.id, 'title', e.target.value)}
                                                disabled={row.status === 'loading' || row.status === 'success'}
                                            />
                                        </td>
                                        <td>
                                            <select 
                                                className="hq-input" 
                                                value={row.price} 
                                                onChange={(e) => handleRowChange(row.id, 'price', e.target.value)}
                                                disabled={row.status === 'loading' || row.status === 'success'}
                                            >
                                                {PRICE_OPTIONS.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
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
                                            {row.status === 'loading' && <span style={{ color: '#3b82f6' }}>جاري الرفع...</span>}
                                            {row.status === 'success' && <span style={{ color: '#10b981' }}>✓ تم النشر</span>}
                                            {row.status === 'error' && <span style={{ color: '#ef4444' }}>✗ خطأ</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        <div style={{ marginTop: '20px' }}>
                            <button 
                                className="hq-btn-primary" 
                                onClick={saveAll}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '15px', fontSize: '18px' }}
                            >
                                {isSaving ? 'جاري نشر الدورات...' : 'نشر وحفظ الجميع'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
