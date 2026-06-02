import { HiOutlineLockClosed } from 'react-icons/hi2'
import { FEATURE_LOCKED_MESSAGE } from '../constants/platformFeatures'
import './FeatureLockedMessage.css'

const FeatureLockedMessage = ({
    message = FEATURE_LOCKED_MESSAGE,
    className = '',
}) => (
    <div className={`feature-locked-message ${className}`.trim()}>
        <div className="feature-locked-icon">
            <HiOutlineLockClosed />
        </div>
        <p>{message}</p>
    </div>
)

export default FeatureLockedMessage
