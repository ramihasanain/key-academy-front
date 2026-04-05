import React, { useState } from 'react';
import { HiOutlineChevronLeft, HiOutlineChevronRight } from 'react-icons/hi2';
import './KeyAiMascots.css';

/* =====================================================================
   1. CLASSIC ROBO (الرجل الآلي)
   ===================================================================== */
export const MascotClassic = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="aiGlow1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--pink)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--purple)" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="roboMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="40%" stopColor="#f0f2f5" />
                <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <linearGradient id="roboDarkMetal" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
            <linearGradient id="roboAccent" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--orange)" />
                <stop offset="50%" stopColor="var(--pink)" />
                <stop offset="100%" stopColor="var(--purple)" />
            </linearGradient>
            <linearGradient id="screenGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#1a0a2e" />
                <stop offset="100%" stopColor="#0f0518" />
            </linearGradient>
            <filter id="roboNeon">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <circle cx="200" cy="250" r="160" fill="url(#aiGlow1)" className="mascot-bg-glow" />

        <g className="mascot-float-parent">
            {/* Robot Hover Thruster Effect */}
            <ellipse cx="200" cy="410" rx="30" ry="10" fill="url(#roboAccent)" filter="url(#roboNeon)" className="mascot-thruster" opacity="0.8" />
            <path d="M 175 390 L 225 390 L 210 420 L 190 420 Z" fill="url(#roboAccent)" filter="url(#roboNeon)" opacity="0.3" className="mascot-thruster-beam" />

            {/* Left Arm (Jointed) */}
            <g className="mascot-arm-left" transform-origin="130 230">
                <circle cx="120" cy="230" r="18" fill="url(#roboDarkMetal)" />
                <circle cx="120" cy="230" r="8" fill="url(#roboAccent)" />
                <rect x="95" y="235" width="20" height="50" rx="10" fill="url(#roboMetal)" transform="rotate(25 120 230)" />
                <circle cx="85" cy="280" r="12" fill="url(#roboDarkMetal)" />
                <rect x="75" y="280" width="16" height="50" rx="8" fill="url(#roboMetal)" transform="rotate(-15 85 280)" />
                <path d="M 70 330 Q 60 350 80 345 Q 90 350 90 330 Z" fill="url(#roboAccent)" />
            </g>

            {/* Right Arm (Waving) */}
            <g className="mascot-arm-right" transform-origin="270 230">
                <circle cx="280" cy="230" r="18" fill="url(#roboDarkMetal)" />
                <circle cx="280" cy="230" r="8" fill="url(#roboAccent)" />
                <rect x="285" y="185" width="20" height="50" rx="10" fill="url(#roboMetal)" transform="rotate(30 280 230)" />
                <circle cx="315" cy="180" r="12" fill="url(#roboDarkMetal)" />
                <g className="mascot-wave-arm">
                    <rect x="307" y="130" width="16" height="50" rx="8" fill="url(#roboMetal)" />
                    <path d="M 305 130 Q 300 110 320 115 Q 330 110 325 130 Z" fill="url(#roboAccent)" />
                </g>
            </g>

            {/* Main Body Chassis */}
            <rect x="135" y="210" width="130" height="150" rx="25" fill="url(#roboMetal)" stroke="url(#roboDarkMetal)" strokeWidth="4" />
            <rect x="140" y="340" width="120" height="10" rx="5" fill="url(#roboAccent)" />
            
            {/* Chest Screen Area */}
            <rect x="150" y="230" width="100" height="60" rx="10" fill="url(#screenGrad1)" stroke="var(--pink)" strokeWidth="2" filter="url(#roboNeon)" />
            <text x="200" y="266" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="26" fontWeight="900" fontFamily="sans-serif" filter="url(#roboNeon)" className="mascot-key-text" letterSpacing="3">KEY</text>

            <circle cx="160" cy="310" r="6" fill="var(--orange)" filter="url(#roboNeon)" className="mascot-blink-1" />
            <circle cx="180" cy="310" r="6" fill="var(--pink)" filter="url(#roboNeon)" className="mascot-blink-2" />
            <circle cx="200" cy="310" r="6" fill="var(--purple)" filter="url(#roboNeon)" className="mascot-blink-3" />
            <rect x="220" y="306" width="20" height="8" rx="4" fill="var(--purple)" opacity="0.5" />

            {/* Hover Base */}
            <path d="M 160 360 L 240 360 L 220 390 L 180 390 Z" fill="url(#roboDarkMetal)" />
            <rect x="175" y="390" width="50" height="8" rx="4" fill="url(#roboAccent)" />

            {/* Neck */}
            <rect x="185" y="180" width="30" height="30" fill="url(#roboDarkMetal)" />
            <line x1="185" y1="190" x2="215" y2="190" stroke="#fff" strokeWidth="2" opacity="0.3" />
            <line x1="185" y1="200" x2="215" y2="200" stroke="#fff" strokeWidth="2" opacity="0.3" />

            {/* Robot Head */}
            <rect x="130" y="90" width="140" height="100" rx="30" fill="url(#roboMetal)" stroke="url(#roboDarkMetal)" strokeWidth="4" />
            <rect x="148" y="60" width="6" height="30" fill="url(#roboDarkMetal)" />
            <circle cx="151" cy="55" r="8" fill="var(--orange)" filter="url(#roboNeon)" className="mascot-blink-1" />
            <rect x="246" y="60" width="6" height="30" fill="url(#roboDarkMetal)" />
            <circle cx="249" cy="55" r="8" fill="var(--pink)" filter="url(#roboNeon)" className="mascot-blink-2" />
            <rect x="120" y="120" width="10" height="40" rx="5" fill="url(#roboAccent)" />
            <rect x="270" y="120" width="10" height="40" rx="5" fill="url(#roboAccent)" />
            <rect x="145" y="110" width="110" height="60" rx="15" fill="url(#screenGrad1)" />
            
            <path d="M 160 140 Q 170 125 180 140" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" filter="url(#roboNeon)" className="mascot-eye" />
            <path d="M 220 140 Q 230 125 240 140" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" filter="url(#roboNeon)" className="mascot-eye" />
            <ellipse cx="155" cy="155" rx="8" ry="4" fill="var(--pink)" opacity="0.6" filter="url(#roboNeon)" className="mascot-blush" />
            <ellipse cx="245" cy="155" rx="8" ry="4" fill="var(--pink)" opacity="0.6" filter="url(#roboNeon)" className="mascot-blush" />
        </g>
    </svg>
)
export const MiniMascotClassic = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <defs>
            <linearGradient id="mRobo1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d1d5db" /></linearGradient>
            <linearGradient id="mRoboA" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="var(--orange)" /><stop offset="100%" stopColor="var(--pink)" /></linearGradient>
            <linearGradient id="mScr" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1a0a2e" /><stop offset="100%" stopColor="#0f0518" /></linearGradient>
        </defs>
        <rect x="35" y="5" width="4" height="20" fill="#9ca3af" />
        <circle cx="37" cy="5" r="5" fill="var(--orange)" />
        <rect x="61" y="5" width="4" height="20" fill="#9ca3af" />
        <circle cx="63" cy="5" r="5" fill="var(--pink)" />
        <rect x="25" y="20" width="50" height="60" rx="15" fill="url(#mRobo1)" stroke="#9ca3af" strokeWidth="2" />
        <rect x="20" y="40" width="5" height="20" rx="2" fill="url(#mRoboA)" />
        <rect x="75" y="40" width="5" height="20" rx="2" fill="url(#mRoboA)" />
        <rect x="32" y="32" width="36" height="28" rx="8" fill="url(#mScr)" />
        <path d="M 37 45 Q 41 40 45 45" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M 55 45 Q 59 40 63 45" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="35" cy="52" r="3" fill="var(--pink)" opacity="0.6" />
        <circle cx="65" cy="52" r="3" fill="var(--pink)" opacity="0.6" />
        <rect x="42" y="80" width="16" height="15" fill="#9ca3af" />
    </svg>
)

/* =====================================================================
   2. COSMIC ROBO (آلي الفضاء)
   ===================================================================== */
export const MascotAlien = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="alGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#00e5ff" stopOpacity="0.15" /><stop offset="100%" stopColor="#7c4dff" stopOpacity="0" /></radialGradient>
            <linearGradient id="alBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#cbd5e1" /></linearGradient>
            <linearGradient id="alArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#4c1d95" /></linearGradient>
            <linearGradient id="alScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#020617" /><stop offset="100%" stopColor="#1e1b4b" /></linearGradient>
            <filter id="alNeon"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="160" fill="url(#alGlow)" />
        <g className="mascot-float-parent">
            {/* Thruster */}
            <path d="M 170 390 L 230 390 L 210 430 L 190 430 Z" fill="#00e5ff" filter="url(#alNeon)" opacity="0.6"/>
            {/* Body */}
            <rect x="135" y="210" width="130" height="160" rx="30" fill="url(#alBody)" stroke="url(#alArmor)" strokeWidth="6" />
            {/* Chest Screen */}
            <rect x="150" y="240" width="100" height="50" rx="8" fill="url(#alScreen)" stroke="#00e5ff" strokeWidth="2" filter="url(#alNeon)" />
            <text x="200" y="271" dominantBaseline="middle" textAnchor="middle" fill="#00e5ff" fontSize="24" fontWeight="900" filter="url(#alNeon)" className="mascot-key-text" letterSpacing="4">KEY</text>
            <circle cx="200" cy="330" r="15" fill="url(#alBody)" stroke="#00e5ff" strokeWidth="3" filter="url(#alNeon)" />
            <circle cx="200" cy="330" r="6" fill="#00e5ff" filter="url(#alNeon)" />
            {/* Arms */}
            <path d="M 120 250 Q 80 280 90 320" fill="none" stroke="url(#alBody)" strokeWidth="15" strokeLinecap="round" />
            <path d="M 280 250 Q 320 280 310 320" fill="none" stroke="url(#alBody)" strokeWidth="15" strokeLinecap="round" />
            <circle cx="90" cy="320" r="12" fill="url(#alArmor)" />
            <circle cx="310" cy="320" r="12" fill="url(#alArmor)" />
            {/* Head */}
            <rect x="140" y="90" width="120" height="100" rx="40" fill="url(#alBody)" stroke="url(#alArmor)" strokeWidth="6" />
            <rect x="155" y="115" width="90" height="45" rx="20" fill="url(#alScreen)" stroke="#00e5ff" strokeWidth="2" filter="url(#alNeon)" />
            {/* Eyes */}
            <path d="M 170 140 Q 180 130 190 140" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" filter="url(#alNeon)" />
            <path d="M 210 140 Q 220 130 230 140" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" filter="url(#alNeon)" />
            {/* Antennas */}
            <line x1="160" y1="90" x2="140" y2="40" stroke="url(#alBody)" strokeWidth="6" strokeLinecap="round" />
            <line x1="240" y1="90" x2="260" y2="40" stroke="url(#alBody)" strokeWidth="6" strokeLinecap="round" />
            <circle cx="140" cy="40" r="8" fill="#00e5ff" filter="url(#alNeon)" className="mascot-blink-1" />
            <circle cx="260" cy="40" r="8" fill="#7c4dff" filter="url(#alNeon)" className="mascot-blink-2" />
        </g>
    </svg>
)
export const MiniMascotAlien = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="25" y="25" width="50" height="50" rx="15" fill="#f8fafc" stroke="#8b5cf6" strokeWidth="4" />
        <rect x="35" y="40" width="30" height="15" rx="5" fill="#020617" />
        <circle cx="42" cy="47" r="3" fill="#00e5ff" />
        <circle cx="58" cy="47" r="3" fill="#00e5ff" />
        <line x1="35" y1="25" x2="25" y2="10" stroke="#8b5cf6" strokeWidth="3" />
        <line x1="65" y1="25" x2="75" y2="10" stroke="#8b5cf6" strokeWidth="3" />
        <circle cx="25" cy="10" r="4" fill="#00e5ff" />
        <circle cx="75" cy="10" r="4" fill="#00e5ff" />
    </svg>
)

/* =====================================================================
   3. TITAN ROBO (العملاق الآلي)
   ===================================================================== */
export const MascotNinja = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="titGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" /><stop offset="100%" stopColor="#b91c1c" stopOpacity="0" /></radialGradient>
            <linearGradient id="titMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f1f5f9" /><stop offset="100%" stopColor="#94a3b8" /></linearGradient>
            <linearGradient id="titArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ea580c" /><stop offset="100%" stopColor="#b91c1c" /></linearGradient>
            <linearGradient id="titScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1c1917" /><stop offset="100%" stopColor="#000000" /></linearGradient>
            <filter id="titNeon"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="180" fill="url(#titGlow)" />
        <g className="titan-float">
            {/* Massive Base/Legs */}
            <path d="M 120 380 L 280 380 L 250 440 L 150 440 Z" fill="url(#titArmor)" stroke="#fff" strokeWidth="4" />
            <rect x="140" y="440" width="120" height="15" rx="5" fill="#f8fafc" />
            {/* Arms - Big Shoulders */}
            <circle cx="90" cy="180" r="40" fill="url(#titArmor)" stroke="url(#titMetal)" strokeWidth="6" />
            <circle cx="310" cy="180" r="40" fill="url(#titArmor)" stroke="url(#titMetal)" strokeWidth="6" />
            <rect x="50" y="200" width="40" height="120" rx="20" fill="url(#titMetal)" transform="rotate(15 70 200)" />
            <rect x="310" y="200" width="40" height="120" rx="20" fill="url(#titMetal)" transform="rotate(-15 330 200)" />
            {/* Body */}
            <path d="M 110 160 L 290 160 L 260 360 L 140 360 Z" fill="url(#titMetal)" stroke="url(#titArmor)" strokeWidth="8" strokeLinejoin="round" />
            <rect x="150" y="210" width="100" height="60" rx="10" fill="url(#titScreen)" stroke="#ef4444" strokeWidth="3" filter="url(#titNeon)" />
            <text x="200" y="250" dominantBaseline="middle" textAnchor="middle" fill="#ef4444" fontSize="30" fontWeight="900" filter="url(#titNeon)" letterSpacing="5">KEY</text>
            <rect x="140" y="300" width="120" height="12" rx="6" fill="url(#titArmor)" />
            <rect x="150" y="330" width="100" height="12" rx="6" fill="url(#titArmor)" />
            {/* Head */}
            <path d="M 130 90 L 270 90 L 250 150 L 150 150 Z" fill="url(#titMetal)" stroke="url(#titArmor)" strokeWidth="6" />
            <rect x="155" y="105" width="90" height="30" rx="10" fill="url(#titScreen)" stroke="#ef4444" strokeWidth="2" filter="url(#titNeon)" />
            <line x1="170" y1="120" x2="230" y2="120" stroke="#fcd34d" strokeWidth="6" strokeLinecap="round" filter="url(#titNeon)" className="titan-visor" />
            <rect x="135" y="40" width="10" height="50" rx="5" fill="url(#titMetal)" />
            <rect x="255" y="40" width="10" height="50" rx="5" fill="url(#titMetal)" />
        </g>
    </svg>
)
export const MiniMascotNinja = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <path d="M 20 20 L 80 20 L 70 80 L 30 80 Z" fill="#f1f5f9" stroke="#ea580c" strokeWidth="4" strokeLinejoin="round" />
        <rect x="30" y="35" width="40" height="20" rx="5" fill="#1c1917" />
        <line x1="38" y1="45" x2="62" y2="45" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
        <rect x="25" y="5" width="8" height="15" fill="#f1f5f9" />
        <rect x="67" y="5" width="8" height="15" fill="#f1f5f9" />
    </svg>
)

/* =====================================================================
   4. SPEEDSTER ROBO (الآلي الخاطف)
   ===================================================================== */
export const MascotSentinel = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="spGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#facc15" stopOpacity="0.25" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0" /></radialGradient>
            <linearGradient id="spMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fdfde0" /><stop offset="100%" stopColor="#cfcfbc" /></linearGradient>
            <linearGradient id="spArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#b45309" /></linearGradient>
            <linearGradient id="spScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1e1e1e" /><stop offset="100%" stopColor="#0a0a0a" /></linearGradient>
            <filter id="spNeon"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="160" fill="url(#spGlow)" />
        <g className="speed-float">
            <path d="M 160 180 L 240 180 L 210 330 L 190 330 Z" fill="url(#spMetal)" stroke="url(#spArmor)" strokeWidth="4" strokeLinejoin="round" />
            <rect x="175" y="210" width="50" height="70" rx="10" fill="url(#spScreen)" stroke="#facc15" strokeWidth="2" filter="url(#spNeon)" />
            <text x="200" y="245" dominantBaseline="middle" textAnchor="middle" fill="#facc15" fontSize="20" fontWeight="900" transform="rotate(-90 200 245)" filter="url(#spNeon)" className="mascot-key-text" letterSpacing="4">KEY</text>
            <circle cx="200" cy="350" r="25" fill="url(#spScreen)" stroke="url(#spArmor)" strokeWidth="4" />
            <circle cx="200" cy="350" r="10" fill="#facc15" filter="url(#spNeon)" className="speed-thrust" />
            <path d="M 150 190 Q 110 220 130 280" fill="none" stroke="url(#spMetal)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 250 190 Q 290 220 270 280" fill="none" stroke="url(#spMetal)" strokeWidth="12" strokeLinecap="round" />
            <circle cx="130" cy="280" r="10" fill="url(#spArmor)" />
            <circle cx="270" cy="280" r="10" fill="url(#spArmor)" />
            <path d="M 150 140 Q 200 60 250 140 Z" fill="url(#spMetal)" stroke="url(#spArmor)" strokeWidth="4" strokeLinejoin="round" />
            <path d="M 170 120 Q 200 90 230 120 Z" fill="url(#spScreen)" />
            <polygon points="190,105 200,115 190,115" fill="#facc15" filter="url(#spNeon)" />
            <polygon points="210,105 200,115 210,115" fill="#facc15" filter="url(#spNeon)" />
            <line x1="80" y1="200" x2="110" y2="200" stroke="#facc15" strokeWidth="3" opacity="0.4" strokeLinecap="round" />
            <line x1="70" y1="240" x2="120" y2="240" stroke="#facc15" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
        </g>
    </svg>
)
export const MiniMascotSentinel = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <path d="M 30 70 Q 50 10 70 70 Z" fill="#cfcfbc" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 40 50 Q 50 30 60 50 Z" fill="#1e1e1e" />
        <circle cx="50" cy="45" r="4" fill="#facc15" />
        <rect x="45" y="75" width="10" height="10" rx="5" fill="#1e1e1e" />
    </svg>
)

/* =====================================================================
   5. ORACLE ROBO (الآلي الحكيم)
   ===================================================================== */
export const MascotMage = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="mgGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" /><stop offset="100%" stopColor="#7e22ce" stopOpacity="0" /></radialGradient>
            <linearGradient id="mgMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#f3f4f6" /></linearGradient>
            <linearGradient id="mgArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#a855f7" /><stop offset="100%" stopColor="#6b21a8" /></linearGradient>
            <linearGradient id="mgScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1e1b4b" /><stop offset="100%" stopColor="#0f172a" /></linearGradient>
            <filter id="mgNeon"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="170" fill="url(#mgGlow)" />
        <g className="oracle-float">
            <ellipse cx="200" cy="380" rx="90" ry="15" fill="none" stroke="#c084fc" strokeWidth="3" filter="url(#mgNeon)" opacity="0.6"/>
            <ellipse cx="200" cy="410" rx="60" ry="10" fill="none" stroke="#e879f9" strokeWidth="2" filter="url(#mgNeon)" opacity="0.4"/>
            <path d="M 160 210 L 240 210 Q 260 350 200 380 Q 140 350 160 210 Z" fill="url(#mgMetal)" stroke="url(#mgArmor)" strokeWidth="5" />
            <rect x="165" y="240" width="70" height="40" rx="10" fill="url(#mgScreen)" stroke="#c084fc" strokeWidth="2" filter="url(#mgNeon)" />
            <text x="200" y="262" dominantBaseline="middle" textAnchor="middle" fill="#c084fc" fontSize="18" fontWeight="900" filter="url(#mgNeon)" className="mascot-key-text" letterSpacing="3">KEY</text>
            <path d="M 140 200 Q 160 170 180 200 Z" fill="url(#mgArmor)" />
            <path d="M 260 200 Q 240 170 220 200 Z" fill="url(#mgArmor)" />
            <circle cx="120" cy="270" r="16" fill="url(#mgMetal)" stroke="url(#mgArmor)" strokeWidth="4" />
            <circle cx="120" cy="270" r="5" fill="#e879f9" filter="url(#mgNeon)" />
            <circle cx="280" cy="270" r="16" fill="url(#mgMetal)" stroke="url(#mgArmor)" strokeWidth="4" />
            <circle cx="280" cy="270" r="5" fill="#e879f9" filter="url(#mgNeon)" />
            <path d="M 145 220 Q 130 240 120 250" fill="none" stroke="#e879f9" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
            <path d="M 255 220 Q 270 240 280 250" fill="none" stroke="#e879f9" strokeWidth="2" strokeDasharray="5 5" opacity="0.5" />
            <rect x="140" y="80" width="120" height="90" rx="45" fill="url(#mgMetal)" stroke="url(#mgArmor)" strokeWidth="6" />
            <rect x="155" y="105" width="90" height="40" rx="20" fill="url(#mgScreen)" stroke="#c084fc" strokeWidth="2" filter="url(#mgNeon)" />
            <path d="M 175 125 Q 200 110 225 125 Q 200 140 175 125 Z" fill="none" stroke="#e879f9" strokeWidth="2" filter="url(#mgNeon)" />
            <circle cx="200" cy="125" r="6" fill="#f0abfc" filter="url(#mgNeon)" className="oracle-head-glow" />
            <path d="M 170 80 L 180 40 L 200 60 L 220 40 L 230 80 Z" fill="url(#mgArmor)" />
            <circle cx="180" cy="40" r="4" fill="#f0abfc" filter="url(#mgNeon)" />
            <circle cx="200" cy="60" r="4" fill="#f0abfc" filter="url(#mgNeon)" />
            <circle cx="220" cy="40" r="4" fill="#f0abfc" filter="url(#mgNeon)" />
        </g>
    </svg>
)
export const MiniMascotMage = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="25" y="30" width="50" height="50" rx="25" fill="#f3f4f6" stroke="#a855f7" strokeWidth="4" />
        <rect x="35" y="45" width="30" height="16" rx="8" fill="#1e1b4b" />
        <circle cx="50" cy="53" r="3" fill="#e879f9" />
        <path d="M 35 30 L 40 15 L 50 25 L 60 15 L 65 30 Z" fill="#a855f7" />
    </svg>
)

/* =====================================================================
   6. ORB BOT (آلي المعرفة)
   ===================================================================== */
export const MascotOrb = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="orbGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" /><stop offset="100%" stopColor="#082f49" stopOpacity="0" /></radialGradient>
            <linearGradient id="orbMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#cbd5e1" /></linearGradient>
            <linearGradient id="orbDark" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#334155" /><stop offset="100%" stopColor="#0f172a" /></linearGradient>
            <filter id="orbNeon"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="160" fill="url(#orbGlow)" />
        <g className="mascot-float-parent">
            <rect x="150" y="240" width="100" height="90" rx="30" fill="url(#orbMetal)" stroke="url(#orbDark)" strokeWidth="4" />
            <circle cx="200" cy="280" r="22" fill="#0f172a" stroke="#0ea5e9" strokeWidth="3" filter="url(#orbNeon)" />
            <text x="200" y="282" dominantBaseline="middle" textAnchor="middle" fill="#0ea5e9" fontSize="12" fontWeight="900" filter="url(#orbNeon)" className="mascot-key-text" letterSpacing="2">KEY</text>
            <path d="M 130 260 Q 90 280 120 330" fill="none" stroke="url(#orbMetal)" strokeWidth="16" strokeLinecap="round" />
            <path d="M 270 260 Q 310 280 260 330" fill="none" stroke="url(#orbMetal)" strokeWidth="16" strokeLinecap="round" />
            <circle cx="260" cy="300" r="25" fill="none" stroke="#38bdf8" strokeWidth="2" filter="url(#orbNeon)" />
            <circle cx="260" cy="300" r="35" fill="none" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="5 10" filter="url(#orbNeon)" className="oracle-ring-1" />
            <circle cx="260" cy="300" r="12" fill="#0ea5e9" filter="url(#orbNeon)" className="mascot-blink-1" />
            <rect x="110" y="80" width="180" height="140" rx="65" fill="url(#orbMetal)" stroke="url(#orbDark)" strokeWidth="5" />
            <rect x="130" y="100" width="140" height="80" rx="35" fill="url(#orbDark)" stroke="#0ea5e9" strokeWidth="2" filter="url(#orbNeon)" />
            <circle cx="165" cy="140" r="15" fill="#38bdf8" filter="url(#orbNeon)" />
            <circle cx="165" cy="140" r="5" fill="#ffffff" />
            <circle cx="235" cy="140" r="15" fill="#38bdf8" filter="url(#orbNeon)" />
            <circle cx="235" cy="140" r="5" fill="#ffffff" />
            <path d="M 190 160 Q 200 170 210 160" fill="none" stroke="#38bdf8" strokeWidth="4" strokeLinecap="round" filter="url(#orbNeon)" />
            <line x1="200" y1="80" x2="200" y2="40" stroke="url(#orbDark)" strokeWidth="4" />
            <circle cx="200" cy="40" r="8" fill="#38bdf8" filter="url(#orbNeon)" className="mascot-blink-2" />
        </g>
    </svg>
)
export const MiniMascotOrb = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="20" y="20" width="60" height="46" rx="20" fill="#f8fafc" stroke="#334155" strokeWidth="3" />
        <rect x="28" y="30" width="44" height="24" rx="10" fill="#0f172a" />
        <circle cx="38" cy="42" r="5" fill="#38bdf8" />
        <circle cx="62" cy="42" r="5" fill="#38bdf8" />
        <rect x="35" y="70" width="30" height="25" rx="10" fill="#cbd5e1" />
        <circle cx="50" cy="82" r="6" fill="#0ea5e9" />
    </svg>
)

/* =====================================================================
   7. CYBER HUMANOID (الآلي السيبراني)
   ===================================================================== */
export const MascotCyber = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="cyGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" /><stop offset="100%" stopColor="#1e3a8a" stopOpacity="0" /></radialGradient>
            <linearGradient id="cyShell" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e2e8f0" /></linearGradient>
            <linearGradient id="cyMech" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#475569" /><stop offset="100%" stopColor="#1e293b" /></linearGradient>
            <filter id="cyNeon"><feGaussianBlur stdDeviation="6" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="170" fill="url(#cyGlow)" />
        <g className="titan-float">
            <path d="M 120 220 Q 200 160 280 220 C 330 350, 260 420, 200 450 C 140 420, 70 350, 120 220 Z" fill="url(#cyShell)" stroke="url(#cyMech)" strokeWidth="4" />
            <path d="M 160 250 L 240 250 L 220 380 L 180 380 Z" fill="url(#cyMech)" opacity="0.1" />
            <circle cx="200" cy="270" r="40" fill="url(#cyMech)" stroke="#3b82f6" strokeWidth="5" filter="url(#cyNeon)" />
            <circle cx="200" cy="270" r="30" fill="#1e3a8a" />
            <text x="200" y="278" dominantBaseline="middle" textAnchor="middle" fill="#60a5fa" fontSize="24" fontWeight="900" filter="url(#cyNeon)" className="mascot-key-text" letterSpacing="3">KEY</text>
            <rect x="180" y="140" width="40" height="40" fill="url(#cyMech)" />
            <line x1="185" y1="150" x2="215" y2="150" stroke="#94a3b8" strokeWidth="2" />
            <line x1="185" y1="160" x2="215" y2="160" stroke="#94a3b8" strokeWidth="2" />
            <line x1="185" y1="170" x2="215" y2="170" stroke="#94a3b8" strokeWidth="2" />
            <path d="M 150 70 Q 200 -10 250 70 Q 260 140 200 160 Q 140 140 150 70 Z" fill="url(#cyShell)" stroke="url(#cyMech)" strokeWidth="4" />
            <path d="M 170 90 Q 180 80 190 90" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" filter="url(#cyNeon)" className="mascot-blink-1" />
            <path d="M 210 90 Q 220 80 230 90" fill="none" stroke="#60a5fa" strokeWidth="6" strokeLinecap="round" filter="url(#cyNeon)" className="mascot-blink-2" />
            <path d="M 190 125 Q 200 130 210 125" fill="none" stroke="url(#cyMech)" strokeWidth="3" strokeLinecap="round" />
            <circle cx="145" cy="100" r="18" fill="url(#cyMech)" stroke="#60a5fa" strokeWidth="3" filter="url(#cyNeon)" />
            <circle cx="255" cy="100" r="18" fill="url(#cyMech)" stroke="#60a5fa" strokeWidth="3" filter="url(#cyNeon)" />
        </g>
    </svg>
)
export const MiniMascotCyber = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <path d="M 30 20 Q 50 0 70 20 Q 75 40 50 45 Q 25 40 30 20 Z" fill="#e2e8f0" stroke="#475569" strokeWidth="2" />
        <line x1="38" y1="28" x2="44" y2="28" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        <line x1="56" y1="28" x2="62" y2="28" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" />
        <path d="M 30 55 Q 50 45 70 55 C 80 90, 60 100, 50 100 C 40 100, 20 90, 30 55 Z" fill="#e2e8f0" />
        <circle cx="50" cy="70" r="10" fill="#1e293b" stroke="#3b82f6" strokeWidth="2" />
    </svg>
)

/* =====================================================================
   8. SMILE BOT (الآلي اللطيف)
   ===================================================================== */
export const MascotSmile = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="smGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" /><stop offset="100%" stopColor="#164e63" stopOpacity="0" /></radialGradient>
            <linearGradient id="smBody" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e5e7eb" /></linearGradient>
            <linearGradient id="smScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
            <filter id="smNeon"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="160" fill="url(#smGlow)" />
        <g className="mascot-float-parent">
            <path d="M 120 250 Q 120 180 200 180 Q 280 180 280 250 Q 280 400 200 400 Q 120 400 120 250 Z" fill="url(#smBody)" stroke="#d1d5db" strokeWidth="5" />
            <path d="M 130 330 Q 200 360 270 330" fill="none" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
            <text x="200" y="310" dominantBaseline="middle" textAnchor="middle" fill="#9ca3af" fontSize="26" fontWeight="900" letterSpacing="4">KEY</text>
            <path d="M 90 280 Q 70 330 90 380 Q 110 330 90 280 Z" fill="url(#smBody)" stroke="#d1d5db" strokeWidth="3" />
            <path d="M 310 280 Q 330 330 310 380 Q 290 330 310 280 Z" fill="url(#smBody)" stroke="#d1d5db" strokeWidth="3" />
            <rect x="100" y="50" width="200" height="120" rx="60" fill="url(#smBody)" stroke="#d1d5db" strokeWidth="5" />
            <rect x="120" y="70" width="160" height="80" rx="40" fill="url(#smScreen)" />
            <path d="M 150 90 Q 165 80 170 100" fill="none" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" filter="url(#smNeon)" />
            <path d="M 230 100 Q 235 80 250 90" fill="none" stroke="#22d3ee" strokeWidth="6" strokeLinecap="round" filter="url(#smNeon)" />
            <path d="M 180 120 Q 200 140 220 120 Z" fill="#22d3ee" filter="url(#smNeon)" />
            <rect x="80" y="90" width="25" height="40" rx="10" fill="url(#smBody)" />
            <rect x="295" y="90" width="25" height="40" rx="10" fill="url(#smBody)" />
        </g>
    </svg>
)
export const MiniMascotSmile = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="20" y="15" width="60" height="40" rx="20" fill="#ffffff" stroke="#e5e7eb" strokeWidth="3" />
        <rect x="25" y="22" width="50" height="26" rx="13" fill="#0f172a" />
        <path d="M 35 30 Q 40 25 42 32" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
        <path d="M 58 32 Q 60 25 65 30" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
        <path d="M 46 38 Q 50 42 54 38 Z" fill="#22d3ee" />
        <path d="M 30 60 Q 30 50 50 50 Q 70 50 70 60 Q 70 90 50 90 Q 30 90 30 60 Z" fill="#ffffff" />
    </svg>
)

/* =====================================================================
   9. BLUE HOLOGRAPHIC (الآلي الأزرق)
   ===================================================================== */
export const MascotBlue = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="blGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" /><stop offset="100%" stopColor="#082f49" stopOpacity="0" /></radialGradient>
            <linearGradient id="blShell" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#38bdf8" /><stop offset="100%" stopColor="#0284c7" /></linearGradient>
            <linearGradient id="blScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
            <filter id="blNeon"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="170" fill="url(#blGlow)" />
        <g className="speed-float">
            <path d="M 130 220 Q 200 180 270 220 Q 290 350 200 420 Q 110 350 130 220 Z" fill="url(#blShell)" stroke="#bae6fd" strokeWidth="3" />
            <path d="M 150 260 L 250 260 Q 200 360 150 260 Z" fill="#0ea5e9" opacity="0.4" />
            <text x="200" y="320" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="22" fontWeight="900" letterSpacing="5" opacity="0.8">KEY</text>
            <path d="M 100 240 Q 50 280 100 350" fill="none" stroke="url(#blShell)" strokeWidth="25" strokeLinecap="round" />
            <path d="M 300 240 Q 350 280 320 320 L 280 300" fill="none" stroke="url(#blShell)" strokeWidth="25" strokeLinecap="round" />
            <ellipse cx="270" cy="280" rx="40" ry="10" fill="none" stroke="#38bdf8" strokeWidth="2" filter="url(#blNeon)" />
            <ellipse cx="270" cy="265" rx="30" ry="8" fill="none" stroke="#7dd3fc" strokeWidth="1" strokeDasharray="5 5" filter="url(#blNeon)" />
            <circle cx="270" cy="250" r="10" fill="#e0f2fe" filter="url(#blNeon)" opacity="0.8" />
            <path d="M 250 280 L 270 250 L 290 280" fill="none" stroke="#38bdf8" strokeWidth="1" filter="url(#blNeon)" opacity="0.6" />
            <rect x="110" y="60" width="180" height="150" rx="75" fill="url(#blShell)" stroke="#bae6fd" strokeWidth="4" />
            <rect x="125" y="80" width="150" height="110" rx="40" fill="url(#blScreen)" stroke="#ffffff" strokeWidth="2" />
            <rect x="150" y="115" width="25" height="40" rx="10" fill="#f0f9ff" filter="url(#blNeon)" className="mascot-blink-1" />
            <rect x="225" y="115" width="25" height="40" rx="10" fill="#f0f9ff" filter="url(#blNeon)" className="mascot-blink-2" />
            <line x1="140" y1="125" x2="175" y2="125" stroke="#0284c7" strokeWidth="2" />
            <line x1="140" y1="135" x2="175" y2="135" stroke="#0284c7" strokeWidth="2" />
            <line x1="140" y1="145" x2="175" y2="145" stroke="#0284c7" strokeWidth="2" />
            <line x1="225" y1="125" x2="260" y2="125" stroke="#0284c7" strokeWidth="2" />
            <line x1="225" y1="135" x2="260" y2="135" stroke="#0284c7" strokeWidth="2" />
            <line x1="225" y1="145" x2="260" y2="145" stroke="#0284c7" strokeWidth="2" />
            <circle cx="95" cy="135" r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" filter="url(#blNeon)" />
            <circle cx="305" cy="135" r="12" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" filter="url(#blNeon)" />
        </g>
    </svg>
)
export const MiniMascotBlue = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="20" y="20" width="60" height="50" rx="25" fill="#0284c7" stroke="#bae6fd" strokeWidth="2" />
        <rect x="25" y="30" width="50" height="35" rx="15" fill="#0f172a" />
        <rect x="35" y="40" width="8" height="15" rx="3" fill="#f0f9ff" />
        <rect x="57" y="40" width="8" height="15" rx="3" fill="#f0f9ff" />
        <path d="M 30 75 Q 50 70 70 75 Q 80 95 50 95 Q 20 95 30 75 Z" fill="#0284c7" />
    </svg>
)

/* =====================================================================
   10. VISOR / STEAMPUNK BOT (آلي النظارة)
   ===================================================================== */
export const MascotVisor = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="vsGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#14b8a6" stopOpacity="0.2" /><stop offset="100%" stopColor="#042f2e" stopOpacity="0" /></radialGradient>
            <linearGradient id="vsWhite" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#d4d4d8" /></linearGradient>
            <linearGradient id="vsBrass" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#fcd34d" /><stop offset="50%" stopColor="#b45309" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient>
            <linearGradient id="vsScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#0f172a" /><stop offset="100%" stopColor="#020617" /></linearGradient>
            <filter id="vsNeon"><feGaussianBlur stdDeviation="5" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="170" fill="url(#vsGlow)" />
        <g className="titan-float">
            <path d="M 140 380 L 260 380 L 230 450 L 170 450 Z" fill="url(#vsWhite)" stroke="url(#vsBrass)" strokeWidth="4" />
            <rect x="170" y="400" width="60" height="40" fill="url(#vsScreen)" stroke="url(#vsBrass)" strokeWidth="2" />
            <ellipse cx="200" cy="460" rx="40" ry="10" fill="#14b8a6" filter="url(#vsNeon)" opacity="0.8" />
            <circle cx="100" cy="220" r="25" fill="none" stroke="url(#vsBrass)" strokeWidth="10" strokeDasharray="10 5" />
            <circle cx="100" cy="220" r="15" fill="url(#vsScreen)" />
            <circle cx="300" cy="220" r="25" fill="none" stroke="url(#vsBrass)" strokeWidth="10" strokeDasharray="10 5" />
            <circle cx="300" cy="220" r="15" fill="url(#vsScreen)" />
            <path d="M 90 240 L 70 300 Q 60 330 90 320" fill="none" stroke="url(#vsWhite)" strokeWidth="15" strokeLinecap="round" />
            <path d="M 310 240 L 330 300 Q 340 330 310 320" fill="none" stroke="url(#vsWhite)" strokeWidth="15" strokeLinecap="round" />
            <g transform="translate(45, 270) rotate(-15)">
                <rect x="0" y="0" width="60" height="40" fill="rgba(20, 184, 166, 0.2)" stroke="#14b8a6" strokeWidth="2" filter="url(#vsNeon)" />
                <line x1="10" y1="10" x2="50" y2="10" stroke="#5eead4" strokeWidth="2" filter="url(#vsNeon)" />
                <line x1="10" y1="20" x2="30" y2="20" stroke="#5eead4" strokeWidth="2" filter="url(#vsNeon)" />
                <circle cx="40" cy="25" r="5" fill="#ccfbf1" filter="url(#vsNeon)" />
            </g>
            <rect x="130" y="200" width="140" height="150" rx="40" fill="url(#vsWhite)" stroke="url(#vsBrass)" strokeWidth="5" />
            <rect x="150" y="230" width="100" height="90" rx="20" fill="url(#vsScreen)" />
            <rect x="160" y="250" width="80" height="40" rx="10" fill="url(#vsBrass)" stroke="#ffffff" strokeWidth="2" />
            <text x="200" y="278" dominantBaseline="middle" textAnchor="middle" fill="#0f172a" fontSize="24" fontWeight="900" letterSpacing="2">KEY</text>
            <rect x="180" y="160" width="40" height="40" fill="url(#vsBrass)" />
            <line x1="180" y1="170" x2="220" y2="170" stroke="#fff" strokeWidth="2" opacity="0.5" />
            <line x1="180" y1="180" x2="220" y2="180" stroke="#fff" strokeWidth="2" opacity="0.5" />
            <rect x="120" y="60" width="160" height="110" rx="55" fill="url(#vsWhite)" stroke="url(#vsBrass)" strokeWidth="4" />
            <rect x="110" y="80" width="180" height="60" rx="10" fill="url(#vsScreen)" stroke="url(#vsBrass)" strokeWidth="6" />
            <circle cx="150" cy="110" r="20" fill="#ccfbf1" filter="url(#vsNeon)" className="mascot-blink-1" opacity="0.9" />
            <circle cx="250" cy="110" r="20" fill="#ccfbf1" filter="url(#vsNeon)" className="mascot-blink-2" opacity="0.9" />
            <path d="M 240 60 Q 250 30 270 40" fill="none" stroke="url(#vsBrass)" strokeWidth="4" strokeLinecap="round" />
            <circle cx="270" cy="40" r="6" fill="#14b8a6" filter="url(#vsNeon)" />
        </g>
    </svg>
)
export const MiniMascotVisor = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="25" y="15" width="50" height="40" rx="20" fill="#ffffff" stroke="#f59e0b" strokeWidth="3" />
        <rect x="20" y="25" width="60" height="20" rx="4" fill="#0f172a" stroke="#fcd34d" strokeWidth="2" />
        <circle cx="35" cy="35" r="5" fill="#ccfbf1" />
        <circle cx="65" cy="35" r="5" fill="#ccfbf1" />
        <rect x="35" y="60" width="30" height="25" rx="8" fill="#ffffff" stroke="#f59e0b" strokeWidth="2" />
        <rect x="40" y="70" width="20" height="8" rx="2" fill="#fcd34d" />
    </svg>
)


/* =====================================================================
   MASTER KEY AI (الذكاء المدمج المتحرك)
   ===================================================================== */
export const MascotKeyAI = () => (
    <svg viewBox="0 0 450 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="keyGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#4c1d95" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="bodyMesh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="armorMesh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#312e81" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#020617" />
                <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
            <filter id="neonPulse">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>
        
        <style>
            {`
                .mk-hover { animation: mkHover 4s ease-in-out infinite alternate; }
                .mk-hand-write { animation: mkWrite 2.5s ease-in-out infinite; transform-origin: 300px 300px; }
                .mk-mouse-click { animation: mkClick 3s ease-in-out infinite; transform-origin: 100px 330px; }
                .mk-holo { animation: mkHoloFloat 3s ease-in-out infinite alternate; }
                .mk-eye-blink { animation: mkBlink 4s infinite; transform-origin: center 150px; }

                @keyframes mkHover { 0% { transform: translateY(0); } 100% { transform: translateY(-15px); } }
                @keyframes mkWrite { 
                    0%, 100% { transform: translate(0, 0) rotate(0); }
                    25% { transform: translate(-10px, -5px) rotate(-5deg); }
                    50% { transform: translate(10px, -15px) rotate(5deg); }
                    75% { transform: translate(-5px, -10px) rotate(-2deg); }
                }
                @keyframes mkClick {
                    0%, 80%, 100% { transform: scale(1) translateY(0); }
                    90% { transform: scale(0.95) translateY(5px); } /* Press down */
                }
                @keyframes mkHoloFloat { 0% { transform: translateY(5px) scale(0.98); opacity: 0.7; } 100% { transform: translateY(-5px) scale(1.02); opacity: 1; } }
                @keyframes mkBlink { 0%, 95%, 98%, 100% { transform: scaleY(1); opacity: 1; } 96%, 99% { transform: scaleY(0.1); opacity: 0.8; } }
            `}
        </style>

        <circle cx="225" cy="250" r="180" fill="url(#keyGlow)" />
        <g className="mk-hover">
            {/* Background Hologram Screens */}
            <g className="mk-holo">
                <rect x="50" y="80" width="100" height="70" rx="10" fill="rgba(99, 102, 241, 0.15)" stroke="#6366f1" strokeWidth="2" filter="url(#neonPulse)" transform="rotate(-15 100 115)" />
                <line x1="60" y1="100" x2="130" y2="100" stroke="#8b5cf6" strokeWidth="3" transform="rotate(-15 100 115)" />
                <line x1="60" y1="120" x2="110" y2="120" stroke="#8b5cf6" strokeWidth="3" transform="rotate(-15 100 115)" />
                
                <rect x="290" y="60" width="120" height="90" rx="10" fill="rgba(236, 72, 153, 0.15)" stroke="#ec4899" strokeWidth="2" filter="url(#neonPulse)" transform="rotate(10 350 105)" />
                <circle cx="350" cy="105" r="20" fill="none" stroke="#f472b6" strokeWidth="4" strokeDasharray="10 5" transform="rotate(10 350 105)" />
            </g>

            {/* Giant Interactive Mouse */}
            <g className="mk-mouse-click">
                <rect x="65" y="300" width="70" height="110" rx="35" fill="url(#bodyMesh)" stroke="#cbd5e1" strokeWidth="4" />
                <path d="M 65 350 Q 100 370 135 350" fill="none" stroke="#cbd5e1" strokeWidth="3" />
                <line x1="100" y1="300" x2="100" y2="360" stroke="#cbd5e1" strokeWidth="3" />
                <circle cx="100" cy="335" r="8" fill="#8b5cf6" filter="url(#neonPulse)" />
                {/* Mouse click pulse effect rings */}
                <ellipse cx="100" cy="420" rx="40" ry="10" fill="none" stroke="#c084fc" strokeWidth="3" filter="url(#neonPulse)" opacity="0.5" />
            </g>

            {/* Main Robot Body */}
            <path d="M 150 210 L 290 210 Q 320 330 250 380 L 190 380 Q 120 330 150 210 Z" fill="url(#bodyMesh)" stroke="url(#armorMesh)" strokeWidth="6" />
            <rect x="175" y="240" width="90" height="50" rx="15" fill="url(#screenGrad)" stroke="#8b5cf6" strokeWidth="3" filter="url(#neonPulse)" />
            <text x="220" y="271" dominantBaseline="middle" textAnchor="middle" fill="#c084fc" fontSize="22" fontWeight="900" filter="url(#neonPulse)" letterSpacing="3">KEY AI</text>
            <path d="M 155 240 Q 130 280 160 350" fill="none" stroke="url(#armorMesh)" strokeWidth="15" strokeLinecap="round" />
            
            {/* Writing Hand */}
            <g className="mk-hand-write">
                <path d="M 285 240 Q 320 280 290 340" fill="none" stroke="url(#armorMesh)" strokeWidth="15" strokeLinecap="round" />
                <circle cx="290" cy="340" r="12" fill="url(#bodyMesh)" stroke="url(#armorMesh)" strokeWidth="3" />
                {/* Digital Stylus */}
                <rect x="270" y="325" width="60" height="8" rx="4" fill="#1e293b" transform="rotate(-45 290 340)" />
                <circle cx="250" cy="305" r="5" fill="#ec4899" filter="url(#neonPulse)" />
                <path d="M 250 305 Q 230 280 260 260" fill="none" stroke="#ec4899" strokeWidth="2" strokeDasharray="4 4" filter="url(#neonPulse)" />
            </g>

            {/* Glowing Pad */}
            <rect x="230" y="390" width="100" height="20" rx="10" fill="rgba(8, 145, 178, 0.2)" stroke="#06b6d4" strokeWidth="2" transform="rotate(-15 280 400)" filter="url(#neonPulse)" />

            {/* Robot Head */}
            <rect x="160" y="90" width="120" height="100" rx="40" fill="url(#bodyMesh)" stroke="url(#armorMesh)" strokeWidth="6" />
            {/* Graduation Cap (Because Key Academy!) */}
            <path d="M 140 90 L 220 50 L 300 90 L 220 110 Z" fill="#1e1b4b" stroke="#4c1d95" strokeWidth="3" />
            <line x1="290" y1="95" x2="290" y2="130" stroke="#fcd34d" strokeWidth="3" />
            <circle cx="290" cy="130" r="5" fill="#fbbf24" />

            <rect x="175" y="115" width="90" height="45" rx="22" fill="url(#screenGrad)" stroke="#c084fc" strokeWidth="2" filter="url(#neonPulse)" />
            {/* Eyes */}
            <path d="M 195 140 Q 205 130 215 140" fill="none" stroke="#00e5ff" strokeWidth="5" strokeLinecap="round" filter="url(#neonPulse)" className="mk-eye-blink" />
            <path d="M 225 140 Q 235 130 245 140" fill="none" stroke="#00e5ff" strokeWidth="5" strokeLinecap="round" filter="url(#neonPulse)" className="mk-eye-blink" />
            {/* Cheeks */}
            <ellipse cx="185" cy="150" rx="6" ry="3" fill="#ec4899" filter="url(#neonPulse)" opacity="0.6" />
            <ellipse cx="255" cy="150" rx="6" ry="3" fill="#ec4899" filter="url(#neonPulse)" opacity="0.6" />
        </g>
    </svg>
)

export const MiniMascotKeyAI = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="25" y="30" width="50" height="50" rx="25" fill="#ffffff" stroke="#6366f1" strokeWidth="4" />
        <path d="M 15 35 L 50 15 L 85 35 L 50 45 Z" fill="#1e1b4b" />
        <rect x="35" y="45" width="30" height="16" rx="8" fill="#020617" />
        <circle cx="43" cy="53" r="3" fill="#00e5ff" />
        <circle cx="57" cy="53" r="3" fill="#00e5ff" />
        <ellipse cx="20" cy="80" rx="10" ry="6" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
        <circle cx="27" cy="80" r="2" fill="#8b5cf6" />
    </svg>
)

/* =====================================================================
   11. THE OFFICIAL KEY MASCOT (المرشد الأساسي - كي)
   ===================================================================== */
export const MascotTrueKey = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="tkGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="tkWhiteCore" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="50%" stopColor="#f0f9ff" />
                <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="tkDarkMesh" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#334155" />
            </linearGradient>
            <linearGradient id="tkLogoPulse" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="tkScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#020617" />
            </linearGradient>
            <filter id="tkBlueNeon">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <filter id="tkGoldGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
        </defs>

        <style>
            {`
                .tk-float-sync { animation: tkHover 5s ease-in-out infinite alternate; }
                .tk-arm-l { animation: tkWaveArmL 4s ease-in-out infinite alternate; transform-origin: 100px 280px; }
                .tk-arm-r { animation: tkWaveArmR 4s ease-in-out infinite alternate; transform-origin: 300px 280px; }
                .tk-tassel-swing { animation: tkTassel 3s ease-in-out infinite alternate; transform-origin: 200px 75px; }
                .tk-key-antenna { animation: tkAntennaPulse 2s ease-in-out infinite alternate; }
                
                .tk-face-happy { animation: tkExpHappy 12s infinite; }
                .tk-face-laugh { animation: tkExpLaugh 12s infinite; opacity: 0; }
                .tk-face-sad { animation: tkExpSad 12s infinite; opacity: 0; }

                @keyframes tkHover { 0% { transform: translateY(0px); } 100% { transform: translateY(-15px); } }
                @keyframes tkWaveArmL { 0% { transform: rotate(5deg); } 100% { transform: rotate(-5deg); } }
                @keyframes tkWaveArmR { 0% { transform: rotate(-5deg); } 100% { transform: rotate(5deg); } }
                @keyframes tkTassel { 0% { transform: rotate(5deg); } 100% { transform: rotate(-15deg); } }
                @keyframes tkAntennaPulse { 0% { filter: brightness(1); drop-shadow(0 0 4px #fbbf24); } 100% { filter: brightness(1.3); drop-shadow(0 0 12px #fbbf24); } }

                @keyframes tkExpHappy { 0%, 25%, 55%, 100% { opacity: 1; } 26%, 54% { opacity: 0; } }
                @keyframes tkExpLaugh { 0%, 25%, 40%, 100% { opacity: 0; } 26%, 39% { opacity: 1; } }
                @keyframes tkExpSad { 0%, 40%, 55%, 100% { opacity: 0; } 41%, 54% { opacity: 1; } }
            `}
        </style>

        <circle cx="200" cy="250" r="180" fill="url(#tkGlow)" />
        
        <g className="tk-float-sync">
            {/* Hover Engine Rings */}
            <path d="M 150 410 Q 200 450 250 410 Z" fill="url(#tkDarkMesh)" />
            <path d="M 140 440 Q 200 460 260 440" fill="none" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" filter="url(#tkBlueNeon)" opacity="0.6" />
            <path d="M 160 460 Q 200 470 240 460" fill="none" stroke="#7dd3fc" strokeWidth="5" strokeLinecap="round" filter="url(#tkBlueNeon)" opacity="0.3" />

            {/* Main Pearl Torso */}
            <path d="M 120 230 C 120 180, 280 180, 280 230 C 310 350, 260 420, 200 420 C 140 420, 90 350, 120 230 Z" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="4" />
            
            {/* Arms */}
            <g className="tk-arm-l">
                {/* Arm Ball Joint */}
                <circle cx="105" cy="245" r="22" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="105" cy="245" r="14" fill="url(#tkDarkMesh)" />
                {/* Segmented Arm Structure */}
                <path d="M 100 245 Q 60 290 70 360" fill="none" stroke="url(#tkDarkMesh)" strokeWidth="24" strokeLinecap="round" />
                <path d="M 100 245 Q 60 290 70 360" fill="none" stroke="#cbd5e1" strokeWidth="24" strokeDasharray="10 5" strokeLinecap="round" />
                {/* 3-Fingered Hand Shell */}
                <path d="M 50 355 Q 50 335 90 335 Q 90 355 90 355 Q 70 395 50 355 Z" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="3" />
                {/* Fingers */}
                <path d="M 60 375 L 55 395" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 70 380 L 68 400" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 80 375 L 82 390" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
            </g>

            <g className="tk-arm-r">
                <circle cx="295" cy="245" r="22" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="3" />
                <circle cx="295" cy="245" r="14" fill="url(#tkDarkMesh)" />
                <path d="M 300 245 Q 340 290 330 360" fill="none" stroke="url(#tkDarkMesh)" strokeWidth="24" strokeLinecap="round" />
                <path d="M 300 245 Q 340 290 330 360" fill="none" stroke="#cbd5e1" strokeWidth="24" strokeDasharray="10 5" strokeLinecap="round" />
                <path d="M 350 355 Q 350 335 310 335 Q 310 355 310 355 Q 330 395 350 355 Z" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="3" />
                <path d="M 340 375 L 345 395" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 330 380 L 332 400" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
                <path d="M 320 375 L 318 390" fill="none" stroke="url(#tkWhiteCore)" strokeWidth="10" strokeLinecap="round" />
            </g>

            {/* Chest Screen with text 'KEY' inline with surroundings */}
            <rect x="150" y="240" width="100" height="90" rx="15" fill="url(#tkScreenGrad)" stroke="#64748b" strokeWidth="5" />
            <rect x="150" y="240" width="100" height="90" rx="15" fill="none" stroke="url(#tkLogoPulse)" strokeWidth="2" filter="url(#tkBlueNeon)" opacity="0.8" />
            <text x="200" y="290" dominantBaseline="middle" textAnchor="middle" fill="#00e5ff" fontSize="34" fontWeight="900" filter="url(#tkBlueNeon)" letterSpacing="4">KEY</text>

            {/* Head Joint */}
            <path d="M 160 170 C 180 190, 220 190, 240 170 Z" fill="url(#tkDarkMesh)" />

            {/* Head Shell */}
            <rect x="110" y="100" width="180" height="120" rx="55" fill="url(#tkWhiteCore)" stroke="#94a3b8" strokeWidth="5" />
            
            {/* Head Side Gears */}
            <ellipse cx="108" cy="160" rx="8" ry="25" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
            <ellipse cx="292" cy="160" rx="8" ry="25" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />

            {/* Glowing Key Antenna */}
            <g className="tk-key-antenna" transform="translate(110, 105) rotate(-25)">
                <line x1="0" y1="0" x2="0" y2="-45" stroke="#fbbf24" strokeWidth="6" />
                {/* Key Handle */ }
                <rect x="-10" y="-65" width="20" height="20" rx="5" fill="#fbbf24" />
                <circle cx="0" cy="-55" r="4" fill="#334155" />
                {/* Teeth */}
                <rect x="0" y="-35" width="14" height="5" fill="#fbbf24" />
                <rect x="0" y="-22" width="14" height="5" fill="#fbbf24" />
            </g>

            {/* TV Screen Visor */}
            <rect x="125" y="115" width="150" height="90" rx="35" fill="url(#tkScreenGrad)" stroke="#38bdf8" strokeWidth="3" filter="url(#tkBlueNeon)" />

            {/* Expressions */}
            {/* Happy State (^^) */}
            <g className="tk-face-happy">
                <path d="M 160 155 Q 170 140 180 155" fill="none" stroke="#00e5ff" strokeWidth="9" strokeLinecap="round" filter="url(#tkBlueNeon)" />
                <path d="M 220 155 Q 230 140 240 155" fill="none" stroke="#00e5ff" strokeWidth="9" strokeLinecap="round" filter="url(#tkBlueNeon)" />
                {/* Tiny Smile */}
                <path d="M 190 180 Q 200 190 210 180" fill="none" stroke="#00e5ff" strokeWidth="5" strokeLinecap="round" filter="url(#tkBlueNeon)" />
            </g>

            {/* Laugh State (^^ with big open mouth) */}
            <g className="tk-face-laugh">
                <path d="M 160 150 Q 170 135 180 150" fill="none" stroke="#00e5ff" strokeWidth="9" strokeLinecap="round" filter="url(#tkBlueNeon)" />
                <path d="M 220 150 Q 230 135 240 150" fill="none" stroke="#00e5ff" strokeWidth="9" strokeLinecap="round" filter="url(#tkBlueNeon)" />
                {/* Wide Mouth */}
                <path d="M 185 170 C 185 195, 215 195, 215 170 Z" fill="#00e5ff" filter="url(#tkBlueNeon)" />
            </g>

            {/* Sad/Squint State (>.<) */}
            <g className="tk-face-sad">
                <path d="M 160 145 L 170 155 L 160 165" fill="none" stroke="#00e5ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#tkBlueNeon)" />
                <path d="M 240 145 L 230 155 L 240 165" fill="none" stroke="#00e5ff" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" filter="url(#tkBlueNeon)" />
                <path d="M 190 185 Q 200 175 210 185" fill="none" stroke="#00e5ff" strokeWidth="5" strokeLinecap="round" filter="url(#tkBlueNeon)" />
            </g>

            {/* Graduation Cap */}
            <g transform="translate(0, -10)">
                <polygon points="200,40 280,70 200,100 120,70" fill="#0f172a" stroke="#1e293b" strokeWidth="5" />
                <polygon points="200,35 280,65 200,95 120,65" fill="#1e1b4b" />
                {/* Center Button and Base */}
                <rect x="175" y="85" width="50" height="25" rx="5" fill="#1e1b4b" />
                <path d="M 175 105 Q 200 115 225 105" fill="none" stroke="#0f172a" strokeWidth="2" />
                <circle cx="200" cy="65" r="5" fill="#fbbf24" />
                {/* Dynamic Hanging Tassel */}
                <g className="tk-tassel-swing">
                    <line x1="200" y1="65" x2="260" y2="75" stroke="#fcd34d" strokeWidth="2" />
                    <line x1="260" y1="75" x2="260" y2="100" stroke="#fcd34d" strokeWidth="2" />
                    <line x1="260" y1="100" x2="255" y2="125" stroke="#f59e0b" strokeWidth="2.5" />
                    <line x1="260" y1="100" x2="260" y2="130" stroke="#fcd34d" strokeWidth="2.5" />
                    <line x1="260" y1="100" x2="265" y2="125" stroke="#f59e0b" strokeWidth="2.5" />
                    <rect x="257" y="100" width="6" height="5" fill="#f59e0b" />
                </g>
            </g>
        </g>
    </svg>
)

export const MiniMascotTrueKey = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="20" y="35" width="60" height="50" rx="25" fill="#ffffff" stroke="#94a3b8" strokeWidth="4" />
        <rect x="30" y="45" width="40" height="25" rx="10" fill="#1e293b" />
        <path d="M 40 55 Q 45 50 50 55" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" />
        <path d="M 60 55 Q 55 50 50 55" fill="none" stroke="#00e5ff" strokeWidth="3.5" strokeLinecap="round" />
        <polygon points="50,10 80,18 50,26 20,18" fill="#1e1b4b" />
        <line x1="50" y1="18" x2="65" y2="30" stroke="#fbbf24" strokeWidth="2" />
        <line x1="20" y1="20" x2="15" y2="5" stroke="#fbbf24" strokeWidth="3" />
    </svg>
)

/* =====================================================================
   13. THE SCHOLAR BOT (الآلي الباحث)
   ===================================================================== */
export const MascotScholar = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="scGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.25" /><stop offset="100%" stopColor="#047857" stopOpacity="0" /></radialGradient>
            <linearGradient id="scMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#f8fafc" /><stop offset="100%" stopColor="#94a3b8" /></linearGradient>
            <linearGradient id="scArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#059669" /><stop offset="100%" stopColor="#064e3b" /></linearGradient>
            <linearGradient id="scScreen" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#022c22" /><stop offset="100%" stopColor="#064e3b" /></linearGradient>
            <filter id="scNeon"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        <circle cx="200" cy="250" r="170" fill="url(#scGlow)" />
        <g className="mascot-float-parent">
            <path d="M 120 220 C 120 160, 280 160, 280 220 C 310 330, 250 400, 200 400 C 150 400, 90 330, 120 220 Z" fill="url(#scMetal)" stroke="url(#scArmor)" strokeWidth="5" />
            <rect x="150" y="240" width="100" height="70" rx="15" fill="url(#scScreen)" stroke="#34d399" strokeWidth="2" filter="url(#scNeon)" />
            <text x="200" y="280" dominantBaseline="middle" textAnchor="middle" fill="#34d399" fontSize="24" fontWeight="900" filter="url(#scNeon)" className="mascot-key-text" letterSpacing="3">KEY</text>
            
            {/* Hover Book */}
            <g transform="translate(140, 340) rotate(-10)">
                <rect x="0" y="0" width="120" height="20" rx="5" fill="#fcd34d" stroke="#b45309" strokeWidth="2" />
                <path d="M 60 0 L 60 20" stroke="#b45309" strokeWidth="2" />
                <rect x="10" y="-15" width="45" height="15" fill="#059669" opacity="0.6" filter="url(#scNeon)" />
                <rect x="65" y="-15" width="45" height="15" fill="#059669" opacity="0.6" filter="url(#scNeon)" />
            </g>

            {/* Arms Holding Book */}
            <path d="M 100 240 Q 60 300 130 350" fill="none" stroke="url(#scMetal)" strokeWidth="18" strokeLinecap="round" />
            <path d="M 300 240 Q 340 300 270 350" fill="none" stroke="url(#scMetal)" strokeWidth="18" strokeLinecap="round" />
            
            {/* Head */}
            <rect x="120" y="90" width="160" height="120" rx="40" fill="url(#scMetal)" stroke="url(#scArmor)" strokeWidth="5" />
            <rect x="135" y="110" width="130" height="80" rx="30" fill="url(#scScreen)" />
            {/* Glasses Glowing Frame */}
            <circle cx="165" cy="150" r="22" fill="none" stroke="#fcd34d" strokeWidth="3" filter="url(#scNeon)" />
            <circle cx="235" cy="150" r="22" fill="none" stroke="#fcd34d" strokeWidth="3" filter="url(#scNeon)" />
            <path d="M 187 150 L 213 150" stroke="#fcd34d" strokeWidth="3" filter="url(#scNeon)" />
            
            {/* Eyes */}
            <path d="M 155 150 Q 165 140 175 150" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" filter="url(#scNeon)" className="mascot-blink-1" />
            <path d="M 225 150 Q 235 140 245 150" fill="none" stroke="#34d399" strokeWidth="5" strokeLinecap="round" filter="url(#scNeon)" className="mascot-blink-2" />
            
            {/* Engine Base */}
            <path d="M 160 400 L 240 400 L 210 440 L 190 440 Z" fill="url(#scArmor)" />
        </g>
    </svg>
)

export const MiniMascotScholar = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <rect x="20" y="25" width="60" height="45" rx="15" fill="#f8fafc" stroke="#059669" strokeWidth="3" />
        <rect x="30" y="35" width="40" height="20" rx="8" fill="#022c22" />
        {/* Glasses */}
        <circle cx="40" cy="45" r="6" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
        <circle cx="60" cy="45" r="6" fill="none" stroke="#fcd34d" strokeWidth="1.5" />
        <path d="M 37 45 Q 40 42 43 45" fill="none" stroke="#34d399" strokeWidth="1.5" />
        <path d="M 57 45 Q 60 42 63 45" fill="none" stroke="#34d399" strokeWidth="1.5" />
        <rect x="35" y="75" width="30" height="5" fill="#fcd34d" />
    </svg>
)

/* =====================================================================
   14. THE LAB BOT (آلي المختبر)
   ===================================================================== */
export const MascotLab = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="lbGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#bef264" stopOpacity="0.25" /><stop offset="100%" stopColor="#4d7c0f" stopOpacity="0" /></radialGradient>
            <linearGradient id="lbMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#ffffff" /><stop offset="100%" stopColor="#e2e8f0" /></linearGradient>
            <linearGradient id="lbArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#84cc16" /><stop offset="100%" stopColor="#4d7c0f" /></linearGradient>
            <linearGradient id="lbLiquid" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#bef264" /><stop offset="100%" stopColor="#65a30d" /></linearGradient>
            <filter id="lbNeon"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        
        <circle cx="200" cy="250" r="170" fill="url(#lbGlow)" />
        <g className="mascot-float-parent">
            {/* Liquid Flask Body */}
            <path d="M 170 190 L 230 190 L 280 370 Q 280 400 200 400 Q 120 400 120 370 Z" fill="url(#lbMetal)" stroke="url(#lbArmor)" strokeWidth="6" strokeLinejoin="round" />
            <path d="M 140 370 L 175 250 L 225 250 L 260 370 Q 260 385 200 385 Q 140 385 140 370 Z" fill="url(#lbLiquid)" opacity="0.8" filter="url(#lbNeon)" />
            {/* Bubbles */}
            <circle cx="180" cy="350" r="5" fill="#fff" opacity="0.6" className="mascot-thrust-pulse" />
            <circle cx="210" cy="320" r="8" fill="#fff" opacity="0.5" className="mascot-thrust-pulse" />
            <circle cx="230" cy="360" r="4" fill="#fff" opacity="0.7" className="mascot-thrust-pulse" />
            
            <text x="200" y="325" dominantBaseline="middle" textAnchor="middle" fill="#0f172a" fontSize="28" fontWeight="900" letterSpacing="4">KEY</text>

            {/* Arms Holding Flask Ends */}
            <path d="M 130 250 Q 80 290 120 350" fill="none" stroke="url(#lbArmor)" strokeWidth="16" strokeLinecap="round" />
            <path d="M 270 250 Q 320 290 280 350" fill="none" stroke="url(#lbArmor)" strokeWidth="16" strokeLinecap="round" />
            
            {/* Head */}
            <rect x="130" y="90" width="140" height="100" rx="30" fill="url(#lbMetal)" stroke="url(#lbArmor)" strokeWidth="5" />
            
            {/* Safety Goggles Screen */}
            <path d="M 130 140 C 130 100, 270 100, 270 140 C 270 170, 200 180, 200 160 C 200 180, 130 170, 130 140 Z" fill="#020617" stroke="#3b82f6" strokeWidth="4" filter="url(#lbNeon)" />
            
            <path d="M 160 135 Q 170 125 180 135" fill="none" stroke="#bef264" strokeWidth="6" strokeLinecap="round" filter="url(#lbNeon)" className="mascot-blink-1" />
            <path d="M 220 135 Q 230 125 240 135" fill="none" stroke="#bef264" strokeWidth="6" strokeLinecap="round" filter="url(#lbNeon)" className="mascot-blink-2" />
        </g>
    </svg>
)

export const MiniMascotLab = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <path d="M 40 20 L 60 20 L 75 65 Q 75 75 50 75 Q 25 75 25 65 Z" fill="#ffffff" stroke="#84cc16" strokeWidth="3" strokeLinejoin="round" />
        <path d="M 30 65 L 42 35 L 58 35 L 70 65 Z" fill="#bef264" opacity="0.8" />
        <path d="M 25 35 Q 50 45 75 35" fill="none" stroke="#3b82f6" strokeWidth="3" />
        <circle cx="42" cy="30" r="3" fill="#bef264" />
        <circle cx="58" cy="30" r="3" fill="#bef264" />
    </svg>
)

/* =====================================================================
   15. THE ASTRO BOT (الآلي الفلكي)
   ===================================================================== */
export const MascotAstronomy = () => (
    <svg viewBox="0 0 400 500" className="lv-mascot-svg">
        <defs>
            <radialGradient id="asGlow" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#c084fc" stopOpacity="0.2" /><stop offset="100%" stopColor="#312e81" stopOpacity="0" /></radialGradient>
            <linearGradient id="asMetal" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#1e1b4b" /><stop offset="100%" stopColor="#0f172a" /></linearGradient>
            <linearGradient id="asArmor" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#8b5cf6" /><stop offset="100%" stopColor="#4c1d95" /></linearGradient>
            <filter id="asNeon"><feGaussianBlur stdDeviation="4" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter>
        </defs>
        
        <circle cx="200" cy="250" r="180" fill="url(#asGlow)" />
        <g className="mascot-float-parent">
            {/* Saturn Rings Background */}
            <ellipse cx="200" cy="300" rx="140" ry="25" fill="none" stroke="#fef08a" strokeWidth="2" filter="url(#asNeon)" transform="rotate(-15 200 300)" opacity="0.4" />
            <ellipse cx="200" cy="300" rx="120" ry="15" fill="none" stroke="#c084fc" strokeWidth="4" filter="url(#asNeon)" transform="rotate(-15 200 300)" opacity="0.6" />
            
            <circle cx="200" cy="300" r="90" fill="url(#asMetal)" stroke="url(#asArmor)" strokeWidth="5" />
            <circle cx="200" cy="300" r="60" fill="#020617" stroke="#c084fc" strokeWidth="2" filter="url(#asNeon)" />
            
            <text x="200" y="306" dominantBaseline="middle" textAnchor="middle" fill="#c084fc" fontSize="28" fontWeight="900" filter="url(#asNeon)" className="mascot-key-text" letterSpacing="4">KEY</text>

            <circle cx="150" cy="270" r="3" fill="#fff" filter="url(#asNeon)" className="mascot-blink-1" />
            <circle cx="240" cy="320" r="4" fill="#fff" filter="url(#asNeon)" className="mascot-blink-2" />
            <circle cx="210" cy="250" r="2" fill="#fff" filter="url(#asNeon)" className="mascot-blink-3" />

            {/* Saturn Rings Foreground */}
            <path d="M 60 300 A 140 25 0 0 0 340 300" fill="none" stroke="#fcd34d" strokeWidth="3" filter="url(#asNeon)" transform="rotate(-15 200 300)" />

            <path d="M 120 250 Q 70 200 80 150" fill="none" stroke="url(#asArmor)" strokeWidth="12" strokeLinecap="round" />
            <path d="M 280 250 Q 330 200 320 150" fill="none" stroke="url(#asArmor)" strokeWidth="12" strokeLinecap="round" />

            <rect x="130" y="80" width="140" height="110" rx="55" fill="url(#asMetal)" stroke="url(#asArmor)" strokeWidth="5" />
            
            {/* Star Antenna */}
            <line x1="200" y1="80" x2="200" y2="30" stroke="#fcd34d" strokeWidth="3" filter="url(#asNeon)" />
            <path d="M 200 15 L 205 25 L 215 25 L 207 33 L 210 43 L 200 37 L 190 43 L 193 33 L 185 25 L 195 25 Z" fill="#fcd34d" filter="url(#asNeon)" className="mascot-thrust-pulse" />

            <rect x="145" y="110" width="110" height="50" rx="25" fill="#020617" stroke="#c084fc" strokeWidth="2" filter="url(#asNeon)" />
            <circle cx="175" cy="135" r="8" fill="#c084fc" filter="url(#asNeon)" className="mascot-blink-1" />
            <circle cx="225" cy="135" r="8" fill="#c084fc" filter="url(#asNeon)" className="mascot-blink-2" />
        </g>
    </svg>
)

export const MiniMascotAstronomy = () => (
    <svg viewBox="0 0 100 100" className="lv-mascot-mini">
        <circle cx="50" cy="65" r="25" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2" />
        <ellipse cx="50" cy="65" rx="35" ry="8" fill="none" stroke="#c084fc" strokeWidth="2" transform="rotate(-15 50 65)" />
        <rect x="35" y="15" width="30" height="25" rx="12" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="2" />
        <rect x="40" y="22" width="20" height="10" rx="5" fill="#020617" />
        <circle cx="45" cy="27" r="2" fill="#c084fc" />
        <circle cx="55" cy="27" r="2" fill="#c084fc" />
        <path d="M 50 5 L 52 10 L 57 10 L 53 13 L 55 18 L 50 15 L 45 18 L 47 13 L 43 10 L 48 10 Z" fill="#fcd34d" />
    </svg>
)


/* =====================================================================
   MASCOTS DATA EXPORT
   ===================================================================== */
export const Mascots = [
    { id: 'robo', name: 'الرجل الآلي', Main: MascotClassic, Mini: MiniMascotClassic },
];

/* =====================================================================
   DEFAULT EXPORT WRAPPER (STANDALONE)
   ===================================================================== */
export default function KeyAiMascotsWrapper() {
    return (
        <div className="lv-ai-robot-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <MascotClassic />
            </div>
            
            <div className="mascot-switcher-ui" style={{ justifyContent: 'center' }}>
                <div className="mascot-sw-info">
                    <span className="mascot-sw-name" style={{ color: 'var(--purple)', fontWeight: 'bold' }}>الرجل الآلي</span>
                </div>
            </div>
        </div>
    );
}
