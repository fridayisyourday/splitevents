/* Per-user, per-device read state for event notifications. */
const STORAGE_PREFIX = "splitevents:seen-events:v1:";
const memoryFallback = new Map();

function getScope(userId) {
    return userId ? "telegram-" + String(userId) : "guest";
}

function getStorageKey(userId) {
    return STORAGE_PREFIX + getScope(userId);
}

function readSeenIds(userId) {
    const key = getStorageKey(userId);

    try {
        const stored = window.localStorage.getItem(key);
        if (stored === null) {
            return new Set(memoryFallback.get(key) || []);
        }

        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : []);
    } catch (error) {
        return new Set(memoryFallback.get(key) || []);
    }
}

function writeSeenIds(userId, ids) {
    const key = getStorageKey(userId);
    const values = Array.from(ids);
    memoryFallback.set(key, values);

    try {
        window.localStorage.setItem(key, JSON.stringify(values));
    } catch (error) {
        // The in-memory copy keeps the counter usable if storage is unavailable.
    }
}

export function getUnreadEventsCount(events, userId) {
    const seen = readSeenIds(userId);
    return events.reduce((count, event) => count + (seen.has(event.id) ? 0 : 1), 0);
}

export function markEventsAsSeen(events, userId) {
    const seen = readSeenIds(userId);
    events.forEach((event) => seen.add(event.id));
    writeSeenIds(userId, seen);
    return getUnreadEventsCount(events, userId);
}
