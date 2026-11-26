const ALLOWED_ORIGIN = "https://fridayisyourday.github.io";

function corsHeaders(origin = "") {
  const headers = {
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };

  if (origin === ALLOWED_ORIGIN) {
    headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN;
  }

  return headers;
}

function json(data, status = 200, origin = "") {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(origin)
    }
  });
}

let telegramBotProbe = { expiresAt: 0, result: null };

async function inspectTelegramBotToken(botToken) {
  if (telegramBotProbe.result && Date.now() < telegramBotProbe.expiresAt) {
    return telegramBotProbe.result;
  }

  let result = "telegram_api_unavailable";
  try {
    const response = await fetch("https://api.telegram.org/bot" + botToken + "/getMe");
    const payload = await response.json();

    if (response.status === 401 || payload?.error_code === 401) {
      result = "bot_token_invalid";
    } else if (!response.ok || payload?.ok !== true || !payload.result) {
      result = "telegram_api_unavailable";
    } else if (
      String(payload.result.username || "").replace(/^@/, "").toLowerCase() !==
      "spliteventsbot"
    ) {
      result = "bot_token_wrong_bot";
    } else {
      result = "bot_token_valid";
    }
  } catch {
    result = "telegram_api_unavailable";
  }

  telegramBotProbe = {
    expiresAt: Date.now() + 60_000,
    result
  };
  return result;
}

async function verifyTelegramInitData(initData, botToken) {
  if (typeof initData !== "string" || !initData.trim()) {
    return { user: null, reason: "missing_init_data" };
  }

  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) {
    return { user: null, reason: "missing_hash" };
  }
  if (!/^[0-9a-f]{64}$/i.test(receivedHash)) {
    return { user: null, reason: "invalid_hash_format" };
  }

  // Bot-token HMAC validation excludes only "hash".
  // The "signature" field is part of the signed data when Telegram includes it.
  params.delete("hash");

  // Use a locale-independent lexical sort, as required by Telegram's data-check format.
  const entries = [...params.entries()].sort(([a], [b]) => (
    a < b ? -1 : a > b ? 1 : 0
  ));
  const dataCheckString = entries
    .map(([key, value]) => key + "=" + value)
    .join("\n");

  const encoder = new TextEncoder();
  // Telegram specifies HMAC(key = "WebAppData", message = botToken).
  const secretKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode("WebAppData"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const secret = await crypto.subtle.sign(
    "HMAC",
    secretKey,
    encoder.encode(botToken)
  );
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secret,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    hmacKey,
    encoder.encode(dataCheckString)
  );
  const actualHash = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  if (actualHash.length !== receivedHash.length) {
    return { user: null, reason: "signature_mismatch" };
  }

  let mismatch = 0;
  for (let index = 0; index < actualHash.length; index += 1) {
    mismatch |= actualHash.charCodeAt(index) ^ receivedHash.charCodeAt(index);
  }
  if (mismatch !== 0) {
    const tokenStatus = await inspectTelegramBotToken(botToken);
    return {
      user: null,
      reason: tokenStatus === "bot_token_valid"
        ? "signature_mismatch"
        : tokenStatus
    };
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || authDate <= 0) {
    return { user: null, reason: "invalid_auth_date" };
  }

  const now = Date.now() / 1000;
  if (now - authDate > 86400 || authDate - now > 300) {
    return { user: null, reason: "auth_data_expired" };
  }

  try {
    const user = JSON.parse(params.get("user") || "null");
    return user && user.id
      ? { user, reason: null }
      : { user: null, reason: "invalid_user_data" };
  } catch {
    return { user: null, reason: "invalid_user_data" };
  }
}


function isSupportedImageFile(file, bytes) {
  if (!file || file.size <= 0 || file.size > 5 * 1024 * 1024) return false;

  const matches = {
    "image/jpeg": bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
    "image/png": bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a,
    "image/webp": bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  };

  return matches[file.type] === true;
}

function imageKitAuthorization(privateKey) {
  return "Basic " + btoa(String(privateKey).trim() + ":");
}

async function deleteImageKitFile(privateKey, fileId) {
  if (!fileId) return true;

  const response = await fetch(
    "https://api.imagekit.io/v1/files/" + encodeURIComponent(fileId),
    {
      method: "DELETE",
      headers: {
        "Authorization": imageKitAuthorization(privateKey)
      }
    }
  );

  return response.ok || response.status === 404;
}

async function uploadProfileMedia(request, env, origin) {
  const contentLength = Number(request.headers.get("Content-Length") || 0);
  if (Number.isFinite(contentLength) && contentLength > 6 * 1024 * 1024) {
    return json({ error: "image_too_large" }, 413, origin);
  }

  if (!env.BOT_TOKEN) {
    return json({ error: "telegram_auth_not_configured" }, 503, origin);
  }
  if (!env.IMAGEKIT_PRIVATE_KEY) {
    return json({ error: "media_storage_not_configured" }, 503, origin);
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "invalid_media_payload" }, 400, origin);
  }

  const initData = form.get("init_data");
  const mediaType = form.get("media_type");
  const file = form.get("file");

  if (mediaType !== "avatar" && mediaType !== "banner") {
    return json({ error: "invalid_media_type" }, 400, origin);
  }
  if (!file || typeof file.arrayBuffer !== "function" || typeof file.size !== "number") {
    return json({ error: "missing_image_file" }, 400, origin);
  }
  if (file.size > 5 * 1024 * 1024) {
    return json({ error: "image_too_large" }, 413, origin);
  }

  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!isSupportedImageFile(file, bytes)) {
    return json({ error: "unsupported_image_format" }, 415, origin);
  }

  const verification = await verifyTelegramInitData(
    typeof initData === "string" ? initData : "",
    String(env.BOT_TOKEN).trim()
  );
  if (!verification.user) {
    return json({
      error: "invalid_telegram_init_data",
      reason: verification.reason || "verification_failed"
    }, 401, origin);
  }

  const telegramId = String(verification.user.id);
  const urlColumn = mediaType === "avatar" ? "avatar_url" : "banner_url";
  const fileIdColumn = mediaType === "avatar" ? "avatar_file_id" : "banner_file_id";

  try {
    await env.DB.prepare(
      "INSERT INTO users (telegram_id, username, first_name, last_name, updated_at) " +
      "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) " +
      "ON CONFLICT(telegram_id) DO UPDATE SET " +
      "username=excluded.username, first_name=excluded.first_name, " +
      "last_name=excluded.last_name, updated_at=CURRENT_TIMESTAMP"
    ).bind(
      telegramId,
      verification.user.username || null,
      verification.user.first_name || "",
      verification.user.last_name || ""
    ).run();
  } catch (error) {
    console.error("Split API: profile media user upsert failed", error?.name || "Error");
    return json({ error: "database_unavailable" }, 503, origin);
  }

  let previous;
  try {
    previous = await env.DB.prepare(
      "SELECT " + fileIdColumn + " AS file_id FROM users WHERE telegram_id=?"
    ).bind(telegramId).first();
  } catch (error) {
    console.error("Split API: profile media lookup failed", error?.name || "Error");
    return json({ error: "database_unavailable" }, 503, origin);
  }

  const extension = file.type === "image/png" ? "png"
    : file.type === "image/webp" ? "webp" : "jpg";
  const fileName = mediaType + "-" + crypto.randomUUID() + "." + extension;
  const uploadForm = new FormData();
  uploadForm.set("file", file, fileName);
  uploadForm.set("fileName", fileName);
  uploadForm.set("folder", "/splitevents/profile");
  uploadForm.set("useUniqueFileName", "false");
  uploadForm.set("overwriteFile", "false");

  let uploaded;
  try {
    const uploadResponse = await fetch(
      "https://upload.imagekit.io/api/v1/files/upload",
      {
        method: "POST",
        headers: {
          "Authorization": imageKitAuthorization(env.IMAGEKIT_PRIVATE_KEY)
        },
        body: uploadForm
      }
    );

    const payload = await uploadResponse.json().catch(() => null);
    if (!uploadResponse.ok || !payload?.fileId || !payload?.url) {
      console.error(
        "Split API: ImageKit upload failed",
        uploadResponse.status,
        uploadResponse.headers.get("x-ik-requestId") || "no_request_id"
      );
      return json({ error: "media_storage_unavailable" }, 502, origin);
    }
    uploaded = payload;
  } catch (error) {
    console.error("Split API: ImageKit request failed", error?.name || "Error");
    return json({ error: "media_storage_unavailable" }, 502, origin);
  }

  try {
    await env.DB.prepare(
      "UPDATE users SET " + urlColumn + "=?, " + fileIdColumn +
      "=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?"
    ).bind(uploaded.url, uploaded.fileId, telegramId).run();

    const user = await env.DB.prepare(
      "SELECT telegram_id, username, first_name, last_name, display_name, " +
      "bio, avatar_url, banner_url, is_public, created_at " +
      "FROM users WHERE telegram_id=?"
    ).bind(telegramId).first();

    if (previous?.file_id && previous.file_id !== uploaded.fileId) {
      try {
        const deleted = await deleteImageKitFile(env.IMAGEKIT_PRIVATE_KEY, previous.file_id);
        if (!deleted) {
          console.warn("Split API: previous ImageKit asset could not be deleted");
        }
      } catch {
        console.warn("Split API: previous ImageKit asset cleanup failed");
      }
    }

    return json({ user }, 200, origin);
  } catch (error) {
    console.error("Split API: profile media database update failed", error?.name || "Error");
    try {
      await deleteImageKitFile(env.IMAGEKIT_PRIVATE_KEY, uploaded.fileId);
    } catch {
      console.warn("Split API: orphan ImageKit asset cleanup failed");
    }
    return json({ error: "database_unavailable" }, 503, origin);
  }
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(requestOrigin)
      });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      try {
        const result = await env.DB.prepare("SELECT 1 AS ok").first();
        return json({
          ok: result?.ok === 1,
          service: "split-api",
          database: "connected"
        }, 200, requestOrigin);
      } catch {
        return json({ ok: false, error: "database_unavailable" }, 503, requestOrigin);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/profile/media") {
      try {
        return await uploadProfileMedia(request, env, requestOrigin);
      } catch (error) {
        console.error("Split API: profile media request failed", error?.name || "Error");
        return json({ error: "media_storage_unavailable" }, 502, requestOrigin);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/me") {
      if (!env.BOT_TOKEN) {
        return json({ error: "telegram_auth_not_configured" }, 503, requestOrigin);
      }

      const contentType = request.headers.get("Content-Type") || "";
      let initData = request.headers.get("X-Telegram-Init-Data") || "";
      let body = null;

      if (contentType.includes("application/x-www-form-urlencoded")) {
        const form = new URLSearchParams(await request.text());
        initData = initData || form.get("init_data") || "";
        if (form.has("display_name")) {
          body = { display_name: form.get("display_name") };
        }
      } else if (contentType.includes("application/json")) {
        try {
          body = await request.json();
        } catch {
          return json({ error: "invalid_json" }, 400, requestOrigin);
        }
        initData = initData || (body && typeof body.init_data === "string"
          ? body.init_data
          : "");
      }

      if (!initData) {
        return json({ error: "missing_telegram_init_data" }, 401, requestOrigin);
      }

      const verification = await verifyTelegramInitData(initData, String(env.BOT_TOKEN).trim());
      if (!verification.user) {
        return json({
          error: "invalid_telegram_init_data",
          reason: verification.reason || "verification_failed"
        }, 401, requestOrigin);
      }
      const user = verification.user;

      if (body !== null && (
        typeof body !== "object" ||
        Array.isArray(body)
      )) {
        return json({ error: "invalid_profile_payload" }, 400, requestOrigin);
      }

      const hasDisplayName = body !== null &&
        Object.prototype.hasOwnProperty.call(body, "display_name");

      if (hasDisplayName && typeof body.display_name !== "string") {
        return json({ error: "invalid_display_name" }, 400, requestOrigin);
      }

      if (hasDisplayName && body.display_name.length > 64) {
        return json({ error: "display_name_too_long" }, 400, requestOrigin);
      }

      const telegramId = String(user.id);

      // Identity fields always come from Telegram's signed initData.
      // A client can only update its own optional display_name.
      try {
        await env.DB.prepare(
          "INSERT INTO users (telegram_id, username, first_name, last_name, updated_at) " +
          "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) " +
          "ON CONFLICT(telegram_id) DO UPDATE SET " +
          "username=excluded.username, first_name=excluded.first_name, " +
          "last_name=excluded.last_name, updated_at=CURRENT_TIMESTAMP"
        ).bind(
          telegramId,
          user.username || null,
          user.first_name || "",
          user.last_name || ""
        ).run();

        if (hasDisplayName) {
          const displayName = body.display_name.trim() || null;
          await env.DB.prepare(
            "UPDATE users SET display_name=?, updated_at=CURRENT_TIMESTAMP WHERE telegram_id=?"
          ).bind(displayName, telegramId).run();
        }

        const profile = await env.DB.prepare(
          "SELECT telegram_id, username, first_name, last_name, display_name, " +
          "bio, avatar_url, banner_url, is_public, created_at " +
          "FROM users WHERE telegram_id=?"
        ).bind(telegramId).first();

        return json({ user: profile }, 200, requestOrigin);
      } catch (error) {
        console.error("Split API: database operation failed", error?.name || "Error");
        return json({ error: "database_unavailable" }, 503, requestOrigin);
      }
    }

    return json({ error: "not_found" }, 404, requestOrigin);
  }
};
