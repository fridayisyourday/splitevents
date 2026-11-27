/* Pure helpers for a seamless, accessible server photo carousel. */

function getImageCount(images) {
    return Array.isArray(images) ? images.length : 0;
}

export function getServerGallerySlides(images) {
    const count = getImageCount(images);
    if (count === 0) return [];
    if (count === 1) return [0];

    return [
        count - 1,
        ...Array.from({ length: count }, (_, index) => index),
        0
    ];
}

export function getInitialServerGalleryPosition(images) {
    return getImageCount(images) > 1 ? 1 : 0;
}

export function getServerGalleryLayout(images, position) {
    const slideCount = getServerGallerySlides(images).length;
    if (slideCount === 0) {
        return {
            trackWidth: "100%",
            slideBasis: "100%",
            transform: "translateX(0%)"
        };
    }

    const slideBasis = 100 / slideCount;
    return {
        trackWidth: `${slideCount * 100}%`,
        slideBasis: `${slideBasis}%`,
        transform: `translateX(-${position * slideBasis}%)`
    };
}

export function normalizeServerGalleryPosition(position, images) {
    const count = getImageCount(images);
    if (count < 2) return 0;
    if (position <= 0) return count;
    if (position >= count + 1) return 1;
    return position;
}

export function getNextServerGalleryPosition(position, direction, images, reduceMotion = false) {
    const count = getImageCount(images);
    const step = Number.isFinite(direction) ? Math.sign(direction) : 0;
    if (count < 2 || step === 0) return position;

    const nextPosition = position + step;
    return reduceMotion
        ? normalizeServerGalleryPosition(nextPosition, images)
        : nextPosition;
}

export function isServerGalleryClonePosition(position, images) {
    const count = getImageCount(images);
    return count > 1 && (position <= 0 || position >= count + 1);
}
