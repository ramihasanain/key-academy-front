// API Base URL — يتم تحديده تلقائياً حسب البيئة
const envApiUrl = (import.meta.env.VITE_API_URL || '').trim()

/** Upgrade http→https when the page is served over TLS (prevents mixed-content blocks). */
export function ensureSecureUrl(url) {
    if (!url || typeof url !== 'string') return url
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && url.startsWith('http://')) {
        return url.replace(/^http:\/\//i, 'https://')
    }
    return url
}

const rawApi = envApiUrl || 'http://127.0.0.1:8000'
export const API = ensureSecureUrl(rawApi.replace(/\/+$/, ''))

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
    refreshSubscribers.forEach(cb => cb(token));
    refreshSubscribers = [];
}

const originalFetch = window.fetch;

// Global fetch override to automatically handle 401 Unauthorized errors and retry queries
window.fetch = async function(...args) {
    let [resource, config] = args;
    
    // Apply interceptor ONLY for our API and NOT for auth endpoints to prevent loops
    if (typeof resource === 'string' && resource.startsWith(API) && !resource.includes('/api/v1/auth/refresh/') && !resource.includes('/api/v1/auth/login/') && !resource.includes('/api/v1/auth/signup/')) {
        

// Auto-inject the latest token if available to prevent race conditions during state updates
        const currentToken = localStorage.getItem('access_token');
        if (config && config.headers) {
             if (config.headers instanceof Headers) {
                 if (currentToken && config.headers.has('Authorization') === false) {
                     config.headers.set('Authorization', `Bearer ${currentToken}`);
                 }
             } else {
                 if (currentToken && !config.headers['Authorization']) {
                     config.headers['Authorization'] = `Bearer ${currentToken}`;
                 }
             }
        } else if (config) {
             config.headers = {};
             if (currentToken) config.headers['Authorization'] = `Bearer ${currentToken}`;
        }

        let response = await originalFetch(resource, config);
        
        // If unauthorized, attempt to use the refresh token
        if (response.status === 401) {
            const refreshToken = localStorage.getItem('refresh_token');
            if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
                
                if (!isRefreshing) {
                    isRefreshing = true;
                    try {
                        const refreshRes = await originalFetch(`${API}/api/v1/auth/refresh/`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ refresh: refreshToken })
                        });
                        
                        if (refreshRes.ok) {
                            const data = await refreshRes.json();
                            if (data.access) {
                                localStorage.setItem('access_token', data.access);
                                if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
                                onRefreshed(data.access);
                            } else {
                                onRefreshed(null);
                                window.dispatchEvent(new Event('auth:logout'));
                            }
                        } else {
                            onRefreshed(null);
                            window.dispatchEvent(new Event('auth:logout'));
                        }
                    } catch (e) {
                        console.error('Refresh Token request failed:', e);
                        onRefreshed(null);
                        window.dispatchEvent(new Event('auth:logout'));
                    } finally {
                        isRefreshing = false;
                    }
                }
                
                // Wait until the first token refresh process finishes
                const newToken = await new Promise(resolve => {
                    refreshSubscribers.push(resolve);
                });
                
                if (newToken) {
                    // Retry the request with the new access token
                    let retryConfig = { ...config };
                    if (!retryConfig.headers) retryConfig.headers = {};
                    
                    if (retryConfig.headers instanceof Headers) {
                        const newHeaders = new Headers(retryConfig.headers);
                        newHeaders.set('Authorization', `Bearer ${newToken}`);
                        retryConfig.headers = newHeaders;
                    } else {
                        retryConfig.headers = { ...retryConfig.headers, 'Authorization': `Bearer ${newToken}` };
                    }
                    
                    return originalFetch(resource, retryConfig);
                }
            } else {
                // Return 401 response OR dispatch logout if they don't have a refresh token
                window.dispatchEvent(new Event('auth:logout'));
            }
        }
        return response;
    }
    return originalFetch(...args);
};
