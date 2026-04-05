import { motion } from 'framer-motion'

const SectionTitle = ({ title, subtitle, light = false }) => {
    return (
        <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6 }}
        >
            <h2 className={light ? '' : 'gradient-text'}>{title}</h2>
            <div className="section-divider"></div>
            {subtitle && <p>{subtitle}</p>}
        </motion.div>
    )
}

export default SectionTitle
