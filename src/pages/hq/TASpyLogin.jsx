import React, { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

export const TASpyLogin = () => {
    const { token } = useParams()
    const navigate = useNavigate()

    useEffect(() => {
        if (token) {
            // Save the spy token to sessionStorage so we don't mess up our admin localStorage login!
            sessionStorage.setItem('spy_token', token)
            navigate('/ta/groups')
        }
    }, [token, navigate])

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--hq-bg)', color: 'white' }}>
            <h2 style={{ color: 'var(--hq-primary)' }}>جاري الاتصال الاستخباراتي... 🕵️‍♂️</h2>
        </div>
    )
}
