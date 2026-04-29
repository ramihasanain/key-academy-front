import { motion } from 'framer-motion'
import './EmptyState.css'

const EmptyState = ({
    title = 'لا يوجد بيانات حالياً',
    message = 'ماكو شي ينعرض بهل الصفحة حالياً.',
    logoSrc = '/key-icon-logo.png',
    logoAlt = 'Key Academy',
    className = '',
    isLoading = false,
    loadingTitle = 'جاري تحميل البيانات...',
    loadingMessage = 'انتظر شوية، ده نجيب المعلومات.'
}) => {
    const displayTitle = isLoading ? loadingTitle : title
    const displayMessage = isLoading ? loadingMessage : message

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`core-empty-state ${className}`.trim()}
        >
            <img src={logoSrc} alt={logoAlt} className="core-empty-state-logo" />
            <h3 className="core-empty-state-title">{displayTitle}</h3>
            <p className="core-empty-state-message">{displayMessage}</p>
        </motion.div>
    )
}

export default EmptyState
