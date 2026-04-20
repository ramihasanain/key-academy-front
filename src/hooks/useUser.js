import { useAuth } from '../contexts/AuthContext'

/**
 * useUser — Custom Hook
 * =====================
 * يرجع بيانات المستخدم فوراً:
 * 1. من AuthContext (بيانات محدثة من السيرفر)
 * 2. أو من localStorage (cache فوري بدون انتظار)
 * 
 * يمنع أي شاشة بيضاء أو تأخير عند التنقل بين الصفحات.
 */
export const useUser = () => {
    const { userData: authUserData, loading, refreshUser } = useAuth()

    const userData = authUserData || (() => {
        try {
            const stored = localStorage.getItem('user')
            return stored && stored !== 'undefined' && stored !== 'null'
                ? JSON.parse(stored)
                : null
        } catch {
            return null
        }
    })()

    return { userData, loading, refreshUser }
}
