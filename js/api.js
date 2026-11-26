/* Split API client. */
const API_BASE_URL = "https://split-api.fridayisyourday.workers.dev";

async function requestMyProfile(initData, body = null) {
    if (typeof initData !== "string" || !initData.trim()) {
        throw new Error("Telegram initData is unavailable.");
    }

    // URL-encoded POST is CORS-safelisted, avoiding a custom-header preflight.
    const form = new URLSearchParams();
    form.set("init_data", initData);

    if (body !== null && Object.prototype.hasOwnProperty.call(body, "display_name")) {
        form.set("display_name", body.display_name);
    }

    const response = await fetch(API_BASE_URL + "/api/me", {
        method: "POST",
        body: form,
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
        const reason = payload && (payload.reason || payload.error)
            ? (payload.reason || payload.error)
            : "HTTP " + response.status;
        throw new Error(reason);
    }

    if (!payload || !payload.user || !payload.user.telegram_id) {
        throw new Error("Split API did not return a verified user.");
    }

    return payload.user;
}

export async function syncTelegramUser(initData, localDisplayName = "") {
    let user = await requestMyProfile(initData);

    // Migrate a nickname saved by an older version only when the server has none.
    if (
        (user.display_name === null || user.display_name === undefined) &&
        typeof localDisplayName === "string" &&
        localDisplayName.trim()
    ) {
        user = await updateTelegramDisplayName(initData, localDisplayName);
    }

    return user;
}

export async function updateTelegramDisplayName(initData, displayName) {
    if (typeof displayName !== "string" || displayName.length > 64) {
        throw new Error("Display name must be a string of up to 64 characters.");
    }

    return requestMyProfile(initData, {
        display_name: displayName.trim()
    });
}
