import assert from "node:assert/strict";
import test from "node:test";
import {
    getCurrentPage,
    getPageHash,
    getPublicUserId,
    VALID_PAGES
} from "../js/navigation.js";

test("all application routes are recognized", () => {
    for (const page of VALID_PAGES) {
        const hash = getPageHash(page);
        assert.equal(getCurrentPage(hash), page);
    }
});

test("home and unknown routes resolve to home", () => {
    assert.equal(getCurrentPage(""), "home");
    assert.equal(getCurrentPage("#/"), "home");
    assert.equal(getCurrentPage("#/missing"), "home");
});

test("nested and query routes resolve to their page", () => {
    assert.equal(getCurrentPage("#/users/0123456789abcdef0123456789abcdef"), "users");
    assert.equal(getCurrentPage("#/nominations?event=squash-award-2026"), "nominations");
});

test("public profile IDs are accepted only in the public profile route", () => {
    const id = "0123456789abcdef0123456789abcdef";
    assert.equal(getPublicUserId("#/users/" + id), id);
    assert.equal(getPublicUserId("#/users/" + id + "?from=friends"), id);
    assert.equal(getPublicUserId("#/users/not-a-public-id"), "");
    assert.equal(getPublicUserId("#/friends/" + id), "");
});

test("invalid page names cannot be used to build routes", () => {
    assert.equal(getPageHash("unknown"), "#/");
});
