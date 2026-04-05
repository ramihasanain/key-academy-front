import { motion } from 'framer-motion'
import { HiOutlineHeart, HiOutlineLightBulb, HiOutlineGlobeAlt, HiOutlineRocketLaunch, HiOutlineAcademicCap, HiOutlineUserGroup, HiOutlineFlag, HiOutlineTrophy } from 'react-icons/hi2'
import { FaKey, FaRobot } from 'react-icons/fa'
import SectionTitle from '../components/SectionTitle'
import ParticleBackground from '../components/ParticleBackground'
import './About.css'

const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: (i = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.6, delay: i * 0.15 } })
}

const About = () => {
    return (
        <div className="page-transition">
            <section className="about-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        من <span className="gradient-text">نحن</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        تعرف على قصتنا وشلون دنبني مستقبل التعليم بالعراق
                    </motion.p>
                </div>
            </section>

            <section className="section about-story">
                <div className="container">
                    <div className="about-story-content">
                        <motion.div className="about-story-text" initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
                            <h3><span className="gradient-text">قصتنا</span> ورؤيتنا</h3>
                            <p>إحنا منصة دراسة أونلاين عراقية، صممناها حتى نغير شكل التدريس الرقمي من خلال دمج الدروس ويه ذكاء اصطناعي حقيقي يفهم الطالب.</p>
                            <p>مشتغلين ويه نخبة أساتذتكم بالعراق، حتى نوفرلكم دروس بيها كلشي تحتاجوه وتضمنلكم المية ببيئة مرنة وآمنة تمشي ويه التطور.</p>
                            <p>منصتنا مو بس فيديوهات، إنها مفتاحك اللي راح يمشي وياك خطوة بخطوة لحد ما توصل للتفوق.</p>
                        </motion.div>
                        <div className="about-vision-graphic">
                            <motion.div className="about-vision-circle" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
                                <img src="/key-icon-logo.png" alt="Key Academy Logo" className="about-vision-logo" style={{ width: '160px', height: 'auto' }} />
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="section about-values">
                <div className="container">
                    <SectionTitle title="شلون نشتغل؟" subtitle="عدنا أساسيات نمشي عليها حتى نضمنلك أحسن دراسة ويانا" />
                    <div className="values-grid">
                        {[
                            { icon: <HiOutlineRocketLaunch />, color: 'purple', title: 'تغيير حقيقي', desc: 'نسوي فرق واضح بالدراسة الأونلاين ونخليها أسهل وأكثر فائدة' },
                            { icon: <HiOutlineTrophy />, color: 'orange', title: 'الأول دايماً', desc: 'نكون الخيار الأول للطالب العراقي من ناحية الجودة والمستوى' },
                            { icon: <HiOutlineLightBulb />, color: 'pink', title: 'دراسة ذكية', desc: 'نطور طريقتك بالدراسة ونخلي التكنولوجيا تخدمك بدل ما تعبك' },
                            { icon: <HiOutlineUserGroup />, color: 'blue', title: 'ثقة كبيرة', desc: 'وفرنا بيئة تريح الأستاذ وتخلي الطالب واثق من دراسته ويانا بدون تعقيد' },
                            { icon: <HiOutlineAcademicCap />, color: 'green', title: 'تغنيك عن الكل', desc: 'وفرنالك كل اللي تحتاجه بمكان واحد، ما راح تحتاج تدور منا ومنا' },
                            { icon: <HiOutlineHeart />, color: 'teal', title: 'نصنع الناجحين', desc: 'نشوف كل طالب كقصة، وهدفنا نكون جزء من 100 ألف قصة نجاح' }
                        ].map((value, i) => (
                            <motion.div key={i} className={`glass-card value-card color-${value.color}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                <div className={`feature-icon ${value.color}`}>{value.icon}</div>
                                <h4>{value.title}</h4>
                                <p>{value.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section goals-section">
                <div className="container">
                    <SectionTitle title="شنو هدفنا؟" subtitle="الأشياء اللي دنشتغل عليها ليل ونهار حتى نوفرها إلك" />
                    <div className="goals-grid">
                        {[
                            { icon: <HiOutlineFlag />, color: 'purple', text: 'نكون قادة تطوير التعليم وتسهيله للطالب' },
                            { icon: <HiOutlineAcademicCap />, color: 'pink', text: 'نغطي كل المناهج والمراحل مستقبلاً' },
                            { icon: <HiOutlineTrophy />, color: 'orange', text: 'أحسن وأقوى منصة بالعراق' },
                            { icon: <HiOutlineUserGroup />, color: 'green', text: 'نوصل أجيال ورة أجيال للتفوق' },
                            { icon: <FaRobot />, color: 'teal', text: 'نخلي الذكاء الاصطناعي مساعدك الشخصي بالدراسة' },
                            { icon: <HiOutlineGlobeAlt />, color: 'blue', text: 'نوفر منصة تنافس المواقع العالمية بالجودة وسهولة الاستخدام' }
                        ].map((goal, i) => (
                            <motion.div key={i} className={`glass-card goal-card color-${goal.color}`} variants={fadeInUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                                <div className={`goal-icon bg-${goal.color}`}>{goal.icon}</div>
                                <h4>{goal.text}</h4>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default About
