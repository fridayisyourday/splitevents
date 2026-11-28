import assert from "node:assert/strict";
import test from "node:test";
import { NOMINATION_DEFINITIONS } from "../js/nominations/database/definitions.js";
import { NOMINEES, compareNames, nomineeById } from "../js/nominations/database/nominees.js";
import { validateNominationDatabase } from "../js/nominations/database/validate.js";
import { createNominationModel } from "../js/nominations/model.js";
import { createNominationState } from "../js/nominations/state.js";
import { getCountdownParts } from "../js/nominations/countdown.js";

const model = createNominationModel({ nomineeById, compareNames });

test("the published nominee catalogue and rules are valid", () => {
    assert.equal(validateNominationDatabase(NOMINEES, NOMINATION_DEFINITIONS), true);
    assert.equal(new Set(NOMINEES.map((person) => person.id)).size, NOMINEES.length);
});

test("vamorii is available in the female nominee pool but is not preselected in a nomination", () => {
    const vamorii = nomineeById.get("vamorii");
    assert.ok(vamorii);
    assert.equal(vamorii.name, "vamorii");
    assert.equal(vamorii.gender, "F");

    const publishedNomineeIds = NOMINATION_DEFINITIONS.flatMap((nomination) => [
        ...(nomination.nomineeIds || []),
        ...(nomination.duoPairs || []).flatMap((pair) => [pair.firstId, pair.secondId])
    ]);
    assert.equal(publishedNomineeIds.includes("vamorii"), true);
});

test("featured SQUASH nominations use their updated titles", () => {
    assert.equal(
        NOMINATION_DEFINITIONS.find((item) => item.id === "pumpkin-king")?.title,
        "PUMPKING"
    );
    assert.equal(
        NOMINATION_DEFINITIONS.find((item) => item.id === "pumpkin-queen")?.title,
        "PUMPQUEEN"
    );
});

test("the eight new nominations are included in the wheel with their intended nominee types", () => {
    const expected = {
        nerd: ["dlv1190", "fridayisyourday", "otorgy", "vale"],
        geek: ["burgomister", "fridayisyourday", "holydark", "otorgy", "theriazon"],
        gamer: ["burgomister", "dlv1190", "theriazon"],
        creator: ["burgomister", "cyathere", "fridayisyourday", "holydark", "vamorii"],
        gnil: ["burgomister", "dlv1190", "fridayisyourday", "otorgy", "tr1ckl"],
        mit: ["a-vy-verite", "burgomister-dacha", "isada-birthday", "kemerovo-dumplings", "loft"],
        mem: ["ip-picked", "metaverse", "slenderman-mansion", "tadc-voiceover", "a-vy-verite"],
        mog: ["cyathere", "dlv1190", "holydark"]
    };

    for (const [id, nomineeIds] of Object.entries(expected)) {
        const nomination = NOMINATION_DEFINITIONS.find((item) => item.id === id);
        assert.ok(nomination, id + " is present");
        assert.deepEqual(nomination.nomineeIds, nomineeIds, id + " nominee order");
        assert.equal(nomination.type, ["mit", "mem"].includes(id) ? "image" : "individual");
        assert.equal(nomination.gender, ["mit", "mem"].includes(id) ? "I" : undefined);
        assert.deepEqual(
            nomination.nomineeIds.map((nomineeId) => nomineeById.get(nomineeId)).sort(compareNames).map((person) => person.id),
            nomineeIds,
            id + " is alphabetically sorted"
        );
    }

    assert.equal(NOMINATION_DEFINITIONS.length, 13);
});

test("new image nominees have square-image catalogue entries", () => {
    const imageNomineeIds = [
        "halloween",
        "isada-birthday",
        "loft",
        "kemerovo-dumplings",
        "burgomister-dacha",
        "slenderman-mansion",
        "a-vy-verite",
        "tadc-voiceover",
        "metaverse",
        "ip-picked"
    ];
    for (const id of imageNomineeIds) {
        const nominee = nomineeById.get(id);
        assert.ok(nominee, id + " exists");
        assert.equal(nominee.gender, "I");
        assert.ok(nominee.avatar.includes("/nominees/" + id + ".webp"));
    }
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

test("countdown splits time into days, hours, and minutes without seconds", () => {
    const target = 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000 + 15 * 60 * 1000;
    assert.deepEqual(getCountdownParts(target, 0), { days: 1, hours: 2, minutes: 15, finished: false });
});

test("countdown clamps after the deadline", () => {
    assert.deepEqual(getCountdownParts(100, 101), { days: 0, hours: 0, minutes: 0, finished: true });
});
