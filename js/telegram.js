/* Telegram Mini Apps integration. */
const webApp = window.Telegram && window.Telegram.WebApp
    ? window.Telegram.WebApp
    : null;

const user = webApp && webApp.initDataUnsafe
    ? webApp.initDataUnsafe.user || null
    : null;

let backButtonHandler = null;
let backButtonBound = false;

function validColor(value, fallback) {
    return typeof value === "string" && /^#[\da-f]{6}$/i.test(value)
        ? value
        : fallback;
}

function applyTheme() {
    if (!webApp) return;

    const theme = webApp.themeParams || {};
    const colorScheme = webApp.colorScheme === "dark" ? "dark" : "light";
    const fallbackBackground = colorScheme === "dark" ? "#121418" : "#ffffff";
    const background = validColor(theme.bg_color, fallbackBackground);
    const header = validColor(theme.header_bg_color, background);

    document.documentElement.style.colorScheme = colorScheme;

    try {
        if (typeof webApp.setBackgroundColor === "function") {
            webApp.setBackgroundColor(background);
        }
        if (typeof webApp.setHeaderColor === "function") {
            webApp.setHeaderColor(header);
        }
    } catch (error) {
        console.warn("SplitEvents: could not update Telegram theme", error);
    }

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = header;
}

function updateViewport() {
    if (!webApp) return;

    const root = document.documentElement;
    const stableHeight = Number(webApp.viewportStableHeight);
    const viewportHeight = Number(webApp.viewportHeight);
    const height = stableHeight > 0 ? stableHeight : viewportHeight;

    if (Number.isFinite(height) && height > 0) {
        root.style.setProperty("--app-viewport-height", `${height}px`);
    }

    const safeArea = webApp.safeAreaInset || {};
    const contentSafeArea = webApp.contentSafeAreaInset || {};

    ["top", "right", "bottom", "left"].forEach((side) => {
        const safeValue = Number(safeArea[side]);
        const contentValue = Number(contentSafeArea[side]);

        root.style.setProperty(
            `--app-safe-${side}`,
            `${Number.isFinite(safeValue) && safeValue > 0 ? safeValue : 0}px`
        );
        root.style.setProperty(
            `--app-content-safe-${side}`,
            `${Number.isFinite(contentValue) && contentValue > 0 ? contentValue : 0}px`
        );
    });
}

export function initTelegram({ onBack } = {}) {
    backButtonHandler = typeof onBack === "function" ? onBack : null;

    if (!webApp) {
        const mediaQuery = window.matchMedia
            ? window.matchMedia("(prefers-color-scheme: dark)")
            : null;

        function applySystemTheme() {
            const isDark = Boolean(mediaQuery && mediaQuery.matches);
            document.documentElement.style.colorScheme = isDark ? "dark" : "light";

            const themeMeta = document.querySelector('meta[name="theme-color"]');
            if (themeMeta) themeMeta.content = isDark ? "#121418" : "#ffffff";
        }

        applySystemTheme();

        if (mediaQuery && typeof mediaQuery.addEventListener === "function") {
            mediaQuery.addEventListener("change", applySystemTheme);
        }

        console.info("SplitEvents: opened in a regular browser");
        return;
    }

    try {
        if (typeof webApp.ready === "function") webApp.ready();
        if (typeof webApp.expand === "function") webApp.expand();
    } catch (error) {
        console.warn("SplitEvents: Telegram initialization failed", error);
    }

    applyTheme();
    updateViewport();

    if (typeof webApp.onEvent === "function") {
        webApp.onEvent("themeChanged", applyTheme);
        webApp.onEvent("viewportChanged", updateViewport);
        webApp.onEvent("safeAreaChanged", updateViewport);
        webApp.onEvent("contentSafeAreaChanged", updateViewport);
    }

    if (
        !backButtonBound &&
        webApp.BackButton &&
        typeof webApp.BackButton.onClick === "function"
    ) {
        webApp.BackButton.onClick(() => {
            if (backButtonHandler) backButtonHandler();
        });
        backButtonBound = true;
    }

    console.info(
        "SplitEvents: Telegram initialized",
        webApp.platform || "unknown",
        webApp.version || "unknown"
    );
}

export function setTelegramBackButtonVisible(visible) {
    if (!webApp || !webApp.BackButton) return;

    try {
        if (visible && typeof webApp.BackButton.show === "function") {
            webApp.BackButton.show();
        } else if (!visible && typeof webApp.BackButton.hide === "function") {
            webApp.BackButton.hide();
        }
    } catch (error) {
        console.warn("SplitEvents: Telegram BackButton update failed", error);
    }
}

export function getTelegramUserId() {
    return user && user.id !== undefined ? String(user.id) : "guest";
}

export function getTelegramName() {
    const firstName = user && user.first_name ? String(user.first_name) : "";
    const lastName = user && user.last_name ? String(user.last_name) : "";

    return [firstName, lastName].filter(Boolean).join(" ").trim()
        || "Пользователь Telegram";
}

export function getTelegramTag() {
    const username = user && user.username
        ? String(user.username).trim().replace(/^@/, "")
        : "";

    return username ? `@${username}` : "Тег не указан";
}

export function getTelegramPhotoUrl() {
    const value = user && user.photo_url ? String(user.photo_url).trim() : "";
    if (!value) return "";

    try {
        const url = new URL(value);
        return url.protocol === "https:" ? url.href : "";
    } catch (error) {
        return "";
    }
}

// initDataUnsafe is used for display only. It is not server-verified identity data.
