/* Split API client. */
const API_BASE_URL = "https://split-api.fridayisyourday.workers.dev";

/* Parse API responses consistently and preserve server-provided error codes. */
async function readJsonResponse(response, invalidResponseMessage) {
    let payload;
    try {
        payload = await response.json();
    } catch {
        throw new Error(invalidResponseMessage);
    }

    if (!response.ok) {
        const reason = payload && (payload.reason || payload.error)
            ? (payload.reason || payload.error)
            : "HTTP " + response.status;
        throw new Error(reason);
    }

    return payload;
}

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

    const payload = await readJsonResponse(
        response,
        "Split API returned an invalid response."
    );

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


export async function uploadProfileImage(initData, mediaType, blob) {
    if (typeof initData !== "string" || !initData.trim()) {
        throw new Error("missing_telegram_init_data");
    }
    if (mediaType !== "avatar" && mediaType !== "banner") {
        throw new Error("invalid_media_type");
    }
    if (!(blob instanceof Blob) || blob.size <= 0) {
        throw new Error("invalid_media_payload");
    }

    const form = new FormData();
    form.set("init_data", initData);
    form.set("media_type", mediaType);
    form.set("file", blob, mediaType + ".jpg");

    const response = await fetch(API_BASE_URL + "/api/profile/media", {
        method: "POST",
        body: form,
        credentials: "omit",
        cache: "no-store"
    });

    const payload = await readJsonResponse(
        response,
        "Split API returned an invalid media response."
    );

    if (!payload || !payload.user || !payload.user[mediaType + "_url"]) {
        throw new Error("invalid_media_response");
    }

    return payload.user;
}


async function requestDirectoryData(path, initData, fields = {}) {
    if (typeof initData !== "string" || !initData.trim()) {
        throw new Error("missing_telegram_init_data");
    }

    const form = new URLSearchParams();
    form.set("init_data", initData);

    Object.entries(fields).forEach(([key, value]) => {
        form.set(key, String(value));
    });

    const response = await fetch(API_BASE_URL + path, {
        method: "POST",
        body: form,
        credentials: "omit",
        cache: "no-store"
    });

    return readJsonResponse(response, "invalid_server_response");
}

export async function fetchFriends(initData) {
    const payload = await requestDirectoryData("/api/friends", initData);
    if (!payload || !Array.isArray(payload.users)) {
        throw new Error("invalid_friends_response");
    }

    return payload.users;
}

export async function fetchPublicProfile(initData, publicId) {
    if (typeof publicId !== "string" || !/^[0-9a-f]{32}$/i.test(publicId)) {
        throw new Error("invalid_public_id");
    }

    const payload = await requestDirectoryData("/api/user", initData, {
        public_id: publicId
    });

    if (!payload || !payload.user || payload.user.public_id !== publicId) {
        throw new Error("invalid_public_profile_response");
    }

    return payload.user;
}
