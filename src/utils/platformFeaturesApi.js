import { API } from '../config'
import {
    DEFAULT_PLATFORM_FEATURES,
    PLATFORM_FEATURES_STORAGE_KEY,
} from '../constants/platformFeatures'

export function getCachedPlatformFeatures() {
    try {
        const raw = localStorage.getItem(PLATFORM_FEATURES_STORAGE_KEY)
        if (!raw || raw === 'undefined') return null
        const parsed = JSON.parse(raw)
        return parsed?.features || null
    } catch {
        return null
    }
}

export function savePlatformFeatures(data) {
    localStorage.setItem(PLATFORM_FEATURES_STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('platform-features:updated', { detail: data }))
}

export function clearPlatformFeaturesCache() {
    localStorage.removeItem(PLATFORM_FEATURES_STORAGE_KEY)
    window.dispatchEvent(new CustomEvent('platform-features:updated', { detail: null }))
}

export async function fetchPlatformFeatures() {
    const token = localStorage.getItem('access_token')
    if (!token || token === 'undefined' || token === 'null') {
        clearPlatformFeaturesCache()
        return null
    }

    try {
        const res = await fetch(`${API}/api/v1/content/platform-features/`, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })

        if (!res.ok) {
            return getCachedPlatformFeatures()
        }

        const data = await res.json()
        savePlatformFeatures(data)
        return data.features
    } catch (error) {
        console.error('Failed to load platform features', error)
        return getCachedPlatformFeatures()
    }
}

export function resolveFeatureStatus(features, key) {
    const status = features?.[key] || DEFAULT_PLATFORM_FEATURES[key] || 'enabled'
    return status
}

export function isFeatureEnabled(features, key) {
    return resolveFeatureStatus(features, key) === 'enabled'
}
