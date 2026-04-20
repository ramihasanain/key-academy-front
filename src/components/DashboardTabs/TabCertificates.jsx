import { motion } from 'framer-motion'

const TabCertificates = ({ certificates }) => {
    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="dash-tab-content">
            <div className="section-header-row">
                <h2 className="dash-section-title">شهاداتك اللي أخذتها 🎓</h2>
            </div>
            <div className="dash-courses-grid">
                {certificates.map((cert, i) => (
                    <motion.div key={cert.id} className="dash-cert-card glass-panel premium-cert hover-lift-rotate" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}>
                        <div className="cert-backdrop-glow"></div>
                        <div className="dash-cert-icon floating-icon">🏆</div>
                        <h3>{cert.title}</h3>
                        <p className="cert-date">تاريخ الإصدار: {cert.issueDate}</p>
                        <button className="dash-btn-primary premium-btn gold-btn">نزلها واطبعها</button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    )
}

export default TabCertificates
