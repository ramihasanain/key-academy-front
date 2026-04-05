import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { FiChevronDown } from 'react-icons/fi'
import { HiOutlineAcademicCap, HiOutlineBookOpen } from 'react-icons/hi'
import './Navbar.css'

const Navbar = () => {
    const [scrolled, setScrolled] = useState(false)
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const location = useLocation()

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setMenuOpen(false)
        setDropdownOpen(false)
    }, [location])

    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : ''
        return () => { document.body.style.overflow = '' }
    }, [menuOpen])

    const isActive = (path) => location.pathname === path ? 'active' : ''

    return (
        <>
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="container">
                    <Link to="/" className="nav-logo">
                        <img src="/new-logo.png" alt="Key Academy" style={{ height: 75 }} />
                    </Link>

                    <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
                        <Link to="/" className={`nav-link ${isActive('/')}`}>الرئيسية</Link>
                        <Link to="/about" className={`nav-link ${isActive('/about')}`}>من نحن</Link>
                        <Link to="/features" className={`nav-link ${isActive('/features')}`}>المميزات</Link>

                        <div className={`nav-dropdown ${dropdownOpen ? 'mobile-open' : ''}`}>
                            <div
                                className="nav-link nav-dropdown-trigger"
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                            >
                                الصفوف الدراسية
                                <FiChevronDown className="dropdown-arrow" />
                            </div>
                            <div className="dropdown-menu">
                                <div className="dropdown-title">الصف السادس الاعدادي</div>
                                <Link to="/grades/sixth-scientific" className="dropdown-item">
                                    <div className="dropdown-item-icon science"><HiOutlineAcademicCap /></div>
                                    الفرع العلمي
                                </Link>
                                <Link to="/grades/sixth-literary" className="dropdown-item">
                                    <div className="dropdown-item-icon literary"><HiOutlineBookOpen /></div>
                                    الفرع الأدبي
                                </Link>
                                <div className="dropdown-divider"></div>
                                <Link to="/grades/third-intermediate" className="dropdown-item">
                                    <div className="dropdown-item-icon science"><HiOutlineBookOpen /></div>
                                    الصف الثالث المتوسط
                                </Link>
                            </div>
                        </div>

                        <Link to="/teachers" className={`nav-link ${isActive('/teachers')}`}>الأساتذة</Link>
                        <Link to="/faq" className={`nav-link ${isActive('/faq')}`}>الأسئلة الشائعة</Link>

                        <div className="nav-cta">
                            <Link to="/login" className="nav-login">تسجيل الدخول</Link>
                            <Link to="/signup" className="nav-start-btn">يلا نبدي</Link>
                        </div>
                    </div>

                    <div className="nav-left-section">
                        <img src="/key-icon-logo.png" alt="Key Academy Icon" className="nav-icon-logo" />
                        <button
                            className={`hamburger ${menuOpen ? 'active' : ''}`}
                            onClick={() => setMenuOpen(!menuOpen)}
                            aria-label="القائمة"
                        >
                            <span></span>
                            <span></span>
                            <span></span>
                        </button>
                    </div>
                </div>
            </nav>
            <div
                className={`nav-overlay ${menuOpen ? 'show' : ''}`}
                onClick={() => setMenuOpen(false)}
            ></div>
        </>
    )
}

export default Navbar
