import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * حارس الروابط (ProtectedRoute)
 * =============================
 * يتحقق من وجود التوكن ومن مطابقة "دور" المستخدم للأدوار المسموح بها.
 * إذا كان غير مصرح له، يتم توجيهه للوحة التحكم الخاصة به بدلاً من الضياع.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    // إذا ما مسجل دخول أصلاً
    if (!token || !userStr || userStr === 'undefined') {
        return <Navigate to="/login" replace />;
    }

    try {
        const user = JSON.parse(userStr);
        
        // التحقق من الصلاحية (Role Check)
        if (!allowedRoles.includes(user.role)) {
            console.warn(`Access Denied for role: ${user.role}. Allowed: ${allowedRoles}`);
            
            // توجيه تلقائي حسب نوع الحساب لضمان عدم بقاء المستخدم عالقاً
            if (user.role === 'admin') return <Navigate to="/hq" replace />;
            if (user.role === 'assistant') return <Navigate to="/ta" replace />;
            if (user.role === 'teacher') return <Navigate to="/teacher" replace />;
            return <Navigate to="/dashboard" replace />;
        }
        
        return children;
    } catch (e) {
        // في حال وجود مشكلة في البيانات المخزنة
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        return <Navigate to="/login" replace />;
    }
};
