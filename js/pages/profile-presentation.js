/* Shared validation for profile media returned by the API. */
export function getSafeProfileImageUrl(value) {
    if (typeof value !== "string" || !value) return "";

    try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname.endsWith(".imagekit.io")
            ? url.href
            : "";
    } catch {
        return "";
    }
}
