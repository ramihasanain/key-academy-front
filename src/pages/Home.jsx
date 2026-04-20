import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { API } from '../config'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, EffectCards } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/effect-cards'
import { HiOutlineSparkles, HiOutlineLightBulb, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineBookOpen, HiOutlineChatBubbleLeftRight, HiOutlineChartBar, HiOutlineChartBarSquare, HiOutlineCpuChip, HiOutlineDocumentText } from 'react-icons/hi2'
import { FaBrain, FaChalkboardTeacher, FaGraduationCap, FaPlay, FaRocket } from 'react-icons/fa'
import AnimatedCounter from '../components/AnimatedCounter'
import SectionTitle from '../components/SectionTitle'
import Contact from './Contact'
import './Home.css'
import robotVideo from '../assets/robot_website.webm'
import iconSlides from '../assets/icon-slides.png'
const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, delay: i * 0.15 }
    })
}

// Generate stars
const stars = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 2 + 1}px`,
    delay: `${Math.random() * 5}s`,
    duration: `${Math.random() * 3 + 2}s`,
}))

// Floating icons for background decoration
const floatingIcons = [
    { icon: '📚', top: '15%', left: '5%', delay: 0, duration: 8 },
    { icon: '🎓', top: '70%', left: '8%', delay: 1, duration: 10 },
    { icon: '💡', top: '20%', right: '7%', delay: 2, duration: 7 },
    { icon: '🔬', top: '75%', right: '5%', delay: 0.5, duration: 9 },
    { icon: '🧪', top: '45%', left: '3%', delay: 1.5, duration: 11 },
    { icon: '📐', top: '50%', right: '4%', delay: 3, duration: 8 },
    { icon: '🏆', top: '85%', left: '15%', delay: 2.5, duration: 9 },
    { icon: '✨', top: '10%', left: '25%', delay: 0.8, duration: 6 },
]

const Home = () => {
    const [teachers, setTeachers] = useState([])
    const [isAppleWebKit, setIsAppleWebKit] = useState(false)

    useEffect(() => {
        // Detect Apple WebKit browsers where WebM alpha is not supported and renders as black
        const ua = navigator.userAgent;
        const isWebKit = /iPad|iPhone|iPod/.test(ua) || 
                         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ||
                         /^((?!chrome|android).)*safari/i.test(ua) ||
                         /CriOS|FxiOS|EdgiOS/.test(ua);
        setIsAppleWebKit(isWebKit);

        const cachedTeachers = sessionStorage.getItem('cached_teachers_list')
        if (cachedTeachers) {
            try { setTeachers(JSON.parse(cachedTeachers)) } catch(e) {}
        }
        
        fetch(API + '/api/teachers/')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch')
                return res.json()
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setTeachers(data)
                    sessionStorage.setItem('cached_teachers_list', JSON.stringify(data))
                }
            })
            .catch(err => console.error('Error fetching teachers:', err))
    }, [])

    return (
        <div className="page-transition">
            {/* ===== HERO ===== */}
            <section className="hero">
                <div className="hero-container">
                    <div className="hero-banner">
                        
                        {/* Right Content (Text) */}
                        <div className="hero-banner-content">
                            <motion.div
                                className="hero-banner-badge"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <span className="hero-banner-badge-dot"></span>
                                مدعوم بالذكاء الاصطناعي <HiOutlineSparkles />
                            </motion.div>

                            <motion.h1
                                className="hero-banner-title"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                            >
                                العلم مفتاح كل حلم
                            </motion.h1>

                            <motion.p
                                className="hero-banner-desc"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                            >
                                أول منصة عراقية تجمع عمالقة التدريس ويه الذكاء
                                <br />
                                الاصطناعي حتى تنطيك تجربة دراسة متطورة
                            </motion.p>

                            <motion.div
                                className="hero-banner-actions"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                            >
                                <Link to="/signup" className="hero-action-link">
                                    <FaRocket className="hero-action-icon rocket-icon" />
                                    <span className="hero-action-text">يلا نبدي</span>
                                </Link>
                                <Link to="/features" className="hero-action-link">
                                    <FaPlay className="hero-action-icon play-icon" />
                                    <span className="hero-action-text">شوف المنصة شلون تشتغل</span>
                                </Link>
                            </motion.div>
                        </div>

                        {/* Left Content (Visuals) */}
                        <div className="hero-banner-visuals">
                            {/* Giant Robot Video */}
                            <div className="hero-robot-wrapper">
                                <video 
                                    src={robotVideo} 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    className="hero-robot-video"
                                    style={isAppleWebKit ? { mixBlendMode: 'screen', filter: 'contrast(1.3) brightness(0.9)' } : {}}
                                />
                            </div>

                            {/* Floating Glass Cards PNG */}
                            <img src={iconSlides} alt="ميزات المنصة" className="hero-floating-cards-img" />
                        </div>

                    </div>
                </div>
            </section>

            {/* ===== Features ===== */}
            <section className="section features-section">
                <div className="container">
                    <SectionTitle title="ليش تختار Key Academy؟" subtitle="نوفرلك تجربة دراسة متكاملة تجمع بين التطور التقني وأقوى الأساتذة بالعراق" />
                    <div className="features-grid">
                        {[
                            { icon: <HiOutlineCpuChip />, color: 'purple', title: 'ذكاء اصطناعي يساعدك', desc: 'تقنيات AI تحلل مستواك وتنطيك خطة دراسية مثالية' },
                            { icon: <FaChalkboardTeacher />, color: 'purple', title: 'عمالقة التدريس', desc: 'وفرنالك نخبة أساتذة العراق واكثرهم خبرة حتى تضمن الدرجة الكاملة والمعدل العالي' },
                            { icon: <HiOutlineBookOpen />, color: 'purple', title: 'مناهج شاملة', desc: 'تغطية كاملة لكافة مناهج الثالث المتوسط والسادس الإعدادي بفرعيه العلمي والأدبي' },
                            { icon: <HiOutlineChatBubbleLeftRight />, color: 'purple', title: 'تواصل مباشر', desc: 'تكدر تسأل وتتواصل ويه أساتذتك ومساعديهم بكل وقت وبدون أي تأخير' },
                            { icon: <HiOutlineChartBarSquare />, color: 'purple', title: 'متابعة مستواك', desc: 'لوحة ذكية تشوف منها تقدمك بالمواد وتعرف وين نقاط ضعفك حتى تقويها وتسيطر' },
                            { icon: <HiOutlineAcademicCap />, color: 'purple', title: 'شهادات إنجاز', desc: 'احصل على شهادة إتمام الدورة بعد إنجازها' },
                        ].map((feature, i) => (
                            <motion.div key={i} className={`feature-card color-${feature.color}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-50px' }} custom={i}>
                                <div className="feature-icon">{feature.icon}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Grades Preview ===== */}
            <section className="section grades-preview">
                <div className="container">
                    <SectionTitle title="الصفوف الدراسية" subtitle="اختار صفك هسه وابدي ويانا درب التفوق ويه أحسن الأساتذة" />
                    <div className="grades-cards">
                        {[
                            { title: 'الصف السادس الإعدادي', desc: 'أهم مرحلة بحياتك التحدد مستقبلك، إحنا وياك خطوة بخطوة', icon: <FaGraduationCap />, link: '/grades/sixth-scientific', hasBranches: true },
                            { title: 'الصف الثالث المتوسط', desc: 'نأسسك صح هسة حتى ترتاح ويانا بالسادس', icon: <HiOutlineAcademicCap />, link: '/grades/third-intermediate', hasBranches: false },
                        ].map((grade, i) => (
                            <motion.div key={i} className={`glass-card grade-preview-card ${i === 0 ? 'color-pink' : 'color-purple'}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                <div className="grade-icon">{grade.icon}</div>
                                <h3>{grade.title}</h3>
                                <p>{grade.desc}</p>
                                <div className="grade-branches">
                                    {grade.hasBranches ? (
                                        <>
                                            <Link to="/grades/sixth-scientific" className="grade-branch-tag">الفرع العلمي</Link>
                                            <Link to="/grades/sixth-literary" className="grade-branch-tag">الفرع الأدبي</Link>
                                        </>
                                    ) : (
                                        <Link to={grade.link} className="grade-branch-tag" style={{ width: '100%', justifyContent: 'center' }}>المنهج المتكامل</Link>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== Teachers Carousel ===== */}
            <section className="section teachers-section">
                <div className="container">
                    <SectionTitle title="أقوى الأساتذة" subtitle="المية مضمونة وياهم" />
                    <Swiper
                        modules={[Autoplay, Pagination]}
                        spaceBetween={24} slidesPerView={1}
                        pagination={{ clickable: true }}
                        autoplay={{ delay: 3000, disableOnInteraction: false }}
                        breakpoints={{ 480: { slidesPerView: 2 }, 768: { slidesPerView: 3 }, 1024: { slidesPerView: 4 } }}
                        style={{ paddingBottom: '50px' }}
                    >
                        {teachers.map((teacher, i) => {
                            // Fallback to cyclic colors only if color is completely missing
                            const fallbackColors = ['blue', 'pink', 'orange', 'purple', 'green', 'teal'];
                            const colorValue = teacher.color || fallbackColors[i % fallbackColors.length];
                            
                            return (
                            <SwiperSlide key={teacher.id}>
                                <div className={`glass-card teacher-card color-${colorValue}`} style={colorValue?.startsWith('#') ? { background: colorValue, borderColor: 'transparent', boxShadow: `0 10px 30px ${colorValue}33` } : {}}>
                                    <div className="tc-image-wrapper">
                                        {teacher.image ? (
                                            <img src={teacher.image} alt={teacher.name} loading="lazy" decoding="async" />
                                        ) : (
                                            <div className="tc-avatar-placeholder">{teacher.initials || 'أ'}</div>
                                        )}
                                    </div>
                                    <div className="tc-info-wrapper">
                                        <h4>{teacher.name}</h4>
                                        <div className="tc-subject">{teacher.subject}</div>
                                        <div className="tc-grade">{teacher.grade}</div>
                                        <Link to={`/teachers/${teacher.id}`} className="tc-btn">شوف ملف الأستاذ</Link>
                                    </div>
                                </div>
                            </SwiperSlide>
                        )})}
                    </Swiper>
                    <div className="view-all-teachers">
                        <Link to="/teachers" className="btn-secondary"><HiOutlineUserGroup /> كل الأساتذة</Link>
                    </div>
                </div>
            </section>

            {/* ===== AI Section ===== */}
            <section className="section ai-section">
                <div className="container">
                    <div className="ai-content">
                        <motion.div className="ai-text" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                            <h3><span className="gradient-text">الذكاء الاصطناعي</span><br />بين ايدك</h3>
                            <p>نستعمل أحدث تقنيات الذكاء الاصطناعي حتى نحلل مستواك وننطيك تجربة دراسة مصممة إلك</p>
                            <div className="ai-features-list">
                                {[
                                    'نظام ملاحظات الك لكل درس تنحفظ يمك وتكدر ترجعلها اي وقت',
                                    'كروبات محادثة ويه الأستاذ والمساعدين داخل المنصة تغنيك عن التشتت الرقمي',
                                    'أسئلة وزارية لجميع الدروس لكل المواد .',
                                    'توقف مفاجئ (أسئلة) حتى يخليك مركز وتختبر فهمك',
                                    'Key المساعد الذكي، رفيقك الي يجاوب على كل استفساراتك بأي وقت',
                                    'نظام سلايدات مرتب يلخص إلك كل درس حتى تراجعه بسهولة',
                                ].map((item, i) => (
                                    <motion.div key={i} className="ai-feature-item" initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}>
                                        <HiOutlineSparkles />
                                        <span>{item}</span>
                                    </motion.div>
                                ))}
                            </div>
                            <Link to="/features" className="btn-primary"><HiOutlineLightBulb /> اكتشف أكثر</Link>
                        </motion.div>
                        <div className="ai-visual">
                            <div className="ai-brain"><FaBrain /></div>
                            <div className="ai-orbit-item"><HiOutlineCpuChip /></div>
                            <div className="ai-orbit-item"><HiOutlineChartBarSquare /></div>
                            <div className="ai-orbit-item"><HiOutlineLightBulb /></div>
                            <div className="ai-orbit-item"><HiOutlineSparkles /></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== Contact Section ===== */}
            <Contact />
        </div>
    )
}

export default Home
