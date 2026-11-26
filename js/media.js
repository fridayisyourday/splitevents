/* Shared paths for static images stored in the repository. */
const ASSET_ROOT = new URL("../assets/", import.meta.url);

export function getAssetUrl(relativePath) {
    const segments = String(relativePath || "").split("/").filter(Boolean);
    if (!segments.length || segments.some((segment) => segment === "." || segment === "..")) {
        return "";
    }

    return new URL(
        segments.map((segment) => encodeURIComponent(segment)).join("/"),
        ASSET_ROOT
    ).href;
}

export function getEventCoverUrl(eventId) {
    return getAssetUrl(`events/${eventId}/cover.webp`);
}

export function getNomineeAvatarUrl(nomineeId) {
    return getAssetUrl(`nominees/${nomineeId}.webp`);
}
