import { motion } from 'framer-motion'
import {
    HiOutlineServerStack,
    HiOutlineMagnifyingGlass,
    HiOutlineUserCircle,
    HiOutlineDocumentText,
    HiOutlineQuestionMarkCircle,
    HiOutlinePencilSquare,
    HiOutlineChatBubbleLeftRight,
    HiOutlineUserGroup,
    HiOutlineMegaphone,
    HiOutlineComputerDesktop,
    HiOutlineXMark,
    HiOutlineCheck,
    HiOutlineDocumentCheck,
    HiOutlineCodeBracketSquare,
    HiOutlineSparkles
} from 'react-icons/hi2'
import { FaRobot } from 'react-icons/fa'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'

import robotVideoWebm from '../assets/robot_website.webm'
import robotVideoMov from '../assets/native_hevc_alpha.mov'
import './Features.css'

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.12 } })
}

const slideInRight = {
    hidden: { opacity: 0, x: 40 },
    visible: (i = 0) => ({ opacity: 1, x: 0, transition: { duration: 0.6, delay: i * 0.15 } })
}

const Features = () => {
    const mainFeatures = [
        { icon: <HiOutlineServerStack />, c: 'o', title: 'قوة تقنية', desc: 'سيرفرات قوية تتحمل أعداد كبيرة بدون ما توقف أو تفصل.' },
        { icon: <HiOutlineMagnifyingGlass />, c: 'p', title: 'بحث ذكي', desc: 'تكدر تلگة الأستاذ أو المادة اللي تريدها بثواني.' },
        { icon: <HiOutlineUserCircle />, c: 'v', title: 'ملفات الأساتذة', desc: 'ملف تعريفي لكل أستاذ' },
        { icon: <HiOutlineDocumentText />, c: 'o', title: 'أسئلة وزارية', desc: 'أسئلة وزارية وملازم مرتبة وجاهزة لكل درس.' },
        { icon: <HiOutlineQuestionMarkCircle />, c: 'p', title: 'توقف مفاجئ', desc: 'أسئلة تطلعلك وأنت تباوع المحاضرة حتى تبقيك مركز وتختبر فهمك.' },
        { icon: <HiOutlinePencilSquare />, c: 'v', title: 'ملاحظاتك الخاصة', desc: 'دفتر ملاحظات ذكي الك، تكتب بي اللي تريده لكل درس وينحفظ يمك.' },
        { icon: <HiOutlineChatBubbleLeftRight />, c: 'o', title: 'بيئة تفاعلية', desc: 'تكدر تحجي وتسأل الأساتذة والمساعدين والطلاب بكل سهولة.' },
        { icon: <HiOutlineUserGroup />, c: 'p', title: 'كروبات دراسة', desc: 'كروبات داخل المنصة تغنيك عن المواقع وتحميك من التشتت.' },
        { icon: <HiOutlineMegaphone />, c: 'v', title: 'تبليغات الأساتذة', desc: 'الأساتذة يكدرون يدزولك تبليغات وتحديثات عن الدروس داخل المنصة.' },
        { icon: <HiOutlineComputerDesktop />, c: 'o', title: 'لوحات للمساعدين', desc: 'المساعدين عدهم لوحة ذكية يتابعون بيها مستواك وامتحاناتك.' },
    ]

    const aiFeatures = [
        { icon: <FaRobot />, color: 'pink', title: 'مساعدك الشخصي للاستفسارات', desc: 'Key موجود وياك 24/7، تسأله أي شي يخص الدرس ويجاوبك من شرح الأستاذ.' },
        { icon: <HiOutlineDocumentCheck />, color: 'orange', title: 'ملخصات ذكية ومباشرة', desc: 'Key يلخصلك المحاضرة كاملة بثواني وبطريقة ذكية توفر وقتك وجهدك.' },
        { icon: <HiOutlineCodeBracketSquare />, color: 'cyan', title: 'اختبارات تقيم مستواك', desc: 'Key يوفرلك أسئلة من الدرس بناء على شرح الأستاذ حتى تتأكد من فهمك للمادة وتكون جاهز للامتحان.' },
    ]

    return (
        <div className="page-transition">
            <section className="features-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        شنو يميز منصة <span className="gradient-text">Key</span>؟
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        اكتشف شلون منصتنا راح تخلي دراستك أسهل وتجربتك ما تنوصف
                    </motion.p>
                </div>
            </section>

            {/* AI Features Horizon - Sci/Fi Space UI */}
            <section className="section ai-spatial-section">
                <ParticleBackground />
                <div className="ai-spatial-glow"></div>
                
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <div className="ai-spatial-header">
                        <SectionTitle 
                            title="تعرف على Key.. زميلك الذكي!" 
                            subtitle="Key هو رفيقك الدراسي بالمنصة، راح يساعدك ويختبرك ويشرحلك ويلخصلك المادة درس درس بناء على طريقة شرح الأستاذ" 
                        />
                    </div>
                    
                    <div className="ai-spatial-layout">
                        {/* Features List */}
                        <div className="ai-spatial-features">
                            {aiFeatures.map((ai, i) => (
                                <motion.div key={i} className="ai-space-card" variants={slideInRight} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                    <div className={`ai-space-icon bg-${ai.color}`}>
                                        {ai.icon}
                                    </div>
                                    <div className="ai-space-content">
                                        <h3 className={`text-${ai.color}`}>{ai.title}</h3>
                                        <p>{ai.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Interactive Mascot */}
                        <motion.div className="ai-spatial-mascot" variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                            <div className="ai-mascot-wrapper" style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', top: '-40px', right: '50%', transform: 'translateX(50%)', background: 'var(--bg-glass)', border: '1px solid var(--pink)', padding: '5px 20px', borderRadius: '20px', color: 'var(--pink)', fontWeight: '900', boxShadow: '0 5px 20px rgba(236, 54, 101, 0.4)', zIndex: 10, letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <HiOutlineSparkles /> Key AI
                                </div>
                                <video 
                                    autoPlay 
                                    loop 
                                    muted 
                                    playsInline 
                                    style={{ width: '100%', maxWidth: '450px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.2))' }}
                                >
                                    <source src={robotVideoMov} type='video/mp4; codecs="hvc1"' />
                                    <source src={robotVideoWebm} type="video/webm" />
                                </video>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            <section className="section features-showcase">
                <div className="container">
                    <SectionTitle title="كل شي تحتاجه بمكان واحد" subtitle="مميزات وفرناها إلك خصيصاً حتى تسيطر على دراستك وتتفوق" />
                    <div className="feature-showcase-grid">
                        {mainFeatures.map((f, i) => (
                            <motion.div key={i} className={`glass-card feature-showcase-card ${['color-blue', 'color-pink', 'color-orange', 'color-purple', 'color-green', 'color-teal'][i % 6]}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                <div className={`f-icon ${f.c}`}>{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    )
}

export default Features
