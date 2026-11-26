/* Shared hash-route helpers for the Mini App. */
export const VALID_PAGES = Object.freeze([
    "home",
    "profile",
    "friends",
    "users",
    "events",
    "servers",
    "nominations"
]);

const validPageSet = new Set(VALID_PAGES);

export function getCurrentPage(hash = (
    typeof window === "undefined" ? "" : window.location.hash
)) {
    const value = typeof hash === "string" ? hash : "";
    const withoutHash = value.startsWith("#") ? value.slice(1) : value;
    const page = withoutHash.split("?")[0].split("/").filter(Boolean)[0] || "home";

    return validPageSet.has(page) ? page : "home";
}

export function getPublicUserId(hash = (
    typeof window === "undefined" ? "" : window.location.hash
)) {
    if (typeof hash !== "string") return "";
    const match = hash.match(/^#\/users\/([0-9a-f]{32})(?:[/?]|$)/i);
    return match ? match[1] : "";
}

export function getPageHash(page) {
    const safePage = validPageSet.has(page) ? page : "home";
    return safePage === "home" ? "#/" : "#/" + safePage;
}
