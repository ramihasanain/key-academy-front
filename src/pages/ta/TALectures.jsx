import React, { useState, useEffect } from 'react';
import { API } from '../../config';
import { HiOutlineVideoCamera, HiOutlineBookOpen, HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi2';

export const TALectures = () => {
    const [courses, setCourses] = useState([]);
    const [isLoadingCourses, setIsLoadingCourses] = useState(true);
    const [expandedCourse, setExpandedCourse] = useState(null);
    const [courseData, setCourseData] = useState({});
    const [loadingCoursesData, setLoadingCoursesData] = useState({});

    useEffect(() => {
        const fetchCourses = async () => {
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
            try {
                // Fetch assigned courses
                const res = await fetch(`${API}/api/hq/courses/?page_size=100`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourses(data.results || data);
                }
            } catch (err) {
                console.error("Failed to fetch TA courses", err);
            } finally {
                setIsLoadingCourses(false);
            }
        };
        fetchCourses();
    }, []);

    const toggleCourse = async (courseId) => {
        if (expandedCourse === courseId) {
            setExpandedCourse(null);
            return;
        }
        
        setExpandedCourse(courseId);
        
        // If we haven't loaded this course's playlist yet, load it now
        if (!courseData[courseId]) {
            setLoadingCoursesData(prev => ({ ...prev, [courseId]: true }));
            const tk = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token');
            try {
                // Fetch course details with modules/lessons
                const res = await fetch(`${API}/api/v1/courses/${courseId}/`, {
                    headers: { 'Authorization': `Bearer ${tk}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCourseData(prev => ({ ...prev, [courseId]: data.modules || [] }));
                }
            } catch (err) {
                console.error("Failed to fetch course details", err);
            } finally {
                setLoadingCoursesData(prev => ({ ...prev, [courseId]: false }));
            }
        }
    };

    const handleLaunchApp = (lessonId) => {
        const token = sessionStorage.getItem('spy_token') || localStorage.getItem('access_token') || '';
        const protocolUrl = `mediaplayer://loginyoutube?lesson=${lessonId}&token=${token}&api=${encodeURIComponent(API)}`;
        window.location.href = protocolUrl;
    };

    if (isLoadingCourses) return <div className="hq-loading">جاري جلب المناهج...</div>;

    return (
        <div className="ta-page" style={{ padding: '20px' }}>
            <div style={{ marginBottom: '30px', background: 'var(--hq-primary)', color: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(131, 42, 150, 0.2)' }}>
                <h2 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <HiOutlineVideoCamera /> 
                    محاضرات المنهاج المسندة
                </h2>
            </div>

            {courses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ color: '#64748b' }}>لا يوجد مناهج مسندة لحسابك حالياً.</h3>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {courses.map(course => (
                        <div key={course.id} style={{ background: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                            {/* Course Header */}
                            <div 
                                onClick={() => toggleCourse(course.id)}
                                style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: expandedCourse === course.id ? '#f8fafc' : 'white', transition: 'background 0.2s' }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '50px', height: '50px', borderRadius: '8px', background: 'var(--hq-primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--hq-primary)' }}>
                                        <HiOutlineBookOpen size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 5px 0', color: '#1e293b' }}>{course.title}</h3>
                                        <div style={{ fontSize: '13px', color: '#64748b' }}>
                                            {course.subject_str || ''} • {course.teacher_str || ''}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: '#94a3b8' }}>
                                    {expandedCourse === course.id ? <HiOutlineChevronUp size={24} /> : <HiOutlineChevronDown size={24} />}
                                </div>
                            </div>

                            {/* Course Content (Modules & Lessons) */}
                            {expandedCourse === course.id && (
                                <div style={{ padding: '20px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                                    {loadingCoursesData[course.id] ? (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>جاري جلب الفصول والدروس...</div>
                                    ) : courseData[course.id] && courseData[course.id].length > 0 ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {courseData[course.id].map(module => (
                                                <div key={module.id} style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                    <h4 style={{ margin: '0 0 15px 0', color: '#334155', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                                        {module.title}
                                                    </h4>
                                                    {module.lessons && module.lessons.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                            {module.lessons.map(lesson => (
                                                                <div key={lesson.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#f8fafc', borderRadius: '6px' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'var(--hq-primary-bg)', color: 'var(--hq-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                                                                            {lesson.order}
                                                                        </div>
                                                                        <span style={{ fontWeight: '500', color: '#475569' }}>{lesson.title}</span>
                                                                    </div>
                                                                    <button 
                                                                        onClick={() => handleLaunchApp(lesson.id)}
                                                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--hq-primary)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: 'opacity 0.2s' }}
                                                                        onMouseOver={e => e.currentTarget.style.opacity = 0.8}
                                                                        onMouseOut={e => e.currentTarget.style.opacity = 1}
                                                                    >
                                                                        <HiOutlineVideoCamera size={16} />
                                                                        تشغيل (تطبيق مكتبي)
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ color: '#94a3b8', fontSize: '14px' }}>لا يوجد دروس في هذا الفصل.</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>لا يوجد فصول أو دروس متاحة.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
