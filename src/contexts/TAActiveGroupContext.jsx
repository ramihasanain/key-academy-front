import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API } from '../config'

const TAActiveGroupContext = createContext(null)

const STORAGE_KEY = 'ta_active_group_id'

export const TAActiveGroupProvider = ({ children, initialGroups = [] }) => {
    const [groups, setGroups] = useState(initialGroups)
    const [activeGroupId, setActiveGroupIdState] = useState(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? parseInt(stored, 10) : null
    })

    const setActiveGroupId = useCallback((id) => {
        setActiveGroupIdState(id)
        if (id) {
            localStorage.setItem(STORAGE_KEY, String(id))
        } else {
            localStorage.removeItem(STORAGE_KEY)
        }
    }, [])

    useEffect(() => {
        if (initialGroups.length > 0) {
            setGroups(initialGroups)
            const valid = initialGroups.some(g => g.id === activeGroupId)
            if (!valid) {
                setActiveGroupId(initialGroups[0].id)
            }
        }
    }, [initialGroups, activeGroupId, setActiveGroupId])

    const activeGroup = groups.find(g => g.id === activeGroupId) || groups[0] || null

    const groupQuery = activeGroupId ? `group_id=${activeGroupId}` : ''
    const appendGroupQuery = (url) => {
        if (!activeGroupId) return url
        const sep = url.includes('?') ? '&' : '?'
        return `${url}${sep}group_id=${activeGroupId}`
    }

    return (
        <TAActiveGroupContext.Provider value={{
            groups,
            setGroups,
            activeGroupId: activeGroup?.id || activeGroupId,
            activeGroup,
            setActiveGroupId,
            groupQuery,
            appendGroupQuery,
        }}>
            {children}
        </TAActiveGroupContext.Provider>
    )
}

export const useTAActiveGroup = () => {
    const ctx = useContext(TAActiveGroupContext)
    if (!ctx) {
        return {
            groups: [],
            activeGroupId: null,
            activeGroup: null,
            setActiveGroupId: () => {},
            groupQuery: '',
            appendGroupQuery: (url) => url,
        }
    }
    return ctx
}

export const fetchTAGroups = async (token) => {
    const res = await fetch(`${API}/api/interactions/ta-my-groups/`, {
        headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
        const data = await res.json()
        return data.groups || []
    }
    return []
}
