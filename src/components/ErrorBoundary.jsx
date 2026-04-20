import { Component } from 'react'

/**
 * ErrorBoundary
 * =============
 * يلتقط أي خطأ React غير متوقع بدل ما يطير الـ UI كاملاً.
 * بدلاً من الشاشة البيضاء → يعرض رسالة واضحة للطالب.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, info) {
        // يمكن ربطه بـ Sentry أو أي logging service مستقبلاً
        console.error('[ErrorBoundary] Caught error:', error, info)
    }

    handleReload = () => {
        this.setState({ hasError: false, error: null })
        window.location.href = '/'
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f0f1a',
                    color: '#e2e8f0',
                    fontFamily: 'Cairo, sans-serif',
                    gap: '20px',
                    textAlign: 'center',
                    padding: '40px'
                }}>
                    <div style={{ fontSize: '64px' }}>⚠️</div>
                    <h2 style={{ fontSize: '24px', color: '#a78bfa', margin: 0 }}>
                        حصل خطأ غير متوقع
                    </h2>
                    <p style={{ color: '#94a3b8', maxWidth: '400px', lineHeight: 1.7, margin: 0 }}>
                        عذراً، صار مشكلة بالصفحة. جرّب تحديث الصفحة أو ارجع للصفحة الرئيسية.
                    </p>
                    <button
                        onClick={this.handleReload}
                        style={{
                            padding: '12px 32px',
                            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            fontFamily: 'Cairo, sans-serif',
                            fontWeight: '600'
                        }}
                    >
                        🏠 الصفحة الرئيسية
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
