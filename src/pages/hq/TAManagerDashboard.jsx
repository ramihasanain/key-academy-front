import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../../config';
import { HiOutlineChartBar, HiOutlineUsers, HiOutlineExclamationCircle, HiOutlineEye, HiOutlineChatBubbleLeftRight, HiOutlineQuestionMarkCircle } from 'react-icons/hi2';

const REFRESH_MS = 60_000;

const DelayAlertBox = ({ title, icon, items, emptyText, kind }) => {
    const hasItems = items && items.length > 0;

    return (
        <div style={{
            background: hasItems ? 'rgba(239, 68, 68, 0.06)' : 'rgba(16, 185, 129, 0.06)',
            border: `1px solid ${hasItems ? 'rgba(239, 68, 68, 0.35)' : 'rgba(16, 185, 129, 0.25)'}`,
            borderRadius: '12px',
            padding: '16px 18px',
            marginBottom: '16px',
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: hasItems ? '12px' : '0' }}>
                <div style={{
                    color: hasItems ? '#ef4444' : '#10b981',
                    fontSize: '22px',
                    display: 'flex',
                }}>
                    {icon}
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: hasItems ? '#b91c1c' : '#047857', fontSize: '15px' }}>
                        {title}
                        {hasItems && (
                            <span style={{
                                marginRight: '8px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '11px',
                                padding: '2px 8px',
                                borderRadius: '999px',
                                fontWeight: 'bold',
                            }}>
                                {items.length}
                            </span>
                        )}
                    </div>
                    {!hasItems && (
                        <div style={{ fontSize: '13px', color: '#059669', marginTop: '4px' }}>{emptyText}</div>
                    )}
                </div>
            </div>

            {hasItems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                    {items.map((item) => (
                        <div
                            key={`${kind}-${item.id}`}
                            style={{
                                background: 'var(--hq-surface)',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '13px',
                                lineHeight: 1.6,
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                <span style={{ color: 'var(--hq-text-main)', fontWeight: '600' }}>
                                    {item.teacher_name || '—'}
                                </span>
                                <span style={{
                                    color: '#dc2626',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    padding: '2px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                }}>
                                    تأخر الرد: {item.delay_label}
                                </span>
                            </div>
                            <div style={{ color: 'var(--hq-text-muted)', marginTop: '4px' }}>
                                {kind === 'qa' ? 'سؤال' : 'دردشة'} من الطالب: <strong style={{ color: 'var(--hq-text-main)' }}>{item.student_name}</strong>
                                {kind === 'chat' && item.group_name && (
                                    <span> — {item.group_name}{item.chat_kind === 'private' ? ' (خاصة)' : ''}</span>
                                )}
                                {item.assistant_name && (
                                    <span> — المساعد: {item.assistant_name}</span>
                                )}
                            </div>
                            {item.content_preview && (
                                <div style={{
                                    marginTop: '6px',
                                    color: 'var(--hq-text-soft)',
                                    fontSize: '12px',
                                    borderRight: '3px solid rgba(239, 68, 68, 0.4)',
                                    paddingRight: '8px',
                                }}>
                                    «{item.content_preview}{item.content_preview.length >= 100 ? '…' : ''}»
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const TAManagerDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const navigate = useNavigate();

    const fetchStats = useCallback(async () => {
        const tk = localStorage.getItem('access_token');
        try {
            const res = await fetch(API + '/api/hq/ta-manager-stats/', {
                headers: { 'Authorization': `Bearer ${tk}` }
            });
            if (res.ok) {
                setStats(await res.json());
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, REFRESH_MS);
        return () => clearInterval(interval);
    }, [fetchStats]);

    const handleImpersonate = async (taId) => {
        const tk = localStorage.getItem('access_token');
        try {
            const res = await fetch(`${API}/api/hq/teacherassistants/${taId}/impersonate/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tk}`,
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json();
                navigate(`/ta-spy/${data.access}`);
            } else {
                alert('حدث خطأ أثناء محاولة الدخول بوضع المراقبة');
            }
        } catch (err) {
            console.error(err);
            alert('حدث خطأ في الاتصال');
        }
    };

    if (loading) return <div style={{ padding: '20px', color: 'var(--hq-text-muted)' }}>جاري التحميل...</div>;

    const filteredTAs = stats?.tas?.filter(ta =>
        ta.name.toLowerCase().includes(search.toLowerCase()) ||
        ta.teacher_name.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const qaAlerts = stats?.delayed_alerts?.qa || [];
    const chatAlerts = stats?.delayed_alerts?.chat || [];

    return (
        <div style={{ padding: '20px' }}>
            <h1 style={{ color: 'var(--hq-primary)', marginBottom: '20px', fontSize: '24px' }}>أداء المساعدين (Manager Dashboard)</h1>

            <DelayAlertBox
                title="تحذير: أسئلة وأجوبة بلا رد (أكثر من ساعة)"
                icon={<HiOutlineQuestionMarkCircle />}
                items={qaAlerts}
                emptyText="لا توجد أسئلة متأخرة — جميع الأسئلة تم الرد عليها خلال الساعة الماضية."
                kind="qa"
            />

            <DelayAlertBox
                title="تحذير: دردشة المجموعات بلا رد (أكثر من ساعة)"
                icon={<HiOutlineChatBubbleLeftRight />}
                items={chatAlerts}
                emptyText="لا توجد دردشات متأخرة — جميع رسائل الطلاب تم الرد عليها خلال الساعة الماضية."
                kind="chat"
            />

            {stats?.overview && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                    <div style={{ background: 'var(--hq-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--hq-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '15px', borderRadius: '50%', fontSize: '24px' }}>
                            <HiOutlineUsers />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>إجمالي المساعدين</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--hq-text-main)' }}>{stats.overview.total_tas}</div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--hq-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--hq-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '15px', borderRadius: '50%', fontSize: '24px' }}>
                            <HiOutlineChartBar />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>المساعدين النشطين</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--hq-text-main)' }}>{stats.overview.total_active}</div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--hq-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--hq-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '15px', borderRadius: '50%', fontSize: '24px' }}>
                            <HiOutlineExclamationCircle />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>أسئلة بلا إجابة عبر النظام</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{stats.overview.total_unanswered}</div>
                        </div>
                    </div>

                    <div style={{ background: 'var(--hq-surface)', padding: '20px', borderRadius: '12px', border: '1px solid var(--hq-border)', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '15px', borderRadius: '50%', fontSize: '24px' }}>
                            <HiOutlineExclamationCircle />
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', color: 'var(--hq-text-muted)' }}>تأخر الرد (&gt; ساعة)</div>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                                {(stats.overview.delayed_qa_count || 0) + (stats.overview.delayed_chat_count || 0)}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ background: 'var(--hq-surface)', borderRadius: '12px', border: '1px solid var(--hq-border)', padding: '20px', overflowX: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', color: 'var(--hq-text-main)' }}>قائمة أداء المساعدين</h2>
                    <input
                        type="text"
                        placeholder="ابحث باسم المساعد أو الأستاذ..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--hq-border)', background: 'var(--hq-bg)', color: 'var(--hq-text-main)', width: '300px' }}
                    />
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--hq-border)', color: 'var(--hq-text-muted)', fontSize: '13px' }}>
                            <th style={{ padding: '10px' }}>اسم المساعد</th>
                            <th style={{ padding: '10px' }}>الأستاذ المرتبط به</th>
                            <th style={{ padding: '10px' }}>إجمالي الردود (Q&A)</th>
                            <th style={{ padding: '10px' }}>رسائل الدردشة</th>
                            <th style={{ padding: '10px' }}>متوسط وقت الرد</th>
                            <th style={{ padding: '10px' }}>أسئلة عالقة</th>
                            <th style={{ padding: '10px' }}>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTAs.map(ta => (
                            <tr key={ta.id} style={{ borderBottom: '1px solid var(--hq-border)', fontSize: '14px', background: !ta.is_active ? 'rgba(239, 68, 68, 0.05)' : 'transparent' }}>
                                <td style={{ padding: '12px 10px', color: 'var(--hq-text-main)' }}>
                                    <div style={{ fontWeight: 'bold' }}>{ta.name}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--hq-text-muted)' }}>{ta.role}</div>
                                </td>
                                <td style={{ padding: '12px 10px', color: 'var(--hq-text-main)' }}>{ta.teacher_name}</td>
                                <td style={{ padding: '12px 10px', color: 'var(--hq-text-main)' }}>{ta.total_replies}</td>
                                <td style={{ padding: '12px 10px', color: 'var(--hq-text-main)' }}>
                                    <div>{ta.total_public_messages ?? 0} عام</div>
                                    <div style={{ fontSize: '11px', color: 'var(--hq-text-muted)' }}>{ta.total_private_messages ?? 0} خاص</div>
                                </td>
                                <td style={{ padding: '12px 10px', color: 'var(--hq-text-main)' }}>{ta.avg_response_time_min} دقيقة</td>
                                <td style={{ padding: '12px 10px', color: ta.unanswered_questions > 0 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{ta.unanswered_questions}</td>
                                <td style={{ padding: '12px 10px' }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => navigate(`/hq/teacherassistants/${ta.id}/360`)}
                                            style={{ background: 'transparent', color: 'var(--hq-primary)', border: '1px solid var(--hq-primary)', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                                        >
                                            الملف 360
                                        </button>
                                        <button
                                            onClick={() => handleImpersonate(ta.id)}
                                            style={{ background: 'var(--hq-primary)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                                        >
                                            <HiOutlineEye /> المراقبة الآن
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTAs.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: 'var(--hq-text-muted)' }}>لا توجد بيانات مطابقة للبحث</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
