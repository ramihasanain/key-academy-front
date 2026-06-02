import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
    DEFAULT_PLATFORM_FEATURES,
    FEATURE_LOCKED_MESSAGE,
} from '../constants/platformFeatures'
import {
    clearPlatformFeaturesCache,
    fetchPlatformFeatures,
    getCachedPlatformFeatures,
    isFeatureEnabled as checkEnabled,
    resolveFeatureStatus,
} from '../utils/platformFeaturesApi'

const PlatformFeaturesContext = createContext(null)

export const usePlatformFeatures = () => {
    const context = useContext(PlatformFeaturesContext)
    if (!context) {
        throw new Error('usePlatformFeatures must be used within PlatformFeaturesProvider')
    }
    return context
}

export const PlatformFeaturesProvider = ({ children }) => {
    const [features, setFeatures] = useState(() => getCachedPlatformFeatures() || DEFAULT_PLATFORM_FEATURES)
    const [loading, setLoading] = useState(() => {
        const token = localStorage.getItem('access_token')
        return !!(token && token !== 'undefined' && token !== 'null')
    })

    const refreshFeatures = useCallback(async () => {
        const token = localStorage.getItem('access_token')
        if (!token || token === 'undefined' || token === 'null') {
            setFeatures(DEFAULT_PLATFORM_FEATURES)
            setLoading(false)
            return DEFAULT_PLATFORM_FEATURES
        }

        setLoading(true)
        const nextFeatures = await fetchPlatformFeatures()
        setFeatures(nextFeatures || DEFAULT_PLATFORM_FEATURES)
        setLoading(false)
        return nextFeatures || DEFAULT_PLATFORM_FEATURES
    }, [])

    useEffect(() => {
        refreshFeatures()

        const handleLogout = () => {
            clearPlatformFeaturesCache()
            setFeatures(DEFAULT_PLATFORM_FEATURES)
            setLoading(false)
        }

        const handleUpdated = (event) => {
            if (event.detail?.features) {
                setFeatures(event.detail.features)
            } else if (!event.detail) {
                setFeatures(DEFAULT_PLATFORM_FEATURES)
            }
        }

        window.addEventListener('auth:logout', handleLogout)
        window.addEventListener('platform-features:updated', handleUpdated)

        return () => {
            window.removeEventListener('auth:logout', handleLogout)
            window.removeEventListener('platform-features:updated', handleUpdated)
        }
    }, [refreshFeatures])

    const isFeatureEnabled = useCallback(
        (key) => checkEnabled(features, key),
        [features]
    )

    const getFeatureStatus = useCallback(
        (key) => resolveFeatureStatus(features, key),
        [features]
    )

    return (
        <PlatformFeaturesContext.Provider
            value={{
                features,
                loading,
                refreshFeatures,
                isFeatureEnabled,
                getFeatureStatus,
                lockedMessage: FEATURE_LOCKED_MESSAGE,
            }}
        >
            {children}
        </PlatformFeaturesContext.Provider>
    )
}
