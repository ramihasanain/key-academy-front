/** اشتراك اطلاع فقط — مشاهدة بدون تفاعل */

export function isViewOnlyCourse(courseOrMeta) {
    if (!courseOrMeta) return false
    return (
        courseOrMeta.access_mode === 'view_only' ||
        courseOrMeta.can_interact === false
    )
}

export const VIEW_ONLY_READ_BANNER =
    'وضع الاطلاع فقط: يمكنك مشاهدة المحتوى دون إرسال رسائل أو تعليقات.'
