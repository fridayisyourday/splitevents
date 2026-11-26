import assert from "node:assert/strict";
import test from "node:test";
import {
    getActiveEventsCount,
    getNextActiveEventExpiry
} from "../js/events/active-state.js";

const now = Date.parse("2026-11-27T12:00:00.000Z");
const events = [
    { id: "no-expiry" },
    { id: "later", endsAt: "2026-11-27T14:00:00.000Z" },
    { id: "earlier", endsAt: "2026-11-27T13:00:00.000Z" },
    { id: "expired", endsAt: "2026-11-27T11:00:00.000Z" },
    { id: "invalid", endsAt: "not-a-date" }
];

test("active event count excludes hidden, expired and invalid events", () => {
    assert.equal(getActiveEventsCount(events, new Set(["no-expiry"]), now), 2);
});

test("next expiry is the earliest visible future end time", () => {
    assert.equal(
        getNextActiveEventExpiry(events, new Set(), now),
        Date.parse("2026-11-27T13:00:00.000Z")
    );
});

test("no future expiry returns positive infinity", () => {
    assert.equal(
        getNextActiveEventExpiry(
            [{ id: "expired", endsAt: "2026-11-27T11:00:00.000Z" }],
            new Set(),
            now
        ),
        Number.POSITIVE_INFINITY
    );
});
