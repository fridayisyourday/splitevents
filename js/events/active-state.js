/* Count currently active events that the user has not hidden. */
export function getActiveEventsCount(events = [], hiddenIds = new Set(), now = Date.now()) {
    const hidden = hiddenIds instanceof Set
        ? hiddenIds
        : new Set(hiddenIds || []);

    return events.reduce((count, event) => {
        if (!event || typeof event.id !== "string" || hidden.has(event.id)) {
            return count;
        }

        if (event.endsAt) {
            const endTime = new Date(event.endsAt).getTime();
            if (!Number.isFinite(endTime) || endTime <= now) {
                return count;
            }
        }

        return count + 1;
    }, 0);
}
