/* Per-user, per-device read state for event notifications. */
import {
    readEventIdSet,
    writeEventIdSet
} from "./storage.js?v=20261126-1";

const STORAGE_PREFIX = "splitevents:seen-events:v1:";

export function getUnreadEventsCount(events, userId) {
    const seen = readEventIdSet(STORAGE_PREFIX, userId);
    return events.reduce(
        (count, event) => count + (seen.has(event.id) ? 0 : 1),
        0
    );
}

export function markEventsAsSeen(events, userId) {
    const seen = readEventIdSet(STORAGE_PREFIX, userId);
    events.forEach((event) => seen.add(event.id));
    writeEventIdSet(STORAGE_PREFIX, userId, seen);
    return getUnreadEventsCount(events, userId);
}