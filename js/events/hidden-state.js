/* Per-user, per-device hidden-event state. */
import {
    readEventIdSet,
    writeEventIdSet
} from "./storage.js?v=20261126-1";

const STORAGE_PREFIX = "splitevents:hidden-events:v1:";

export function getHiddenEventIds(userId) {
    return readEventIdSet(STORAGE_PREFIX, userId);
}

export function hideEvent(eventId, userId) {
    if (typeof eventId !== "string" || !eventId.trim()) {
        return false;
    }

    const hiddenIds = readEventIdSet(STORAGE_PREFIX, userId);
    if (hiddenIds.has(eventId)) {
        return false;
    }

    hiddenIds.add(eventId);
    writeEventIdSet(STORAGE_PREFIX, userId, hiddenIds);
    return true;
}

export function unhideEvent(eventId, userId) {
    if (typeof eventId !== "string" || !eventId.trim()) {
        return false;
    }

    const hiddenIds = readEventIdSet(STORAGE_PREFIX, userId);
    if (!hiddenIds.has(eventId)) {
        return false;
    }

    hiddenIds.delete(eventId);
    writeEventIdSet(STORAGE_PREFIX, userId, hiddenIds);
    return true;
}
