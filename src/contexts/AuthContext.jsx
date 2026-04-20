import { createContext, useContext, useState, useEffect } from 'react';
import { API } from '../config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    // Attempt to load from storage initially for instantly rendering components
    const [userData, setUserData] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    });
    const [loading, setLoading] = useState(true);

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
                // If token is dead
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');
                setUserData(null);
            })
            .finally(() => {
                setLoading(false);
            });
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
