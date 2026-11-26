/* Event-count and expiry calculations. This module has no DOM or timer side effects. */
function normalizeHiddenIds(hiddenIds) {
    return hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds || []);
}

export function getActiveEventsCount(events = [], hiddenIds = new Set(), now = Date.now()) {
    const hidden = normalizeHiddenIds(hiddenIds);
    return events.reduce((count, event) => {
        if (!event || typeof event.id !== "string" || hidden.has(event.id)) return count;
        if (event.endsAt) {
            const endTime = new Date(event.endsAt).getTime();
            if (!Number.isFinite(endTime) || endTime <= now) return count;
        }
        return count + 1;
    }, 0);
}

export function getNextActiveEventExpiry(events = [], hiddenIds = new Set(), now = Date.now()) {
    const hidden = normalizeHiddenIds(hiddenIds);
    return events.reduce((nextExpiry, event) => {
        if (!event || typeof event.id !== "string" || hidden.has(event.id) || !event.endsAt) {
            return nextExpiry;
        }
        const endTime = new Date(event.endsAt).getTime();
        return Number.isFinite(endTime) && endTime > now
            ? Math.min(nextExpiry, endTime)
            : nextExpiry;
    }, Number.POSITIVE_INFINITY);
}
