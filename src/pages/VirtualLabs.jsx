import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
    HiOutlineBeaker, 
    HiOutlineXMark, 
    HiOutlinePlayCircle,
    HiOutlineAcademicCap 
} from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import { VirtualLabsData } from '../data/VirtualLabsData'
import './VirtualLabs.css'

const VirtualLabs = () => {
    const [filter, setFilter] = useState('الكل')
    const [selectedLab, setSelectedLab] = useState(null)

    const subjects = ['الكل', ...new Set(VirtualLabsData.map(lab => lab.subject))]

    const filteredLabs = filter === 'الكل' 
        ? VirtualLabsData 
        : VirtualLabsData.filter(lab => lab.subject === filter)

    useEffect(() => {
        window.scrollTo(0, 0)
    }, [])

    return (
        <div className="vl-page page-transition">
            <ParticleBackground />
            
            <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                <div className="vl-header">
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="gradient-text"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '15px' }}
                    >
                        <HiOutlineBeaker /> المختبرات الافتراضية
                    </motion.h1>
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                        نفذ تجاربك العلمية للمنهج العراقي بشكل تفاعلي ومباشر. مكتبة تجارب متكاملة بالتعاون مع PhET Interactive Simulations.
                    </motion.p>
                </div>

                {/* Filters */}
                <motion.div className="vl-filters" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    {subjects.map(subj => (
                        <button 
                            key={subj} 
                            className={`vl-filter-btn ${filter === subj ? 'active' : ''}`}
                            onClick={() => setFilter(subj)}
                        >
                            {subj}
                        </button>
                    ))}
                </motion.div>

                {/* Grid */}
                <motion.div 
                    className="vl-grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <AnimatePresence mode="popLayout">
                        {filteredLabs.map(lab => (
                            <motion.div 
                                key={lab.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                className="vl-card"
                                onClick={() => setSelectedLab(lab)}
                            >
                                <div className="vl-card-img-wrap">
                                    <img src={lab.coverImage} alt={lab.title} className="vl-card-img" />
                                    <div className="vl-card-overlay">
                                        <HiOutlinePlayCircle className="vl-play-icon" />
                                    </div>
                                    <span className="vl-badge" style={{ backgroundColor: lab.color, position: 'absolute', top: '15px', right: '15px' }}>
                                        {lab.subject}
                                    </span>
                                </div>
                                <div className="vl-card-body">
                                    <h3>{lab.title}</h3>
                                    <p>{lab.description}</p>
                                    <div className="vl-card-footer">
                                        <div className="vl-grade">
                                            <HiOutlineAcademicCap /> {lab.grade}
                                        </div>
                                        <button className="vl-launch-btn" style={{ color: lab.color }}>
                                            ابدأ التجربة <HiOutlinePlayCircle />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Fullscreen Lab Modal */}
            <AnimatePresence>
                {selectedLab && (
                    <motion.div 
                        className="vl-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedLab(null)}
                    >
                        <motion.div 
                            className="vl-modal-content"
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            onClick={e => e.stopPropagation()} 
                        >
                            <div className="vl-modal-header">
                                <h3>
                                    <span style={{ color: selectedLab.color }}><HiOutlineBeaker /></span>
                                    {selectedLab.title} - {selectedLab.subject} ({selectedLab.grade})
                                </h3>
                                <button className="vl-modal-close" onClick={() => setSelectedLab(null)}>
                                    <HiOutlineXMark />
                                </button>
                            </div>
                            <div className="vl-modal-body">
                                <iframe 
                                    src={selectedLab.phetUrl}
                                    className="vl-modal-iframe"
                                    allowFullScreen
                                    title={selectedLab.title}
                                ></iframe>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default VirtualLabs
