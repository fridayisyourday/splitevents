/* Shared localStorage adapter for event IDs scoped to a user and device. */
const memoryFallback = new Map();

function createStorageKey(prefix, userId) {
    const scope = userId ? "telegram-" + String(userId) : "guest";
    return prefix + scope;
}

export function readEventIdSet(prefix, userId) {
    const key = createStorageKey(prefix, userId);

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

export function writeEventIdSet(prefix, userId, ids) {
    const key = createStorageKey(prefix, userId);
    const values = Array.from(ids);
    memoryFallback.set(key, values);

    try {
        window.localStorage.setItem(key, JSON.stringify(values));
    } catch (error) {
        // The in-memory fallback keeps the interface usable if storage is blocked.
    }
}