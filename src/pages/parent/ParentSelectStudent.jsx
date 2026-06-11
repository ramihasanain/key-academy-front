import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { HiOutlineAcademicCap, HiOutlineChevronLeft } from 'react-icons/hi2'
import ParticleBackground from '../../components/ParticleBackground'
import { ParentProtectedRoute } from '../../components/ParentProtectedRoute'
import '../Auth.css'

const ParentSelectStudentForm = () => {
    const navigate = useNavigate()
    let children = []
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        children = user.children || []
    } catch {
        children = []
    }

    const handleSelect = (student) => {
        localStorage.setItem('parent_selected_student', JSON.stringify(student))
        navigate('/parent/about')
    }

    return (
        <div className="auth-page">
            <ParticleBackground />
            <motion.div
                className="auth-card glass-panel"
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ maxWidth: 480 }}
            >
                <div className="auth-header" style={{ textAlign: 'center' }}>
                    <h1>اختر الطالب</h1>
                    <p>عندك أكثر من طالب مرتبط بهذا الحساب</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {children.map((student) => (
                        <button
                            key={student.id}
                            type="button"
                            onClick={() => handleSelect(student)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '12px',
                                padding: '16px 18px',
                                borderRadius: '14px',
                                border: '1px solid rgba(56,189,248,0.25)',
                                background: 'rgba(56,189,248,0.06)',
                                cursor: 'pointer',
                                textAlign: 'right',
                                color: 'inherit',
                                width: '100%',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: 48, height: 48, borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: '1.2rem', fontWeight: 'bold',
                                }}>
                                    {(student.full_name || student.first_name || 'ط')[0]}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                                        {student.full_name || `${student.first_name} ${student.last_name}`}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                                        {student.grade || 'طالب'}
                                    </div>
                                </div>
                            </div>
                            <HiOutlineChevronLeft style={{ fontSize: '1.2rem', opacity: 0.6 }} />
                        </button>
                    ))}
                </div>

                {children.length === 0 && (
                    <p style={{ textAlign: 'center', color: '#888' }}>
                        <HiOutlineAcademicCap style={{ verticalAlign: 'middle', marginLeft: 6 }} />
                        لا يوجد طلاب مرتبطين
                    </p>
                )}
            </motion.div>
        </div>
    )
}

const ParentSelectStudent = () => (
    <ParentProtectedRoute skipStudentCheck>
        <ParentSelectStudentForm />
    </ParentProtectedRoute>
)

export default ParentSelectStudent
