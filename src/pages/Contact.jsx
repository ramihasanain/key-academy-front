import { useState } from 'react'
import { motion } from 'framer-motion'
import { API } from '../config'
import { HiOutlineMapPin, HiOutlinePhone, HiOutlineEnvelope, HiOutlinePaperAirplane } from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './Contact.css'

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const res = await fetch(API + '/api/contact/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitted(true);
                setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
                setTimeout(() => setSubmitted(false), 5000);

                // تحديث سريع لعداد الرسائل في واجهة المشرفين إذا كانت مفتوحة
                window.dispatchEvent(new Event('focus'));
            } else {
                let errorMessage = 'حدث خطأ أثناء الإرسال، الرجاء المحاولة مجدداً.';

                try {
                    const errorData = await res.json();

                    if (errorData && typeof errorData === 'object') {
                        const messages = Object.values(errorData)
                            .flatMap((value) => Array.isArray(value) ? value : [value])
                            .filter(Boolean)
                            .join('\n');

                        if (messages) {
                            errorMessage = messages;
                        }
                    } else if (typeof errorData === 'string' && errorData.trim()) {
                        errorMessage = errorData;
                    }
                } catch {
                    // Ignore parse errors and keep fallback message
                }

                alert(errorMessage);
            }
        } catch (err) {
            console.error(err);
            alert('انقطع الاتصال بالخادم، الرجاء المحاولة مجدداً.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="page-transition">
            <section className="contact-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <span className="gradient-text">تواصل ويانا</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        إحنا هنا حتى نجاوب على كل استفساراتك ونساعدك بدراستك
                    </motion.p>
                </div>
            </section>

            <section className="section contact-section">
                <div className="container">
                    <div className="contact-layout">

                        {/* Contact Info Side */}
                        <motion.div
                            className="contact-info-wrapper"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2>شلون تتواصل ويانا؟</h2>
                            <p className="contact-subtitle">براحتك، اتصل بينا بأي طريقة تعجبك أو دزلنا رسالتك منا.</p>

                            <div className="contact-info-list">
                                <div className="info-item">
                                    <div className="info-icon"><HiOutlineMapPin /></div>
                                    <div className="info-text">
                                        <h4>العنوان</h4>
                                        <p>بغداد، العراق، شارع المنصور الرئيسي</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon"><HiOutlinePhone /></div>
                                    <div className="info-text">
                                        <h4>رقم الهاتف</h4>
                                        <p dir="ltr" style={{ textAlign: 'right' }}>+964 770 000 0000</p>
                                    </div>
                                </div>
                                <div className="info-item">
                                    <div className="info-icon"><HiOutlineEnvelope /></div>
                                    <div className="info-text">
                                        <h4>البريد الإلكتروني</h4>
                                        <p>info@keyacademy.iq</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Contact Form Side */}
                        <motion.div
                            className="glass-card contact-form-card"
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h3 className="form-title">دزلنا رسالة</h3>

                            {submitted && (
                                <motion.div className="success-message" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                                    رسالتك وصلتنا! راح نتواصل وياك بأقرب وقت.
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="input-group">
                                        <label>الاسم الكامل</label>
                                        <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="اكتب اسمك الثلاثي" />
                                    </div>
                                    <div className="input-group">
                                        <label>رقم الهاتف</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange} dir="ltr" className="text-right" placeholder="07XX XXX XXXX" />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="input-group">
                                        <label>البريد الإلكتروني</label>
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="example@email.com" dir="ltr" className="text-right" />
                                    </div>
                                    <div className="input-group">
                                        <label>موضوع الرسالة</label>
                                        <input type="text" name="subject" value={formData.subject} onChange={handleChange} required placeholder="بشنو نكدر نساعدك؟" />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label>نص الرسالة</label>
                                    <textarea name="message" value={formData.message} onChange={handleChange} required rows="5" placeholder="اكتب اللي بكلبك واستفسارك هنا..."></textarea>
                                </div>

                                <button type="submit" className="btn-primary submit-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'جاري الإرسال...' : (
                                        <>
                                            إرسال الرسالة
                                            <HiOutlinePaperAirplane className="submit-icon" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </motion.div>

                    </div>
                </div>
            </section>
        </div>
    )
}

export default Contact
