import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';

const AnimatedCounter = ({ from = 0, to, duration = 2, suffix = '' }) => {
    const [count, setCount] = useState(from);

    useEffect(() => {
        let startTime = null;

        const animate = (time) => {
            if (!startTime) startTime = time;
            const progress = (time - startTime) / (duration * 1000);
            
            if (progress < 1) {
                setCount(Math.floor(from + (to - from) * progress));
                requestAnimationFrame(animate);
            } else {
                setCount(to);
            }
        };

        requestAnimationFrame(animate);
    }, [from, to, duration]);

    return (
        <span style={{ display: 'inline-block' }}>
            {count}{suffix}
        </span>
    );
};

export default AnimatedCounter;
