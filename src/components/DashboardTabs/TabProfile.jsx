import { motion } from 'framer-motion'
import { HiOutlineUser } from 'react-icons/hi2'
import { useUser } from '../../hooks/useUser'

const TabProfile = ({ videoStats }) => {
    const { userData } = useUser()

    if (!userData) return null;

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
            <div className="section-header-row">
                <h2 className="dash-section-title">إعدادات حسابك ⚙️</h2>
            </div>
            <div className="dash-profile-card glass-panel premium-profile">
                <div className="profile-header-bg"></div>
                <div className="dash-profile-avatar-lg pulse-glow-strong">
                    {userData.full_name ? userData.full_name[0] : 'س'}
                    <div className="cam-btn"><HiOutlineUser /></div>
                </div>

                {/* Read-only notice */}
                <div style={{
                    background: 'rgba(251, 191, 36, 0.08)',
                    border: '1.5px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    color: '#fbbf24'
                }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🔒</span>
                    <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', marginBottom: '6px' }}>
                            لا يمكنك تعديل بياناتك بشكل مباشر
                        </p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(251, 191, 36, 0.85)', lineHeight: 1.7 }}>
                            لتعديل أي معلومة في حسابك، يرجى التواصل مع إدارة المنصة عبر صفحة التواصل أو التلغرام.
                        </p>
                    </div>
                </div>

                <div className="dash-profile-form">
                    <div className="input-row-half">
                        <div className="dash-input-group glass-input flex-1">
                            <label>الاسم الكامل</label>
                            <input type="text" value={userData.full_name || ''} disabled className="disabled-glass" readOnly />
                        </div>
                        <div className="dash-input-group glass-input flex-1">
                            <label>اليوزرنيم (المعرف)</label>
                            <input type="text" value={userData.username || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                        </div>
                    </div>
                    <div className="dash-input-group glass-input">
                        <label>رقم التليفون الأساسي</label>
                        <input type="tel" value={userData.phone || ''} dir="ltr" disabled className="disabled-glass" readOnly />
                    </div>
                    <div className="dash-input-group glass-input">
                        <label>المسار الدراسي</label>
                        <input type="text" value={userData.grade || ''} disabled className="disabled-glass" readOnly />
                    </div>
                </div>
            </div>

            {/* Video Stats Section */}
            <div className="section-header-row mt-6 pt-6" style={{marginTop: '20px',borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <h2 className="dash-section-title">إحصائيات تفاعلات وأسئلة الفيديو 📊</h2>
            </div>
            {videoStats && (
                <div className="dash-profile-card glass-panel premium-profile video-stats-card" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginBottom: '30px', flexWrap: 'wrap' }}>
                        <div className="hq-stat-card" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center', minWidth: '150px', flex: 1, background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                            <h3 style={{ fontSize: '2rem', color: '#38bdf8', margin: '0 0 5px 0', fontWeight: 'bold' }}>{videoStats.total_lessons_watched}</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>دروس تم التفاعل مع أسئلتها</p>
                        </div>
                        <div className="hq-stat-card" style={{ padding: '20px', borderRadius: '15px', textAlign: 'center', minWidth: '150px', flex: 1, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <h3 style={{ fontSize: '2rem', color: '#10b981', margin: '0 0 5px 0', fontWeight: 'bold' }}>{videoStats.overall_correct_percentage}%</h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted, #666)' }}>معدل الإجابات الصحيحة الكلي</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {videoStats.lesson_stats.map((ls, idx) => (
                            <div key={idx} className="hq-card glass-panel" style={{ padding: '15px', borderRadius: '12px', border: '1px solid var(--border-color, rgba(0,0,0,0.05))' }}>
                                <h4 style={{ fontSize: '1.1rem', color: 'var(--text-primary, #333)', marginBottom: '10px', fontWeight: 'bold' }}>{ls.lesson_title}</h4>
                                <div style={{ display: 'flex', gap: '15px', fontSize: '0.9rem', color: 'var(--text-muted, #666)', paddingBottom: '10px', borderBottom: '1px solid var(--border-color, rgba(0,0,0,0.05))', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <span style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#0284c7' }}>المشاهدات: <strong>{ls.total_views}</strong></span>
                                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px', color: '#059669' }}>صحيحة: <strong>{ls.correct_answers} / {ls.total_answers}</strong></span>
                                    <span style={{ background: (ls.total_answers ? (ls.correct_answers / ls.total_answers >= 0.5 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)') : 'rgba(0,0,0,0.05)'), padding: '4px 10px', borderRadius: '6px', color: (ls.total_answers ? (ls.correct_answers / ls.total_answers >= 0.5 ? '#059669' : '#dc2626') : 'inherit') }}>
                                        الدقة: <strong>{ls.total_answers ? Math.round((ls.correct_answers / ls.total_answers) * 100) : 0}%</strong>
                                    </span>
                                </div>
                                <h5 style={{ color: 'var(--text-primary, #444)', fontSize: '0.9rem', marginBottom: '10px', fontWeight: '600' }}>آخر جلسات المشاهدة والإجابات:</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {ls.sessions.map((sess, sidx) => (
                                        <div key={sidx} style={{ background: 'var(--bg-secondary, rgba(0,0,0,0.02))', padding: '10px 15px', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--text-secondary, #555)', display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', border: '1px solid var(--border-color, rgba(0,0,0,0.02))' }}>
                                            <span style={{ fontWeight: '500' }}>🕒 {new Date(sess.created_at).toLocaleString('ar-IQ')}</span>
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <span style={{ color: 'var(--text-muted, #777)' }}>الإجابات:</span>
                                                {sess.answers.map((ans, aidx) => (
                                                    <span key={aidx} style={{ padding: '2px 8px', borderRadius: '4px', background: ans.is_correct ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${ans.is_correct ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`, color: ans.is_correct ? '#059669' : '#dc2626' }}>
                                                        س{ans.quiz_index + 1}: {ans.is_correct ? '✅' : '❌'}
                                                    </span>
                                                ))}
                                                {sess.answers.length === 0 && <span style={{ opacity: 0.6, fontStyle: 'italic' }}>انتهت المشاهدة بلا إجابات</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {videoStats.lesson_stats.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '40px 20px', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px', border: '1px dashed rgba(56, 189, 248, 0.3)' }}>
                                <p style={{ color: '#0284c7', margin: 0, fontSize: '1rem', fontWeight: '500' }}>
                                    لم تقم بمشاهدة أي دروس توفر أسئلة تفاعلية ضمن الفيديو حتى الآن.
                                </p>
                                <p style={{ color: 'var(--text-muted, #666)', fontSize: '0.85rem', marginTop: '10px' }}>
                                    الإحصائيات الخاصة بك ستظهر هنا فور تفاعلك مع الدروس عبر تطبيق سطح المكتب.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    )
}

export default TabProfile
