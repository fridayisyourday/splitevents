import assert from "node:assert/strict";
import test from "node:test";
import {
    IMAGEKIT_ENDPOINT_ID,
    IMAGEKIT_LIBRARY_ROOT,
    IMAGEKIT_FOLDERS,
    getImageKitAssetUrl,
    getSafeImageKitUrl,
    getEventCoverUrl,
    getNomineeAvatarUrl,
    getServerBannerUrl,
    getServerGalleryImageUrl
} from "../js/media.js";
import { getSafeProfileImageUrl } from "../js/pages/profile-presentation.js";

const IMAGEKIT_BASE = "https://ik.imagekit.io/firdayywh/splitevents";

test("uses one configured ImageKit endpoint and library root for all media", () => {
    assert.equal(IMAGEKIT_ENDPOINT_ID, "firdayywh");
    assert.equal(IMAGEKIT_LIBRARY_ROOT, "splitevents");
    assert.deepEqual(IMAGEKIT_FOLDERS, {
        profile: "profile",
        servers: "servers",
        events: "events",
        nominees: "nominees"
    });
});

test("accepts ImageKit Upload API URLs for profile avatar and banner", () => {
    const avatarUrl = IMAGEKIT_BASE + "/profile/avatar-123.webp?updatedAt=1795814309498";
    const bannerUrl = IMAGEKIT_BASE + "/profile/banner-456.jpg";

    assert.equal(getSafeProfileImageUrl(avatarUrl), avatarUrl);
    assert.equal(getSafeProfileImageUrl(bannerUrl), bannerUrl);
    assert.equal(getSafeImageKitUrl(avatarUrl, IMAGEKIT_FOLDERS.profile), avatarUrl);
    assert.equal(getSafeImageKitUrl(bannerUrl, IMAGEKIT_FOLDERS.profile), bannerUrl);
});

test("builds stable URLs for events, nominees, server banners and gallery images", () => {
    assert.equal(
        getEventCoverUrl("squash-award-2026"),
        IMAGEKIT_BASE + "/events/squash-award-2026/cover.webp"
    );
    assert.equal(
        getNomineeAvatarUrl("fridayisyourday"),
        IMAGEKIT_BASE + "/nominees/fridayisyourday.webp"
    );
    assert.equal(
        getServerBannerUrl("technocracy"),
        IMAGEKIT_BASE + "/servers/technocracy/banner.webp"
    );
    assert.equal(
        getServerGalleryImageUrl("technocracy", "gallery-01.webp"),
        IMAGEKIT_BASE + "/servers/technocracy/gallery-01.webp"
    );
});

test("validates every managed media folder through the same URL validator", () => {
    for (const folder of Object.values(IMAGEKIT_FOLDERS)) {
        const url = IMAGEKIT_BASE + "/" + folder + "/asset.webp";
        assert.equal(getSafeImageKitUrl(url, folder), url);
    }
});

test("rejects foreign endpoints, wrong roots, folders and protocols", () => {
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/splitevents/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/another-endpoint/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/firdayywh/other-root/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://ik.imagekit.io/firdayywh/splitevents/unknown/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("http://ik.imagekit.io/firdayywh/splitevents/profile/avatar.webp"),
        ""
    );
    assert.equal(
        getSafeImageKitUrl("https://example.com/firdayywh/splitevents/profile/avatar.webp"),
        ""
    );
});

test("rejects malformed, missing, and unsafe asset paths", () => {
    assert.equal(getImageKitAssetUrl("../outside.webp"), "");
    assert.equal(getImageKitAssetUrl("unknown/outside.webp"), "");
    assert.equal(getImageKitAssetUrl("servers/../banner.webp"), "");
    assert.equal(getServerGalleryImageUrl("technocracy", "banner.webp"), "");
    assert.equal(getServerBannerUrl("../technocracy"), "");
    assert.equal(getSafeImageKitUrl(""), "");
    assert.equal(getSafeImageKitUrl(null), "");
    assert.equal(getSafeImageKitUrl(undefined), "");
    assert.equal(getSafeProfileImageUrl("not a URL"), "");
    assert.equal(
        getSafeImageKitUrl(IMAGEKIT_BASE + "/profile/%2e%2e/avatar.webp"),
        ""
    );
});
