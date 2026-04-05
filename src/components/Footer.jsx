import { Link } from 'react-router-dom'
import { FaFacebookF, FaInstagram, FaTelegramPlane, FaYoutube } from 'react-icons/fa'
import './Footer.css'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-brand">
                        <Link to="/" className="nav-logo">
                            <img src="/new-logo.png" alt="Key Academy" style={{ height: 60 }} />
                        </Link>
                        <p>
                            منصة تعليمية رائدة في العراق، مدعومة بالذكاء الاصطناعي لتقديم تجربة تعليمية فريدة ومتطورة تناسب جيل السرعة والتكنولوجيا.
                        </p>
                        <div className="footer-socials">
                            <a href="#" className="footer-social-link" aria-label="Facebook"><FaFacebookF /></a>
                            <a href="#" className="footer-social-link" aria-label="Instagram"><FaInstagram /></a>
                            <a href="#" className="footer-social-link" aria-label="Telegram"><FaTelegramPlane /></a>
                            <a href="#" className="footer-social-link" aria-label="YouTube"><FaYoutube /></a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h4>روابط سريعة</h4>
                        <Link to="/">الرئيسية</Link>
                        <Link to="/about">من نحن</Link>
                        <Link to="/features">المميزات</Link>
                        <Link to="/teachers">الأساتذة</Link>
                        <Link to="/faq">الأسئلة الشائعة</Link>
                    </div>

                    <div className="footer-col">
                        <h4>الصفوف الدراسية</h4>
                        <Link to="/grades/sixth-scientific">السادس العلمي</Link>
                        <Link to="/grades/sixth-literary">السادس الأدبي</Link>
                        <Link to="/grades/third-intermediate">الثالث المتوسط</Link>
                    </div>

                    <div className="footer-col">
                        <h4>تواصل معنا</h4>
                        <a href="mailto:info@keyacademy.iq">info@keyacademy.iq</a>
                        <a href="tel:+9647700000000">+964 770 000 0000</a>
                        <a href="#">بغداد، العراق</a>
                    </div>
                </div>

                <div className="footer-bottom">
                    <p>© 2026 Key Academy. جميع الحقوق محفوظة.</p>
                    <div className="footer-bottom-links">
                        <a href="#">سياسة الخصوصية</a>
                        <a href="#">الشروط والأحكام</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
