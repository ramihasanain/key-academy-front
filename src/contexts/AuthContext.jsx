import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Attempt to load from storage initially for instantly rendering components
    const [userData, setUserData] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    });
    // Start as NOT loading if we already have cached user data — renders the UI instantly.
    // If no cache, stay true so we wait for the API before showing anything.
    const [loading, setLoading] = useState(() => {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        const hasCachedUser = stored && stored !== 'undefined' && stored !== 'null';
        const hasToken = token && token !== 'undefined' && token !== 'null';
        return !(hasCachedUser && hasToken);
    });

    const refreshIntervalRef = useRef(null);

    // ─── Silent token refresh ─────────────────────────────────────────────────
    const silentRefresh = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken || refreshToken === 'undefined' || refreshToken === 'null') return;

        try {
            const res = await fetch(`${API}/api/auth/refresh/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh: refreshToken })
            });
            if (!res.ok) throw new Error('Refresh failed');
            const data = await res.json();
            if (data.access) {
                localStorage.setItem('access_token', data.access);
                // If server rotates refresh token, update it too
                if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
            }
        } catch {
            // Refresh token expired → logout silently
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUserData(null);
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token || token === 'undefined' || token === 'null') {
            setLoading(false);
            setUserData(null);
            return;
        }

        fetch(`${API}/api/auth/me/`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        })
            .then(res => {
                if (res.status === 401) throw new Error('Unauthorized');
                return res.json();
            })
            .then(data => {
                setUserData(data);
                // Also update localStorage so next boot is faster and accurate
                localStorage.setItem('user', JSON.stringify(data));
            })
            .catch(() => {
                // Token is dead — try silent refresh first
                silentRefresh();
            })
            .finally(() => {
                setLoading(false);
            });

        // Auto-refresh every 13 minutes (access token expires in 15)
        refreshIntervalRef.current = setInterval(silentRefresh, 13 * 60 * 1000);

        return () => {
            if (refreshIntervalRef.current) clearInterval(refreshIntervalRef.current);
        };
    }, []);

    // A helper to let components manually trigger user refresh (e.g. after uploading profile picture)
    const refreshUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserData(data);
                localStorage.setItem('user', JSON.stringify(data));
            }
        } catch (e) {
            console.error('Failed to refresh user', e);
        }
    };

    return (
        <AuthContext.Provider value={{ userData, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
