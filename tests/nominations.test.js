import assert from "node:assert/strict";
import test from "node:test";
import { NOMINATION_DEFINITIONS } from "../js/nominations/database/definitions.js";
import { NOMINEES, compareNames, nomineeById } from "../js/nominations/database/nominees.js";
import { validateNominationDatabase } from "../js/nominations/database/validate.js";
import { createNominationModel } from "../js/nominations/model.js";
import { createNominationState } from "../js/nominations/state.js";

const model = createNominationModel({ nomineeById, compareNames });

test("the published nominee catalogue and rules are valid", () => {
    assert.equal(validateNominationDatabase(NOMINEES, NOMINATION_DEFINITIONS), true);
    assert.equal(new Set(NOMINEES.map((person) => person.id)).size, NOMINEES.length);
});

test("nomination state is independent between widget instances", () => {
    const first = createNominationState();
    const second = createNominationState();
    assert.notEqual(first, second);
    assert.notEqual(first[0].nomineeIds, second[0].nomineeIds);
    assert.equal(first[0].selectedId, null);
    assert.equal(second[0].selectedId, null);
});

test("DUO choices resolve known people and preserve the selected pair", () => {
    const duo = NOMINATION_DEFINITIONS.find((item) => item.type === "duo");
    const pairs = model.getDuoPairs(duo);
    assert.equal(pairs.length, duo.duoPairs.length);
    assert.ok(pairs.every((pair) => pair.first && pair.second));
    assert.equal(model.selectedDuo({ ...duo, selectedPairId: pairs[0].id }).id, pairs[0].id);
    assert.equal(model.selectedDuo({ ...duo, selectedPairId: "missing" }), null);
});

test("a complete local ballot contains a valid selection for every category", () => {
    const nominations = createNominationState();
    for (const nomination of nominations) {
        if (nomination.type === "duo") {
            nomination.selectedPairId = nomination.duoPairs[0].id;
        } else if (nomination.type === "image") {
            nomination.suggestionMode = "voted";
            nomination.suggestedText = "test suggestion";
        } else {
            nomination.selectedId = nomination.nomineeIds[0];
        }
    }
    assert.equal(model.isBallotComplete(nominations), true);
    const ballot = model.buildBallotPayload(nominations);
    assert.equal(ballot.nominations.length, NOMINATION_DEFINITIONS.length);
    assert.ok(ballot.nominations.every((item) => item.selection !== null));
    assert.equal(model.buildNominationSnapshot(nominations).length, NOMINATION_DEFINITIONS.length);
});

test("an invalid nominee ID cannot complete a nomination", () => {
    const nominations = createNominationState();
    nominations[0].selectedId = "not-in-the-catalogue";
    assert.equal(model.isBallotComplete(nominations), false);
});
