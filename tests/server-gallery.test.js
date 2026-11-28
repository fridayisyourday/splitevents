import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
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


test("carousel clone normalization is committed before transitions are restored", () => {
    const component = readFileSync(
        new URL("../src/components/ServersPage.vue", import.meta.url),
        "utf8"
    );
    const handlerStart = component.indexOf("async function normalizeGalleryLoop");
    const handlerEnd = component.indexOf("\nfunction toggleServerDetails", handlerStart);
    assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);

    const handler = component.slice(handlerStart, handlerEnd);
    const awaitIndex = handler.indexOf("await nextTick()");
    const layoutFlushIndex = handler.indexOf("void track.offsetWidth");
    const restoreTransitionIndex = handler.indexOf("requestAnimationFrame", layoutFlushIndex);

    assert.ok(awaitIndex >= 0, "Vue must flush the no-transition state");
    assert.ok(layoutFlushIndex > awaitIndex, "the browser layout must be committed after Vue updates");
    assert.ok(restoreTransitionIndex > layoutFlushIndex, "animation must only be restored after the layout flush");
});

test("server cards share the hero title and animate between explicit mobile heights", () => {
    const styles = readFileSync(
        new URL("../css/servers.css", import.meta.url),
        "utf8"
    );
    const component = readFileSync(
        new URL("../src/components/ServersPage.vue", import.meta.url),
        "utf8"
    );
    assert.match(styles, /\.server-card\s*\{[^}]*min-height:\s*260px;[^}]*height:\s*auto;/s);
    assert.match(styles, /\.server-card-content\s*\{[^}]*position:\s*relative;[^}]*grid-row:\s*1;/s);
    assert.match(styles, /\.server-card-title\s*\{[^}]*text-wrap:\s*balance;/s);
    assert.doesNotMatch(styles, /\.server-card-title\s*\{[^}]*font-size\s*:/);
    assert.doesNotMatch(styles, /\.server-card-title\s*\{[^}]*text-overflow:\s*ellipsis|white-space:\s*nowrap/s);
    assert.match(component, /class="server-card-title app-heading-hero"/);
    assert.match(
        styles,
        /@media \(max-width: 640px\)[\s\S]*?\.server-card\s*\{[^}]*height:\s*300px;[^}]*min-height:\s*300px;[^}]*transition:\s*height 320ms/s
    );
    assert.match(
        styles,
        /\.server-entry--expanded \.server-card\s*\{[^}]*height:\s*500px;[^}]*min-height:\s*500px;[^}]*grid-template-rows:/s
    );
    assert.match(
        styles,
        /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.server-card[\s\S]*?transition:\s*none/
    );
});;
