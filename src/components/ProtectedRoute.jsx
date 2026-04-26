import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * حارس الروابط (ProtectedRoute)
 * =============================
 * يتحقق من وجود التوكن ومن مطابقة "دور" المستخدم للأدوار المسموح بها.
 * إذا كان غير مصرح له، يتم توجيهه للوحة التحكم الخاصة به بدلاً من الضياع.
 */
export const ProtectedRoute = ({ children, allowedRoles }) => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    const location = useLocation();
    
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

        // [MFA ENFORCEMENT] - خاص بالإدارة والموظفين فقط
        // إذا كان أدمن ولم يفعل الـ MFA، نوجهه لصفحة الإعداد (إلا إذا كان فيها أصلاً)
        if (user.role === 'admin' && !user.mfa_enabled && location.pathname !== '/hq/2fa-setup') {
            return <Navigate to="/hq/2fa-setup" replace />;
        }
        
        return children;
    } catch (e) {
        // في حال وجود مشكلة في البيانات المخزنة
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        return <Navigate to="/login" replace />;
    }
};
