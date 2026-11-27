import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
    return readFileSync(new URL("../" + path, import.meta.url), "utf8");
}

const designCss = readProjectFile("css/design-system.css");
const designGuide = readProjectFile("docs/design-system.md");
const eventCss = readProjectFile("css/events.css");
const squashCss = readProjectFile("css/squash.css");
const serverCss = readProjectFile("css/servers.css");
const eventPage = readProjectFile("src/components/EventsPage.vue");
const votingPage = readProjectFile("src/components/NominationsPage.vue");
const serverPage = readProjectFile("src/components/ServersPage.vue");

test("shared descriptive copy typography has one documented source of truth", () => {
    const block = designCss.match(/\.app-description\s*\{([^}]+)\}/);
    assert.ok(block, "the shared .app-description rule must exist");
    const descriptionRule = designCss.match(/\.app-description\s*\{([^}]+)\}/);
    assert.ok(descriptionRule, "the shared description role must exist");
    assert.match(descriptionRule[1], /font-size:\s*var\(--app-font-size-accent\)/);
    assert.match(block[1], /font-weight:\s*var\(--app-font-weight-subtle\)/);
    assert.match(block[1], /line-height:\s*var\(--app-line-height-label\)/);
    assert.match(designGuide, /16 px/);
    assert.match(designGuide, /\.app-description/);
});

test("event description, date and countdown inherit the shared typography", () => {
    assert.match(eventPage, /class="event-card-description app-description"/);
    assert.match(eventPage, /class="event-card-meta app-description"/);

    const metaBlocks = [...eventCss.matchAll(/\.event-card-meta\s*\{([^}]+)\}/g)];
    assert.ok(metaBlocks.length >= 1);
    for (const match of metaBlocks) {
        assert.doesNotMatch(match[1], /(?:font-size|font-weight|line-height|color)\s*:/);
    }
    assert.match(eventCss, /\.event-countdown-value,\s*\.event-countdown-unit\s*\{\s*color:\s*inherit;\s*font:\s*inherit;/);
});

test("SQUASH hero subtitle and date share the exact same type style", () => {
    assert.match(votingPage, /class="squash-hero-subtitle app-description"/);
    assert.match(votingPage, /class="squash-hero-date app-description"/);

    const dateBlock = squashCss.match(/\.squash-hero-date\s*\{([^}]+)\}/);
    assert.ok(dateBlock);
    assert.doesNotMatch(dateBlock[1], /(?:font-size|font-weight|letter-spacing|line-height|color)\s*:/);
});

test("server description does not introduce a mobile-only typography override", () => {
    assert.match(serverPage, /class="server-card-subtitle app-description"/);
    assert.equal((serverCss.match(/\.server-card-subtitle\s*\{/g) || []).length, 1);
});

test("server page resets expanded gallery state whenever navigation leaves it", () => {
    assert.match(serverPage, /window\.addEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /window\.removeEventListener\("splitevents:menu-page", handleMenuPageChange\)/);
    assert.match(serverPage, /if \(event\.detail\?\.page !== "servers"\)\s*\{\s*resetServerPageState\(\);/);
});


test("the four typography roles match their visual references", () => {
    assert.match(designCss, /--app-font-size-title:\s*clamp\(66px, 10vw, 148px\)/);
    assert.match(designCss, /--app-font-size-heading:\s*clamp\(32px, 4vw, 40px\)/);
    assert.match(designCss, /--app-font-size-main:\s*14px/);
    assert.match(designCss, /--app-font-size-accent:\s*16px/);
    assert.match(squashCss, /\.squash-hero-title\s*\{[^}]*font-size:\s*var\(--app-font-size-title\)/s);
    assert.match(readProjectFile("css/pages.css"), /\.section-page-title\s*\{[^}]*font-size:\s*var\(--app-font-size-heading\)/s);
    assert.match(readProjectFile("css/profile.css"), /\.profile-telegram-tag\s*\{[^}]*font-size:\s*var\(--app-font-size-main\)/s);
    assert.match(block[1], /font-size:\s*var\(--app-font-size-accent\)/);
});

test("every stylesheet uses only the four semantic text-size roles", () => {
    const stylesheets = [
        "css/base.css",
        "css/components.css",
        "css/design-system.css",
        "css/events.css",
        "css/friends.css",
        "css/layout.css",
        "css/menu.css",
        "css/nominations.css",
        "css/nominations-cards.css",
        "css/nominations-carousel.css",
        "css/nominations-picker.css",
        "css/notifications.css",
        "css/pages.css",
        "css/profile.css",
        "css/servers.css",
        "css/squash.css"
    ];
    const allowed = /^var\(--app-font-size-(?:title|heading|main|accent)\)$|^inherit$/;

    for (const path of stylesheets) {
        const css = readProjectFile(path);
        assert.doesNotMatch(css, /--app-font-size-(?!title\b|heading\b|main\b|accent\b)[A-Za-z0-9_-]+/);
        for (const match of css.matchAll(/font-size\s*:\s*([^;]+);/g)) {
            assert.match(match[1].trim(), allowed, `${path} has an unapproved font size: ${match[0]}`);
        }
    }
});
