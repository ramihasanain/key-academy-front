// API Base URL — يتم تحديده تلقائياً حسب البيئة
// محلياً: http://127.0.0.1:8000
// الإنتاج: https://clownfish-app-jcsgq.ondigitalocean.app
export const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
