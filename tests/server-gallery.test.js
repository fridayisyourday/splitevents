import assert from "node:assert/strict";
import test from "node:test";
import {
    getInitialServerGalleryPosition,
    getNextServerGalleryPosition,
    getServerGalleryLayout,
    getServerGallerySlides,
    isServerGalleryClonePosition,
    normalizeServerGalleryPosition
} from "../js/servers/gallery.js";

const gallery = ["first.webp", "second.webp", "third.webp"];

test("server gallery creates one leading and one trailing loop clone", () => {
    assert.deepEqual(getServerGallerySlides(gallery), [2, 0, 1, 2, 0]);
    assert.deepEqual(getServerGallerySlides(["only.webp"]), [0]);
    assert.deepEqual(getServerGallerySlides([]), []);
});

test("server gallery starts at the first real image", () => {
    assert.equal(getInitialServerGalleryPosition(gallery), 1);
    assert.equal(getInitialServerGalleryPosition(["only.webp"]), 0);
    assert.equal(getInitialServerGalleryPosition(null), 0);
});

test("server gallery track geometry advances exactly one viewport per image", () => {
    assert.deepEqual(getServerGalleryLayout(gallery, 1), {
        trackWidth: "500%",
        slideBasis: "20%",
        transform: "translateX(-20%)"
    });
    assert.deepEqual(getServerGalleryLayout(gallery, 3), {
        trackWidth: "500%",
        slideBasis: "20%",
        transform: "translateX(-60%)"
    });
    assert.deepEqual(getServerGalleryLayout(["only.webp"], 0), {
        trackWidth: "100%",
        slideBasis: "100%",
        transform: "translateX(-0%)"
    });
});

test("server gallery clone positions normalize to their matching real images", () => {
    assert.equal(isServerGalleryClonePosition(0, gallery), true);
    assert.equal(isServerGalleryClonePosition(4, gallery), true);
    assert.equal(isServerGalleryClonePosition(2, gallery), false);
    assert.equal(normalizeServerGalleryPosition(0, gallery), 3);
    assert.equal(normalizeServerGalleryPosition(4, gallery), 1);
    assert.equal(normalizeServerGalleryPosition(2, gallery), 2);
    assert.equal(normalizeServerGalleryPosition(0, ["only.webp"]), 0);
});

test("server gallery handles both directions and reduced motion", () => {
    assert.equal(getNextServerGalleryPosition(1, -1, gallery), 0);
    assert.equal(getNextServerGalleryPosition(3, 1, gallery), 4);
    assert.equal(getNextServerGalleryPosition(1, -1, gallery, true), 3);
    assert.equal(getNextServerGalleryPosition(3, 1, gallery, true), 1);
    assert.equal(getNextServerGalleryPosition(1, 0, gallery), 1);
    assert.equal(getNextServerGalleryPosition(0, 1, ["only.webp"]), 0);
});
