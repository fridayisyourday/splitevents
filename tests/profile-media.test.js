import assert from "node:assert/strict";
import test from "node:test";
import { getSafeProfileImageUrl } from "../js/pages/profile-presentation.js";

test("accepts HTTPS ImageKit media URLs", () => {
    const url = "https://ik.imagekit.io/splitevents/profile/avatar.webp";
    assert.equal(getSafeProfileImageUrl(url), url);
});

test("rejects non-HTTPS and non-ImageKit URLs", () => {
    assert.equal(
        getSafeProfileImageUrl("http://ik.imagekit.io/splitevents/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeProfileImageUrl("https://example.com/avatar.webp"),
        ""
    );
    assert.equal(getSafeProfileImageUrl("javascript:alert(1)"), "");
});

test("rejects missing or malformed values", () => {
    assert.equal(getSafeProfileImageUrl(""), "");
    assert.equal(getSafeProfileImageUrl(null), "");
    assert.equal(getSafeProfileImageUrl(undefined), "");
    assert.equal(getSafeProfileImageUrl("not a URL"), "");
});
