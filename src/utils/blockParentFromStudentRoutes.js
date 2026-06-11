/** Redirect parent accounts away from student-only content (lectures, courses). */
export function isParentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}')
        return user?.role === 'parent'
    } catch {
        return false
    }
}
