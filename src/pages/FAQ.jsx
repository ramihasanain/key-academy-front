import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { API } from '../config'
import { HiOutlineMagnifyingGlass, HiChevronDown } from 'react-icons/hi2'
import ParticleBackground from '../components/ParticleBackground'
import './FAQ.css'

const categories = ['الكل', 'عام', 'التسجيل', 'الدورات', 'الدفع', 'تقني']

const FAQ = () => {
    const [faqData, setFaqData] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeCat, setActiveCat] = useState('الكل')
    const [search, setSearch] = useState('')
    const [openIndex, setOpenIndex] = useState(null)

    useEffect(() => {
        const fetchFAQs = async () => {
            try {
                const response = await fetch(API + '/api/content/faq/')
                const data = await response.json()
                setFaqData(data)
            } catch (error) {
                console.error("Error fetching FAQs:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchFAQs()
    }, [])

    const filtered = faqData.filter(item => {
        if (activeCat !== 'الكل' && item.category !== activeCat) return false
        if (search && !item.question.includes(search) && !item.answer.includes(search)) return false
        return true
    })

    return (
        <div className="page-transition">
            <section className="faq-hero">
                <ParticleBackground />
                <div className="container" style={{ position: 'relative', zIndex: 2 }}>
                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        أسئلة <span className="gradient-text">دايماً تنسأل</span>
                    </motion.h1>
                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
                        أهم الأسئلة اللي ببالك وإجاباتها عن منصتنا
                    </motion.p>
                </div>
            </section>

            <section className="section faq-section">
                <div className="container">
                    <div className="faq-search">
                        <HiOutlineMagnifyingGlass />
                        <input
                            type="text"
                            placeholder="دور على اللي ببالك..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div className="faq-categories">
                        {categories.map(cat => (
                            <button key={cat} className={`faq-cat ${activeCat === cat ? 'active' : ''}`} onClick={() => setActiveCat(cat)}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="faq-list">
                        {filtered.map((item, i) => (
                            <motion.div
                                key={i}
                                className="faq-item"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.05 }}
                            >
                                <button
                                    className={`faq-question ${openIndex === i ? 'open' : ''}`}
                                    onClick={() => setOpenIndex(openIndex === i ? null : i)}
                                >
                                    {item.question}
                                    <HiChevronDown />
                                </button>
                                <div className={`faq-answer ${openIndex === i ? 'open' : ''}`}>
                                    <p>{item.answer}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    )
}

export default FAQ
