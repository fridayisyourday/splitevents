/* Per-user, per-device hidden-event state. */
const STORAGE_PREFIX = "splitevents:hidden-events:v1:";
const memoryFallback = new Map();

function getStorageKey(userId) {
    const scope = userId ? "telegram-" + String(userId) : "guest";
    return STORAGE_PREFIX + scope;
}

function readHiddenIds(userId) {
    const key = getStorageKey(userId);

    try {
        const stored = window.localStorage.getItem(key);
        if (stored === null) {
            return new Set(memoryFallback.get(key) || []);
        }

        const parsed = JSON.parse(stored);
        return new Set(
            Array.isArray(parsed)
                ? parsed.filter((id) => typeof id === "string")
                : []
        );
    } catch (error) {
        return new Set(memoryFallback.get(key) || []);
    }
}

function writeHiddenIds(userId, ids) {
    const key = getStorageKey(userId);
    const values = Array.from(ids);
    memoryFallback.set(key, values);

    try {
        window.localStorage.setItem(key, JSON.stringify(values));
    } catch (error) {
        // The in-memory copy keeps hiding usable if storage is unavailable.
    }
}

export function getHiddenEventIds(userId) {
    return readHiddenIds(userId);
}

export function hideEvent(eventId, userId) {
    if (typeof eventId !== "string" || !eventId.trim()) {
        return false;
    }

    const hiddenIds = readHiddenIds(userId);
    if (hiddenIds.has(eventId)) {
        return false;
    }

    hiddenIds.add(eventId);
    writeHiddenIds(userId, hiddenIds);
    return true;
}