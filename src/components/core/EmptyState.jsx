import { motion } from 'framer-motion'
import './EmptyState.css'

const EmptyState = ({
    title = 'لا يوجد بيانات حالياً',
    message = 'ماكو شي ينعرض بهل الصفحة حالياً.',
    logoSrc = '/key-icon-logo.png',
    logoAlt = 'Key Academy',
    className = ''
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`core-empty-state ${className}`.trim()}
        >
            <img src={logoSrc} alt={logoAlt} className="core-empty-state-logo" />
            <h3 className="core-empty-state-title">{title}</h3>
            <p className="core-empty-state-message">{message}</p>
        </motion.div>
    )
}

export default EmptyState
