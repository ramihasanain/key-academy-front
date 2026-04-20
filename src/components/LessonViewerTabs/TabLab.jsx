import { useParams } from 'react-router-dom'
import { HiOutlineBeaker } from 'react-icons/hi2'
import { VirtualLabsData } from '../../data/VirtualLabsData'
import '../../pages/LessonViewer.css'

const TabLab = () => {
    const { lessonId } = useParams()
    const lab = VirtualLabsData.find(l => l.id === lessonId) || VirtualLabsData[0]

    return (
        <div className="lv-tab-pane lv-fade">
            <h4 className="lv-section-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <HiOutlineBeaker /> المختبر الافتراضي التطبيقي: {lab.title}
            </h4>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>{lab.description}</p>

            <div className="lv-lab-container" style={{ width: '100%', height: '600px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-glass)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <iframe
                    src={lab.phetUrl}
                    width="100%"
                    height="100%"
                    allowFullScreen
                    title={lab.title}
                    style={{ border: 'none', backgroundColor: '#fff' }}
                ></iframe>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>* مدعوم من PhET Interactive Simulations (جامعة كولورادو)</span>
                <button className="lv-outline-btn" onClick={() => window.open(lab.phetUrl, '_blank')}>
                    توسيع الشاشة بالكامل
                </button>
            </div>
        </div>
    )
}

export default TabLab
