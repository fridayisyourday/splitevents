/* Shared Split API integration. */
const API_BASE_URL = "https://split-api.fridayisyourday.workers.dev";

/**
 * Sends Telegram's signed initData to the API.
 * The server verifies the signature and creates/updates the user's shared record.
 * No identity data from initDataUnsafe is sent or trusted here.
 */
export async function syncTelegramUser() {
    const webApp = window.Telegram && window.Telegram.WebApp
        ? window.Telegram.WebApp
        : null;
    const initData = webApp && typeof webApp.initData === "string"
        ? webApp.initData
        : "";

    if (!initData) {
        console.info(
            "SplitEvents: shared profile sync skipped (Telegram initData unavailable)"
        );
        return {
            ok: false,
            reason: "telegram_init_data_unavailable"
        };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/me`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Telegram-Init-Data": initData
            },
            body: "{}",
            cache: "no-store",
            credentials: "omit"
        });

        let payload = {};
        try {
            payload = await response.json();
        } catch (error) {
            throw new Error("The API returned an invalid response.");
        }

        if (!response.ok) {
            const reason = typeof payload.error === "string"
                ? payload.error
                : `HTTP ${response.status}`;
            throw new Error(reason);
        }

        if (!payload.user || !payload.user.telegram_id) {
            throw new Error("The API response does not contain a user profile.");
        }

        console.info("SplitEvents: Telegram user synced with the shared database");

        return {
            ok: true,
            user: payload.user
        };
    } catch (error) {
        console.warn("SplitEvents: shared profile sync failed", error);
        return {
            ok: false,
            reason: "sync_failed"
        };
    }
}
