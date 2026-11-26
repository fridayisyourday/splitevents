const ALLOWED_ORIGIN = "https://fridayisyourday.github.io";

function corsHeaders() {
  return {
    // Identity is protected by Telegram's signed initData, not by CORS.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Telegram-Init-Data",
    "Access-Control-Max-Age": "86400"
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders()
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

  params.delete("hash");
  params.delete("signature");

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

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
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
        });
      } catch {
        return json({ ok: false, error: "database_unavailable" }, 503);
      }
    }

    if (request.method === "POST" && url.pathname === "/api/me") {
      if (!env.BOT_TOKEN) {
        return json({ error: "telegram_auth_not_configured" }, 503);
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
          return json({ error: "invalid_json" }, 400);
        }
        initData = initData || (body && typeof body.init_data === "string"
          ? body.init_data
          : "");
      }

      if (!initData) {
        return json({ error: "missing_telegram_init_data" }, 401);
      }

      const verification = await verifyTelegramInitData(initData, String(env.BOT_TOKEN).trim());
      if (!verification.user) {
        return json({
          error: "invalid_telegram_init_data",
          reason: verification.reason || "verification_failed"
        }, 401);
      }
      const user = verification.user;

      if (body !== null && (
        typeof body !== "object" ||
        Array.isArray(body)
      )) {
        return json({ error: "invalid_profile_payload" }, 400);
      }

      const hasDisplayName = body !== null &&
        Object.prototype.hasOwnProperty.call(body, "display_name");

      if (hasDisplayName && typeof body.display_name !== "string") {
        return json({ error: "invalid_display_name" }, 400);
      }

      if (hasDisplayName && body.display_name.length > 64) {
        return json({ error: "display_name_too_long" }, 400);
      }

      const telegramId = String(user.id);

      // Identity fields always come from Telegram's signed initData.
      // A client can only update its own optional display_name.
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

      return json({ user: profile });
    }

    return json({ error: "not_found" }, 404);
  }
};
