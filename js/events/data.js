/* Published events live here. Every record uses the shared event-card template. */
const EVENT_RECORDS = [
    {
        id: "squash-award-2026",
        title: "SQUASH!",
        dateLabel: "20.12.2026",
        // The countdown runs until the end of December 20 in the visitor's local time.
        endsAt: "2026-12-20T23:59:59",
        description: "squash 2026 - ежегодная премия ρumρkin ρie. подведение итогов, где участники выберут лучшие моменты года.",
        actionLabel: "Принять участие"
    }

    /*
     * Чтобы добавить ещё одно событие, поставьте запятую после предыдущего
     * объекта и добавьте новую запись с уникальным id.
     *
     * {
     *     id: "new-event-2027",
     *     title: "НАЗВАНИЕ",
     *     dateLabel: "ДД.ММ.ГГГГ",
     *     endsAt: "2027-12-31T23:59:59",
     *     description: "описание события",
     *     actionLabel: "Принять участие"
     * }
     */
];

function createEventCatalog(records) {
    const seenIds = new Set();

    return Object.freeze(records.map((event, index) => {
        if (!event || typeof event !== "object") {
            throw new TypeError(`SplitEvents: event at index ${index} is not an object.`);
        }

        const id = typeof event.id === "string" ? event.id.trim() : "";
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
            throw new Error(`SplitEvents: invalid event id at index ${index}. Use lowercase latin letters, numbers and hyphens.`);
        }
        if (seenIds.has(id)) {
            throw new Error(`SplitEvents: duplicate event id "${id}". Every event must have a unique id.`);
        }
        seenIds.add(id);

        if (typeof event.title !== "string" || !event.title.trim()) {
            throw new Error(`SplitEvents: event "${id}" is missing a title.`);
        }
        if (typeof event.dateLabel !== "string" || !event.dateLabel.trim()) {
            throw new Error(`SplitEvents: event "${id}" is missing a date label.`);
        }

        if (event.endsAt && !Number.isFinite(new Date(event.endsAt).getTime())) {
            throw new Error(`SplitEvents: event "${id}" has an invalid endsAt date.`);
        }

        return Object.freeze({ ...event, id });
    }));
}

export const EVENTS = createEventCatalog(EVENT_RECORDS);
