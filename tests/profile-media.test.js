import assert from "node:assert/strict";
import test from "node:test";
import {
    getImageKitAssetUrl,
    getSafeImageKitUrl
} from "../js/media.js";
import { getSafeProfileImageUrl } from "../js/pages/profile-presentation.js";

test("accepts HTTPS ImageKit media inside the SplitEvents profile folder", () => {
    const url = "https://ik.imagekit.io/splitevents/profile/avatar.webp";
    assert.equal(getSafeProfileImageUrl(url), url);
    assert.equal(getSafeImageKitUrl(url, "profile"), url);
});

test("accepts only the requested SplitEvents ImageKit media folder", () => {
    const eventUrl = "https://ik.imagekit.io/splitevents/events/squash-award-2026/cover.webp";
    const nomineeUrl = "https://ik.imagekit.io/splitevents/nominees/fridayisyourday.webp";

    assert.equal(getSafeImageKitUrl(eventUrl, "events"), eventUrl);
    assert.equal(getSafeImageKitUrl(nomineeUrl, "nominees"), nomineeUrl);
    assert.equal(getSafeImageKitUrl(eventUrl, "nominees"), "");
});

test("rejects non-HTTPS, foreign hosts, and foreign ImageKit endpoints", () => {
    assert.equal(
        getSafeImageKitUrl("http://ik.imagekit.io/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://example.com/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://other.imagekit.io/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/another-project/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/splitevents/profile/%2e%2e/avatar.webp"),
        ""
    );
    assert.equal(getSafeImageKitUrl("javascript:alert(1)"), "");
});

test("rejects missing or malformed values", () => {
    assert.equal(getSafeImageKitUrl(""), "");
    assert.equal(getSafeImageKitUrl(null), "");
    assert.equal(getSafeImageKitUrl(undefined), "");
    assert.equal(getSafeProfileImageUrl("not a URL"), "");
});

test("builds stable ImageKit paths for events, nominees, and server images", () => {
    assert.equal(
        getImageKitAssetUrl("servers/technocracy/banner.webp"),
        "https://ik.imagekit.io/splitevents/servers/technocracy/banner.webp"
    );
    assert.equal(getImageKitAssetUrl("../outside.webp"), "");
});
