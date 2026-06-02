import FeatureLockedMessage from './FeatureLockedMessage'
import { usePlatformFeatures } from '../contexts/PlatformFeaturesContext'

const FeatureGate = ({ feature, children, className = '', fallback = null }) => {
    const { isFeatureEnabled, loading } = usePlatformFeatures()

    if (loading) {
        return fallback
    }

    if (!isFeatureEnabled(feature)) {
        return <FeatureLockedMessage className={className} />
    }

    return children
}

export default FeatureGate
