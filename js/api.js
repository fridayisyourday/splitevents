/* Split API client. */
const API_BASE_URL = "https://split-api.fridayisyourday.workers.dev";

export async function syncTelegramUser(initData) {
    if (typeof initData !== "string" || !initData.trim()) {
        throw new Error("Telegram initData is unavailable.");
    }

    const response = await fetch(`${API_BASE_URL}/api/me`, {
        method: "POST",
        headers: {
            "X-Telegram-Init-Data": initData
        },
        credentials: "omit",
        cache: "no-store"
    });

    let payload = null;
    try {
        payload = await response.json();
    } catch (error) {
        throw new Error("Split API returned an invalid response.");
    }

    if (!response.ok) {
        const reason = payload && payload.error
            ? payload.error
            : `HTTP ${response.status}`;
        throw new Error(`Split API request failed: ${reason}`);
    }

    if (!payload || !payload.user || !payload.user.telegram_id) {
        throw new Error("Split API did not return a verified user.");
    }

    return payload.user;
}
