/* ImageKit is the single source for site-managed images. */
export const IMAGEKIT_ENDPOINT_ID = "firdayywh";
const IMAGEKIT_ORIGIN = "https://ik.imagekit.io";
const IMAGEKIT_LIBRARY_ROOT = "splitevents";
const IMAGEKIT_ROOT = IMAGEKIT_ORIGIN + "/" + IMAGEKIT_ENDPOINT_ID + "/" + IMAGEKIT_LIBRARY_ROOT;

function isSafePathSegment(segment) {
    return Boolean(segment)
        && segment !== "."
        && segment !== ".."
        && !segment.includes("/")
        && !segment.includes("\\")
        && !segment.includes("?")
        && !segment.includes("#");
}

function getAssetSegments(relativePath) {
    const segments = String(relativePath || "").split("/");
    return segments.length && segments.every(isSafePathSegment)
        ? segments
        : [];
}

function isValidId(value) {
    return typeof value === "string"
        && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function getImageKitAssetUrl(relativePath) {
    const segments = getAssetSegments(relativePath);
    if (!segments.length) return "";

    return IMAGEKIT_ROOT + "/" + segments
        .map((segment) => encodeURIComponent(segment))
        .join("/");
}

export function getSafeImageKitUrl(value, expectedFolder = "") {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
        const url = new URL(value);
        if (
            url.protocol !== "https:"
            || url.hostname !== "ik.imagekit.io"
            || url.username
            || url.password
        ) {
            return "";
        }

        const encodedSegments = url.pathname.split("/").filter(Boolean);
        const segments = encodedSegments.map((segment) => decodeURIComponent(segment));
        if (
            segments.length < 4
            || segments[0] !== IMAGEKIT_ENDPOINT_ID
            || segments[1] !== IMAGEKIT_LIBRARY_ROOT
            || (expectedFolder && segments[2] !== expectedFolder)
            || !segments.every(isSafePathSegment)
        ) {
            return "";
        }

        return url.href;
    } catch {
        return "";
    }
}

export function getEventCoverUrl(eventId) {
    if (!isValidId(eventId)) return "";
    return getImageKitAssetUrl("events/" + eventId + "/cover.webp");
}

export function getNomineeAvatarUrl(nomineeId) {
    if (!isValidId(nomineeId)) return "";
    return getImageKitAssetUrl("nominees/" + nomineeId + ".webp");
}

export function getServerBannerUrl(serverId) {
    if (!isValidId(serverId)) return "";
    return getImageKitAssetUrl("servers/" + serverId + "/banner.webp");
}

export function getServerGalleryImageUrl(serverId, fileName) {
    if (
        !isValidId(serverId)
        || typeof fileName !== "string"
        || !/^gallery-[0-9]{2}\.webp$/.test(fileName)
    ) {
        return "";
    }

    return getImageKitAssetUrl("servers/" + serverId + "/" + fileName);
}
