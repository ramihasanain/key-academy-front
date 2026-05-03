import React, { useState, useEffect } from 'react';
import { API } from '../../config';
import './Admin.css';

export const AdminQuickFillCourses = () => {
    const [teachers, setTeachers] = useState([]);
    const [globalTeacher, setGlobalTeacher] = useState('');
    const [globalPrice, setGlobalPrice] = useState('50000');
    const [globalImage, setGlobalImage] = useState(null);
    const [courseNames, setCourseNames] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [results, setResults] = useState([]); // { title, status }

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

    const handleImageChange = (e) => {
        setGlobalImage(e.target.files[0]);
    };

    const saveAll = async () => {
        if (!globalTeacher) {
            alert("الرجاء اختيار الأستاذ أولاً");
            return;
        }

        const names = courseNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
        if (names.length === 0) {
            alert("الرجاء إدخال أسماء الدورات");
            return;
        }

        setIsSaving(true);
        const tk = localStorage.getItem('access_token');
        
        const newResults = names.map(n => ({ title: n, status: 'loading' }));
        setResults(newResults);

        for (let i = 0; i < names.length; i++) {
            const title = names[i];
            
            try {
                const formData = new FormData();
                formData.append('title', title);
                formData.append('teacher', globalTeacher);
                formData.append('price', globalPrice);
                formData.append('is_published', 'true'); // All active
                
                if (globalImage) {
                    formData.append('hero_image', globalImage);
                }

                const res = await fetch(API + '/api/hq/courses/', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${tk}`
                    },
                    body: formData
                });

                if (res.ok) {
                    newResults[i].status = 'success';
                } else {
                    newResults[i].status = 'error';
                }
            } catch (err) {
                newResults[i].status = 'error';
            }
            // Trigger re-render to show progress
            setResults([...newResults]);
        }
        setIsSaving(false);
    };

    return (
        <div className="hq-overview">
            <div className="hq-page-header">
                <h3>التعبئة السريعة للدورات (نسخ / لصق)</h3>
                <p>قم باختيار الإعدادات العامة والصق أسماء الدورات، ليتم إنشاؤها جميعاً كدورات مدفوعة وفعالة.</p>
            </div>

            <div className="hq-card" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>الأستاذ (مطلوب)</label>
                        <select 
                            className="hq-input" 
                            value={globalTeacher} 
                            onChange={(e) => setGlobalTeacher(e.target.value)}
                            disabled={isSaving}
                        >
                            <option value="">اختر الأستاذ الموحد...</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name || t.user?.username || `أستاذ ${t.id}`}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>السعر الموحد (مطلوب)</label>
                        <input 
                            type="text" 
                            className="hq-input" 
                            placeholder="مثال: 50000" 
                            value={globalPrice}
                            onChange={(e) => setGlobalPrice(e.target.value)}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>غلاف الدورة الموحد (اختياري)</label>
                    <input 
                        type="file" 
                        className="hq-input" 
                        accept="image/*"
                        onChange={handleImageChange}
                        disabled={isSaving}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>أسماء الدورات (كل اسم في سطر مستقل)</label>
                    <textarea 
                        className="hq-input" 
                        rows="15"
                        placeholder="دورة الفيزياء الفصل الأول&#10;دورة الكيمياء العضوية&#10;الرياضيات المكثف..."
                        value={courseNames}
                        onChange={(e) => setCourseNames(e.target.value)}
                        disabled={isSaving}
                        style={{ height: 'auto', resize: 'vertical' }}
                    ></textarea>
                </div>
                
                <button 
                    className="hq-btn-primary" 
                    onClick={saveAll}
                    disabled={isSaving}
                    style={{ width: '100%', padding: '15px', fontSize: '18px' }}
                >
                    {isSaving ? 'جاري الإنشاء...' : 'إنشاء جميع الدورات دفعة واحدة'}
                </button>

                {results.length > 0 && (
                    <div style={{ marginTop: '30px' }}>
                        <h4>سجل الإنشاء</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {results.map((res, i) => (
                                <li key={i} style={{ 
                                    padding: '10px', 
                                    marginBottom: '5px', 
                                    background: res.status === 'success' ? '#dcfce7' : res.status === 'error' ? '#fee2e2' : '#f3f4f6',
                                    borderRadius: '5px',
                                    display: 'flex',
                                    justifyContent: 'space-between'
                                }}>
                                    <span>{res.title}</span>
                                    <strong>
                                        {res.status === 'loading' && <span style={{ color: '#3b82f6' }}>جاري...</span>}
                                        {res.status === 'success' && <span style={{ color: '#10b981' }}>نجاح ✓</span>}
                                        {res.status === 'error' && <span style={{ color: '#ef4444' }}>فشل ✗</span>}
                                    </strong>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
