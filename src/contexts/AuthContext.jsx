import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { API } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const hasInitializedRef = useRef(false);
    // Attempt to load from storage initially for instantly rendering components
    const [userData, setUserData] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    });

    const [loading, setLoading] = useState(() => {
        const stored = localStorage.getItem('user');
        const token = localStorage.getItem('access_token');
        const hasCachedUser = stored && stored !== 'undefined' && stored !== 'null';
        const hasToken = token && token !== 'undefined' && token !== 'null';
        return !(hasCachedUser && hasToken);
    });

    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        // Listen to global logout event triggered by interceptor
        const handleLogout = () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setUserData(null);
        };
        window.addEventListener('auth:logout', handleLogout);

        const bootstrapAuthFromStorage = async () => {
            const token = localStorage.getItem('access_token');
            const storedUser = localStorage.getItem('user');
            const hasCachedUser = storedUser && storedUser !== 'undefined' && storedUser !== 'null';

            if (!token || token === 'undefined' || token === 'null') {
                handleLogout();
                setLoading(false);
                return;
            }

            // Use local cache as source of truth on app boot to avoid unnecessary /me calls.
            if (hasCachedUser) {
                try {
                    setUserData(JSON.parse(storedUser));
                } catch {
                    handleLogout();
                } finally {
                    setLoading(false);
                }
                return;
            }

            try {
                // The global fetch interceptor automatically handles expired tokens and retries
                const res = await fetch(`${API}/api/auth/me/`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setUserData(data);
                    localStorage.setItem('user', JSON.stringify(data));
                } else {
                    // If we get here, it means the interceptor tried refreshing and failed
                    handleLogout();
                }
            } catch (err) {
                // Network error or unexpected error
                console.error('Auth verification failed', err);
            } finally {
                setLoading(false);
            }
        };

        bootstrapAuthFromStorage();

        return () => {
            window.removeEventListener('auth:logout', handleLogout);
        };
    }, []);

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
