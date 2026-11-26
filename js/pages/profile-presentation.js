/* Shared, safe profile-presentation helpers. */
export function getSafeProfileImageUrl(value) {
    if (typeof value !== "string" || !value) return "";

    try {
        const url = new URL(value);
        return url.protocol === "https:" ? url.href : "";
    } catch {
        return "";
    }
}

export function createPersonIcon() {
    return createIcon("user-round");
}
