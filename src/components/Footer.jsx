import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTelegramPlane,
  FaTiktok,
  FaYoutube,
} from "react-icons/fa";
import "./Footer.css";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="nav-logo">
              <img
                src="/new-logo.png"
                alt="Key Academy"
                style={{ height: 60 }}
              />
            </Link>
            <p>
              منصة تعليمية رائدة في العراق، مدعومة بالذكاء الاصطناعي لتقديم
              تجربة تعليمية فريدة ومتطورة تناسب جيل السرعة والتكنولوجيا.
            </p>
            <p style={{ fontSize: '0.85rem', marginTop: '10px', color: 'var(--text-secondary)', direction: 'ltr', textAlign: 'left' }}>
              Key Academy is a leading AI-powered educational platform in Iraq, designed to provide students with the best learning experience.
            </p>
            <div className="footer-socials">
              <a
                href="https://www.facebook.com/profile.php?id=61583561625436"
                className="footer-social-link"
                target="_blank"
                aria-label="Facebook"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.instagram.com/keyacademy.iq/"
                className="footer-social-link"
                target="_blank"
                aria-label="Instagram"
              >
                <FaInstagram />
              </a>
              <a
                href="https://t.me/keyacademy1"
                className="footer-social-link"
                target="_blank"
                aria-label="Telegram"
              >
                <FaTelegramPlane />
              </a>
              <a
                href="https://www.tiktok.com/@keyacademy.iq?_r=1&_t=ZS-95L9nX37r2e&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnco2Eq79-_oAAyBpgfj0oAztk36qrhkfJqfwycOAiKznloVt17fR8H3fu9PQ_aem_fkeibTxe849axvrwpDxAPw"
                className="footer-social-link"
                target="_blank"
                aria-label="Tiktok"
              >
                <FaTiktok />
              </a>
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
            <a href="mailto:info@key.academy">info@key.academy</a>
            <a href="tel:07777007006">07777007006</a>
            <a href="tel:07877007006">07877007006</a>
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
  );
};

export default Footer;
