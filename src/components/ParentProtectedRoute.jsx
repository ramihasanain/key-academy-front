import { Navigate, useLocation } from 'react-router-dom'

/**
 * حارس روابط بوابة ولي الأمر — ويب فقط، دور parent فقط.
 */
export const ParentProtectedRoute = ({ children, skipPasswordCheck = false, skipStudentCheck = false }) => {
    const location = useLocation()
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user')

    if (!token || !userStr || userStr === 'undefined') {
        return <Navigate to="/parent/login" replace state={{ from: location.pathname }} />
    }

    try {
        const user = JSON.parse(userStr)
        if (user.role !== 'parent') {
            if (user.role === 'admin') return <Navigate to="/hq" replace />
            if (user.role === 'assistant') return <Navigate to="/ta" replace />
            if (user.role === 'teacher') return <Navigate to="/teacher" replace />
            return <Navigate to="/dashboard" replace />
        }

        if (!skipPasswordCheck && user.must_change_password && location.pathname !== '/parent/change-password') {
            return <Navigate to="/parent/change-password" replace />
        }

        const childrenList = user.children || []
        const selected = localStorage.getItem('parent_selected_student')
        const needsStudentPick = childrenList.length > 1 && !selected

        if (!skipStudentCheck && needsStudentPick && location.pathname !== '/parent/select-student') {
            return <Navigate to="/parent/select-student" replace />
        }

        if (!skipStudentCheck && childrenList.length === 1 && !selected) {
            localStorage.setItem('parent_selected_student', JSON.stringify(childrenList[0]))
        }

        return children
    } catch {
        localStorage.removeItem('user')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('parent_selected_student')
        return <Navigate to="/parent/login" replace />
    }
}

export const getParentSelectedStudent = () => {
    try {
        const raw = localStorage.getItem('parent_selected_student')
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}
