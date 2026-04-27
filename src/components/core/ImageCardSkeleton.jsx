import './ImageCardSkeleton.css'

const ImageCardSkeleton = ({ count = 6, className = '' }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={`image-card-skeleton-${index}`} className={`dash-course-card premium-card image-card-skeleton ${className}`.trim()}>
                    <div className="dash-course-accent image-card-skeleton-shimmer"></div>
                    <div className="dash-course-body">
                        <div className="image-card-skeleton-media image-card-skeleton-shimmer"></div>
                        <div className="image-card-skeleton-line image-card-skeleton-shimmer w-60"></div>
                        <div className="image-card-skeleton-line image-card-skeleton-shimmer w-80"></div>
                        <div className="image-card-skeleton-row">
                            <div className="image-card-skeleton-line image-card-skeleton-shimmer w-40"></div>
                            <div className="image-card-skeleton-line image-card-skeleton-shimmer w-30"></div>
                        </div>
                        <div className="image-card-skeleton-button image-card-skeleton-shimmer"></div>
                    </div>
                </div>
            ))}
        </>
    )
}

export default ImageCardSkeleton
