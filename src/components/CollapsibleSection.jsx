import React, { useState } from 'react'
import { HiOutlineChevronDown } from 'react-icons/hi2'

export function CollapsibleSection({
    title,
    subtitle,
    defaultOpen = false,
    children,
    className = '',
    badge,
}) {
    const [open, setOpen] = useState(defaultOpen)

    return (
        <div className={`collapsible-section ${open ? 'is-open' : ''} ${className}`}>
            <button
                type="button"
                className="collapsible-section-trigger"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
            >
                <span className="collapsible-section-leading">
                    <span className="collapsible-section-title">{title}</span>
                    {subtitle && <span className="collapsible-section-sub">{subtitle}</span>}
                </span>
                {badge && <span className="collapsible-section-badge">{badge}</span>}
                <HiOutlineChevronDown className="collapsible-section-chevron" aria-hidden />
            </button>
            <div className="collapsible-section-body" hidden={!open}>
                {children}
            </div>
        </div>
    )
}
