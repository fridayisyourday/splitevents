/* Shared ImageKit URL construction and validation for all site-managed media. */
export const IMAGEKIT_ENDPOINT_ID = "firdayywh";
export const IMAGEKIT_LIBRARY_ROOT = "splitevents";
export const IMAGEKIT_FOLDERS = Object.freeze({
    profile: "profile",
    servers: "servers",
    events: "events",
    nominees: "nominees"
});

const IMAGEKIT_ORIGIN = "https://ik.imagekit.io";
const IMAGEKIT_ROOT = IMAGEKIT_ORIGIN + "/" + IMAGEKIT_ENDPOINT_ID + "/" + IMAGEKIT_LIBRARY_ROOT;
const IMAGEKIT_FOLDER_NAMES = new Set(Object.values(IMAGEKIT_FOLDERS));

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

/**
 * Builds a public URL for a file stored under the shared ImageKit library root.
 * Pass a path relative to /splitevents, e.g. "servers/technocracy/banner.webp".
 */
export function getImageKitAssetUrl(relativePath) {
    const segments = getAssetSegments(relativePath);
    if (!segments.length || !IMAGEKIT_FOLDER_NAMES.has(segments[0])) return "";

    return IMAGEKIT_ROOT + "/" + segments
        .map((segment) => encodeURIComponent(segment))
        .join("/");
}

/**
 * Validates URLs returned by ImageKit Upload API or stored as asset references.
 * All folders share the same endpoint, library root and URL validation rules.
 */
export function getSafeImageKitUrl(value, expectedFolder = "") {
    if (typeof value !== "string" || !value.trim()) return "";

    try {
        const url = new URL(value);
        if (
            url.protocol !== "https:"
            || url.hostname !== "ik.imagekit.io"
            || url.username
            || url.password
            || url.port
        ) {
            return "";
        }

        const encodedSegments = url.pathname.split("/").filter(Boolean);
        const segments = encodedSegments.map((segment) => decodeURIComponent(segment));
        const folder = segments[2];

        if (
            segments.length < 4
            || segments[0] !== IMAGEKIT_ENDPOINT_ID
            || segments[1] !== IMAGEKIT_LIBRARY_ROOT
            || !IMAGEKIT_FOLDER_NAMES.has(folder)
            || (expectedFolder && folder !== expectedFolder)
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
    return getImageKitAssetUrl(IMAGEKIT_FOLDERS.events + "/" + eventId + "/cover.webp");
}

export function getNomineeAvatarUrl(nomineeId) {
    if (!isValidId(nomineeId)) return "";
    return getImageKitAssetUrl(IMAGEKIT_FOLDERS.nominees + "/" + nomineeId + ".webp");
}

export function getServerBannerUrl(serverId) {
    if (!isValidId(serverId)) return "";
    return getImageKitAssetUrl(IMAGEKIT_FOLDERS.servers + "/" + serverId + "/banner.webp");
}

export function getServerGalleryImageUrl(serverId, fileName) {
    if (
        !isValidId(serverId)
        || typeof fileName !== "string"
        || !/^gallery-[0-9]{2}\.webp$/.test(fileName)
    ) {
        return "";
    }

    return getImageKitAssetUrl(IMAGEKIT_FOLDERS.servers + "/" + serverId + "/" + fileName);
}
