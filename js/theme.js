const VALID_THEMES = new Set(["light", "dark"]);

export function normalizeTheme(theme) {
    return VALID_THEMES.has(theme) ? theme : "light";
}

export function getStoredTheme(storage) {
    try {
        const saved = storage?.getItem("splitevents-color-scheme");
        return VALID_THEMES.has(saved) ? saved : null;
    } catch {
        return null;
    }
}

export function resolveTheme(savedTheme, telegramTheme, systemDark) {
    if (VALID_THEMES.has(savedTheme)) return savedTheme;
    if (VALID_THEMES.has(telegramTheme)) return telegramTheme;
    return systemDark ? "dark" : "light";
}

export function applyTheme(theme, root = document.documentElement) {
    const normalized = normalizeTheme(theme);
    root.dataset.colorScheme = normalized;
    return normalized;
}

export function saveTheme(theme, storage = window.localStorage) {
    const normalized = normalizeTheme(theme);
    try {
        storage?.setItem("splitevents-color-scheme", normalized);
    } catch {
        // Theme still works for the current session when storage is unavailable.
    }
    return normalized;
}
