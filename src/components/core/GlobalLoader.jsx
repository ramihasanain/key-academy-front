import './GlobalLoader.css'

const GlobalLoader = ({
    text = 'جاري التحميل...',
    logoSrc = '/new-logo.png',
    logoAlt = 'Key Academy'
}) => {
    return (
        <div className="global-loader" role="status" aria-live="polite" aria-busy="true">
            <img src={logoSrc} alt={logoAlt} className="global-loader-logo" />
            <p className="global-loader-text">{text}</p>
        </div>
    )
}

export default GlobalLoader
