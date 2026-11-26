/* Shared, safe profile-presentation helpers. */
import { createIcon } from "../dom.js?v=20261126-2";
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
